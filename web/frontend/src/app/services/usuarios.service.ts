import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { GraphqlService } from './graphql.service';
import {
  AUTHENTICATE_USER_MUTATION,
  CREATE_USER_MUTATION,
  CHANGE_PASSWORD_MUTATION,
} from '../operations/mutation';

export interface CreateUserInput {
  email: string;
  nombre?: string | null;
  apepaterno?: string | null;
  apematerno?: string | null;
  rol:
  | 'COORDINADOR_FEDERAL'
  | 'COORDINADOR_ESTATAL'
  | 'RESPONSABLE_CCT'
  | 'CONSULTA';
  clavesCCT: string[];
  password: string;
}

export interface UsuarioCreado {
  id: string;
  email: string;
  nombre: string;
  apepaterno: string;
  apematerno?: string | null;
  activo: boolean;
  fechaRegistro: string;
  rol: string;
}

export interface UsuarioAutenticado {
  id: string;
  email: string;
  rol: string;
  primerLogin?: boolean;
  passwordDebeCambiar?: boolean;
  centrosTrabajo?: Array<{ claveCCT: string }>;
}

export interface Role {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  permisos: any;
}

export interface AuthPayload {
  ok: boolean;
  message?: string;
  token?: string;
  user?: UsuarioAutenticado;
}

interface CreateUserResponse {
  createUser: UsuarioCreado;
}

interface AuthenticateUserResponse {
  authenticateUser: {
    ok: boolean;
    message?: string | null;
    token?: string | null;
    user?: UsuarioAutenticado | null;
  };
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  constructor(private readonly graphqlService: GraphqlService) { }

  crearUsuario(input: CreateUserInput): Observable<UsuarioCreado> {
    return this.graphqlService
      .execute<CreateUserResponse>(CREATE_USER_MUTATION, { input })
      .pipe(
        map((response) => {
          if (response.errors?.length) {
            throw new Error(
              response.errors[0].message ?? 'No se pudo crear el usuario.',
            );
          }
          if (!response.data?.createUser) {
            throw new Error('No se recibió respuesta al crear el usuario.');
          }
          return response.data.createUser;
        }),
      );
  }

  autenticarUsuario(
    email: string,
    password: string,
  ): Observable<AuthPayload> {
    return this.graphqlService
      .execute<AuthenticateUserResponse>(AUTHENTICATE_USER_MUTATION, {
        input: { email, password },
      })
      .pipe(
        map((response) => {
          if (response.errors?.length) {
            throw new Error(
              response.errors[0].message ?? 'No se pudo autenticar el usuario.',
            );
          }
          const resultado = response.data?.authenticateUser;
          if (!resultado) {
            throw new Error('No se recibió respuesta del servidor.');
          }
          return {
            ok: resultado.ok,
            message: resultado.message || undefined,
            token: resultado.token || undefined,
            user: resultado.user ? {
              ...resultado.user,
              passwordDebeCambiar: (resultado.user as any).passwordDebeCambiar || false
            } : undefined
          };
        }),
      );
  }

  recuperarPassword(email: String): Observable<string> {
    const mutation = `
      mutation RecoverPassword($email: String!) {
        recoverPassword(email: $email)
      }
    `;
    return this.graphqlService
      .execute<{ recoverPassword: string }>(mutation, { email })
      .pipe(
        map((res) => {
          if (res.errors) throw new Error(res.errors[0].message);
          return res.data?.recoverPassword || '';
        }),
      );
  }

  listarUsuarios(
    limit = 10,
    offset = 0,
    search?: string
  ): Observable<{ nodes: UsuarioCreado[]; totalCount: number }> {
    const query = `
      query ListUsers($limit: Int, $offset: Int, $search: String) {
        listUsers(limit: $limit, offset: $offset, search: $search) {
          nodes {
            id
            email
            nombre
            apepaterno
            apematerno
            rol
            fechaRegistro
            activo
          }
          totalCount
        }
      }
    `;
    return this.graphqlService
      .execute<{
        listUsers: { nodes: UsuarioCreado[]; totalCount: number };
      }>(query, { limit, offset, search })
      .pipe(
        map((res) => {
          if (res.errors) throw new Error(res.errors[0].message);
          return res.data?.listUsers || { nodes: [], totalCount: 0 };
        }),
      );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<AuthPayload> {
    return this.graphqlService
      .execute<{ changePassword: AuthPayload }>(CHANGE_PASSWORD_MUTATION, {
        input: { currentPassword, newPassword }
      })
      .pipe(
        map((res) => {
          if (res.errors) throw new Error(res.errors[0].message);
          return res.data?.changePassword || { ok: false, message: 'No se recibió respuesta.' };
        })
      );
  }

  actualizarUsuario(id: string, input: any): Observable<UsuarioCreado> {
    const mutation = `
      mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
        updateUser(id: $id, input: $input) {
          id
          email
          nombre
          apepaterno
          apematerno
          rol
          activo
          fechaRegistro
        }
      }
    `;
    return this.graphqlService
      .execute<{ updateUser: UsuarioCreado }>(mutation, { id, input })
      .pipe(
        map((res) => {
          if (res.errors) throw new Error(res.errors[0].message);
          return res.data!.updateUser;
        }),
      );
  }

  eliminarUsuario(id: string): Observable<boolean> {
    const mutation = `
      mutation DeleteUser($id: ID!) {
        deleteUser(id: $id) {
          success
          message
        }
      }
    `;
    return this.graphqlService
      .execute<{ deleteUser: { success: boolean } }>(mutation, { id })
      .pipe(
        map((res) => {
          if (res.errors) throw new Error(res.errors[0].message);
          return res.data?.deleteUser.success || false;
        }),
      );
  }

  listarRoles(): Observable<Role[]> {
    const query = `
      query GetRoles {
        getRoles {
          id
          codigo
          nombre
          descripcion
          permisos
        }
      }
    `;
    return this.graphqlService
      .execute<{ getRoles: Role[] }>(query)
      .pipe(
        map((res) => {
          if (res.errors) throw new Error(res.errors[0].message);
          return res.data?.getRoles || [];
        }),
      );
  }

  actualizarPermisosRol(roleId: string, permisos: any): Observable<Role> {
    const mutation = `
      mutation UpdateRolePermissions($roleId: ID!, $permisos: JSON!) {
        updateRolePermissions(roleId: $roleId, permisos: $permisos) {
          id
          codigo
          nombre
          permisos
        }
      }
    `;
    return this.graphqlService
      .execute<{ updateRolePermissions: Role }>(mutation, { roleId, permisos })
      .pipe(
        map((res) => {
          if (res.errors) throw new Error(res.errors[0].message);
          return res.data!.updateRolePermissions;
        }),
      );
  }
}
