const { Client } = require('pg');

const databaseUrl = "postgresql://neondb_owner:npg_z8ZBSDLmQYw2@ep-bold-king-apdsh4xa-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function seed() {
  console.log('Seeding database tables...');
  
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    // 1. Seed Employees
    const employeeCheck = await client.query('SELECT count(*) FROM employees');
    if (parseInt(employeeCheck.rows[0].count) === 0) {
      console.log('Inserting seed employees...');
      await client.query(`
        INSERT INTO employees (name, role, mobile, daily_wage, is_active) VALUES
        ('Ramesh Singh', 'delivery_man', '9876543210', 500.00, true),
        ('Sunil Kumar', 'loader', '9876543211', 400.00, true),
        ('Anil Yadav', 'loader', '9876543212', 400.00, true);
      `);
      console.log('Employees seeded.');
    } else {
      console.log('Employees table already has data, skipping.');
    }

    // 2. Seed Customers
    const customerCheck = await client.query('SELECT count(*) FROM customers');
    if (parseInt(customerCheck.rows[0].count) === 0) {
      console.log('Inserting seed customers...');
      await client.query(`
        INSERT INTO customers (name, consumer_number, mobile, address, customer_type, credit_allowed) VALUES
        ('Hotel Grand Regency', 'COM-10023', '9999988888', 'Main Road, Town Center', 'commercial', true),
        ('Maa Vaishno Dhaba', 'COM-10024', '9999988887', 'Highway Junction', 'commercial', true),
        ('Sanjay Sharma', 'DOM-55412', '9888877777', 'Ward No. 5, Gramin Colony', 'domestic', false);
      `);
      console.log('Customers seeded.');
    } else {
      console.log('Customers table already has data, skipping.');
    }

    console.log('Database seeding successfully completed!');
  } catch (error) {
    console.error('Seeding failed:', error.message);
  } finally {
    await client.end();
  }
}

seed();
