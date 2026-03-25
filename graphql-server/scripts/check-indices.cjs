const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });
  await client.connect();
  const res = await client.query(`SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'solicitudes_eia2'`);
  res.rows.forEach(r => console.log(`${r.indexname}: ${r.indexdef}`));
  await client.end();
}
run();
