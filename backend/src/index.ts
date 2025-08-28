import express from "express";
import cors from "cors";
import userRouter from "./routes/userRoute.js";
import accountRouter from "./routes/accountRoute.js";
import transactionRouter from "./routes/transactionRoute.js";

const app = express();
app.use(express.json())
app.use(cors())

app.use("/api/v1/user", userRouter)
app.use("/api/v1/account", accountRouter)
app.use("/api/v1/transaction", transactionRouter)


app.listen(process.env.PORT, () => {
    console.log(`Listening on Port ${process.env.PORT}`)
})