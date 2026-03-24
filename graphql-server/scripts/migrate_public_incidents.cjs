const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to DB...');
    
    const alterSql = `
      ALTER TABLE tickets_soporte 
      ADD COLUMN IF NOT EXISTS user_fullname VARCHAR(255),
      ADD COLUMN IF NOT EXISTS user_cct VARCHAR(20),
      ADD COLUMN IF NOT EXISTS user_email VARCHAR(150);
    `;
    
    await client.query(alterSql);
    console.log('Columns added successfully to tickets_soporte.');
    
  } catch (err) {
    console.error('Error running migration:', err);
  } finally {
    await client.end();
  }
}

run();
