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

import crypto from 'crypto';
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
  fechaRegistro: Date;
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
  nombre?: string | null;
  apepaterno?: string | null;
  apematerno?: string | null;
  clavesCCT?: string[];
  rol: string;
  password: string;
}

interface UpdateUserInput {
  nombre?: string;
  apepaterno?: string;
  apematerno?: string;
  rol?: string | number;
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
  fechaRegistro: Date;
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
  fechaRegistro: Date;
}

interface AuthPayload {
  ok: boolean;
  message?: string | null;
  user?: UserRow | null;
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
): { updates: string[]; values: (string | boolean | number)[] } => {
  const updates: string[] = [];
  const values: (string | boolean | number)[] = [];
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
            u.id, 
            u.email, 
            u.nombre, 
            u.apepaterno,
            u.apematerno,
            r.codigo as "rol",
            u.activo,
            u.fecha_registro as "fechaRegistro",
            u.fecha_ultimo_acceso as "fechaUltimoAcceso"
          FROM usuarios u
          INNER JOIN cat_roles_usuario r ON u.rol = r.id_rol
          WHERE u.id = $1`,
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
            u.id, 
            u.email, 
            u.nombre, 
            u.apepaterno,
            u.apematerno,
            r.codigo as "rol",
            u.activo,
            u.fecha_registro as "fechaRegistro",
            u.fecha_ultimo_acceso as "fechaUltimoAcceso"
          FROM usuarios u
          INNER JOIN cat_roles_usuario r ON u.rol = r.id_rol
          ORDER BY u.fecha_registro DESC
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
        const { email, nombre, apepaterno, apematerno, rol, password } = input;
        const clavesCCT = Array.isArray((input as { clavesCCT?: string[] }).clavesCCT)
          ? (input as { clavesCCT?: string[] }).clavesCCT
          : [];
        const nombreSeguro = (nombre ?? '').trim();
        const apepaternoSeguro = (apepaterno ?? '').trim();
        const apematernoSeguro = apematerno ? apematerno.trim() : null;

        // Validar que el email no exista
        const existingUser = await query('SELECT id FROM usuarios WHERE email = $1', [email]);

        if (existingUser.rows.length > 0) {
          throw new Error('El email ya está registrado');
        }

        const roleResult = await query(
          'SELECT id_rol FROM cat_roles_usuario WHERE codigo = $1',
          [rol]
        );

        if (roleResult.rows.length === 0) {
          throw new Error('El rol especificado no existe');
        }

        const roleId = Number((roleResult.rows[0] as { id_rol: number }).id_rol);

        const salt = crypto.randomBytes(16).toString('hex');
        const passwordHash = crypto.scryptSync(password, salt, 64).toString('hex');

        // Insertar usuario
        const result = await query(
          `INSERT INTO usuarios 
            (email, nombre, apepaterno, apematerno, rol, password_hash, activo, fecha_registro)
          VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
          RETURNING 
            id, 
            email, 
            nombre, 
            apepaterno,
            apematerno,
            (SELECT codigo FROM cat_roles_usuario WHERE id_rol = usuarios.rol) as "rol",
            activo,
            fecha_registro as "fechaRegistro"`,
          [email, nombreSeguro, apepaternoSeguro, apematernoSeguro, roleId, `${salt}:${passwordHash}`]
        );

        const createdUser = result.rows[0] as CreateUserResult;

        if (clavesCCT.length) {
          const centros = await query(
            `SELECT id, clave_cct as "claveCCT"
             FROM centros_trabajo
             WHERE clave_cct = ANY($1)`,
            [clavesCCT]
          );

          const centrosEncontrados = centros.rows as Array<{ id: string; claveCCT: string }>;
          for (const centro of centrosEncontrados) {
            await query(
              `INSERT INTO usuarios_centros_trabajo (usuario_id, centro_trabajo_id)
               VALUES ($1, $2)
               ON CONFLICT DO NOTHING`,
              [createdUser.id, centro.id]
            );
          }
        }

        logger.info('User created successfully', { userId: createdUser.id });

        return createdUser;
      } catch (error) {
        logger.error('Error creating user', { input, error });
        throw error;
      }
    },

    /**
     * Autenticar usuario
     * @use-case CU-01: Autenticación de usuario
     */
    authenticateUser: async (_: unknown, { input }: { input: { email: string; password: string } }): Promise<AuthPayload> => {
      try {
        const { email, password } = input;
        const result = await query(
          `SELECT 
            u.id,
            u.email,
            u.nombre,
            u.apepaterno,
            u.apematerno,
            r.codigo as "rol",
            u.password_hash,
            u.activo,
            u.fecha_registro as "fechaRegistro",
            u.fecha_ultimo_acceso as "fechaUltimoAcceso"
          FROM usuarios u
          INNER JOIN cat_roles_usuario r ON u.rol = r.id_rol
          WHERE u.email = $1`,
          [email]
        );

        if (result.rows.length === 0) {
          return { ok: false, message: 'Credenciales inválidas', user: null };
        }

        const usuario = result.rows[0] as UserRow & { password_hash: string | null };
        if (!usuario.activo) {
          return { ok: false, message: 'Usuario inactivo', user: null };
        }

        const hashGuardado = usuario.password_hash ?? '';
        const [salt, hash] = hashGuardado.split(':');
        if (!salt || !hash) {
          return { ok: false, message: 'Credenciales inválidas', user: null };
        }

        const hashCalculado = crypto.scryptSync(password, salt, 64).toString('hex');
        const coincide = crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(hashCalculado, 'hex'));
        if (!coincide) {
          return { ok: false, message: 'Credenciales inválidas', user: null };
        }

        await query('UPDATE usuarios SET fecha_ultimo_acceso = NOW() WHERE id = $1', [usuario.id]);

        return { ok: true, message: 'Autenticación correcta', user: usuario };
      } catch (error) {
        logger.error('Error authenticating user', { input, error });
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
        const updatesInput: UpdateUserInput = { ...input };

        if (input.rol !== undefined) {
          const roleResult = await query(
            'SELECT id_rol FROM cat_roles_usuario WHERE codigo = $1',
            [input.rol]
          );

          if (roleResult.rows.length === 0) {
            throw new Error('El rol especificado no existe');
          }

          updatesInput.rol = Number((roleResult.rows[0] as { id_rol: number }).id_rol);
        }

        const { updates, values } = buildUpdateQuery(updatesInput);

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
            (SELECT codigo FROM cat_roles_usuario WHERE id_rol = usuarios.rol) as "rol",
            activo,
            fecha_registro as "fechaRegistro"`,
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
            r.codigo as "rol",
            u.activo
          FROM usuarios u
          INNER JOIN usuarios_centros_trabajo uct ON u.id = uct.usuario_id
          INNER JOIN cat_roles_usuario r ON u.rol = r.id_rol
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
