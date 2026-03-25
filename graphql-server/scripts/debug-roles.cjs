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
    console.log('--- Buscando usuario: jose_mx@hotmail.com ---');
    const res = await client.query('SELECT id, email, rol, activo FROM usuarios WHERE email = $1', ['jose_mx@hotmail.com']);
    
    if (res.rows.length === 0) {
      console.log('Usuario NO encontrado.');
    } else {
      console.log('Usuario encotrado:', JSON.stringify(res.rows[0], null, 2));
      
      const roles = await client.query('SELECT * FROM cat_roles_usuario');
      console.log('Roles disponibles:', JSON.stringify(roles.rows, null, 2));
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
