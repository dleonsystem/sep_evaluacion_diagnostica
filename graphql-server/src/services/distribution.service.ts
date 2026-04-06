import { logger } from '../utils/logger.js';
import { Pool } from 'pg';

export interface ValidationTeam {
  id: number;
  nombre: string;
  email: string;
  sftpPath: string;
}

export class DistributionService {
  private teams: ValidationTeam[] = [];

  constructor(public pool: Pool) {
    // Inicialización de equipos (En producción vendría de la BD)
    this.teams = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      nombre: `Equipo de Validación ${i + 1}`,
      email: `equipo${i + 1}.validacion@nube.sep.gob.mx`,
      sftpPath: `storage/teams/equipo${i + 1}`,
    }));
  }

  /**
   * Asigna un CCT a un equipo de manera determinística (hashing)
   */
  public getTeamForCCT(cct: string): ValidationTeam {
    // Usamos el hash del CCT para que siempre caiga en el mismo equipo
    let hash = 0;
    for (let i = 0; i < cct.length; i++) {
      hash = (hash << 5) - hash + cct.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    const teamIndex = Math.abs(hash) % this.teams.length;
    return this.teams[teamIndex];
  }

  /**
   * Registra la distribución en la base de datos
   */
  public async logDistribution(solicitudId: string, teamId: number): Promise<void> {
    try {
      await this.pool.query(
        'UPDATE solicitudes_eia2 SET equipo_asignado = $1, distributed_at = NOW() WHERE id = $2',
        [teamId, solicitudId]
      );

      await this.pool.query(
        'INSERT INTO log_actividades (id_usuario, accion, tabla, detalle, modulo) VALUES ($1, $2, $3, $4, $5)',
        [
          null,
          'FILE_DISTRIBUTED',
          'solicitudes_eia2',
          JSON.stringify({
            mensaje: `Solicitud ${solicitudId} asignada al Equipo ${teamId}`,
            solicitudId,
            equipoId: teamId,
          }),
          'DISTRIBUCION',
        ]
      );

      logger.info(`Distribución registrada: Solicitud ${solicitudId} -> Equipo ${teamId}`);
    } catch (error) {
      logger.error('Error al registrar distribución', error);
      throw error;
    }
  }
}
