import dotenv from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

dotenv.config();

console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD type:', typeof process.env.DB_PASSWORD);
console.log('DB_PASSWORD length:', process.env.DB_PASSWORD?.length);

const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'eia_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || undefined,
    ssl: {
        rejectUnauthorized: false
    }
};

console.log('Final password type in config:', typeof poolConfig.password);

const pool = new Pool(poolConfig);

try {
    console.log('Attempting connection...');
    const client = await pool.connect();
    console.log('Connected!');
    client.release();
} catch (err) {
    console.error('Connection failed:', err);
} finally {
    await pool.end();
}
