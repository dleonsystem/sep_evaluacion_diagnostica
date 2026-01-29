import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { GraphqlService } from './graphql.service';
import { CREATE_USER_MUTATION } from '../operations/mutation';

export interface CreateUserInput {
  email: string;
  nombre?: string | null;
  apepaterno?: string | null;
  apematerno?: string | null;
  rol: 'COORDINADOR_FEDERAL' | 'COORDINADOR_ESTATAL' | 'RESPONSABLE_CCT' | 'CONSULTA';
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

interface CreateUserResponse {
  createUser: UsuarioCreado;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  constructor(private readonly graphqlService: GraphqlService) {}

  crearUsuario(input: CreateUserInput): Observable<UsuarioCreado> {
    return this.graphqlService
      .execute<CreateUserResponse>(CREATE_USER_MUTATION, { input })
      .pipe(
        map((response) => {
          if (response.errors?.length) {
            throw new Error(response.errors[0].message ?? 'No se pudo crear el usuario.');
          }
          if (!response.data?.createUser) {
            throw new Error('No se recibió respuesta al crear el usuario.');
          }
          return response.data.createUser;
        })
      );
  }
}
