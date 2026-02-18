/**
 * Database Configuration Module
 *
 * @module config/database
 * @description Configuración de conexión a PostgreSQL siguiendo estándares PSP
 * @version 1.0.0
 * @author SEP - Evaluación Diagnóstica
 * @standard PSP (Personal Software Process)
 * @compliance RUP - Elaboration Phase
 * @cmmi CMMI Level 3 - Configuration Management
 */

import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

// Cargar variables de entorno
dotenv.config();

/**
 * Configuración del pool de conexiones PostgreSQL
 * @psp Defect Prevention - Validación de configuración antes de crear pool
 */
const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'eia_db',
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD || ''),
  min: parseInt(process.env.DB_POOL_MIN || '2', 10),
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};
/**
 * Validación de configuración de base de datos
 * @psp Code Review Checklist - Validar parámetros críticos
 */
function validateDatabaseConfig(): void {
  const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    logger.warn(`Missing required environment variables: ${missingVars.join(', ')}`);
    logger.warn('Server will continue in degraded mode (No Database)');
  }
}

// Validar configuración antes de crear pool
validateDatabaseConfig();

/**
 * Pool de conexiones PostgreSQL
 * @rup Architecture Pattern - Connection Pool Pattern
 */
export const pool = new Pool(poolConfig);

/**
 * Event handlers para monitoreo del pool
 * @psp Process Metrics - Monitoreo de rendimiento
 */
pool.on('connect', () => {
  logger.info('New client connected to PostgreSQL pool');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle PostgreSQL client (Server will continue)', err);
  // No cerrar el proceso en desarrollo si falla la conexión
});

pool.on('remove', () => {
  logger.info('Client removed from PostgreSQL pool');
});

/**
 * Función para probar la conexión a la base de datos
 * @psp Unit Testing - Test de conectividad
 * @returns Promise<boolean>
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');

    logger.info('PostgreSQL connection test successful', {
      currentTime: result.rows[0].current_time,
      version: result.rows[0].pg_version,
    });

    client.release();
    return true;
  } catch (error) {
    logger.error('PostgreSQL connection test failed', error);
    return false;
  }
}

/**
 * Función para cerrar el pool de conexiones
 * @psp Resource Management - Cleanup
 */
export async function closePool(): Promise<void> {
  try {
    await pool.end();
    logger.info('PostgreSQL pool closed successfully');
  } catch (error) {
    logger.error('Error closing PostgreSQL pool', error);
    throw error;
  }
}

/**
 * Query helper con manejo de errores
 * @psp Error Prevention - Wrapper con logging y manejo de errores
 * @param text SQL query
 * @param params Query parameters
 */
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    logger.debug('Query executed', {
      text,
      duration,
      rows: result.rowCount,
    });

    return result;
  } catch (error) {
    logger.error('Query execution failed', {
      text,
      params,
      error,
    });
    throw error;
  }
}

/**
 * Helper to get a single client from the pool (useful for transactions)
 */
export async function getClient() {
  const client = await pool.connect();
  return client;
}

export default pool;
