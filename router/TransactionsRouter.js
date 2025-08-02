import express from "express";
import { PrismaClient, TransactionType } from "@prisma/client";

const TransactionsRouter = express.Router();
const prisma = new PrismaClient();

TransactionsRouter.get("/:accountId", async (req, res) => {
  const { accountId } = req.params;
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        fromAccountId: accountId,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

TransactionsRouter.post("/", async (req, res) => {
  const userId = req.user.userId;
  const { fromAccountId, toAccountId, amount, category } = req.body;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid transaction amount" });
  }

  try {
    const from = await prisma.account.findUnique({
      where: { id: fromAccountId },
    });
    const to = await prisma.account.findUnique({ where: { id: toAccountId } });

    if (!from || !to || from.balance < amount) {
      return res
        .status(400)
        .json({ error: "Invalid accounts or insufficient balance" });
    }

    const [updatedFrom, updatedTo, debitTx, creditTx] =
      await prisma.$transaction([
        prisma.account.update({
          where: { id: fromAccountId },
          data: { balance: { decrement: amount } },
        }),
        prisma.account.update({
          where: { id: toAccountId },
          data: { balance: { increment: amount } },
        }),

        prisma.transaction.create({
          data: {
            amount,
            category,
            type: TransactionType.DEBITED,
            fromAccountId,
            toAccountId,
            userId,
          },
        }),

        prisma.transaction.create({
          data: {
            amount,
            category,
            type: TransactionType.CREDITED,
            fromAccountId:toAccountId,
            toAccountId:fromAccountId,
            userId: to.userId,
          },
        }),
      ]);

    res.json({
      message: "Transaction successful",
      debitTransaction: debitTx,
      creditTransaction: creditTx,
      updatedBalances: {
        from: updatedFrom.balance,
        to: updatedTo.balance,
      },
    });
  } catch (err) {
    console.error("Transaction error:", err);
    res.status(500).json({ error: "Transaction failed" });
  }
});

export default TransactionsRouter;
