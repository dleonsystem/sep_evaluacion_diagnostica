import { parentPort } from 'worker_threads';
import * as XLSX from 'xlsx';

/**
 * Worker para procesar archivos Excel de evaluación diagnóstica
 * Evita bloquear el Event Loop principal durante el parsing de archivos grandes
 */

interface WorkerInput {
    archivoBase64: string;
    nombreArchivo: string;
}

interface ParsedStudent {
    curp: string;
    nombre: string;
    grupo: string;
    evaluaciones: { materiaIndex: number; valor: number }[];
}


if (parentPort) {
    parentPort.on('message', (message: WorkerInput) => {
        const errors: string[] = [];
        try {
            const { archivoBase64 } = message;
            const buffer = Buffer.from(archivoBase64, 'base64');
            const workbook = XLSX.read(buffer, { type: 'buffer' });

            // 1. Estructura base (Hojas requeridas)
            if (!workbook.SheetNames.includes('ESC')) {
                errors.push('No se encontró la hoja obligatoria "ESC".');
            }

            // 2. Extraer y validar CCT e Identificadores en Hoja ESC
            const sheetEsc = workbook.Sheets['ESC'];
            const dataEsc: any[][] = XLSX.utils.sheet_to_json(sheetEsc, { header: 1 });
            
            let cct = '';
            let nivel = '';
            
            if (sheetEsc) {
                // Validación de etiquetas de cabecera (Punto 6: Consistencia de cabeceras)
                const cctLabel = (dataEsc[8] && dataEsc[8][1]) ? dataEsc[8][1].toString().trim() : '';
                if (!cctLabel.includes('CCT')) {
                    errors.push('La estructura de la hoja ESC es inválida (falta etiqueta CCT en B9).');
                }

                // Extracción de CCT (Punto 2)
                cct = (dataEsc[8] && dataEsc[8][3]) ? dataEsc[8][3].toString().trim() : '';
                if (!cct) {
                    errors.push('La CCT no está capturada en la celda D9 de la hoja ESC.');
                } else if (!/^[0-9]{2}[A-Z]{3}[0-9]{4}[A-Z]$/.test(cct)) {
                    errors.push(`La CCT "${cct}" tiene un formato inválido.`);
                }

                // Extracción de Nivel (Punto 3)
                nivel = (dataEsc[5] && dataEsc[5][2]) ? dataEsc[5][2].toString().toUpperCase() : '';
            }

            // Fallback de detección de nivel si no está en ESC
            const sheetsNormalized = workbook.SheetNames.map(n => n.toUpperCase());
            if (!nivel) {
                if (sheetsNormalized.includes('PREESCOLAR')) nivel = 'PREESCOLAR';
                else if (sheetsNormalized.includes('SEXTO')) nivel = 'PRIMARIA';
                else if (sheetsNormalized.includes('SECUNDARIA')) nivel = 'SECUNDARIA';
            }

            if (!nivel) {
                errors.push('No se pudo identificar el nivel educativo del archivo.');
            }

            // 3. Identificar Hoja de Datos y Grado
            const validGrades = ['PRIMERO', 'SEGUNDO', 'TERCERO', 'CUARTO', 'QUINTO', 'SEXTO', 'PREESCOLAR', 'SECUNDARIA'];
            const dataSheetName = workbook.SheetNames.find(n => 
                validGrades.some(g => n.toUpperCase().includes(g))
            );

            if (!dataSheetName) {
                errors.push('No se encontró la hoja de captura de evaluaciones (ej. PRIMERO, SEGUNDO, etc.).');
            }

            if (errors.length > 0) {
                parentPort?.postMessage({ success: false, error: errors.join(' | ') });
                return;
            }

            const sheetData = workbook.Sheets[dataSheetName!];
            const dataAlumnos: any[][] = XLSX.utils.sheet_to_json(sheetData, { header: 1 });

            // Detectar grado
            const gradoMap: Record<string, number> = {
                PRIMERO: 1, SEGUNDO: 2, TERCERO: 3, CUARTO: 4, QUINTO: 5, SEXTO: 6,
                '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6
            };
            const gradeText = dataSheetName!.toUpperCase();
            const foundGradeKey = Object.keys(gradoMap).find(k => gradeText.includes(k));
            const baseGrado = foundGradeKey ? gradoMap[foundGradeKey] : 1;

            // 4. Procesar Alumnos y Validaciones de Rango/Campos (Puntos 4 y 5)
            const alumnos: ParsedStudent[] = [];
            const studentRows = dataAlumnos.slice(1); // Omitir cabecera

            studentRows.forEach((row, index) => {
                if (!row || row.length < 2) return;
                
                const curp = (row[1] || '').toString().trim();
                const nombre = (row[2] || '').toString().trim();
                const grupo = (row[3] || 'A').toString().trim();

                // Si tiene CURP o Nombre, debe tener ambos
                if (curp || nombre) {
                    if (!curp) errors.push(`Fila ${index + 2}: Falta CURP del estudiante.`);
                    if (!nombre) errors.push(`Fila ${index + 2}: Falta nombre del estudiante.`);
                    
                    const evaluations: { materiaIndex: number; valor: number }[] = [];
                    // Validar rangos 0-3 (Punto 4)
                    for (let col = 6; col < Math.min(row.length, 10); col++) {
                        const val = row[col];
                        if (val !== undefined && val !== null && val !== '') {
                            const nVal = parseInt(val.toString());
                            if (isNaN(nVal) || nVal < 0 || nVal > 3) {
                                errors.push(`Fila ${index + 2}, Col ${(col + 1)}: Valor "${val}" fuera de rango (0-3).`);
                            } else {
                                evaluations.push({ materiaIndex: col - 6, valor: nVal });
                            }
                        }
                    }

                    if (curp && nombre) {
                        alumnos.push({ curp, nombre, grupo, evaluaciones: evaluations });
                    }
                }
            });

            if (alumnos.length === 0) {
                errors.push('No se encontraron registros de estudiantes con evaluaciones válidas.');
            }

            if (errors.length > 0) {
                parentPort?.postMessage({ success: false, error: errors.join(' | ') });
                return;
            }

            // Éxito
            parentPort?.postMessage({
                success: true,
                data: {
                    cct, nivel, grado: baseGrado, alumnos,
                    metadata: { nivelDetectado: nivel, gradoDetectado: gradeText }
                }
            });

        } catch (error: any) {
            parentPort?.postMessage({
                success: false,
                error: `Error crítico en procesamiento: ${error.message}`
            });
        }
    });
}
