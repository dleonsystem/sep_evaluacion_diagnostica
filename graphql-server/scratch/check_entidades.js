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

async function checkEntidades() {
  try {
    const res = await pool.query('SELECT id_entidad, nombre FROM cat_entidades_federativas');
    console.log('Entidades:', res.rows);
    await pool.end();
  } catch (error) {
    console.error('Error checking entidades:', error);
  }
}

checkEntidades();
