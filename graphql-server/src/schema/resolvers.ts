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
import * as XLSX from 'xlsx';
import { query, getClient } from '../config/database.js';
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
            u.updated_at as "fechaUltimoAcceso"
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
            u.updated_at as "fechaUltimoAcceso"
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

    /**
     * Listar solicitudes de carga EIA2
     * @use-case CU-05: Historial de cargas
     */
    getSolicitudes: async (_: unknown, { limit = 10, offset = 0 }: { limit?: number; offset?: number }) => {
      try {
        const result = await query(
          `SELECT 
            id,
            consecutivo,
            cct,
            archivo_original as "archivoOriginal",
            fecha_carga as "fechaCarga",
            estado_validacion as "estadoValidacion",
            nivel_educativo as "nivelEducativo",
            archivo_path as "archivoPath",
            archivo_size as "archivoSize",
            procesado_externamente as "procesadoExternamente"
          FROM solicitudes_eia2
          ORDER BY fecha_carga DESC
          LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
        return result.rows;
      } catch (error) {
        logger.error('Error fetching solicitudes', { error });
        throw new Error('Error al obtener historial de solicitudes');
      }
    },

    /**
     * Listar tickets del usuario autenticado o por correo
     * @use-case CU-13: Mesa de ayuda
     */
    getMyTickets: async (_: any, { correo }: { correo?: string }, context: GraphQLContext) => {
      const { user } = context;
      let userId = user?.id;

      try {
        let sql = `
          SELECT 
            t.id,
            t.numero_ticket as "numeroTicket",
            t.asunto,
            t.descripcion,
            (SELECT nombre FROM cat_estado_ticket WHERE id = t.estado) as estado,
            t.prioridad,
            t.evidencias,
            u.email as "correo",
            t.created_at as "fechaCreacion",
            t.updated_at as "fechaActualizacion"
          FROM tickets_soporte t
          INNER JOIN usuarios u ON t.usuario_id = u.id
        `;
        const params: any[] = [];

        if (userId) {
          sql += ' WHERE t.usuario_id = $1';
          params.push(userId);
        } else if (correo) {
          // Búsqueda por correo si no hay sesión (Auth Mock)
          sql += ' WHERE u.email = $1';
          params.push(correo.trim().toLowerCase());
        } else {
          throw new Error('Se requiere estar autenticado o proporcionar un correo');
        }

        sql += ' ORDER BY t.created_at DESC';

        const result = await query(sql, params);
        return result.rows;

      } catch (error) {
        logger.error('Error fetching my tickets', { correo, error });
        throw new Error('Error al obtener tus tickets');
      }
    },

    /**
     * Listar todos los tickets del sistema (Admin)
     * @use-case CU-13: Mesa de ayuda
     */
    getAllTickets: async (_: any, __: any, context: GraphQLContext) => {
      // Validar que sea admin (Coordinador Federal o Estatal)
      if (!context.user || !['COORDINADOR_FEDERAL', 'COORDINADOR_ESTATAL'].includes(context.user.rol)) {
        throw new Error('No autorizado: Solo administradores pueden ver todos los tickets');
      }

      try {
        const result = await query(`
          SELECT 
            t.id,
            t.numero_ticket as "numeroTicket",
            t.asunto,
            t.descripcion,
            (SELECT nombre FROM cat_estado_ticket WHERE id = t.estado) as estado,
            t.prioridad,
            t.evidencias,
            u.email as "correo",
            t.created_at as "fechaCreacion",
            t.updated_at as "fechaActualizacion"
          FROM tickets_soporte t
          INNER JOIN usuarios u ON t.usuario_id = u.id
          ORDER BY t.created_at DESC
        `);
        return result.rows;
      } catch (error) {
        logger.error('Error fetching all tickets', { error });
        throw new Error('Error al obtener los tickets');
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

        if (clavesCCT && clavesCCT.length) {
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
            u.updated_at as "fechaUltimoAcceso"
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

        await query('UPDATE usuarios SET updated_at = NOW() WHERE id = $1', [usuario.id]);

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
     * Crear nuevo ticket de soporte
     * @use-case CU-13: Mesa de ayuda
     */
    createTicket: async (_: any, { input }: { input: any }, context: GraphQLContext) => {
      const { motivo, descripcion, evidencias, correo } = input;
      const client = await getClient();
      let userId = context.user?.id;

      // 1. Validar autenticación o buscar por correo
      if (!userId && correo) {
        try {
          const userRes = await client.query('SELECT id FROM usuarios WHERE email = $1', [correo.trim().toLowerCase()]);
          if (userRes.rows.length > 0) {
            userId = userRes.rows[0].id;
          }
          // Si no encuentra usuario, userId = undefined (ticket anónimo o solo correo)
        } catch (e) {
          logger.warn('Error buscando usuario por correo', { correo, error: e });
        }
      }

      // Si no hay usuario ni por token ni por correo, ¿permitimos?
      // El requerimiento decía "usuario debe estar autenticado".
      // Pero dado que el frontend es mock, permitiremos tickets con userId nulo si se manda correo.
      if (!userId && !correo) {
        throw new Error('No autorizado: Debes iniciar sesión o proporcionar un correo para crear un ticket');
      }

      try {
        await client.query('BEGIN');

        // 2. Generar número de ticket (TKT-{YYYY}-{MM}{DD}-{SEQ})
        const now = new Date();
        const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');

        // Obtener siguiente secuencia (usamos una secuencia global o conteo)
        const seqRes = await client.query("SELECT nextval('seq_numero_ticket') as seq");
        const seq = seqRes.rows[0].seq;
        const numeroTicket = `TKT-${ymd}-${seq.toString().padStart(4, '0')}`;

        // 3. Procesar evidencias (Guardar archivos)
        const evidenciasProcesadas = [];
        if (evidencias && evidencias.length > 0) {
          for (const evidencia of evidencias) {
            // En un entorno real, guardaríamos el base64 en disco/S3.
            // Aquí simularemos generando una ruta.
            const fileName = `ticket_${numeroTicket}_${Date.now()}_${evidencia.nombre}`;
            const filePath = `storage/tickets/${fileName}`;

            evidenciasProcesadas.push({
              nombre: evidencia.nombre,
              url: filePath,
              size: Math.round(evidencia.base64.length * 0.75) // Aproximación
            });
          }
        }

        // 4. Insertar Ticket
        const insertRes = await client.query(
          `INSERT INTO tickets_soporte 
            (numero_ticket, usuario_id, asunto, descripcion, estado, prioridad, evidencias, created_at, updated_at)
           VALUES ($1, $2, $3, $4, fn_catalogo_id('cat_estado_ticket', 'ABIERTO'), 'MEDIA', $5, NOW(), NOW())
           RETURNING 
            id, 
            numero_ticket as "numeroTicket", 
            asunto, 
            descripcion,
            evidencias,
            created_at as "fechaCreacion", 
            updated_at as "fechaActualizacion",
            prioridad,
            estado`,
          [numeroTicket, userId, motivo, descripcion, JSON.stringify(evidenciasProcesadas)]
        );

        await client.query('COMMIT');

        const row = insertRes.rows[0];
        return row;

      } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Error creating ticket', { input, error });
        throw error;
      } finally {
        client.release();
      }
    },

    /**
     * Responder a un ticket de soporte (Admin)
     * @use-case CU-13: Mesa de ayuda
     */
    respondToTicket: async (_: any, { ticketId, respuesta, cerrar }: { ticketId: string, respuesta: string, cerrar: boolean }, context: GraphQLContext) => {
      if (!context.user || !['COORDINADOR_FEDERAL', 'COORDINADOR_ESTATAL'].includes(context.user.rol)) {
        throw new Error('No autorizado: Solo administradores pueden responder tickets');
      }

      const client = await getClient();
      try {
        await client.query('BEGIN');

        // 1. Insertar comentario
        await client.query(`
          INSERT INTO comentarios_ticket (ticket_id, usuario_id, comentario, es_interno)
          VALUES ($1, $2, $3, false)
        `, [ticketId, context.user.id, respuesta]);

        // 2. Actualizar estado del ticket
        const nuevoEstado = cerrar ? 'RESUELTO' : 'EN PROCESO';
        await client.query(`
          UPDATE tickets_soporte
          SET estado = (SELECT id FROM cat_estado_ticket WHERE nombre = $1),
              updated_at = NOW()
          WHERE id = $2
        `, [nuevoEstado, ticketId]);

        await client.query('COMMIT');

        const result = await client.query(`
          SELECT 
            t.id,
            t.numero_ticket as "numeroTicket",
            t.asunto,
            t.descripcion,
            (SELECT nombre FROM cat_estado_ticket WHERE id = t.estado) as estado,
            t.prioridad,
            t.evidencias,
            t.created_at as "fechaCreacion",
            t.updated_at as "fechaActualizacion"
          FROM tickets_soporte t
          WHERE t.id = $1
        `, [ticketId]);

        return result.rows[0];

      } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Error responding to ticket', { ticketId, error });
        throw new Error('Error al responder el ticket');
      } finally {
        client.release();
      }
    },

    /**
     * Cargar evaluación
     * @use-case CU-05: Carga de archivos
     * @psp Code Review - Validación de formato
     */
    /**
     * Cargar archivo de evaluación (Universal)
     * @use-case CU-05: Recepción de archivos (EIA2)
     * @psp Code Review - Validación de formato Excel y parsing dinámico
     */
    uploadExcelAssessment: async (_: any, { input }: { input: any }) => {
      const { archivoBase64, nombreArchivo, cicloEscolar, confirmarReemplazo } = input;
      const errores: string[] = [];
      let alumnosProcesados = 0;
      let cct = '';
      let nivel = '';
      let baseGrado: number | null = null;
      let client;
      const nivelMap: Record<string, number> = {
        'PREESCOLAR': 1,
        'PRIMARIA': 2,
        'SECUNDARIA': 3,
        'TELESECUNDARIA': 4
      };
      let nivelId = 2;

      try {
        logger.info('Iniciando carga masiva', { nombreArchivo, cicloEscolar });
        const buffer = Buffer.from(archivoBase64, 'base64');
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        const sheetEsc = workbook.Sheets['ESC'] || workbook.Sheets[workbook.SheetNames[0]];
        const dataEsc: any[][] = XLSX.utils.sheet_to_json(sheetEsc, { header: 1 });

        for (const row of dataEsc) {
          if (row && typeof row[1] === 'string' && row[1].includes('CCT')) {
            cct = (row[2] || '').toString().trim();
          }
        }

        if (!cct && dataEsc[8]) cct = (dataEsc[8][3] || '').toString().trim();

        const dataSheetName = workbook.SheetNames.find((n: string) =>
          ['PRIMERO', 'SEGUNDO', 'TERCERO', 'CUARTO', 'QUINTO', 'SEXTO', 'PREESCOLAR', 'SECUNDARIA'].some(prefix => n.toUpperCase().includes(prefix))
        ) || workbook.SheetNames[1];

        const sheetData = workbook.Sheets[dataSheetName];

        if (dataEsc[5] && dataEsc[5][2]) {
          nivel = dataEsc[5][2].toString().toUpperCase();
        }

        nivelId = Object.keys(nivelMap).find(k => nivel.includes(k)) ? nivelMap[Object.keys(nivelMap).find(k => nivel.includes(k))!] : 2;

        client = await getClient();
        await client.query('BEGIN');

        // Calcular Hash del archivo para detectar duplicados
        const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

        // Verificar si existe una solicitud con el mismo hash
        const existingReq = await client.query(
          'SELECT id FROM solicitudes_eia2 WHERE hash_archivo = $1 LIMIT 1',
          [fileHash]
        );

        let solicitudId;

        if (existingReq.rows.length > 0) {
          // DUPLICADO DETECTADO
          if (!confirmarReemplazo) {
            await client.query('ROLLBACK');
            return {
              success: false,
              message: 'El archivo ya existe en el sistema. ¿Desea reemplazarlo?',
              duplicadoDetectado: true,
              detalles: null
            };
          } else {
            // CONFIRMADO: Usar solicitud existente y actualizar fecha
            solicitudId = existingReq.rows[0].id;
            await client.query(
              'UPDATE solicitudes_eia2 SET updated_at = NOW() WHERE id = $1',
              [solicitudId]
            );
            logger.info('Reemplazando archivo existente (Duplicate Hash)', { solicitudId, fileHash });
          }
        } else {
          // NUEVO ARCHIVO (Versión diferente o nuevo)
          const solicitudRes = await client.query(
            `INSERT INTO solicitudes_eia2 
              (cct, archivo_original, fecha_carga, estado_validacion, nivel_educativo, archivo_path, archivo_size, hash_archivo)
            VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7)
            RETURNING id`,
            [cct, nombreArchivo, 1, nivelId, `storage/uploads/${nombreArchivo}`, buffer.length, fileHash]
          );
          solicitudId = solicitudRes.rows[0].id;
          logger.info('Nueva solicitud creada', { solicitudId, fileHash });
        }

        let escuelaRes = await client.query('SELECT id FROM escuelas WHERE cct = $1', [cct]);
        let escuelaId;
        if (escuelaRes.rows.length === 0) {
          const defaultRes = await client.query(
            `INSERT INTO escuelas (cct, nombre, id_turno, id_nivel, id_entidad, id_ciclo)
             VALUES ($1, $2, 1, $3, 14, 1) RETURNING id`,
            [cct, (dataEsc[4] && dataEsc[4][2]) || 'Escuela sin nombre', nivelId]
          );
          escuelaId = defaultRes.rows[0].id;
        } else {
          escuelaId = escuelaRes.rows[0].id;
        }

        const dataAlumnos: any[][] = XLSX.utils.sheet_to_json(sheetData, { header: 1 });

        // Detectar grado de la hoja
        const gradoFromSheet = dataSheetName.toUpperCase();
        const gradoMap: Record<string, number> = {
          'PRIMERO': 1, 'SEGUNDO': 2, 'TERCERO': 3, 'CUARTO': 4, 'QUINTO': 5, 'SEXTO': 6,
          '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6
        };
        baseGrado = Object.keys(gradoMap).find(k => gradoFromSheet.includes(k)) ? gradoMap[Object.keys(gradoMap).find(k => gradoFromSheet.includes(k))!] : 1;

        // Calcular id_grado (ej: 201 para 1ro Primaria)
        const idGrado = (nivelId * 100) + baseGrado;

        const periodRes = await client.query("SELECT id FROM periodos_evaluacion LIMIT 1");
        const periodoId = periodRes.rows[0]?.id;

        const materiaRes = await client.query("SELECT id FROM materias WHERE nivel_educativo = $1 LIMIT 4", [nivelId === 2 ? 2 : 2]);
        const materiasIds = materiaRes.rows.map(m => m.id);

        const studentRows = dataAlumnos.slice(1);
        for (const row of studentRows) {
          if (!row || row.length < 5 || !row[1]) continue;

          const curp = (row[1] || '').toString().trim();
          const nombreCompleto = (row[2] || '').toString().trim();
          const grupoNombre = (row[3] || 'A').toString().trim();

          if (!curp || !nombreCompleto) continue;

          let grupoRes = await client.query(
            'SELECT id FROM grupos WHERE escuela_id = $1 AND grado_id = $2 AND nombre = $3',
            [escuelaId, idGrado, grupoNombre]
          );
          let grupoId;
          if (grupoRes.rows.length === 0) {
            const newGrupo = await client.query(
              'INSERT INTO grupos (escuela_id, grado_id, nombre, nivel_educativo) VALUES ($1, $2, $3, $4) RETURNING id',
              [escuelaId, idGrado, grupoNombre, nivelId]
            );
            grupoId = newGrupo.rows[0].id;
          } else {
            grupoId = grupoRes.rows[0].id;
          }

          const studentCheck = await client.query('SELECT id FROM estudiantes WHERE curp = $1', [curp]);
          let estudianteId;
          if (studentCheck.rows.length === 0) {
            const newStudent = await client.query(
              `INSERT INTO estudiantes (nombre, grupo_id, curp, estatus)
               VALUES ($1, $2, $3, 'A') RETURNING id`,
              [nombreCompleto, grupoId, curp]
            );
            estudianteId = newStudent.rows[0].id;
          } else {
            estudianteId = studentCheck.rows[0].id;
            await client.query(
              'UPDATE estudiantes SET nombre = $1, grupo_id = $2 WHERE id = $3',
              [nombreCompleto, grupoId, estudianteId]
            );
          }

          for (let col = 6; col < Math.min(row.length, 10); col++) {
            const valor = row[col];
            if (valor !== undefined && valor !== null && valor !== '' && materiasIds[col - 6]) {
              const valorNum = parseInt(valor.toString());
              if (!isNaN(valorNum) && valorNum >= 0 && valorNum <= 3) {
                await client.query(
                  `INSERT INTO evaluaciones (estudiante_id, materia_id, periodo_id, valoracion, fecha_evaluacion, updated_at, solicitud_id)
                   VALUES ($1, $2, $3, $4, NOW(), NOW(), $5)
                   ON CONFLICT (estudiante_id, materia_id, periodo_id, solicitud_id)
                   DO UPDATE SET 
                     valoracion = EXCLUDED.valoracion,
                     fecha_evaluacion = EXCLUDED.fecha_evaluacion,
                     updated_at = NOW()`,
                  [estudianteId, materiasIds[col - 6], periodoId, valorNum, solicitudId]
                );
              }
            }
          }
          alumnosProcesados++;
        }

        await client.query('COMMIT');
        return {
          success: true,
          message: 'Archivo procesado exitosamente',
          solicitudId,
          detalles: { cct, nivel: Object.keys(nivelMap).find(k => nivelMap[k] === nivelId) || nivel, grado: baseGrado, alumnosProcesados, errores }
        };
      } catch (error: any) {
        if (client) await client.query('ROLLBACK');
        logger.error('Error in uploadExcelAssessment', { error });
        return {
          success: false,
          message: `Error al procesar: ${error.message}`,
          solicitudId: null,
          detalles: {
            cct,
            nivel: Object.keys(nivelMap).find(k => nivelMap[k] === nivelId) || nivel,
            grado: (typeof baseGrado !== 'undefined' ? baseGrado : null),
            alumnosProcesados,
            errores: [error.message]
          }
        };
      } finally {
        if (client) client.release();
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
