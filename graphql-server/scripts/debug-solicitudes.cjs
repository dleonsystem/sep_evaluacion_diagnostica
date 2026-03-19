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
  const res = await client.query(`
    SELECT id, cct, archivo_original, hash_archivo, estado_validacion 
    FROM solicitudes_eia2 
    WHERE usuario_id = 'adc8767d-995d-44bc-a437-e01d7b2c651c'
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
run();
