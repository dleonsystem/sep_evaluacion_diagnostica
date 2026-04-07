import { Pool } from 'pg';
import { logger } from '../utils/logger.js';
import { DistributionService } from '../services/distribution.service.js';
import { ReportConsolidatorService } from '../services/report-consolidator.service.js';

let syncInterval: NodeJS.Timeout | null = null;
const SYNC_INTERVAL_MS = parseInt(process.env.LEGACY_SYNC_INTERVAL_MS || '300000', 10); // Default: 5 minutos

/**
 * Inicia el cronjob nativo (setInterval) para sondear solicitudes PENDIENTES o EN_PROCESO
 * y consolidar sus resultados si los archivos esperados (PDFs) ya fueron generados.
 */
export function startSyncLegacyJob(pool: Pool, _distributionService?: DistributionService) {
  if (syncInterval) {
    logger.warn('El Job de sincronización legacy ya se encuentra en ejecución.');
    return;
  }

  logger.info(`🔄 Iniciando Job de sincronización legacy (Intervalo: ${SYNC_INTERVAL_MS / 1000}s)`);
  const consolidatorService = new ReportConsolidatorService();

  syncInterval = setInterval(() => {
    void (async () => {
      try {
        // Obtenemos un lote pequeño para asegurar que no ahogamos a la BD.
        // Validamos que procesado_externamente sea true, y que no tenga ya resultados
        // o su estado siga en 1 (PENDIENTE), o si utilizamos otro flow, los buscamos.
        // De acuerdo a la API: estado_validacion 1 = PENDIENTE, 2 = VALIDO
        const res = await pool.query(`
          SELECT id, cct, estado_validacion 
          FROM solicitudes_eia2 
          WHERE procesado_externamente = true 
            AND (jsonb_array_length(resultados) = 0 OR resultados IS NULL)
            AND estado_validacion IN (
              fn_catalogo_id('cat_estado_validacion_eia2', 'PENDIENTE'),
              fn_catalogo_id('cat_estado_validacion_eia2', 'RECHAZADO')
            )
          ORDER BY updated_at ASC
          LIMIT 10
        `);

        if (res.rows.length === 0) {
          // logger.debug('Job Sincronización: No hay solicitudes pendientes de resultados legacy.');
          return;
        }

        logger.info(`Job Sincronización: Procesando lote de ${res.rows.length} solicitudes...`);

        for (const sol of res.rows) {
          const { id, cct } = sol;
          try {
            // Intentamos consolidar (busca los archivos locales/SFTP, empaqueta y reporta)
            const wasConsolidated = await consolidatorService.consolidateReportsByCCT(cct, id);
            
            if (wasConsolidated) {
              logger.info(`✅ Job: Resultados consolidados correctamente para CCT ${cct} (Req: ${id})`);
            } else {
              // Si aún no están listos en FS, lo ignoramos de momento y retomamos en el sig loop
              logger.debug(`Job: Aún no hay entregables para CCT ${cct} (Req: ${id})`);
            }
          } catch (itemErr) {
            logger.error(`❌ Job Error consolidando req ${id}:`, itemErr);
          }
        }
      } catch (err) {
        logger.error('Error general en el ciclo de SyncLegacyJob:', err);
      }
    })();
  }, SYNC_INTERVAL_MS);
}

/**
 * Detiene la ejecución del cronjob.
 */
export function stopSyncLegacyJob() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    logger.info('🛑 Job de sincronización legacy detenido exitosamente.');
  }
}
