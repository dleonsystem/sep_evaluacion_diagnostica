export const CREATE_USER_MUTATION = `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      email
      nombre
      apepaterno
      apematerno
      activo
      fechaRegistro
      rol
    }
  }
`;

export const AUTHENTICATE_USER_MUTATION = `
  mutation AuthenticateUser($input: AuthenticateUserInput!) {
    authenticateUser(input: $input) {
      ok
      message
      token
      user {
        id
        email
        rol
        centrosTrabajo {
          claveCCT
        }
      }
    }
  }
`;

export const UPLOAD_EXCEL_MUTATION = `
  mutation UploadExcel($input: UploadExcelInput!) {
    uploadExcelAssessment(input: $input) {
      success
      message
      solicitudId
      duplicadoDetectado
      detalles {
        cct
        nivel
        grado
        alumnosProcesados
        errores
        erroresEstructurados {
          fila
          columna
          campo
          error
          valorEncontrado
          valorEsperado
          hoja
        }
      }
    }
  }
`;
export const UPLOAD_RESULTS_MUTATION = `
  mutation UploadResults($input: UploadResultsInput!) {
    uploadAssessmentResults(input: $input) {
      success
      message
      resultados {
        nombre
        url
        size
      }
    }
  }
`;
