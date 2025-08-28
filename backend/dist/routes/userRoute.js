import express, {} from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middlewares/auth.js";
const prisma = new PrismaClient();
const userRouter = express.Router();
// Register
userRouter.post("/register", async (req, res) => {
    const { email, password, firstName, lastName } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
        return res.status(400).json({ message: "User already exists" });
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: { email, password: hashed, firstName, lastName },
    });
    res.status(201).json({ message: "User registered", user });
});
// Login
userRouter.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
        return res.status(400).json({ message: "User not found" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
        return res.status(401).json({ message: "Invalid password" });
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({ message: "Login successful", token });
});
// Update password
userRouter.put("/users/update-password", authMiddleware, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: Number(req.user?.id) } });
    if (!user)
        return res.status(404).json({ message: "User not found" });
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid)
        return res.status(401).json({ message: "Old password incorrect" });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: Number(req.user?.id) }, data: { password: hashed } });
    res.status(200).json({ message: "Password updated successfully" });
});
// Delete account
userRouter.delete("/delete-user", authMiddleware, async (req, res) => {
    if (!req.user) {
        return res.status(403).json({ message: "Forbidden: Not your account" });
    }
    await prisma.user.delete({ where: { id: Number(req.user?.id) } });
    res.status(200).json({ message: "User deleted" });
});
export default userRouter;
//# sourceMappingURL=userRoute.js.map