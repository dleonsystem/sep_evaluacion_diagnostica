import { query, pool } from './dist/config/database.js';

async function runMigration() {
  try {
    console.log('Adding primer_login...');
    await query('ALTER TABLE usuarios ADD COLUMN primer_login BOOLEAN DEFAULT TRUE');
    console.log('Adding intentos_fallidos...');
    await query('ALTER TABLE usuarios ADD COLUMN intentos_fallidos INT DEFAULT 0');
    console.log('Migration successful');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('Columns already exist, skipping');
    } else {
      console.error('Migration failed:', error);
    }
  } finally {
    await pool.end();
  }
}

runMigration();
