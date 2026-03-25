import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GraphqlService } from './graphql.service';

export interface SchoolReport {
  id: string;
  nombre: string;
  tipo: string;
  fechaGeneracion: string;
  url: string;
  size?: number;
  solicitudId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  constructor(private readonly graphqlService: GraphqlService) {}

  /**
   * Obtiene la lista de reportes disponibles para un CCT.
   * @use-case CU-08: Generar Reportes
   */
  getSchoolReports(cct: String): Observable<SchoolReport[]> {
    const query = `
      query GetSchoolReports($cct: String!) {
        getSchoolReports(cct: $cct) {
          id
          nombre
          tipo
          fechaGeneracion
          url
          size
          solicitudId
        }
      }
    `;
    return this.graphqlService.execute<{ getSchoolReports: SchoolReport[] }>(query, { cct })
      .pipe(map(base => {
        if (base.errors) throw new Error(base.errors[0].message);
        return base.data?.getSchoolReports || [];
      }));
  }

  /**
   * Descarga un archivo de resultado específico.
   * @use-case CU-17: Entrega de Resultados
   */
  descargarReporte(solicitudId: string, fileName: string): Observable<{ success: boolean; contentBase64: string; fileName: string }> {
    const query = `
      query DownloadResult($solicitudId: ID!, $fileName: String!) {
        downloadAssessmentResult(solicitudId: $solicitudId, fileName: $fileName) {
          success
          contentBase64
          fileName
        }
      }
    `;
    return this.graphqlService.execute<{ downloadAssessmentResult: any }>(query, { solicitudId, fileName })
      .pipe(map(base => {
        if (base.errors) throw new Error(base.errors[0].message);
        return base.data?.downloadAssessmentResult;
      }));
  }

  /**
   * Simula la generación de reportes (Demo).
   */
  simularGeneracion(solicitudId: string): Observable<boolean> {
    const mutation = `
      mutation Simulate($solicitudId: ID!) {
        simulateReportGeneration(solicitudId: $solicitudId)
      }
    `;
    return this.graphqlService.execute<{ simulateReportGeneration: boolean }>(mutation, { solicitudId })
      .pipe(map(base => {
        if (base.errors) throw new Error(base.errors[0].message);
        return !!base.data?.simulateReportGeneration;
      }));
  }
}
