const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios_centros_trabajo'
    `);
    console.log(res.rows.map(r => r.column_name).join(', '));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
