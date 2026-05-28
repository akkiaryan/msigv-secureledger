const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_z8ZBSDLmQYw2@ep-bold-king-apdsh4xa-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    }
  }
});

async function main() {
  console.log('Seeding Prisma database for Production Roles...');

  // 1. Create clean Admin User with bcrypt hashed password
  console.log('Creating Admin user...');
  const adminPasswordHash = bcrypt.hashSync('Santoshi@717', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'MaaSantoshi' },
    update: { passwordHash: adminPasswordHash },
    create: {
      username: 'MaaSantoshi',
      passwordHash: adminPasswordHash,
      name: 'Maa Santoshi',
      role: 'ADMIN',
      isActive: true
    }
  });
  console.log(`Admin created: User ID = ${admin.id}`);

  // 2. Create clean Employee User with bcrypt hashed password
  console.log('Creating Employee user...');
  const employeePasswordHash = bcrypt.hashSync('Employee@001', 10);
  const employeeUser = await prisma.user.upsert({
    where: { username: 'EmployeeSantoshi' },
    update: { passwordHash: employeePasswordHash },
    create: {
      username: 'EmployeeSantoshi',
      passwordHash: employeePasswordHash,
      name: 'Employee Santoshi',
      role: 'EMPLOYEE',
      isActive: true
    }
  });
  console.log(`Employee User created: ID = ${employeeUser.id}`);

  // Seed Employee registry profile
  const employeeRegistry = await prisma.employee.upsert({
    where: { mobile: '7783099911' },
    update: { name: 'Employee Santoshi', isActive: true },
    create: {
      name: 'Employee Santoshi',
      role: 'employee',
      mobile: '7783099911',
      isActive: true
    }
  });
  console.log(`Employee Registry profile created: ID = ${employeeRegistry.id}`);

  // 3. Create clean Auditor User with bcrypt hashed password
  console.log('Creating Auditor user...');
  const auditorPasswordHash = bcrypt.hashSync('Auditor@001', 10);
  const auditor = await prisma.user.upsert({
    where: { username: 'AuditorSantoshi' },
    update: { passwordHash: auditorPasswordHash },
    create: {
      username: 'AuditorSantoshi',
      passwordHash: auditorPasswordHash,
      name: 'Auditor Santoshi',
      role: 'AUDITOR',
      isActive: true
    }
  });
  console.log(`Auditor created: User ID = ${auditor.id}`);

  // 4. Seed Base Stock Inventory
  console.log('Creating initial stock slots...');
  await prisma.inventory.upsert({
    where: { cylinderType: 'DOMESTIC_14_2' },
    update: { filledStock: 0, emptyStock: 550, damagedStock: 0, leakageStock: 0 },
    create: {
      cylinderType: 'DOMESTIC_14_2',
      filledStock: 0,
      emptyStock: 550,
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
  console.log('Stock slots initialized.');

  console.log('Production database seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
