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
