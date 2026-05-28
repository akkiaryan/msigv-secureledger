const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const databaseUrl = "postgresql://neondb_owner:npg_z8ZBSDLmQYw2@ep-bold-king-apdsh4xa-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function migrate() {
  console.log('Starting Neon database migration...');
  const schemaPath = path.join(__dirname, '../database/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to Neon PostgreSQL database.');
    
    // Execute the SQL schema block
    await client.query(sql);
    console.log('Database schema successfully initialized in Neon!');
  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    await client.end();
  }
}

migrate();
