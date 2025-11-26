export interface UsuarioInput {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  correoElectronico: string;
  telefono: string;
  curp: string;
  fechaNacimiento: string;
  sexo: number; // Se mantiene como number para compatibilidad
  estado: number; // ID numérico de la entidad federativa
  municipio: number; // ID numérico del municipio
  password: string;
  rol: string;
}

export interface UsuarioResponse {
  status: string;
  message: string;
  token: string;
  usuario: {
    id: string;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    correoElectronico: string;
    entidad?: string; // Nuevo campo devuelto por los resolvers
    telefono: string;
    curp: string;
    fechaNacimiento: string;
    sexo: number; // Se mantiene como number
    estado: {
      id: number;
      nombreEstado: string;
    };
    municipio: {
      id: number;
      nombreMunicipio: string;
    };
    rol: string;
  };
}

export interface Estado {
  id: number;
  codigoEstado: string;
  nombreEstado: string;
}

export interface Municipio {
  id: number;
  codigoMunicipio: string;
  nombreMunicipio: string;
}

export interface LoginInput {
  correoElectronico: string;
  password: string;
}
