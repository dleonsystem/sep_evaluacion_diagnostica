/**
 * GraphQL Server Entry Point
 *
 * @module index
 * @description Punto de entrada del servidor GraphQL Apollo
 * @version 1.0.0
 * @author SEP - Evaluación Diagnóstica
 * @standard PSP (Personal Software Process)
 * @rup Elaboration Phase - Architectural Baseline
 * @cmmi CMMI Level 3 - Integrated Project Management
 */

// Imports de Swagger
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

// ... (después de imports)

/**
 * Configura Swagger UI
 */
function configureSwagger(app: express.Application) {
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'API Sistema de Evaluación Diagnóstica EIA',
        version: '1.0.0',
        description: 'Documentación de API REST para integración con sistemas legados.',
      },
      servers: [
        {
          url: `http://${HOST}:${PORT}/api`,
        },
      ],
    },
    apis: ['./src/config/swagger.def.js', './src/index.ts'], // Path to files with annotations
  };

  const specs = swaggerJsdoc(options);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  logger.info(`📚 Documentación Swagger disponible en http://${HOST}:${PORT}/api-docs`);
}

// 8. Iniciar servidor HTTP
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'node:http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { typeDefs } from './schema/typeDefs.js';
import { resolvers, GraphQLContext } from './schema/resolvers.js';
import { query, testConnection, closePool, pool } from './config/database.js';
import { logger, logPSPTime } from './utils/logger.js';
import { createDataLoaders } from './utils/data-loaders.js';
import { DistributionService } from './services/distribution.service.js';
import { EmailWatcherService } from './services/email-watcher.service.js';
import { verifyToken } from './config/jwt.js';
import { startSyncLegacyJob, stopSyncLegacyJob } from './jobs/sync-legacy.job.js';

// Cargar variables de entorno
dotenv.config();

/**
 * Configuración del servidor
 * @psp Configuration Management
 */
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || 'localhost';
const GRAPHQL_PATH = process.env.GRAPHQL_PATH || '/graphql';

/**
 * Configura middlewares de Express
 * @psp Configuration Management
 */
function configureMiddlewares(app: express.Application) {
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
}

/**
 * Crea servidor Apollo GraphQL
 * @psp Process Script - Apollo Configuration
 */
function createApolloServer(httpServer: http.Server) {
  return new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async requestDidStart() {
          await Promise.resolve(); // Satisfy require-await
          return {
            async didEncounterErrors(requestContext: any) {
              await Promise.resolve(); // Satisfy require-await
              logger.error('GraphQL Error', {
                errors: requestContext.errors,
                operation: requestContext.operation?.operation,
                variables: requestContext.request.variables,
              });
            },
          };
        },
      },
    ],
    introspection: process.env.NODE_ENV !== 'production' && process.env.GRAPHQL_INTROSPECTION === 'true',
    includeStacktraceInErrorResponses: process.env.NODE_ENV !== 'production',
  });
}

/**
 * Configura rutas de Express
 * @psp Configuration Management
 */
function configureRoutes(app: express.Application) {
  app.get('/health', (_req, res) => {
    void (async () => {
      try {
        const dbConnected = await testConnection();
        res.json({
          status: 'OK',
          timestamp: new Date().toISOString(),
          database: dbConnected ? 'connected' : 'disconnected',
          uptime: process.uptime(),
        });
      } catch (error) {
        logger.error('Health check error:', error);
        res.status(503).json({
          status: 'ERROR',
          timestamp: new Date().toISOString(),
          database: 'disconnected',
        });
      }
    })();
  });

  app.get('/', (_req, res) => {
    res.json({
      message: 'Servidor GraphQL - Sistema de Evaluación Integral de Aprendizaje (EIA)',
      version: '1.0.0',
      graphql: `http://${HOST}:${PORT}${GRAPHQL_PATH}`,
      health: `http://${HOST}:${PORT}/health`,
      standards: {
        psp: 'Personal Software Process',
        rup: 'Rational Unified Process',
        cmmi: 'CMMI Level 3',
      },
    });
  });
}

/**
 * Rutas de API REST para sistemas legados
 * @use-case CU-15: Integración con Sistemas Legados
 */
function configureLegacyApi(app: express.Application) {
  const router = express.Router();

  // Endpoint para obtener estadísticas por CCT
  router.get('/stats/:cct', (req, res) => {
    void (async () => {
      const { cct } = req.params;
      try {
        const dbRes = await query(
          `
          SELECT 
            COUNT(DISTINCT e.id) as total_estudiantes,
            COUNT(v.id) as total_evaluaciones
          FROM escuelas esc
          JOIN grupos g ON g.escuela_id = esc.id
          JOIN estudiantes e ON e.grupo_id = g.id
          LEFT JOIN evaluaciones v ON v.estudiante_id = e.id
          WHERE esc.cct = $1
        `,
          [cct]
        );

        if (dbRes.rows.length === 0) {
          return res.status(404).json({ error: 'CCT no encontrada' });
        }

        const stats = dbRes.rows[0];
        res.json({
          cct,
          success: true,
          data: {
            total_estudiantes: parseInt(stats.total_estudiantes),
            total_evaluaciones: parseInt(stats.total_evaluaciones),
            porcentaje_completado:
              stats.total_estudiantes > 0
                ? ((stats.total_evaluaciones / (stats.total_estudiantes * 4)) * 100).toFixed(2) +
                  '%'
                : '0%',
          },
        });
        return; // Added return to match code path expectation
      } catch (error) {
        logger.error('Legacy API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
    })();
  });

  app.use('/api/legacy', router);
}

/**
 * Función principal para iniciar el servidor
 * @psp Process Script - Startup Sequence
 * @rup Iteration Planning - Bootstrap Phase
 */
async function startServer() {
  const startTime = Date.now();

  try {
    logger.info('=== Iniciando servidor GraphQL EIA ===');

    // 1. Verificar conexión a base de datos
    logger.info('Verificando conexión a PostgreSQL...');
    const dbConnected = await testConnection();
    if (dbConnected) {
      logger.info(`✓ Conexión a PostgreSQL establecida en host: ${process.env.DB_HOST || 'localhost'}`);
    } else {
      logger.error('❌ Falló la conexión a PostgreSQL. El servidor requiere una BD activa.');
      process.exit(1);
    }

    // 2. Crear aplicación Express
    const app = express();
    const httpServer = http.createServer(app);

    // 3. Configurar middlewares de seguridad
    configureMiddlewares(app);

    // 4. Inicializar Servicios de Distribución (CU-06)
    const distributionService = new DistributionService(pool);
    const emailWatcherService = new EmailWatcherService(distributionService);

    // Solo iniciar el watcher si están configuradas las credenciales IMAP (evita fallos en dev)
    if (process.env.IMAP_USER && process.env.IMAP_PASSWORD) {
      emailWatcherService.start().catch((err) => {
        logger.error('Error al iniciar el servicio de monitoreo de correos:', err);
      });
    } else {
      logger.warn('EmailWatcherService no iniciado: Faltan credenciales IMAP en .env');
    }

    // Iniciar CronJob de resultados legacy (CU-09v2 / Issue #259)
    startSyncLegacyJob(pool, distributionService);

    // 5. Crear servidor Apollo GraphQL
    const server = createApolloServer(httpServer);

    // 5. Iniciar servidor Apollo
    await server.start();
    logger.info('✓ Servidor Apollo GraphQL iniciado');

    // 6. Configurar middleware de GraphQL
    const allowedOrigins = (process.env.CORS_ORIGIN || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (process.env.NODE_ENV !== 'development' && allowedOrigins.length === 0) {
      logger.error('[FATAL] CORS_ORIGIN environment variable is required in production.');
      throw new Error(
        '[FATAL] CORS_ORIGIN must be set in production. Server cannot start without it.'
      );
    }

    app.use(
      GRAPHQL_PATH,
      cors<cors.CorsRequest>({
        origin: (origin, callback) => {
          // En desarrollo, permitimos cualquier origen para evitar problemas de CORS
          const isAllowed =
            !origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development';

          if (isAllowed) {
            callback(null, true);
          } else {
            logger.warn(`🛑 CORS BLOQUEADO: Origen no permitido: ${origin}`);
            callback(new Error('CORS policy violation'));
          }
        },
        credentials: true,
      }),
      expressMiddleware(server, {
        context: async ({ req }): Promise<GraphQLContext> => {
          const authHeader = req.headers.authorization || '';
          const loaders = createDataLoaders();

          if (!authHeader) return { user: undefined, loaders, distributionService };

          try {
            // Extraer token de forma más robusta
            const token = authHeader.split(' ').pop();
            if (!token) {
              logger.error('Token vacío en el header Authorization');
              return { user: undefined, loaders, distributionService };
            }

            // 1. Verificar JWT
            const decodedJwt = verifyToken(token);
            const email = decodedJwt?.email;

            if (!email) {
              logger.error('Token JWT inválido o sin email', {
                hasHeader: !!authHeader,
                tokenPrefix: token.substring(0, 10),
              });
              return { user: undefined, loaders, distributionService };
            }

            // 2. Buscar usuario real (insensible a mayúsculas para mayor robustez)
            const result = await query(
              `SELECT 
                u.id, 
                u.email, 
                r.codigo as rol,
                u.nombre,
                e.cct,
                u.password_hash
               FROM usuarios u
               INNER JOIN cat_roles_usuario r ON u.rol = r.id_rol
               LEFT JOIN escuelas e ON u.escuela_id = e.id
               WHERE LOWER(u.email) = LOWER($1) AND u.activo = true`,
              [email.trim()]
            );

            if (result.rows.length > 0) {
              return {
                user: result.rows[0],
                loaders,
                distributionService,
                req,
              };
            } else {
              logger.error('Sesión rechazada: Usuario del token no encontrado o inactivo', {
                email,
              });
            }
          } catch (error: any) {
            logger.error('Error fatal procesando token de contexto', { error: error.message });
          }

          return { user: undefined, loaders, distributionService, req };
        },
      })
    );

    // 7. Configurar rutas
    configureRoutes(app);
    configureLegacyApi(app);
    configureSwagger(app);

    // 8. Iniciar servidor HTTP
    await new Promise<void>((resolve) => {
      httpServer.listen(PORT, () => {
        resolve();
      });
    });

    const elapsedTime = Date.now() - startTime;

    logger.info('=================================================');
    logger.info(`🚀 Servidor GraphQL listo en http://${HOST}:${PORT}${GRAPHQL_PATH}`);
    logger.info(`📊 Health check disponible en http://${HOST}:${PORT}/health`);
    logger.info(`⏱️  Tiempo de inicio: ${elapsedTime}ms`);
    logger.info(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
    logger.info('=================================================');

    // PSP Time Logging
    logPSPTime('Server Startup', elapsedTime);
  } catch (error) {
    logger.error('Error fatal al iniciar servidor:', error);
    process.exit(1);
  }
}

/**
 * Manejo de señales de terminación
 * @psp Resource Management - Graceful Shutdown
 */
async function gracefulShutdown(signal: string) {
  logger.info(`Señal ${signal} recibida, cerrando servidor...`);

  try {
    stopSyncLegacyJob();
    logger.info('✓ Job de sincronización Legacy detenido');

    await closePool();
    logger.info('✓ Pool de base de datos cerrado');

    logger.info('Servidor detenido correctamente');
    process.exit(0);
  } catch (error) {
    logger.error('Error durante el cierre:', error);
    process.exit(1);
  }
}

// Registrar manejadores de señales
process.on('SIGTERM', () => {
  void gracefulShutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void gracefulShutdown('SIGINT');
});

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // No salimos del proceso para evitar que caídas de servicios secundarios (como IMAP)
  // tiren todo el servidor GraphQL. 
  // process.exit(1); 
});

// Iniciar servidor
await startServer();
