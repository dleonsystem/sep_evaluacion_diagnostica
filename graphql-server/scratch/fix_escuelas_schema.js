import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function fixSchema() {
  try {
    console.log('Adding missing columns to escuelas table...');
    
    await pool.query(`
      ALTER TABLE escuelas 
      ADD COLUMN IF NOT EXISTS email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS telefono VARCHAR(50),
      ADD COLUMN IF NOT EXISTS director VARCHAR(150),
      ADD COLUMN IF NOT EXISTS cp VARCHAR(10)
    `);
    
    console.log('Columns added successfully.');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Failed to update schema:', error);
    process.exit(1);
  }
}

fixSchema();
