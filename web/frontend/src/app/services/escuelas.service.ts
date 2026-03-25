import { Injectable } from '@angular/core';
import { GraphqlService } from './graphql.service';
import { Observable, map } from 'rxjs';

export interface Escuela {
    id: string;
    cct: string;
    nombre: string;
    estado: string;
    cp: string;
    email: string;
    telefono: string;
    director: string;
    activo: boolean;
    turno: {
        id: number;
        nombre: string;
        codigo: string;
    };
    nivel: string;
    entidadFederativa: {
        id: number;
        nombre: string;
    };
    cicloEscolar: {
        id: number;
        nombre: string;
    };
}

export interface EscuelaInput {
    cct: string;
    nombre: string;
    id_turno: number;
    id_nivel: number;
    id_entidad: number;
    id_ciclo: number;
    email?: string;
    telefono?: string;
    director?: string;
    cp?: string;
}

@Injectable({
    providedIn: 'root'
})
export class EscuelasService {
    constructor(private graphql: GraphqlService) { }

    listarEscuelas(limit: number = 10, offset: number = 0, filtro?: string): Observable<{ nodes: Escuela[], totalCount: number }> {
        const QUERY = `
      query ListEscuelas($limit: Int, $offset: Int, $filtro: String) {
        listEscuelas(limit: $limit, offset: $offset, filtro: $filtro) {
          nodes {
            id
            cct
            nombre
            estado
            cp
            telefono
            email
            director
            activo
            turno { id nombre codigo }
            nivel
            entidadFederativa { id nombre }
            cicloEscolar { id nombre }
          }
          totalCount
        }
      }
    `;
        return this.graphql.execute<any>(QUERY, { limit, offset, filtro }).pipe(
            map(res => res.data?.listEscuelas)
        );
    }

    crearEscuela(input: EscuelaInput): Observable<Escuela> {
        const MUTATION = `
      mutation CreateEscuela($input: CreateEscuelaInput!) {
        createEscuela(input: $input) {
          id
          cct
          nombre
        }
      }
    `;
        return this.graphql.execute<any>(MUTATION, { input }).pipe(
            map(res => {
                if (res.errors) throw new Error(res.errors[0].message);
                return res.data?.createEscuela;
            })
        );
    }

    actualizarEscuela(id: string, input: Partial<EscuelaInput>): Observable<Escuela> {
        const MUTATION = `
      mutation UpdateEscuela($id: ID!, $input: UpdateEscuelaInput!) {
        updateEscuela(id: $id, input: $input) {
          id
          cct
          nombre
        }
      }
    `;
        return this.graphql.execute<any>(MUTATION, { id, input }).pipe(
            map(res => {
                if (res.errors) throw new Error(res.errors[0].message);
                return res.data?.updateEscuela;
            })
        );
    }

    eliminarEscuela(id: string): Observable<boolean> {
        const MUTATION = `
      mutation DeleteEscuela($id: ID!) {
        deleteEscuela(id: $id) {
          success
          message
        }
      }
    `;
        return this.graphql.execute<any>(MUTATION, { id }).pipe(
            map(res => res.data?.deleteEscuela?.success)
        );
    }
}
