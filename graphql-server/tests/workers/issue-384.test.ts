import { describe, it, expect } from '@jest/globals';
import * as XLSX from 'xlsx';
import { parseExcelAssessmentBuffer } from '../../src/workers/excel-parser';

describe('Issue #384: Carga de alumnos con valoraciones parciales', () => {
  const createBaseWorkbook = () => {
    const workbook = XLSX.utils.book_new();
    const escSheet = XLSX.utils.aoa_to_sheet([]);
    escSheet.C6 = { t: 's', v: 'PREESCOLAR' };
    escSheet.D9 = { t: 's', v: '01DJN0001A' };
    escSheet.D11 = { t: 's', v: 'MATUTINO' };
    escSheet.D13 = { t: 's', v: 'ESCUELA PRUEBA' };
    escSheet.D18 = { t: 's', v: 'test@example.com' };
    escSheet['!ref'] = 'A1:E20';
    XLSX.utils.book_append_sheet(workbook, escSheet, 'ESC');
    return workbook;
  };

  it('debe saltar alumnos sin valoraciones sin marcar error (incluso si tienen metadatos)', () => {
    const workbook = createBaseWorkbook();
    const data = [
      [], [], [], [], [], [], [], [], [], // Filas 1-9
      ['', 1, 'ALUMNO COMPLETO', 'H', 'A', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Fila 10: OK
      ['', 2, 'VAZQUEZ REYES MIGUEL ANGEL', 'H', 'B', '', '', '', '', '', '', '', '', '', '', ''], // Fila 11: Metadatos presentes, evaluaciones vacías
    ];
    const sheet = XLSX.utils.aoa_to_sheet(data);
    sheet['!ref'] = 'A1:P11';
    XLSX.utils.book_append_sheet(workbook, sheet, 'TERCERO');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    const result = parseExcelAssessmentBuffer(buffer);

    expect(result.erroresEstructurados?.filter(e => e.hoja === 'TERCERO')).toHaveLength(0);
    expect(result.alumnos).toHaveLength(1); // Solo ALUMNO COMPLETO
    expect(result.alumnos[0].nombre).toBe('ALUMNO COMPLETO');
  });

  it('debe rechazar alumnos con valoraciones parciales (algunas sí, otras no)', () => {
    const workbook = createBaseWorkbook();
    const data = [
      [], [], [], [], [], [], [], [], [], // Filas 1-9
      ['', 1, 'ALUMNO PARCIAL', 'H', 'A', 1, '', 1, '', 1, '', 1, '', 1, '', 1], // Fila 10: Parcial
    ];
    const sheet = XLSX.utils.aoa_to_sheet(data);
    sheet['!ref'] = 'A1:P10';
    XLSX.utils.book_append_sheet(workbook, sheet, 'TERCERO');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    const result = parseExcelAssessmentBuffer(buffer);

    const erroresEvaluacion = result.erroresEstructurados?.filter(e => e.error === 'Falta la valoración.');
    expect(erroresEvaluacion).not.toHaveLength(0);
    expect(erroresEvaluacion?.length).toBeGreaterThan(0);
    expect(result.alumnos).toHaveLength(0); // No se agrega si hay errores
  });
});
