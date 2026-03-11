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

interface WorkerOutput {
    success: boolean;
    data?: {
        cct: string;
        nivel: string;
        grado: number;
        alumnos: ParsedStudent[];
        metadata: {
            nivelDetectado: string;
            gradoDetectado: string;
        };
    };
    error?: string;
}

if (parentPort) {
    parentPort.on('message', (message: WorkerInput) => {
        try {
            const { archivoBase64 } = message;

            // Decodificar buffer
            const buffer = Buffer.from(archivoBase64, 'base64');

            // Parsear Excel
            const workbook = XLSX.read(buffer, { type: 'buffer' });

            // 1. Extraer CCT (Hoja ESC)
            const sheetEsc = workbook.Sheets['ESC'] || workbook.Sheets[workbook.SheetNames[0]];
            const dataEsc: any[][] = XLSX.utils.sheet_to_json(sheetEsc, { header: 1 });

            let cct = '';
            for (const row of dataEsc) {
                if (row && typeof row[1] === 'string' && row[1].includes('CCT')) {
                    cct = (row[2] || '').toString().trim();
                }
            }
            if (!cct && dataEsc[8]) cct = (dataEsc[8][3] || '').toString().trim();

            // 2. Extraer Nivel
            let nivel = '';
            if (dataEsc[5] && dataEsc[5][2]) {
                nivel = dataEsc[5][2].toString().toUpperCase();
            }

            // 2b. Fallback: Detectar por nombres de hojas si no está en ESC
            if (!nivel) {
                const sheets = workbook.SheetNames.map(n => n.toUpperCase());
                if (sheets.includes('PREESCOLAR')) nivel = 'PREESCOLAR';
                else if (sheets.includes('SEXTO') || sheets.includes('CUARTO')) nivel = 'PRIMARIA';
                else if (sheets.some(n => n.includes('SECUNDARIA'))) nivel = 'SECUNDARIA';
            }

            // 2c. Fallback: Detectar por nombre de archivo
            if (!nivel) {
                const name = message.nombreArchivo.toUpperCase();
                if (name.includes('PREESCOLAR')) nivel = 'PREESCOLAR';
                else if (name.includes('PRIMARIA')) nivel = 'PRIMARIA';
                else if (name.includes('SECUNDARIA')) nivel = 'SECUNDARIA';
            }

            // 3. Identificar Hoja de Datos y Grado
            const dataSheetName =
                workbook.SheetNames.find((n: string) =>
                    [
                        'PRIMERO',
                        'SEGUNDO',
                        'TERCERO',
                        'CUARTO',
                        'QUINTO',
                        'SEXTO',
                        'PREESCOLAR',
                        'SECUNDARIA',
                    ].some((prefix) => n.toUpperCase().includes(prefix))
                ) || workbook.SheetNames[1];

            const sheetData = workbook.Sheets[dataSheetName];
            const dataAlumnos: any[][] = XLSX.utils.sheet_to_json(sheetData, { header: 1 });

            // Detectar grado
            const gradoFromSheet = dataSheetName.toUpperCase();
            const gradoMap: Record<string, number> = {
                PRIMERO: 1,
                SEGUNDO: 2,
                TERCERO: 3,
                CUARTO: 4,
                QUINTO: 5,
                SEXTO: 6,
                '1': 1,
                '2': 2,
                '3': 3,
                '4': 4,
                '5': 5,
                '6': 6,
            };

            // Mapeo inverso de nivel para baseGrado
            // Nota: La lógica original usaba nivelId para calcular idGrado, aquí devolvemos el grado base (1-6)
            const baseGrado = Object.keys(gradoMap).find((k) => gradoFromSheet.includes(k))
                ? gradoMap[Object.keys(gradoMap).find((k) => gradoFromSheet.includes(k))!]
                : 1;

            // 4. Procesar Alumnos
            const alumnos: ParsedStudent[] = [];
            const studentRows = dataAlumnos.slice(1);

            for (const row of studentRows) {
                if (!row || row.length < 5 || !row[1]) continue;

                const curp = (row[1] || '').toString().trim();
                const nombreCompleto = (row[2] || '').toString().trim();
                const grupoNombre = (row[3] || 'A').toString().trim();

                if (!curp || !nombreCompleto) continue;

                const studentEvaluaciones: { materiaIndex: number; valor: number }[] = [];

                // Leer columnas de evaluaciones (columna 6 en adelante)
                // Limitamos a 4 materias como en el original (aunque el original limitaba a 10 cols, y usaba materiasIds que tenia LIMIT 4)
                for (let col = 6; col < Math.min(row.length, 10); col++) {
                    const valor = row[col];
                    if (valor !== undefined && valor !== null && valor !== '') {
                        const valorNum = parseInt(valor.toString());
                        if (!isNaN(valorNum) && valorNum >= 0 && valorNum <= 3) {
                            studentEvaluaciones.push({
                                materiaIndex: col - 6, // Índice relativo a las materias
                                valor: valorNum,
                            });
                        }
                    }
                }

                alumnos.push({
                    curp,
                    nombre: nombreCompleto,
                    grupo: grupoNombre,
                    evaluaciones: studentEvaluaciones,
                });
            }

            const output: WorkerOutput = {
                success: true,
                data: {
                    cct,
                    nivel,
                    grado: baseGrado,
                    alumnos,
                    metadata: {
                        nivelDetectado: nivel,
                        gradoDetectado: gradoFromSheet,
                    },
                },
            };

            if (parentPort) parentPort.postMessage(output);
        } catch (error: any) {
            if (parentPort) {
                parentPort.postMessage({
                    success: false,
                    error: error.message || 'Error desconocido en worker',
                });
            }
        }
    });
}
