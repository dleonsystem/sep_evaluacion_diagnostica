import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { GraphqlService } from './graphql.service';
import { UPLOAD_EXCEL_MUTATION, UPLOAD_RESULTS_MUTATION } from '../operations/mutation';
import { GET_SOLICITUDES, DOWNLOAD_ASSESSMENT_RESULT } from '../operations/query';

export interface UploadExcelInput {
    archivoBase64: string;
    nombreArchivo: string;
    cicloEscolar: string;
    email?: string;
    confirmarReemplazo?: boolean;
}

export interface ExcelValidationError {
    fila?: number;
    columna?: string;
    campo?: string;
    error: string;
    valorEncontrado?: string;
    valorEsperado?: string;
    hoja?: string;
}

export interface ExcelUploadResult {
    cct?: string;
    nivel?: string;
    grado?: number;
    alumnosProcesados: number;
    errores?: string[];
    erroresEstructurados?: ExcelValidationError[];
}

export interface UploadExcelResponse {
    uploadExcelAssessment: {
        success: boolean;
        message: string;
        solicitudId?: string;
        consecutivo?: string;
        detalles?: ExcelUploadResult;
        duplicadoDetectado?: boolean;
    };
}

export interface SolicitudEia2 {
    id: string;
    consecutivo: number;
    cct: string;
    turno?: string;
    archivoOriginal: string;
    fechaCarga: string;
    estadoValidacion: number;
    nivelEducativo?: number;
    archivoPath?: string;
    archivoSize?: number;
    procesadoExternamente: boolean;
    errores?: string[];
    resultados?: Array<{ nombre: string; url: string; size: number }>;
}

export interface UploadResultsResponse {
    uploadAssessmentResults: {
        success: boolean;
        message: string;
        resultados: Array<{ nombre: string; url: string; size: number }>;
    };
}

export interface GetSolicitudesResponse {
    getSolicitudes: SolicitudEia2[];
}

@Injectable({ providedIn: 'root' })
export class EvaluacionesService {
    constructor(private readonly graphqlService: GraphqlService) { }

    subirExcel(input: UploadExcelInput): Observable<UploadExcelResponse['uploadExcelAssessment']> {
        return this.graphqlService
            .execute<UploadExcelResponse>(UPLOAD_EXCEL_MUTATION, { input })
            .pipe(
                map((response) => {
                    if (response.errors?.length) {
                        throw new Error(response.errors[0].message ?? 'Error al subir el archivo.');
                    }
                    if (!response.data?.uploadExcelAssessment) {
                        throw new Error('No se recibió respuesta del servidor.');
                    }
                    return response.data.uploadExcelAssessment;
                })
            );
    }

    getSolicitudes(cct?: string, limit: number = 10, offset: number = 0): Observable<SolicitudEia2[]> {
        return this.graphqlService
            .execute<GetSolicitudesResponse>(GET_SOLICITUDES, { cct, limit, offset })
            .pipe(
                map((response) => {
                    if (response.errors?.length) {
                        throw new Error(response.errors[0].message ?? 'Error al obtener historial.');
                    }
                    return response.data?.getSolicitudes ?? [];
                })
            );
    }

    subirResultados(solicitudId: string, archivos: Array<{ nombre: string; base64: string }>): Observable<UploadResultsResponse['uploadAssessmentResults']> {
        const input = { solicitudId, archivos };
        return this.graphqlService
            .execute<UploadResultsResponse>(UPLOAD_RESULTS_MUTATION, { input })
            .pipe(
                map((response) => {
                    if (response.errors?.length) {
                        throw new Error(response.errors[0].message ?? 'Error al subir resultados.');
                    }
                    if (!response.data?.uploadAssessmentResults) {
                        throw new Error('No se recibió respuesta del servidor.');
                    }
                    return response.data.uploadAssessmentResults;
                })
            );
    }

    descargarResultado(solicitudId: string, fileName: string): Observable<{ success: boolean, fileName: string, contentBase64: string }> {
        return this.graphqlService
            .execute<{ downloadAssessmentResult: { success: boolean, fileName: string, contentBase64: string, message?: string } }>(
                DOWNLOAD_ASSESSMENT_RESULT,
                { solicitudId, fileName }
            )
            .pipe(
                map((response) => {
                    if (response.errors?.length) {
                        throw new Error(response.errors[0].message ?? 'Error al descargar archivo.');
                    }
                    const data = response.data?.downloadAssessmentResult;
                    if (!data || !data.success) {
                        throw new Error(data?.message ?? 'No se pudo descargar el archivo.');
                    }
                    return data;
                })
            );
    }
}
