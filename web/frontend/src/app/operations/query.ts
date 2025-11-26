import gql from 'graphql-tag';

export const login = gql`
 query Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
    }
  }
  `;

export const meData = gql`
  query {
    me {
      status
      message
      user {
        id
        name
        lastname
        email
        entidad
      }
    }
  }
`;

export const registrosPorUsuario = gql`
query RegistrosPorUsuario($usuarioId: String!) {
  registrosPorUsuario(usuarioId: $usuarioId) {
    status
    message
    registros {
      id
      evento {
        id
        nombre
        descripcion
        estado
        fecha
        lugar
        modalidad
        tipo
        urlImagen
        destacado
        capacidadMaxima
        cupoDisponible
        hora
        sectorId
      }
      fechaRegistro
      confirmado
      cancelado
      sector
      nivelEducativo
      subsistema
      giroEmpresa
      tamanioEmpresa
      ubicacionesEmpresa
      nivelOperacionEmpresa
      modeloDual
      numEstudiantesDual
      anosExperiencia
      entidadFederativa
      municipio
      nombreEmpresa
      institucion
      usuarioId
      eventoId
      # ❌ REMOVIDO: otroSubsector - no existe en el tipo RegistroEvento del backend
    }
  }
}`;

// ✅ ACTUALIZADO: Query para obtener eventos con subsectores
export const getEventos = gql`
  query Eventos {
    eventos {
      status
      message
      eventos {
        id
        nombre
        descripcion
        fecha
        hora
        capacidadMaxima
        cupoDisponible
        lugar
        tipo
        estado
        urlImagen
        destacado
        modalidad
        sectorId
        preguntaSubsector
        sectorId
        programa {
        Descripcion
        Nombre
      }
      actividadesPrograma {
        CargoPonente
        Descripcion
        EventoId
        FechaHoraFin
        FechaHoraInicio
        Institucion
        NombreActividad
        NombrePonente
        Oid
        TemaActividad
        UrlArchivo
      }
        sectores {
          id
          nombre
          descripcion
        }
        subsectores {
          id
          nombre
          descripcion
        }
      }
    }
  }
`;

// Query para obtener todos los estados
export const getEstados = gql`
  query Estados {
    estados {
      status
      message
      estados {
        id
        codigoEstado
        nombreEstado
      }
    }
  }
`;

// Query para obtener municipios por estado
export const getMunicipiosPorEstado = gql`
  query MunicipiosPorEstado($estadoId: Int!) {
    municipiosPorEstado(estadoId: $estadoId) {
      status
      message
      municipios {
        id
        codigoMunicipio
        nombreMunicipio
      }
    }
  }
`;

// Nuevo query para obtener usuario por ID
export const getUsuario = gql`
  query Usuario($usuarioId: String!) {
    usuario(id: $usuarioId) {
      status
      message
      usuarios {
        id
        nombre
        apellidoPaterno
        apellidoMaterno
        correoElectronico
        telefono
        curp
        fechaNacimiento
        sexo
        rol
        entidad
        estado {
          id
          nombreEstado
        }
        municipio {
          id
          nombreMunicipio
        }
      }
    }
  }
`;

export const getMe = gql`
query Me {
  me {
    status
    message
    usuario {
      id
      nombre
      apellidoMaterno
      apellidoPaterno
      fechaNacimiento
      sexo
      curp
      telefono
      correoElectronico
      rol
      entidad
      estado {
        id
        nombreEstado
      }
      municipio {
        id
        nombreMunicipio
      }
    }
  }
}`;

export const getArchivosPorEvento = gql`
  query ArchivosPorEvento($eventoId: String!) {
    archivosPorEvento(eventoId: $eventoId) {
      status
      message
      archivos {
        id
        nombreArchivo
        rutaAlmacenamiento
        tipoArchivo
        fechaCarga
      }
    }
  }
`;


export const getEnlacesDeInteres = gql`
  query EnlacesDeInteres {
    enlacesDeInteres {
      status
      message
      enlaces {
        id
        nombre
        descripcion
        url
        nombreEnlace
        urlEnlace2
        nombreEnlace2
      }
    }
  }
`;


export const usuarioEnListaEspera = gql`
  query UsuarioEnListaEspera($usuarioId: String!, $eventoId: String!) {
    usuarioEnListaEspera(usuarioId: $usuarioId, eventoId: $eventoId) {
      status
      message
      enListaEspera
      registro {
        oid
        usuarioId
        eventoId
        fecha
        atendido
      }
      error
    }
  }
`;


export const listaEsperaPorUsuario = gql`
  query ListaEsperaPorUsuario($usuarioId: String!) {
    listaEsperaPorUsuario(usuarioId: $usuarioId) {
      status
      message
      listaEspera {
        id
        usuarioId
        eventoId
        fechaRegistro
      }
    }
  }
`;

export const getConfiguracion = gql`
  query GetConfiguracion {
    getConfiguracion {
      status
      message
      configuracion {
        llave
        valor
      }
    }
  }
`;

export const listaEsperaPorEvento = gql`
  query ListaEsperaPorEvento($eventoId: String!) {
    listaEsperaPorEvento(eventoId: $eventoId) {
      status
      message
      listaEspera {
        id
        usuarioId
        eventoId
      }
    }
  }
`;
