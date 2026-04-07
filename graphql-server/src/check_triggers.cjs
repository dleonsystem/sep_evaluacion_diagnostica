
const { query, closePool } = require('../dist/config/database.js');

async function checkTriggers() {
  try {
    console.log('Buscando triggers en la tabla usuarios...');
    const res = await query(`
        SELECT tgname 
        FROM pg_trigger 
        JOIN pg_class ON pg_class.oid = tgrelid 
        WHERE relname = 'usuarios'
    `);
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await closePool();
  }
}

checkTriggers();
