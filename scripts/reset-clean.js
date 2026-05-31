const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// 1. Environment Guard & Database URL resolution
const nodeEnv = process.env.NODE_ENV;
const resetConfirm = process.env.RESET_CONFIRM;

if (nodeEnv === 'production' && resetConfirm !== 'MSIGV_RESET_CLEAN') {
  console.error('======================================================================');
  console.error('ERROR: DATABASE RESET BLOCKED ON PRODUCTION ENVIRONMENT!');
  console.error('To override and execute, set environment variable:');
  console.error('RESET_CONFIRM="MSIGV_RESET_CLEAN"');
  console.error('======================================================================');
  process.exit(1);
}

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  
  // Try loading from local environment files
  const envPaths = [
    path.join(__dirname, '../.env.local'),
    path.join(__dirname, '../.env')
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/^DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);
        if (match && match[1]) {
          return match[1].trim();
        }
      } catch (err) {
        console.warn(`Warning: Could not read env file at ${envPath}:`, err.message);
      }
    }
  }

  // Fallback to default dev url
  return "postgresql://neondb_owner:npg_z8ZBSDLmQYw2@ep-bold-king-apdsh4xa-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
}

const dbUrl = getDatabaseUrl();
console.log(`Connecting to database for clean reset...`);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
    }
  }
});

async function main() {
  console.log('Starting clean database reset workflow...');

  // 2. Clear Operational Tables in Dependency Order
  console.log('Purging operational/transactional records...');
  
  // Child tables first to avoid foreign key violations
  await prisma.deliveryItem.deleteMany({});
  await prisma.commercialLedger.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.emptyReturn.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.regulatorReturn.deleteMany({});
  await prisma.hosePipeTransaction.deleteMany({});
  await prisma.kycCardBookTransaction.deleteMany({});
  await prisma.auditorVerification.deleteMany({});
  await prisma.cylinderIncident.deleteMany({});
  await prisma.customerConnection.deleteMany({});
  
  // Parent tables
  await prisma.delivery.deleteMany({});
  await prisma.loadItem.deleteMany({});
  await prisma.load.deleteMany({});
  await prisma.loadCycle.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.monthlyArchive.deleteMany({});
  await prisma.inventoryTransaction.deleteMany({});
  await prisma.invite.deleteMany({});
  await prisma.dailyClosing.deleteMany({});
  
  // Clear customers and non-essential audit logs
  await prisma.customer.deleteMany({});
  await prisma.auditLog.deleteMany({});

  console.log('Operational records deleted successfully.');

  // 3. Keep only seeded role users
  console.log('Enforcing seed users (Admin, Employee, Auditor)...');
  await prisma.user.deleteMany({
    where: {
      username: {
        notIn: ['MaaSantoshi', 'EmployeeSantoshi', 'AuditorSantoshi']
      }
    }
  });

  // Re-seed/Upsert admin
  const adminPasswordHash = bcrypt.hashSync('Santoshi@717', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'MaaSantoshi' },
    update: { passwordHash: adminPasswordHash, name: 'Maa Santoshi', role: 'ADMIN', isActive: true },
    create: {
      username: 'MaaSantoshi',
      passwordHash: adminPasswordHash,
      name: 'Maa Santoshi',
      role: 'ADMIN',
      isActive: true
    }
  });
  console.log(`Admin user verified: ${admin.username}`);

  // Re-seed/Upsert employee user
  const employeePasswordHash = bcrypt.hashSync('Employee@001', 10);
  const employeeUser = await prisma.user.upsert({
    where: { username: 'EmployeeSantoshi' },
    update: { passwordHash: employeePasswordHash, name: 'Employee Santoshi', role: 'EMPLOYEE', isActive: true },
    create: {
      username: 'EmployeeSantoshi',
      passwordHash: employeePasswordHash,
      name: 'Employee Santoshi',
      role: 'EMPLOYEE',
      isActive: true
    }
  });
  console.log(`Employee user verified: ${employeeUser.username}`);

  // Re-seed/Upsert employee profile registry
  await prisma.employee.deleteMany({
    where: {
      mobile: {
        not: '7783099911'
      }
    }
  });
  const employeeProfile = await prisma.employee.upsert({
    where: { mobile: '7783099911' },
    update: { name: 'Employee Santoshi', role: 'employee', isActive: true },
    create: {
      name: 'Employee Santoshi',
      role: 'employee',
      mobile: '7783099911',
      isActive: true
    }
  });
  console.log(`Employee profile verified: ${employeeProfile.name} (${employeeProfile.mobile})`);

  // Re-seed/Upsert auditor
  const auditorPasswordHash = bcrypt.hashSync('Auditor@001', 10);
  const auditor = await prisma.user.upsert({
    where: { username: 'AuditorSantoshi' },
    update: { passwordHash: auditorPasswordHash, name: 'Auditor Santoshi', role: 'AUDITOR', isActive: true },
    create: {
      username: 'AuditorSantoshi',
      passwordHash: auditorPasswordHash,
      name: 'Auditor Santoshi',
      role: 'AUDITOR',
      isActive: true
    }
  });
  console.log(`Auditor user verified: ${auditor.username}`);

  // 4. Initialize empty inventory slots
  console.log('Resetting inventory balances to 0 (Uninitialized state)...');
  await prisma.inventory.upsert({
    where: { cylinderType: 'DOMESTIC_14_2' },
    update: { filledStock: 0, emptyStock: 0, damagedStock: 0, leakageStock: 0 },
    create: {
      cylinderType: 'DOMESTIC_14_2',
      filledStock: 0,
      emptyStock: 0,
      damagedStock: 0,
      leakageStock: 0
    }
  });

  await prisma.inventory.upsert({
    where: { cylinderType: 'COMMERCIAL_19' },
    update: { filledStock: 0, emptyStock: 0, damagedStock: 0, leakageStock: 0 },
    create: {
      cylinderType: 'COMMERCIAL_19',
      filledStock: 0,
      emptyStock: 0,
      damagedStock: 0,
      leakageStock: 0
    }
  });
  console.log('Inventory balances successfully set to 0.');

  // 5. Log the clean system-wide audit entry
  console.log('Writing final system log entry...');
  await prisma.auditLog.create({
    data: {
      action: 'ADJUSTMENT',
      tableName: 'system',
      recordId: 'SYSTEM',
      remarks: 'Clean database reset completed before production release'
    }
  });

  console.log('======================================================================');
  console.log('DATABASE CLEAN RESET COMPLETED SUCCESSFULLY!');
  console.log('All operational data deleted.');
  console.log('Only primary seed users exist.');
  console.log('Portal will now prompt to initialize opening stock.');
  console.log('======================================================================');
}

main()
  .catch((e) => {
    console.error('Clean database reset failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
