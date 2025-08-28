import express, { type Request, type Response } from "express"
import { PrismaClient } from "@prisma/client";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";

const transactionRouter = express.Router();
const prisma = new PrismaClient();

//Transfer
transactionRouter.post("/send", authMiddleware, async (req: AuthRequest, res: Response) => {
    const { fromAccountId, toAccountId, amount, description } = req.body;

    try {
        const transaction = await prisma.$transaction(async (tx) => {

            const fromAccount = await tx.account.findUnique({
                where: { id: fromAccountId }
            })

            if (!fromAccount) throw new Error("Sender account not found");

            if (fromAccount.balance < amount) throw new Error("Insufficient funds");

            const toAccount = await tx.account.findUnique({
                where: { id: toAccountId }
            })

            if (!toAccount) throw new Error("Receiver account not found");

            const updateSender = await tx.account.update({
                where: { id: fromAccountId },
                data: { balance: { decrement: amount } }
            })
            const updateReceiver = await tx.account.update({
                where: { id: toAccountId },
                data: { balance: { increment: amount } }
            })

            const debitTx = await tx.transaction.create({
                data: {
                    amount: -amount,
                    type: "debit",
                    description: description || `Transfer to ${toAccount.accountName}`,
                    accountId: fromAccountId
                }
            })

            const creditTx = await tx.transaction.create({
                data: {
                    amount: amount,
                    type: "credit",
                    description: description || `Transfer to ${fromAccount.accountName}`,
                    accountId: toAccountId
                }
            })

            return { updateSender, updateReceiver, debitTx, creditTx };
        });

        res.status(201).json({
            message: "Transfer successful",
            data: transaction,
        });
    } catch (error: any) {
        res.status(400).json({
            message: "Transfer failed",
            error: error.message,
        });
    }
});

//All transactions
transactionRouter.get("/all", authMiddleware, async (req: AuthRequest, res: Response) => {

    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const transactions = await prisma.transaction.findMany({
            where: {
                account: {
                    userId: Number(userId), 
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return res.status(200).json({
            message: "Transactions fetched successfully",
            transactions,
        });
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
})



export default transactionRouter;
