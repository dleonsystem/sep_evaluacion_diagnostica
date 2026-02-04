import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { GraphqlService } from './graphql.service';
import { UPLOAD_EXCEL_MUTATION } from '../operations/mutation';

export interface UploadExcelInput {
    archivoBase64: string;
    nombreArchivo: string;
    cicloEscolar: string;
}

export interface ExcelUploadResult {
    cct?: string;
    nivel?: string;
    grado?: number;
    alumnosProcesados: number;
    errores?: string[];
}

export interface UploadExcelResponse {
    uploadExcelAssessment: {
        success: boolean;
        message: string;
        solicitudId?: string;
        detalles?: ExcelUploadResult;
    };
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
}
