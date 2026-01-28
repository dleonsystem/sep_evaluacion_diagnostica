/**
 * Database Models and Interfaces
 *
 * @module models/index
 * @description Interfaces TypeScript para modelos de datos
 * @version 1.0.0
 * @author SEP - Evaluación Diagnóstica
 * @standard PSP (Personal Software Process)
 * @rup Analysis Model - Domain Objects
 * @cmmi CMMI Level 3 - Requirements Development
 */

/**
 * Interfaz para Usuario
 * @use-case CU-01, CU-02
 * @requirements RF-01, RF-02
 */
export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apepaterno: string;
  apematerno?: string;
  rol: UserRole;
  activo: boolean;
  fechaCreacion: Date;
  fechaUltimoAcceso?: Date;
}

/**
 * Roles de usuario del sistema
 * @requirements RF-01: Control de acceso basado en roles
 */
export enum UserRole {
  COORDINADOR_FEDERAL = 'COORDINADOR_FEDERAL',
  COORDINADOR_ESTATAL = 'COORDINADOR_ESTATAL',
  RESPONSABLE_CCT = 'RESPONSABLE_CCT',
  CONSULTA = 'CONSULTA',
}

/**
 * Interfaz para Centro de Trabajo
 * @use-case CU-03
 * @requirements RF-03
 */
export interface CentroTrabajo {
  id: string;
  claveCCT: string;
  nombre: string;
  entidad: string;
  municipio: string;
  localidad: string;
  nivel: NivelEducativo;
  turno: string;
}

/**
 * Niveles educativos soportados
 * @requirements RF-03: Múltiples niveles educativos
 */
export enum NivelEducativo {
  PREESCOLAR = 'PREESCOLAR',
  PRIMARIA = 'PRIMARIA',
  SECUNDARIA = 'SECUNDARIA',
}

/**
 * Interfaz para Evaluación
 * @use-case CU-05, CU-10
 * @requirements RF-05, RF-14
 */
export interface Evaluacion {
  id: string;
  claveCCT: string;
  periodo: string;
  grado: number;
  grupo: string;
  fechaCarga: Date;
  nombreArchivo: string;
  estadoValidacion: EstadoValidacion;
}

/**
 * Estados de validación de evaluaciones
 * @requirements RF-14: Validación de datos
 */
export enum EstadoValidacion {
  PENDIENTE = 'PENDIENTE',
  VALIDADO = 'VALIDADO',
  RECHAZADO = 'RECHAZADO',
  EN_PROCESO = 'EN_PROCESO',
}

/**
 * Interfaz para Estudiante
 * @use-case CU-06
 * @requirements RF-06
 */
export interface Estudiante {
  id: string;
  curp: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  grado: number;
  grupo: string;
  evaluacionId: string;
}

/**
 * Interfaz para relación Usuario-CentroTrabajo
 * @requirements RF-02: Usuario puede tener múltiples CCTs
 */
export interface UsuarioCentroTrabajo {
  usuarioId: string;
  centroTrabajoId: string;
  fechaAsignacion: Date;
}

/**
 * Tipo para contexto de GraphQL
 * @psp Type Safety
 */
export interface GraphQLContext {
  user?: {
    id: string;
    rol: UserRole;
  };
}

/**
 * Interfaz para respuestas paginadas
 * @rup Architecture Pattern - Pagination
 */
export interface PaginatedResponse<T> {
  nodes: T[];
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Parámetros de paginación
 */
export interface PaginationParams {
  limit: number;
  offset: number;
}

/**
 * Interfaz para errores de validación
 * @psp Defect Prevention
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Tipo para resultado de operaciones
 * @psp Error Handling Pattern
 */
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

// Re-export enums for default export
export default {
  UserRole,
  NivelEducativo,
  EstadoValidacion,
};
