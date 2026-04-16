import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Verificando columna user_turno en tickets_soporte...');
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tickets_soporte' AND column_name = 'user_turno'
    `);

    if (res.rows.length === 0) {
      console.log('Añadiendo columna user_turno a tickets_soporte...');
      await client.query('ALTER TABLE tickets_soporte ADD COLUMN user_turno VARCHAR(50)');
      console.log('✅ Columna user_turno añadida exitosamente.');
    } else {
      console.log('ℹ️ La columna user_turno ya existe.');
    }
  } catch (err) {
    console.error('❌ Error migrando base de datos:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
