
const { query, closePool } = require('../dist/config/database.js');

async function getFunc() {
  try {
    const res = await query("SELECT pg_get_functiondef(p.oid) as def FROM pg_proc p WHERE p.proname = 'fn_catalogo_id'");
    if (res.rows.length > 0) {
      console.log('--- DEFINICION SQL ---');
      console.log(res.rows[0].def);
      console.log('--- FIN ---');
    } else {
      console.log('No se encontró la función.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await closePool();
  }
}

getFunc();
