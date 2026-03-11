import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        const sql = fs.readFileSync('./scripts/add_resultados_solicitudes.sql', 'utf8');
        console.log('Ejecutando migración...');
        await pool.query(sql);
        console.log('✓ Migración completada exitosamente');
    } catch (err) {
        console.error('❌ Error en el proceso de migración:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrate();
