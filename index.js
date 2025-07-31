import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import linkBankRouter from './router/LinkBankRouter.js';
import accountsRouter from './router/AccountsRouter.js';
import transactionsRouter from './router/TransactionsRouter.js';
import { authenticate } from "./middleware/authMiddleware.js";

dotenv.config()

const PORT = process.env.PORT;

const app = express()

app.use(express.json());
app.use(cors(
    {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"]
    }
))
app.use('/link-bank', linkBankRouter);
app.use('/accounts',authenticate,accountsRouter);
app.use('/transactions',authenticate,transactionsRouter);


app.listen(PORT,()=>{
    console.log(`server is running at ${PORT}`)
})