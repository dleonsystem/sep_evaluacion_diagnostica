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
