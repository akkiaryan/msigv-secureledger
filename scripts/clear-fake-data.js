const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_z8ZBSDLmQYw2@ep-bold-king-apdsh4xa-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    }
  }
});

async function main() {
  console.log('Clearing fake mock data from Neon database...');

  // Delete transactions, ledgers, inputs
  await prisma.deliveryItem.deleteMany({});
  await prisma.delivery.deleteMany({});
  await prisma.commercialLedger.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.emptyReturn.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.regulatorReturn.deleteMany({});
  await prisma.hosePipeTransaction.deleteMany({});
  await prisma.kycCardBookTransaction.deleteMany({});
  await prisma.auditorVerification.deleteMany({});
  await prisma.cylinderIncident.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.loadItem.deleteMany({});
  await prisma.load.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.invite.deleteMany({});
  await prisma.customerConnection.deleteMany({});
  await prisma.monthlyArchive.deleteMany({});
  await prisma.loadCycle.deleteMany({});

  // Delete customers (all commercial and domestic)
  await prisma.customer.deleteMany({});

  // Reset inventory filled stock to 0 while keeping slots
  await prisma.inventory.updateMany({
    data: {
      filledStock: 0,
      emptyStock: 550,
      damagedStock: 0,
      leakageStock: 0
    }
  });

  console.log('Neon database cleared. Seeding default configurations...');

  // Seed default employees to keep registry operational but clean
  // We can keep 'Employee Santoshi' to align with the seeded accounts.
  console.log('Dummy mock records successfully removed!');
}

main()
  .catch((e) => {
    console.error('Database clearing failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
