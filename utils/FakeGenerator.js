import { faker } from '@faker-js/faker';
import {
AccountType,
TransactionType,
TransactionCategory,
PrismaClient,
User,
} from '@prisma/client';

const prisma = new PrismaClient();


export async function generateFakeAccount(userId) {
const account = await prisma.account.create({
data: {
userId,
type: faker.helpers.enumValue(AccountType),
bankName: faker.company.name(),
balance: faker.number.float({ min: 1000, max: 100000, precision: 0.01 }),
},
});

return account;
}


export async function generateFakeTransactions(
user,
accountId,
count=10
) {
const transactions = [];

for (let i = 0; i < count; i++) {
const isCredit = faker.datatype.boolean();
const tx = await prisma.transaction.create({
data: {
amount: faker.number.float({ min: 100, max: 5000, precision: 0.01 }),
type: isCredit ? TransactionType.CREDITED : TransactionType.DEBITED,
category: faker.helpers.enumValue(TransactionCategory),
userId: user.id,
fromAccountId: isCredit ? undefined : accountId,
toAccountId: isCredit ? accountId : undefined,
createdAt: faker.date.recent({ days: 90 }),
},
});
transactions.push(tx);
}

return transactions;
}