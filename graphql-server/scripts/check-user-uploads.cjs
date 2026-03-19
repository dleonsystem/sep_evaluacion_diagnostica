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
    const userId = 'adc8767d-995d-44bc-a437-e01d7b2c651c';
    console.log('--- Buscando solicitudes para usuario ID:', userId, '---');
    const res = await client.query('SELECT id, cct, archivo_original, fecha_carga, estado_validacion FROM solicitudes_eia2 WHERE usuario_id = $1', [userId]);
    
    console.log('Total encontradas:', res.rows.length);
    console.log(JSON.stringify(res.rows, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
