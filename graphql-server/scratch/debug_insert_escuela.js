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

async function testInsert() {
  try {
    console.log('Testing INSERT for createEscuela...');
    
    // Values from the user's failed request
    const cct = "15DPR1234Z";
    const nombre = "ESCUELA PRIMARIA PRUEBA POSTMAN";
    const id_turno = 1;
    const id_nivel = 2;
    const id_entidad = 15;
    const id_ciclo = 2024;
    const email = null;
    const telefono = null;
    const director = "PROF. INVESTIGADOR";
    const cp = "50000";

    const res = await pool.query(
      `INSERT INTO escuelas (
        cct, nombre, id_turno, id_nivel, id_entidad, id_ciclo, 
        email, telefono, director, cp, activo, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, NOW(), NOW())
      RETURNING id`,
      [
        cct.toUpperCase(),
        nombre,
        id_turno,
        id_nivel,
        id_entidad,
        id_ciclo,
        email,
        telefono,
        director,
        cp,
      ]
    );
    
    console.log('INSERT successful, id:', res.rows[0].id);
    
    // Clean up
    await pool.query('DELETE FROM escuelas WHERE id = $1', [res.rows[0].id]);
    console.log('Test record cleaned up.');
    
    await pool.end();
  } catch (error) {
    console.error('INSERT FAILED with error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testInsert();
