import express from "express";
import { PrismaClient } from "@prisma/client";
const AccountsRouter = express.Router();
const prisma = new PrismaClient();

AccountsRouter.get("/", async (req, res) => {
  const userId = req.user.id;
  const accounts = await prisma.account.findMany({ where: { userId } });
  res.json(accounts);
});

AccountsRouter.get("/:accountId", async (req, res) => {
  const { accountId } = req.params;

  const account = await prisma.account.findFirst({
    where: {
      id: accountId,
      userId: req.user.id,
    },
  });

  if (!account)
    return res
      .status(404)
      .json({ error: "Account not found or access denied" });

  res.json({ account });
});

export default AccountsRouter;
