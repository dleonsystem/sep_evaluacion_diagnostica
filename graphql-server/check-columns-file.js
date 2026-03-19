import { query, pool } from './dist/config/database.js';
import fs from 'fs';

async function checkColumns() {
  try {
    const res = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios'
    `);
    fs.writeFileSync('columns_out.json', JSON.stringify(res.rows, null, 2));
  } catch (error) {
    fs.writeFileSync('columns_error.txt', error.toString());
  } finally {
    await pool.end();
  }
}

checkColumns();
