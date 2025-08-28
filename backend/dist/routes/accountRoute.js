import express, {} from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middlewares/auth.js";
const accountRouter = express.Router();
const prisma = new PrismaClient();
// Create account
accountRouter.post("/create-account", authMiddleware, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ message: "Unauthorized" });
    const { accountName, type, balance } = req.body;
    if (!accountName || !type) {
        return res.status(400).json({ message: "Account name and type are required" });
    }
    try {
        const account = await prisma.account.create({
            data: {
                accountName,
                type,
                balance,
                userId: Number(req.user.id),
            },
        });
        res.status(201).json({ message: "Account created successfully", account });
    }
    catch (error) {
        res.status(500).json({ message: "Error creating account", error });
    }
});
//Delete account
accountRouter.delete("/delete-account/:id", authMiddleware, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ message: "Unauthorized" });
    const accountId = req.params.id;
    try {
        const account = await prisma.account.findUnique({ where: { id: Number(accountId) } });
        if (!account || account.userId !== req.user.id) {
            return res.status(403).json({ message: "Not allowed to delete this account" });
        }
        await prisma.account.delete({ where: { id: Number(accountId) } });
        res.status(200).json({ message: "Account deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Error deleting account", error });
    }
});
// All account for particular user
accountRouter.get("/accounts", authMiddleware, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ message: "Unauthorized" });
    const accounts = await prisma.account.findMany({
        where: { userId: req.user.id }
    });
    res.status(200).json({ accounts });
});
//Particular account of the user
accountRouter.get("/accounts/:id", authMiddleware, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ message: "Unauthorized" });
    const accountId = req.params.id;
    const account = await prisma.account.findUnique({
        where: { id: Number(accountId) },
        include: { transactions: true },
    });
    if (!account || account.userId !== req.user.id) {
        return res.status(404).json({ message: "Account not found" });
    }
    res.status(200).json({ account });
});
//Get balance for particular account
accountRouter.get("/accounts/balance/:id", authMiddleware, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ message: "Unauthorized" });
    const accountId = req.params.id;
    const account = await prisma.account.findUnique({
        where: { id: Number(accountId) },
    });
    if (!account || account.userId !== req.user.id) {
        return res.status(404).json({ message: "Account not found" });
    }
    const balance = account.balance;
    res.status(200).json({ balance });
});
export default accountRouter;
//# sourceMappingURL=accountRoute.js.map