import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Clearing existing data...");
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const users = [];
  console.log("👤 Creating users...");
  for (let i = 0; i < 3; i++) {
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
      },
    });
    users.push(user);
  }

  const accounts = [];
  console.log("🏦 Creating accounts...");
  for (const user of users) {
    const numAccounts = faker.number.int({ min: 1, max: 2 });
    for (let i = 0; i < numAccounts; i++) {
      const account = await prisma.account.create({
        data: {
          userId: user.id,
          type: faker.helpers.arrayElement(['SAVING', 'CURRENT', 'SALARY']),
          bankName: faker.company.name(),
          balance: new Decimal(faker.finance.amount(1000, 10000, 2)),
        },
      });
      accounts.push(account);
    }
  }

  console.log("💸 Creating transactions...");
  let skipped = 0;
  for (let i = 0; i < 20; i++) {
    const from = faker.helpers.arrayElement(accounts);
    let to = faker.helpers.arrayElement(accounts);

    while (to.id === from.id) {
      to = faker.helpers.arrayElement(accounts);
    }

    const amount = new Decimal(faker.finance.amount(50, 5000, 2));

    // ❌ Skip if insufficient funds
    if (from.balance.lessThan(amount)) {
      skipped++;
      continue;
    }

    const category = faker.helpers.arrayElement([
      'FOOD', 'RENT', 'SALARY', 'SHOPPING', 'TRANSFER',
      'UTILITIES', 'ENTERTAINMENT', 'EDUCATION', 'INVESTMENT', 'OTHERS',
    ]);

    // Create debit transaction (from sender's perspective)
    await prisma.transaction.create({
      data: {
        userId: from.userId,
        amount,
        type: 'DEBITED',
        category,
        fromAccountId: from.id,
        toAccountId: to.id,
      },
    });

    // Create credit transaction (to receiver's perspective)
    await prisma.transaction.create({
      data: {
        userId: to.userId,
        amount,
        type: 'CREDITED',
        category,
        fromAccountId: from.id,
        toAccountId: to.id,
      },
    });

    // Update balances
    from.balance = from.balance.minus(amount);
    to.balance = to.balance.plus(amount);

    await prisma.account.update({
      where: { id: from.id },
      data: { balance: from.balance },
    });

    await prisma.account.update({
      where: { id: to.id },
      data: { balance: to.balance },
    });
  }

  console.log(`✅ Seeding complete! Skipped transactions due to low balance: ${skipped}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
