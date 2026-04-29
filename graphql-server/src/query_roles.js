
const { query, closePool } = require('../dist/config/database.js');

async function checkRoles() {
  try {
    console.log('Consultando roles en cat_roles_usuario...');
    const res = await query('SELECT id_rol, codigo, nombre FROM cat_roles_usuario');
    console.log('Roles encontrados:');
    console.table(res.rows);
  } catch (err) {
    console.error('Error consultando roles:', err.message);
  } finally {
    await closePool();
  }
}

checkRoles();
