// models.ts - Interfaces actualizadas para incluir preguntaSubsector, programa y actividadesPrograma

// ✅ NUEVO: Interfaces para sectores y subsectores
export interface Sector {
  id: string;
  nombre: string;
  descripcion: string;
}

export interface Subsector {
  id: string;
  nombre: string;
  descripcion: string;
}

// ✅ NUEVO: Interface para programa
export interface Programa {
  Descripcion: string;
  Nombre: string;
}

// ✅ NUEVO: Interface para actividades del programa
export interface ActividadPrograma {
  CargoPonente: string;
  Descripcion: string;
  EventoId: string;
  FechaHoraFin: string;
  FechaHoraInicio: string;
  Institucion: string;
  NombreActividad: string;
  NombrePonente: string;
  Oid: string;
  TemaActividad: string;
  UrlArchivo: string;
}

export interface Evento {
  id: string;
  titulo: string;
  nombre: string;
  estado: string;
  descripcion: string;
  fecha: string;
  hora: string;
  lugar: string;
  modalidad: string;
  /**
   * Cupos disponibles reportados por la API.
   * Se mantiene la propiedad `cuposDisponibles` para compatibilidad interna.
   */
  cupoDisponible?: number;
  cuposDisponibles: number;
  capacidadMaxima: number;
  urlImagen: string;
  categoria: string;
  organizador: string;
  inscrito: boolean;
  destacado: boolean;
  ponentes?: string[];
  objetivos?: string[];
  requisitos?: string[];
  programa?: { hora: string, actividad: string }[]; // Mantener para compatibilidad
  documentos?: { nombre: string, url: string }[];
  contacto?: string;
  urlEvento?: string;
  // ✅ PROPIEDADES EXISTENTES
  sectorId?: string | null; // Identificador del sector principal del evento
  sectores?: {
    id: string;
    nombre: string;
    descripcion: string | null;
  }[];
  subsectores?: {
    id: string;
    nombre: string;
    descripcion: string | null;
  }[];
  // ✅ CAMPO EXISTENTE: Campo para la pregunta personalizada de subsectores
  preguntaSubsector?: string | null;
  // ✅ NUEVO: Campo para lista de espera
  enListaEspera?: boolean;
  // ✅ NUEVOS CAMPOS: Programa y actividades del programa desde GraphQL
  programaInfo?: Programa | null; // Renombrado para evitar conflicto con el campo existente
  actividadesPrograma?: ActividadPrograma[] | null;
}

export interface Usuario {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  curp: string;
  fechaNacimiento: string;
  sexo: string;
  entidad: string;
  correoElectronico: string;
  apellidos: string;
  email: string;
  telefono: string;
  institucion: string;
  cargo: string;
  eventos: string[];
  origenAutenticacion?: string; // ← Campo existente

  // ✅ NUEVOS CAMPOS OPCIONALES para LlaveMX
  oid?: string;
  estadoNacimiento?: string;
  domicilio?: {
    codigo_postal: string;
    colonia: string;
    alcaldia_municipio: string;
    estado: string;
    calle: string;
    idAlcaldiaMunicipio?: string;
    idColonia?: string;
    idEstado?: string;
  } | null;
}

// Interfaces para el login con GraphQL
export interface LoginInput {
  correoElectronico: string;
  password: string;
}

export interface LoginResponse {
  status: boolean;
  message: string;
  token: string;
  usuario: {
    id: string;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    correoElectronico: string;
    telefono: string;
    curp: string;
    fechaNacimiento: string;
    sexo: string;
    rol: string;
  } | null;
}

// Interfaces para registro de usuario
export interface UsuarioInput {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  correoElectronico: string;
  telefono: string;
  curp: string;
  fechaNacimiento: string;
  sexo: number;
  estado: number;
  municipio: number;
  password: string;
  rol: string;
}

// ✅ ACTUALIZADA: Interfaz para registro de evento con subsectores Y otroSubsector
export interface RegistroEventoInput {
  usuarioId: string;
  eventoId: string;
  // Campos básicos (opcionales)
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  correoElectronico?: string;
  telefono?: string;
  curp?: string;

  // Campos del formulario
  sector: string;
  nivelEducativo?: string | null;
  subsistema?: string | null;
  giroEmpresa?: string | null;
  tamanioEmpresa?: string | null;
  ubicacionesEmpresa?: string[] | null;
  nivelOperacionEmpresa?: string | null;
  modeloDual?: boolean | null;
  numEstudiantesDual?: number | null;
  anosExperiencia?: string | null;
  entidadFederativa?: number | null;
  municipio?: number | null;

  // Campos adicionales
  nombreEmpresa?: string | null;
  institucion?: string | null;

  // ✅ CAMPOS PARA SUBSECTORES
  subsectores?: string[] | null; // Array de IDs de subsectores
  otroSubsector?: string | null; // ✅ NUEVO: Campo para el texto "Otro" subsector
}

export interface CancelacionResponse {
  status: boolean;
  message: string;
  cancelacion: {
    id: string;
    fechaCancelacion: string;
    motivo: string;
    canceladoPor: string;
  } | null;
}

// Interfaces para las respuestas de estados y municipios
export interface EstadosResponse {
  status: boolean;
  message: string;
  estados: {
    id: number;
    codigoEstado: string;
    nombreEstado: string;
  }[];
}

export interface MunicipiosResponse {
  status: boolean;
  message: string;
  municipios: {
    id: number;
    codigoMunicipio: string;
    nombreMunicipio: string;
  }[];
}

export interface ActualizarUsuarioInput {
  id: string;
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  correoElectronico: string;
  telefono?: string;
  curp?: string;
  fechaNacimiento?: string;
  rol?: string;
  estado?: number;
  municipio?: number;
}

export interface ActualizarUsuarioResponse {
  status: boolean;
  message: string;
  usuario: {
    id: string;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    correoElectronico: string;
    telefono: string;
    curp: string;
    fechaNacimiento: string;
    rol: string;
  } | null;
}

export interface ArchivoEvento {
  id: string;
  nombreArchivo: string;
  rutaAlmacenamiento: string;
  tipoArchivo: string;
  fechaCarga: string;
  tamanoArchivo?: string;
}

export interface ArchivosPorEventoResponse {
  status: boolean;
  message: string;
  archivos: ArchivoEvento[];
}

// Interfaces para LlaveMX
export interface LlaveMxTokenResponse {
  data: {
    getTokenLlaveMx: string;
  };
}

export interface LlaveMxDatosResponse {
  data: {
    getDatosLlaveMx: {
      oid: string;
      correo: string;
      nombre: string;
      paterno: string;
      materno: string;
      curp: string;
      fecha_nacimiento: string;
      sexo: string;
      telefono_vigente: string;
      estado_nacimiento: string;
      domicilio: {
        codigo_postal: string;
        colonia: string;
        alcaldia_municipio: string;
        estado: string;
        calle: string;
      };
    };
  };
}

export interface UsuarioLlaveMx {
  oid: string;
  correo: string;
  nombre: string;
  paterno: string;
  materno: string;
  curp: string;
  fecha_nacimiento: string;
  sexo: string;
  telefono_vigente: string;
  estado_nacimiento: string;
  domicilio: {
    codigo_postal: string;
    colonia: string;
    alcaldia_municipio: string;
    estado: string;
    calle: string;
  };
}

// Interface para el usuario mapeado al sistema
export interface UsuarioSistemaLlaveMx {
  id?: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  correoElectronico: string;
  telefono: string;
  curp: string;
  fechaNacimiento: string;
  sexo: number;
  estado: number;
  municipio: number;
  password: string;
  rol: string;
}


export interface CrearUsuarioResponse {
  status: boolean;
  message: string;
  codigo?: string;
  usuario: {
    id: string;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    correoElectronico: string;
    telefono: string;
    curp: string;
    fechaNacimiento: string;
    sexo: number;
    rol: string;
  } | null;
}


// ✅ NUEVO: Elemento de la lista de espera
export interface ListaEsperaItem {
  id: string;
  usuarioId: string;
  eventoId: string;
  otroSubsector?: string | null;
}

export interface ListaEsperaResponse {
  status: boolean;
  message: string;
  enListaEspera: boolean;
  listaEspera?: ListaEsperaItem[] | null;
  error?: string;
}
