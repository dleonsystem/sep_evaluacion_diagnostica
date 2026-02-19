/**
 * GraphQL Type Definitions
 *
 * @module schema/typeDefs
 * @description Definiciones de tipos GraphQL para el sistema EIA
 * @version 1.0.0
 * @author SEP - Evaluación Diagnóstica
 * @standard PSP (Personal Software Process)
 * @rup Use Case Driven - Schema basado en casos de uso
 * @cmmi CMMI Level 3 - Requirements Development
 */

export const typeDefs = `#graphql
  """
  Tipo Query raíz del esquema GraphQL
  @rup Architecture-centric - API Gateway Pattern
  """
  type Query {
    """
    Obtener información del servidor
    @psp Unit Test - Query de prueba básica
    """
    healthCheck: HealthCheck!
    
    """
    Obtener usuario por ID
    @use-case CU-01: Autenticación de usuarios
    """
    getUser(id: ID!): User
    
    """
    Listar todos los usuarios
    @use-case CU-02: Gestión de usuarios
    """
    listUsers(
      limit: Int = 10
      offset: Int = 0
    ): UserConnection!
    
    """
    Obtener centro de trabajo (CCT) por clave
    @use-case CU-03: Consulta de centros de trabajo
    """
    getCCT(clave: String!): CentroTrabajo
    
    """
    Obtener evaluación por ID
    @use-case CU-10: Consulta de evaluaciones
    """
    getEvaluacion(id: ID!): Evaluacion

    """
    Listar solicitudes de carga EIA2
    @use-case CU-05: Historial de cargas
    """
    getSolicitudes(
      cct: String
      limit: Int = 10
      offset: Int = 0
    ): [SolicitudEia2!]!

    """
    Listar tickets del usuario autenticado o por correo
    @use-case CU-13: Mesa de ayuda
    """
    getMyTickets(correo: String): [Ticket!]!
    
    """
    Obtener métricas para el dashboard administrativo
    @use-case CU-14: Dashboard
    """
    getDashboardMetrics: DashboardMetrics!

    """
    Exportar tickets a formato CSV (Base64)
    @use-case CU-15: Reportes
    """
    exportTicketsCSV: ExportResponse!

    """
    Listar todos los tickets del sistema (Admin)
    @use-case CU-13: Mesa de ayuda
    """
    getAllTickets: [Ticket!]!

    """
    Generar comprobante de recepción (PDF)
    @use-case CU-16: Descarga de Comprobantes
    """
    generateComprobante(solicitudId: ID!): FileDownload!
  }

  """
  Respuesta de exportación de archivos
  """
  type ExportResponse {
    success: Boolean!
    fileName: String!
    contentBase64: String!
  }

  """
  Métricas para el dashboard
  """
  type DashboardMetrics {
    totalUsuarios: Int!
    usuariosActivos: Int!
    totalTickets: Int!
    ticketsAbiertos: Int!
    ticketsResueltos: Int!
    totalSolicitudes: Int!
    solicitudesValidadas: Int!
    totalCCTs: Int!
  }
  
  """
  Tipo Mutation raíz del esquema GraphQL
  @rup Iterative Development - Incremento de funcionalidades
  """
  type Mutation {
    """
    Crear nuevo usuario
    @use-case CU-01: Registro de usuarios
    @psp Design Review - Validación de entrada
    """
    createUser(input: CreateUserInput!): User!

    """
    Autenticar usuario
    @use-case CU-01: Autenticación de usuarios
    """
    authenticateUser(input: AuthenticateUserInput!): AuthPayload!
    
    """
    Actualizar usuario existente
    @use-case CU-02: Actualización de datos de usuario
    """
    updateUser(id: ID!, input: UpdateUserInput!): User!
    
    """
    Eliminar usuario
    @use-case CU-02: Baja de usuarios
    """
    deleteUser(id: ID!): DeleteResponse!
    
    """
    Cargar archivo de evaluación
    @use-case CU-05: Recepción de archivos (EIA2)
    @psp Code Review - Validación de formato Excel
    """
    uploadExcelAssessment(input: UploadExcelInput!): UploadExcelResponse!
    
    """
    Recuperar contraseña (envío de email)
    @use-case CU-01: Autenticación
    """
    recoverPassword(email: String!): String!

    """
    Crear nuevo ticket de soporte
    @use-case CU-13: Mesa de ayuda
    """
    createTicket(input: CreateTicketInput!): Ticket!

    """
    Responder a un ticket de soporte (Admin)
    @use-case CU-13: Mesa de ayuda
    """
    respondToTicket(ticketId: ID!, respuesta: String!, cerrar: Boolean!): Ticket!

    """
    Borrar lógicamente un ticket (Usuario/Admin)
    @use-case CU-13: Mesa de ayuda
    """
    deleteTicket(ticketId: ID!): Boolean!
  }
  
  """
  Estado de salud del servidor
  @psp Process Metrics - Monitoreo de servicio
  """
  type HealthCheck {
    status: String!
    timestamp: String!
    database: DatabaseStatus!
    version: String!
  }
  
  """
  Estado de la base de datos
  """
  type DatabaseStatus {
    connected: Boolean!
    latency: Int
  }
  
  """
  Usuario del sistema
  @use-case CU-01, CU-02
  @cmmi Requirements Traceability
  """
  type User {
    id: ID!
    email: String!
    nombre: String!
    apepaterno: String!
    apematerno: String
    rol: UserRole!
    activo: Boolean!
    fechaRegistro: String!
    fechaUltimoAcceso: String
    centrosTrabajo: [CentroTrabajo!]!
  }
  
  """
  Roles de usuario
  @requirements RF-01: Control de acceso basado en roles
  """
  enum UserRole {
    COORDINADOR_FEDERAL
    COORDINADOR_ESTATAL
    RESPONSABLE_CCT
    CONSULTA
  }
  
  """
  Centro de trabajo (CCT)
  @use-case CU-03: Gestión de centros de trabajo
  """
  type CentroTrabajo {
    id: ID!
    claveCCT: String!
    nombre: String!
    entidad: String!
    municipio: String!
    localidad: String!
    nivel: NivelEducativo!
    turno: String!
    usuarios: [User!]!
  }
  
  """
  Niveles educativos
  @requirements RF-03: Soporte para múltiples niveles
  """
  enum NivelEducativo {
    PREESCOLAR
    PRIMARIA
    SECUNDARIA
  }
  
  """
  Evaluación
  @use-case CU-05, CU-10: Gestión de evaluaciones
  """
  type Evaluacion {
    id: ID!
    claveCCT: String!
    periodo: String!
    grado: Int!
    grupo: String!
    fechaCarga: String!
    nombreArchivo: String!
    estadoValidacion: EstadoValidacion!
    estudiantes: [Estudiante!]!
  }
  
  """
  Estados de validación
  @requirements RF-14: Validación de datos
  """
  enum EstadoValidacion {
    PENDIENTE
    VALIDADO
    RECHAZADO
    EN_PROCESO
  }
  
  """
  Estudiante
  @use-case CU-06: Gestión de estudiantes
  """
  type Estudiante {
    id: ID!
    curp: String!
    nombre: String!
    apellidoPaterno: String!
    apellidoMaterno: String
    grado: Int!
    grupo: String!
  }
  
  """
  Conexión paginada de usuarios
  @rup Architecture Pattern - Pagination
  """
  type UserConnection {
    nodes: [User!]!
    totalCount: Int!
    hasNextPage: Boolean!
  }

  """
  Resultado de autenticación
  """
  type AuthPayload {
    ok: Boolean!
    message: String
    user: User
  }
  
  """
  Input para crear usuario
  @psp Design by Contract - Validación de entrada
  """
  input CreateUserInput {
    email: String!
    nombre: String
    apepaterno: String
    apematerno: String
    rol: UserRole!
    clavesCCT: [String!]!
    password: String!
  }

  """
  Input para autenticar usuario
  """
  input AuthenticateUserInput {
    email: String!
    password: String!
  }
  
  """
  Input para actualizar usuario
  """
  input UpdateUserInput {
    nombre: String
    apepaterno: String
    apematerno: String
    rol: UserRole
    activo: Boolean
  }
  
  """
  Input para carga de evaluación
  @use-case CU-05: Recepción de archivos
  """
  input UploadEvaluacionInput {
    claveCCT: String!
    periodo: String!
    grado: Int!
    grupo: String!
    archivoBase64: String!
    nombreArchivo: String!
  }
  
  """
  Respuesta de eliminación
  """
  type DeleteResponse {
    success: Boolean!
    message: String!
  }

  """
  Input para carga de Excel Universal
  """
  input UploadExcelInput {
    archivoBase64: String!
    nombreArchivo: String!
    cicloEscolar: String!
    email: String
    confirmarReemplazo: Boolean
  }

  """
  Respuesta de carga de Excel
  """
  type UploadExcelResponse {
    success: Boolean!
    message: String!
    solicitudId: ID
    detalles: ExcelUploadResult
    duplicadoDetectado: Boolean
  }

  """
  Detalles del resultado del procesamiento Excel
  """
  type ExcelUploadResult {
    cct: String
    nivel: String
    grado: Int
    alumnosProcesados: Int
    errores: [String!]
  }

  """
  Solicitud de carga EIA2
  """
  type SolicitudEia2 {
    id: ID!
    consecutivo: Int!
    cct: String!
    archivoOriginal: String!
    fechaCarga: String!
    estadoValidacion: Int!
    nivelEducativo: Int
    archivoPath: String
    archivoSize: Int
    procesadoExternamente: Boolean!
    errores: [String!]
  }
  """
  Ticket de Soporte
  """
  type Ticket {
    id: ID!
    numeroTicket: String!
    asunto: String!
    descripcion: String!
    estado: String!
    prioridad: String!
    evidencias: [TicketEvidencia!]
    respuestas: [TicketRespuesta!]
    correo: String
    fechaCreacion: String!
    fechaActualizacion: String!
  }

  """
  Respuesta de Ticket (Comentario)
  """
  type TicketRespuesta {
    id: ID!
    mensaje: String!
    fecha: String!
    autor: String!
    esInterno: Boolean!
  }

  """
  Evidencia de Ticket
  """
  type TicketEvidencia {
    nombre: String!
    url: String!
    size: Int
  }

  """
  Input para crear Ticket
  """
  input CreateTicketInput {
    motivo: String!
    descripcion: String!
    correo: String
    evidencias: [TicketEvidenciaInput!]
  }

  """
  Input para evidencia de Ticket
  """
  input TicketEvidenciaInput {
    nombre: String!
    base64: String!
  }

  """
  Respuesta para descarga de archivos
  """
  type FileDownload {
    success: Boolean!
    fileName: String!
    contentBase64: String!
  }
`;

export default typeDefs;
