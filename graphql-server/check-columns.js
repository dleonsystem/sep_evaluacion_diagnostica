import { query, pool } from './dist/config/database.js';

async function checkColumns() {
  try {
    const res = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios'
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (error) {
    console.error('Error checking columns:', error);
  } finally {
    await pool.end();
  }
}

checkColumns();
