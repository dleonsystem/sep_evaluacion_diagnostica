import { Pool } from 'pg';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

export class SolicitudService {
  constructor(private pool: Pool) {}

  public async createSolicitud(data: {
    cct: string;
    nombreArchivo: string;
    nivelId: number;
    archivoPath: string;
    archivoSize: number;
    fileHash: string;
    usuarioId?: string | null;
  }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Verificar si existe una solicitud con el mismo hash
      const existingReq = await client.query(
        'SELECT id FROM solicitudes_eia2 WHERE hash_archivo = $1 LIMIT 1',
        [data.fileHash]
      );

      let solicitudId: string;

      if (existingReq.rows.length > 0) {
        solicitudId = existingReq.rows[0].id;
        await client.query(
          'UPDATE solicitudes_eia2 SET updated_at = NOW(), usuario_id = $1 WHERE id = $2',
          [data.usuarioId || null, solicitudId]
        );
      } else {
        const solicitudRes = await client.query(
          `INSERT INTO solicitudes_eia2 
            (cct, archivo_original, fecha_carga, estado_validacion, nivel_educativo, archivo_path, archivo_size, hash_archivo, usuario_id)
          VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8)
          RETURNING id`,
          [
            data.cct,
            data.nombreArchivo,
            1, // PENDIENTE
            data.nivelId,
            data.archivoPath,
            data.archivoSize,
            data.fileHash,
            data.usuarioId || null,
          ]
        );
        solicitudId = solicitudRes.rows[0].id;
      }

      await client.query('COMMIT');
      return solicitudId;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error al crear/actualizar solicitud', error);
      throw error;
    } finally {
      client.release();
    }
  }

  public calculateHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
}
