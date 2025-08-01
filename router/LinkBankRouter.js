import express from "express";
import {
  PrismaClient,
  AccountType,
  TransactionCategory,
  TransactionType,
} from "@prisma/client";
import { faker } from "@faker-js/faker";
import { signToken } from "../utils/jwt.js";

const linkBankRouter = express.Router();
const prisma = new PrismaClient();

linkBankRouter.post("/", async (req, res) => {
  const { name, email } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true, transactions: true },
    });

    if (existingUser) {
      const token = signToken({ userId: existingUser.id });
      return res.json({
        user: existingUser,
        accounts: existingUser.accounts,
        transactions: existingUser.transactions,
        accessToken: token,
      });
    }

    // Create new user
    const user = await prisma.user.create({
      data: { name, email },
    });

    const allAccounts = await prisma.account.findMany(); // for transaction targets
    const accounts = [];
    const transactions = [];

    for (let i = 0; i < faker.number.int({ min: 1, max: 2 }); i++) {
      const initialBalance = faker.number.float({
        min: 1000,
        max: 100000,
        precision: 0.01,
      });

      const newAccount = await prisma.account.create({
        data: {
          userId: user.id,
          type: faker.helpers.enumValue(AccountType),
          bankName: faker.company.name(),
          balance: initialBalance,
        },
      });

      accounts.push(newAccount);
      allAccounts.push(newAccount);

      let currentBalance = initialBalance;

      for (let j = 0; j < 10; j++) {
        const amount = faker.number.float({ min: 100, max: 5000, precision: 0.01 });
        const category = faker.helpers.enumValue(TransactionCategory);
        const type = faker.helpers.enumValue(TransactionType);

        const possibleRecipients = allAccounts.filter(
          (acc) => acc.id !== newAccount.id
        );
        if (possibleRecipients.length === 0) break;

        const toAccount = faker.helpers.arrayElement(possibleRecipients);

        const tx = await prisma.transaction.create({
          data: {
            amount,
            type,
            category,
            userId: user.id,
            fromAccountId: newAccount.id,
            toAccountId: toAccount.id,
            createdAt: faker.date.recent({ days: 90 }),
          },
        });

        // Adjust local balance
        currentBalance = type === "DEBITED"
          ? currentBalance - amount
          : currentBalance + amount;

        transactions.push(tx);
      }

      await prisma.account.update({
        where: { id: newAccount.id },
        data: { balance: currentBalance },
      });
    }

    const token = signToken({ userId: user.id });

    res.json({
      user,
      accounts,
      transactions,
      accessToken: token,
    });
  } catch (err) {
    console.error("❌ Error in linkBankRouter:", err);
    res.status(500).json({ error: "Error linking bank" });
  }
});

export default linkBankRouter;
