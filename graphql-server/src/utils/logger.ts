/**
 * Logger Utility Module
 *
 * @module utils/logger
 * @description Sistema de logging centralizado usando Winston
 * @version 1.0.0
 * @author SEP - Evaluación Diagnóstica
 * @standard PSP (Personal Software Process)
 * @cmmi CMMI Level 3 - Process and Product Quality Assurance
 */

import winston from 'winston';
import path from 'node:path';

/**
 * Niveles de log personalizados
 * @psp PSP Logging Standards
 */
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

/**
 * Colores para cada nivel de log
 */
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(logColors);

/**
 * Formato de log personalizado
 * @psp Defect Logging - Formato estructurado para análisis
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) =>
      `${info.timestamp} ${info.level}: ${info.message}${
        info.metadata ? ' ' + JSON.stringify(info.metadata) : ''
      }`
  )
);

/**
 * Transportes de Winston
 * @psp Process Metrics - Logs para análisis de proceso
 */
const transports = [
  // Console output
  new winston.transports.Console({
    format: logFormat,
  }),
  // Error log file
  new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  }),
  // Combined log file
  new winston.transports.File({
    filename: path.join('logs', 'combined.log'),
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  }),
];

/**
 * Logger instance
 * @rup Architectural Mechanism - Logging Framework
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  levels: logLevels,
  transports,
  exitOnError: false,
});

/**
 * PSP Time Logging helper
 * @psp Time Recording Log
 */
export function logPSPTime(activity: string, timeSpent: number, defects: number = 0): void {
  logger.info('PSP Time Log', {
    activity,
    timeSpent,
    defects,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Stream para Morgan (HTTP logging)
 */
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export default logger;
