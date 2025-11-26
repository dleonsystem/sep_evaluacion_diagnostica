// mutation.ts - Mutación crearRegistro actualizada para incluir subsectores

import gql from 'graphql-tag';

// ✅ ACTUALIZADA: Mutación para incluir subsectores
export const crearRegistro = gql`
  mutation CrearRegistro($input: RegistroEventoInput!) {
    crearRegistro(input: $input) {
      status
      message
      registros {
        id
        usuarioId
        eventoId
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
      }
    }
  }
`;

// Resto de mutaciones sin cambios...
export const crearUsuario = gql`
  mutation CrearUsuario($input: UsuarioInput!) {
    crearUsuario(input: $input) {
      status
      message
      token
      usuario {
        id
        nombre
        apellidoPaterno
        apellidoMaterno
        correoElectronico
        curp
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

export const login = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      status
      message
      token
      usuario {
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
      }
    }
  }
`;

export const cancelarRegistro = gql`
  mutation CancelarRegistro($registroId: String!, $motivo: String!) {
    cancelarRegistro(registroId: $registroId, motivo: $motivo) {
      status
      message
      cancelaciones {
        id
        fechaCancelacion
        motivo
        canceladoPor
      }
    }
  }
`;

export const registrarEnListaEspera = gql`
  mutation RegistrarEnListaEspera($input: RegistroEventoInput!) {
    registrarEnListaEspera(input: $input) {
      status
      message
      listaEspera {
        id
        usuario {
          id
          nombre
          apellidoPaterno
          apellidoMaterno
        }
        evento {
          id
          nombre
        }
        fechaSolicitud
        atendido
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
      }
    }
  }
`;

export const actualizarUsuario = gql`
  mutation ActualizarUsuario($input: ActualizarUsuarioInput!) {
    actualizarUsuario(input: $input) {
      status
      message
      usuario {
        id
        nombre
        apellidoPaterno
        apellidoMaterno
        correoElectronico
        telefono
        curp
        fechaNacimiento
        rol
      }
    }
  }
`;
