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

    const existingUser=await prisma.user.findUnique({
      where:{
        email:email
      },
      include:{
        accounts:true,
        transactions:true,
      }
      
    })

    if(existingUser){
      const token = signToken({ userId: existingUser.id });
          res.json({
            user:  existingUser,
            accounts:existingUser.accounts,
            transactions:existingUser.transactions,
            accessToken: token,
          })
    }
    else
    {
          const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { name, email },
    });

    const allAccounts = await prisma.account.findMany();

    const accounts = [];
    const transactions = [];

    // 3. Create 1-2 accounts for this user
    for (let i = 0; i < faker.number.int({ min: 1, max: 2 }); i++) {
      const newAccount = await prisma.account.create({
        data: {
          userId: user.id,
          type: faker.helpers.enumValue(AccountType),
          bankName: faker.company.name(),
          balance: faker.number.float({
            min: 1000,
            max: 100000,
            precision: 0.01,
          }),
        },
      });

      accounts.push(newAccount);

      // Push new account into allAccounts list (so next txns can send to this as well)
      allAccounts.push(newAccount);

      // 4. Generate 10 transactions per new account
      for (let j = 0; j < 10; j++) {
        const amount = faker.number.float({
          min: 100,
          max: 5000,
          precision: 0.01,
        });
        const category = faker.helpers.enumValue(TransactionCategory);
        const type = faker.helpers.enumValue(TransactionType);

        // Pick a toAccountId from the existing seeded accounts (not same as from)
        const possibleRecipients = allAccounts.filter(
          (acc) => acc.id !== newAccount.id
        );
        if (possibleRecipients.length === 0) break;

        const toAccount = faker.helpers.arrayElement(possibleRecipients);

        // Save transaction
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

        transactions.push(tx);
      }
    }

    const token = signToken({ userId: user.id });

    res.json({
      user,
      accounts,
      transactions,
      accessToken: token,
    });
      
    }
  } catch (err) {
    console.error("❌ Error in linkBankRouter:", err);
    res.status(500).json({ error: "Error linking bank" });
  }
});
export default linkBankRouter;
