/**
 * GraphQL Resolvers
 *
 * @module schema/resolvers
 * @description Implementación de resolvers GraphQL
 * @version 1.0.0
 * @author SEP - Evaluación Diagnóstica
 * @standard PSP (Personal Software Process)
 * @rup Use Case Realization
 * @cmmi CMMI Level 3 - Technical Solution
 */

import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * User type for context
 * @psp Type Safety - User authentication
 */
interface ContextUser {
  id: string;
  email: string;
  rol: string;
}

/**
 * Context type para resolvers
 * @psp Type Safety - Tipos estrictos
 */
export interface GraphQLContext {
  user?: ContextUser;
  dataSources?: Record<string, unknown>;
}

/**
 * Database row types
 * @psp Type Safety - Definición de tipos de respuesta
 */
interface UserRow {
  id: string;
  email: string;
  nombre: string;
  apepaterno: string;
  apematerno: string;
  rol: string;
  activo: boolean;
  fechaCreacion: Date;
  fechaUltimoAcceso?: Date;
}

interface CentroTrabajoRow {
  id: string;
  claveCCT: string;
  nombre: string;
  entidad: string;
  municipio: string;
  localidad: string;
  nivel: string;
  turno: string;
}

interface EvaluacionRow {
  id: string;
  claveCCT: string;
  periodo: string;
  grado: number;
  grupo: string;
  fechaCarga: Date;
  nombreArchivo: string;
  estadoValidacion: string;
}

interface EstudianteRow {
  id: string;
  curp: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  grado: number;
  grupo: string;
}

interface CreateUserInput {
  email: string;
  nombre: string;
  apepaterno: string;
  apematerno: string;
  rol: string;
}

interface UpdateUserInput {
  nombre?: string;
  apepaterno?: string;
  apematerno?: string;
  rol?: string;
  activo?: boolean;
}

interface UpdateUserResult {
  id: string;
  email: string;
  nombre: string;
  apepaterno: string;
  apematerno: string;
  rol: string;
  activo: boolean;
  fechaCreacion: Date;
}

interface ParentWithId {
  id: string;
}

interface CreateUserResult {
  id: string;
  email: string;
  nombre: string;
  apepaterno: string;
  apematerno: string;
  rol: string;
  activo: boolean;
  fechaCreacion: Date;
}

interface UploadEvaluacionInput {
  claveCCT: string;
  periodo: string;
  grado: number;
  grupo: string;
  nombreArchivo: string;
  archivoBase64?: string;
}

/**
 * Helper function to build update query
 * @psp Code Reuse - Extract complex logic
 */
const buildUpdateQuery = (
  input: UpdateUserInput
): { updates: string[]; values: (string | boolean)[] } => {
  const updates: string[] = [];
  const values: (string | boolean)[] = [];
  let paramIndex = 1;

  if (input.nombre !== undefined) {
    updates.push(`nombre = $${paramIndex++}`);
    values.push(input.nombre);
  }
  if (input.apepaterno !== undefined) {
    updates.push(`apepaterno = $${paramIndex++}`);
    values.push(input.apepaterno);
  }
  if (input.apematerno !== undefined) {
    updates.push(`apematerno = $${paramIndex++}`);
    values.push(input.apematerno);
  }
  if (input.rol !== undefined) {
    updates.push(`rol = $${paramIndex++}`);
    values.push(input.rol);
  }
  if (input.activo !== undefined) {
    updates.push(`activo = $${paramIndex++}`);
    values.push(input.activo);
  }

  return { updates, values };
};

/**
 * Resolvers del esquema GraphQL
 * @rup Architecture Pattern - Resolver Chain
 * @psp Code Review - Documentación de cada resolver
 */
export const resolvers = {
  Query: {
    /**
     * Health check endpoint
     * @psp Unit Test - Verificación de servicio
     */
    healthCheck: async () => {
      const start = Date.now();
      try {
        await query('SELECT NOW() as timestamp');
        const latency = Date.now() - start;

        return {
          status: 'OK',
          timestamp: new Date().toISOString(),
          database: {
            connected: true,
            latency,
          },
          version: '1.0.0',
        };
      } catch (error) {
        logger.error('Health check failed', error);
        return {
          status: 'ERROR',
          timestamp: new Date().toISOString(),
          database: {
            connected: false,
            latency: null,
          },
          version: '1.0.0',
        };
      }
    },

    /**
     * Obtener usuario por ID
     * @use-case CU-01: Consulta de usuario
     * @psp Defect Prevention - Validación de ID
     */
    getUser: async (_: unknown, { id }: { id: string }): Promise<UserRow | null> => {
      try {
        const result = await query(
          `SELECT 
            id, 
            email, 
            nombre, 
            apepaterno,
            apematerno,
            rol,
            activo,
            fecha_creacion as "fechaCreacion",
            fecha_ultimo_acceso as "fechaUltimoAcceso"
          FROM usuarios 
          WHERE id = $1`,
          [id]
        );

        if (result.rows.length === 0) {
          return null;
        }

        return result.rows[0] as UserRow;
      } catch (error) {
        logger.error('Error fetching user', { id, error });
        throw new Error('Error al obtener usuario');
      }
    },

    /**
     * Listar usuarios con paginación
     * @use-case CU-02: Lista de usuarios
     * @psp Performance - Paginación eficiente
     */
    listUsers: async (
      _: unknown,
      { limit = 10, offset = 0 }: { limit?: number; offset?: number }
    ) => {
      try {
        // Obtener total de usuarios
        const countResult = await query('SELECT COUNT(*) as total FROM usuarios');
        const totalCount = Number.parseInt(
          String((countResult.rows[0] as { total: number }).total),
          10
        );

        // Obtener usuarios paginados
        const usersResult = await query(
          `SELECT 
            id, 
            email, 
            nombre, 
            apepaterno,
            apematerno,
            rol,
            activo,
            fecha_creacion as "fechaCreacion",
            fecha_ultimo_acceso as "fechaUltimoAcceso"
          FROM usuarios 
          ORDER BY fecha_creacion DESC
          LIMIT $1 OFFSET $2`,
          [limit, offset]
        );

        return {
          nodes: usersResult.rows,
          totalCount,
          hasNextPage: offset + limit < totalCount,
        };
      } catch (error) {
        logger.error('Error listing users', { limit, offset, error });
        throw new Error('Error al listar usuarios');
      }
    },

    /**
     * Obtener centro de trabajo por clave CCT
     * @use-case CU-03: Consulta de CCT
     */
    getCCT: async (_: unknown, { clave }: { clave: string }): Promise<CentroTrabajoRow | null> => {
      try {
        const result = await query(
          `SELECT 
            id,
            clave_cct as "claveCCT",
            nombre,
            entidad,
            municipio,
            localidad,
            nivel,
            turno
          FROM centros_trabajo 
          WHERE clave_cct = $1`,
          [clave]
        );

        if (result.rows.length === 0) {
          return null;
        }

        return result.rows[0] as CentroTrabajoRow;
      } catch (error) {
        logger.error('Error fetching CCT', { clave, error });
        throw new Error('Error al obtener centro de trabajo');
      }
    },

    /**
     * Obtener evaluación por ID
     * @use-case CU-10: Consulta de evaluación
     */
    getEvaluacion: async (_: unknown, { id }: { id: string }): Promise<EvaluacionRow | null> => {
      try {
        const result = await query(
          `SELECT 
            id,
            clave_cct as "claveCCT",
            periodo,
            grado,
            grupo,
            fecha_carga as "fechaCarga",
            nombre_archivo as "nombreArchivo",
            estado_validacion as "estadoValidacion"
          FROM evaluaciones 
          WHERE id = $1`,
          [id]
        );

        if (result.rows.length === 0) {
          return null;
        }

        return result.rows[0] as EvaluacionRow;
      } catch (error) {
        logger.error('Error fetching evaluation', { id, error });
        throw new Error('Error al obtener evaluación');
      }
    },
  },

  Mutation: {
    /**
     * Crear nuevo usuario
     * @use-case CU-01: Registro de usuario
     * @psp Design Review - Validación completa de entrada
     */
    createUser: async (_: any, { input }: { input: CreateUserInput }) => {
      try {
        const { email, nombre, apepaterno, apematerno, rol } = input;

        // Validar que el email no exista
        const existingUser = await query('SELECT id FROM usuarios WHERE email = $1', [email]);

        if (existingUser.rows.length > 0) {
          throw new Error('El email ya está registrado');
        }

        // Insertar usuario
        const result = await query(
          `INSERT INTO usuarios 
            (email, nombre, apepaterno, apematerno, rol, activo, fecha_creacion)
          VALUES ($1, $2, $3, $4, $5, true, NOW())
          RETURNING 
            id, 
            email, 
            nombre, 
            apepaterno,
            apematerno,
            rol,
            activo,
            fecha_creacion as "fechaCreacion"`,
          [email, nombre, apepaterno, apematerno, rol]
        );

        const createdUser = result.rows[0] as CreateUserResult;
        logger.info('User created successfully', { userId: createdUser.id });

        return createdUser;
      } catch (error) {
        logger.error('Error creating user', { input, error });
        throw error;
      }
    },

    /**
     * Actualizar usuario
     * @use-case CU-02: Actualización de usuario
     */
    updateUser: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateUserInput }
    ): Promise<UpdateUserResult> => {
      try {
        const { updates, values } = buildUpdateQuery(input);

        if (updates.length === 0) {
          throw new Error('No hay campos para actualizar');
        }

        values.push(id);
        const paramIndex = values.length;

        const result = await query(
          `UPDATE usuarios 
          SET ${updates.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING 
            id, 
            email, 
            nombre, 
            apepaterno,
            apematerno,
            rol,
            activo,
            fecha_creacion as "fechaCreacion"`,
          values
        );

        if (result.rows.length === 0) {
          throw new Error('Usuario no encontrado');
        }

        logger.info('User updated successfully', { userId: id });

        return result.rows[0] as UpdateUserResult;
      } catch (error) {
        logger.error('Error updating user', { id, input, error });
        throw error;
      }
    },

    /**
     * Eliminar usuario
     * @use-case CU-02: Baja de usuario
     * @psp Soft Delete Pattern
     */
    deleteUser: async (_: any, { id }: { id: string }) => {
      try {
        // Soft delete - marcar como inactivo
        const result = await query(
          'UPDATE usuarios SET activo = false WHERE id = $1 RETURNING id',
          [id]
        );

        if (result.rows.length === 0) {
          throw new Error('Usuario no encontrado');
        }

        logger.info('User deleted (soft) successfully', { userId: id });

        return {
          success: true,
          message: 'Usuario eliminado correctamente',
        };
      } catch (error) {
        logger.error('Error deleting user', { id, error });
        throw error;
      }
    },

    /**
     * Cargar evaluación
     * @use-case CU-05: Carga de archivos
     * @psp Code Review - Validación de formato
     */
    uploadEvaluacion: async (_: any, { input }: { input: UploadEvaluacionInput }) => {
      try {
        const { claveCCT, periodo, grado, grupo, nombreArchivo } = input;
        // archivoBase64 se procesará en futuras iteraciones

        // Insertar evaluación
        const result = await query(
          `INSERT INTO evaluaciones 
            (clave_cct, periodo, grado, grupo, nombre_archivo, fecha_carga, estado_validacion)
          VALUES ($1, $2, $3, $4, $5, NOW(), 'PENDIENTE')
          RETURNING 
            id,
            clave_cct as "claveCCT",
            periodo,
            grado,
            grupo,
            fecha_carga as "fechaCarga",
            nombre_archivo as "nombreArchivo",
            estado_validacion as "estadoValidacion"`,
          [claveCCT, periodo, grado, grupo, nombreArchivo]
        );

        const evaluacion = result.rows[0] as EvaluacionRow;

        logger.info('Evaluation uploaded successfully', {
          evaluacionId: evaluacion.id,
          claveCCT,
          periodo,
        });

        return evaluacion;
      } catch (error) {
        logger.error('Error uploading evaluation', { input, error });
        throw error;
      }
    },
  },

  /**
   * Field resolvers para User
   * @psp DataLoader Pattern - Prevención de N+1 queries
   */
  User: {
    centrosTrabajo: async (parent: ParentWithId) => {
      try {
        const result = await query(
          `SELECT 
            ct.id,
            ct.clave_cct as "claveCCT",
            ct.nombre,
            ct.entidad,
            ct.municipio,
            ct.localidad,
            ct.nivel,
            ct.turno
          FROM centros_trabajo ct
          INNER JOIN usuarios_centros_trabajo uct ON ct.id = uct.centro_trabajo_id
          WHERE uct.usuario_id = $1`,
          [parent.id]
        );

        return result.rows as CentroTrabajoRow[];
      } catch (error) {
        logger.error('Error fetching user CCTs', { userId: parent.id, error });
        return [];
      }
    },
  },

  /**
   * Field resolvers para CentroTrabajo
   */
  CentroTrabajo: {
    usuarios: async (parent: ParentWithId): Promise<UserRow[]> => {
      try {
        const result = await query(
          `SELECT 
            u.id,
            u.email,
            u.nombre,
            u.apepaterno,
            u.apematerno,
            u.rol,
            u.activo
          FROM usuarios u
          INNER JOIN usuarios_centros_trabajo uct ON u.id = uct.usuario_id
          WHERE uct.centro_trabajo_id = $1`,
          [parent.id]
        );

        return result.rows as UserRow[];
      } catch (error) {
        logger.error('Error fetching CCT users', { cctId: parent.id, error });
        return [];
      }
    },
  },

  /**
   * Field resolvers para Evaluacion
   */
  Evaluacion: {
    estudiantes: async (parent: ParentWithId): Promise<EstudianteRow[]> => {
      try {
        const result = await query(
          `SELECT 
            id,
            curp,
            nombre,
            apellido_paterno as "apellidoPaterno",
            apellido_materno as "apellidoMaterno",
            grado,
            grupo
          FROM estudiantes
          WHERE evaluacion_id = $1`,
          [parent.id]
        );

        return result.rows as EstudianteRow[];
      } catch (error) {
        logger.error('Error fetching evaluation students', { evaluacionId: parent.id, error });
        return [];
      }
    },
  },
};

export default resolvers;
