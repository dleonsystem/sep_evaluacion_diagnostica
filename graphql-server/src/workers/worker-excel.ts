import { parentPort } from 'worker_threads';
import { parseExcelAssessmentBuffer } from './excel-parser.js';

/**
 * Worker para procesar archivos Excel de evaluación diagnóstica
 * Evita bloquear el Event Loop principal durante el parsing de archivos grandes
 */

interface WorkerInput {
  archivoBase64: string;
  nombreArchivo: string;
}

if (parentPort) {
  parentPort.on('message', (message: WorkerInput) => {
    try {
      const buffer = Buffer.from(message.archivoBase64, 'base64');
      const data = parseExcelAssessmentBuffer(buffer);
      parentPort?.postMessage({ success: true, data });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error crítico en procesamiento';
      parentPort?.postMessage({
        success: false,
        error: errorMessage,
      });
    }
  });
}
