import express from 'express';
import { PrismaClient } from '@prisma/client';
const TransactionsRouter = express.Router();
const prisma = new PrismaClient();

TransactionsRouter.get('/:accountId',async (req, res) => {
  const { accountId } = req.params;
  const transactions = await prisma.transaction.findMany({
    where: {
      OR: [
        { fromAccountId: accountId },
        { toAccountId: accountId },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(transactions);
});

TransactionsRouter.post('/', async (req, res) => {
  const userId = req.user.id;
  const { fromAccountId, toAccountId, amount, category } = req.body;

  try {
    const from = await prisma.account.findUnique({ where: { id: fromAccountId } });
    const to = await prisma.account.findUnique({ where: { id: toAccountId } });

    if (!from || !to || from.balance < amount) {
      return res.status(400).json({ error: 'Invalid accounts or insufficient balance' });
    }

    const result = await prisma.$transaction([
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
          type: 'DEBITED',
          fromAccountId,
          toAccountId,
          userId,
        },
      }),
    ]);

    res.json({ message: 'Transaction successful', result });
  } catch (err) {
    res.status(500).json({ error: 'Transaction failed' });
  }
});

export default TransactionsRouter;
