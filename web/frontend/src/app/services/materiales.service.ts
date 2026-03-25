import { Injectable } from '@angular/core';
import { GraphqlService } from './graphql.service';
import { map, Observable } from 'rxjs';

export interface MaterialEvaluacion {
  id: string;
  nombre: string;
  tipo: 'EIA' | 'FRV' | 'RUBRICA';
  nivelEducativo: string;
  rutaArchivo: string;
  cicloEscolar: string;
  fechaPublicacion: string;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MaterialesService {
  constructor(private graphql: GraphqlService) {}

  getMateriales(nivel?: string, ciclo?: string): Observable<MaterialEvaluacion[]> {
    const query = `
      query GetMateriales($nivel: NivelEducativo, $ciclo: String) {
        getMateriales(nivel: $nivel, ciclo: $ciclo) {
          id
          nombre
          tipo
          nivelEducativo
          rutaArchivo
          cicloEscolar
          fechaPublicacion
          activo
        }
      }
    `;
    return this.graphql.execute<{ getMateriales: MaterialEvaluacion[] }>(query, { nivel, ciclo })
      .pipe(map(result => result.data?.getMateriales || []));
  }

  publicarMaterial(input: any): Observable<any> {
    const mutation = `
      mutation PublicarMaterial($input: PublicarMaterialInput!) {
        publicarMaterial(input: $input) {
          success
          message
          requiresConfirmation
          material {
            id
            nombre
            tipo
            nivelEducativo
            cicloEscolar
            fechaPublicacion
          }
        }
      }
    `;
    return this.graphql.execute<any>(mutation, { input })
      .pipe(map(result => result.data));
  }

  descargarMaterial(id: string): Observable<any> {
    const query = `
      query DownloadMaterial($id: ID!) {
        downloadMaterial(id: $id) {
          success
          fileName
          contentBase64
        }
      }
    `;
    return this.graphql.execute<any>(query, { id })
      .pipe(map(result => result.data?.downloadMaterial));
  }
}
