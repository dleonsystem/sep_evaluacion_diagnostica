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
    @use-case CU-05: Carga de archivos DBF
    @psp Code Review - Validación de formato
    """
    uploadEvaluacion(input: UploadEvaluacionInput!): Evaluacion!
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
`;

export default typeDefs;
