import DataLoader from 'dataloader';
import { query } from '../config/database.js';
import { logger } from './logger.js';

/**
 * DataLoaders factory to prevent N+1 queries.
 * @psp DataLoader Pattern - Performance Optimization
 */
export const createDataLoaders = () => {
  return {
    /**
     * Batch loader for centrosTrabajo (schools) linked to users.
     */
    userCentrosTrabajo: new DataLoader(async (userIds: readonly string[]) => {
      logger.debug('DataLoader: Batch fetching centrosTrabajo for users', {
        count: userIds.length,
      });

      const results = await query(
        `
        SELECT 
          u.id as user_id,
          e.id,
          e.cct as "claveCCT",
          e.nombre,
          e.estado as entidad,
          e.municipio,
          e.localidad,
          REPLACE(ne.codigo, ' ', '_') as nivel,
          t.nombre as turno
        FROM escuelas e
        JOIN usuarios u ON e.id = u.escuela_id
        LEFT JOIN cat_nivel_educativo ne ON e.id_nivel = ne.id
        LEFT JOIN cat_turnos t ON e.id_turno = t.id_turno
        WHERE u.id = ANY($1)
        UNION
        SELECT 
          uct.usuario_id as user_id,
          e.id,
          e.cct as "claveCCT",
          e.nombre,
          e.estado as entidad,
          e.municipio,
          e.localidad,
          REPLACE(ne.codigo, ' ', '_') as nivel,
          t.nombre as turno
        FROM escuelas e
        JOIN usuarios_centros_trabajo uct ON e.id = uct.centro_trabajo_id
        LEFT JOIN cat_nivel_educativo ne ON e.id_nivel = ne.id
        LEFT JOIN cat_turnos t ON e.id_turno = t.id_turno
        WHERE uct.usuario_id = ANY($1)
      `,
        [userIds as string[]]
      );

      // Map results back to the order of requested userIds
      const userSchoolsMap = results.rows.reduce(
        (acc, row) => {
          if (!acc[row.user_id]) acc[row.user_id] = [];
          acc[row.user_id].push(row);
          return acc;
        },
        {} as Record<string, any[]>
      );

      return userIds.map((id) => userSchoolsMap[id] || []);
    }),

    /**
     * Batch loader for students linked to evaluations.
     */
    evaluationStudents: new DataLoader(async (evaluacionIds: readonly string[]) => {
      logger.debug('DataLoader: Batch fetching students for evaluations', {
        count: evaluacionIds.length,
      });

      const results = await query(
        `
        SELECT 
          id,
          evaluacion_id,
          curp,
          nombre,
          apellido_paterno as "apellidoPaterno",
          apellido_materno as "apellidoMaterno",
          grado,
          grupo
        FROM estudiantes
        WHERE evaluacion_id = ANY($1)
      `,
        [evaluacionIds as string[]]
      );

      const studentsMap = results.rows.reduce(
        (acc, row) => {
          if (!acc[row.evaluacion_id]) acc[row.evaluacion_id] = [];
          acc[row.evaluacion_id].push(row);
          return acc;
        },
        {} as Record<string, any[]>
      );

      return evaluacionIds.map((id) => studentsMap[id] || []);
    }),

    /**
     * Batch loader for responses linked to tickets.
     */
    ticketResponses: new DataLoader(async (ticketIds: readonly string[]) => {
      logger.debug('DataLoader: Batch fetching responses for tickets', { count: ticketIds.length });

      const results = await query(
        `
        SELECT 
          id, 
          ticket_id,
          comentario as mensaje, 
          created_at as fecha,
          COALESCE(
            (SELECT CASE WHEN r.codigo IN ('COORDINADOR_FEDERAL', 'COORDINADOR_ESTATAL') THEN 'admin' ELSE 'user' END 
             FROM usuarios u 
             JOIN cat_roles_usuario r ON u.rol = r.id_rol 
             WHERE u.id = comentarios_ticket.usuario_id),
            'admin'
          ) as autor,
          es_interno as "esInterno"
        FROM comentarios_ticket
        WHERE ticket_id = ANY($1)
        ORDER BY created_at ASC
      `,
        [ticketIds as string[]]
      );

      const responsesMap = results.rows.reduce(
        (acc, row) => {
          if (!acc[row.ticket_id]) acc[row.ticket_id] = [];
          acc[row.ticket_id].push({
            ...row,
            fecha: row.fecha instanceof Date ? row.fecha.toISOString() : row.fecha,
          });
          return acc;
        },
        {} as Record<string, any[]>
      );

      return ticketIds.map((id) => responsesMap[id] || []);
    }),
  };
};
