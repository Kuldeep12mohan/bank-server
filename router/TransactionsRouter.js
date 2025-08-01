import express from 'express';
import { PrismaClient, TransactionType } from '@prisma/client';

const TransactionsRouter = express.Router();
const prisma = new PrismaClient();

// Get transactions for an account
TransactionsRouter.get('/:accountId', async (req, res) => {
  const { accountId } = req.params;

  try {
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
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Create a transaction
TransactionsRouter.post('/', async (req, res) => {
  const userId = req.user?.id;
  const { fromAccountId, toAccountId, amount, category } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid transaction amount' });
  }

  try {
    const from = await prisma.account.findUnique({ where: { id: fromAccountId } });
    const to = await prisma.account.findUnique({ where: { id: toAccountId } });

    if (!from || !to || from.balance < amount) {
      return res.status(400).json({ error: 'Invalid accounts or insufficient balance' });
    }

    const [updatedFrom, updatedTo, debitTx, creditTx] = await prisma.$transaction([
      // Update balances
      prisma.account.update({
        where: { id: fromAccountId },
        data: { balance: { decrement: amount } },
      }),
      prisma.account.update({
        where: { id: toAccountId },
        data: { balance: { increment: amount } },
      }),

      // Create DEBIT transaction for sender
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

      // Create CREDIT transaction for receiver
      prisma.transaction.create({
        data: {
          amount,
          category,
          type: TransactionType.CREDITED,
          fromAccountId,
          toAccountId,
          userId: to.userId, // credit transaction is recorded under receiver’s userId
        },
      }),
    ]);

    res.json({
      message: 'Transaction successful',
      debitTransaction: debitTx,
      creditTransaction: creditTx,
      updatedBalances: {
        from: updatedFrom.balance,
        to: updatedTo.balance,
      },
    });
  } catch (err) {
    console.error("Transaction error:", err);
    res.status(500).json({ error: 'Transaction failed' });
  }
});

export default TransactionsRouter;
