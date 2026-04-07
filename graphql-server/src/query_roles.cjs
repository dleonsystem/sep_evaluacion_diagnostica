
const { query, closePool } = require('../dist/config/database.js');

async function checkRoles() {
  try {
    console.log('Consultando roles en cat_roles_usuario...');
    const res = await query('SELECT id_rol, codigo FROM cat_roles_usuario');
    console.log('--- ROLES DISPONIBLES EN DB ---');
    console.table(res.rows);
    console.log('-------------------------------');
  } catch (err) {
    console.error('Error consultando roles:', err.message);
  } finally {
    await closePool();
  }
}

checkRoles();
