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
    const email = 'jose_mx@hotmail.com';
    const res = await client.query('SELECT password_hash FROM usuarios WHERE email = $1', [email]);
    if (res.rows.length > 0) {
      console.log('HASH:', res.rows[0].password_hash);
    } else {
      console.log('Usuario no encontrado');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
