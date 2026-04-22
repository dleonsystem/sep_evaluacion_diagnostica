import { query } from '../src/config/database.js';
import { logger } from '../src/utils/logger.js';

async function fixSchema() {
  try {
    logger.info('Adding missing columns to escuelas table...');
    
    await query(`
      ALTER TABLE escuelas 
      ADD COLUMN IF NOT EXISTS email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS telefono VARCHAR(50),
      ADD COLUMN IF NOT EXISTS director VARCHAR(150),
      ADD COLUMN IF NOT EXISTS cp VARCHAR(10)
    `);
    
    logger.info('Columns added successfully.');
    process.exit(0);
  } catch (error) {
    logger.error('Failed to update schema:', error);
    process.exit(1);
  }
}

fixSchema();
