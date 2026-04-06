import { describe, it, expect } from '@jest/globals';
import * as XLSX from 'xlsx';
import { parseExcelAssessmentBuffer } from '../../src/workers/excel-parser';

describe('parseExcelAssessmentBuffer', () => {
  it('parsea correctamente un archivo preescolar validado en frontend', () => {
    const workbook = XLSX.utils.book_new();

    const escSheet = XLSX.utils.aoa_to_sheet([]);
    escSheet.C6 = { t: 's', v: 'PREESCOLAR' };
    escSheet.D9 = { t: 's', v: '01DJN0001A' };
    escSheet.D11 = { t: 's', v: 'MATUTINO' };
    escSheet.D13 = { t: 's', v: 'ANDRES OSUAN' };
    escSheet.D18 = { t: 's', v: 'pepe.arevalo74@gmail.com' };
    escSheet['!ref'] = 'A1:E20';
    XLSX.utils.book_append_sheet(workbook, escSheet, 'ESC');

    const data = [
      [], [], [], [], [], [], [], [], [], // Filas 1-9 vacías
      ['', 1, 'ADRIANA MANGUEN RODRIGUEZ', 'M', 'A', 1, 2, 3, 3, 2, 1, 2, 3, 1, 2, 3], // Fila 10
      ['', 2, 'BERNARDO RUIZ GONZALEZ', 'H', 'A', 2, 3, 1, 2, 3, 3, 1, 1, 2, 2, 3], // Fila 11
    ];
    const tercero = XLSX.utils.aoa_to_sheet(data);
    tercero['!ref'] = 'A1:P12';
    XLSX.utils.book_append_sheet(workbook, tercero, 'TERCERO');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    const result = parseExcelAssessmentBuffer(buffer);

    expect(result.cct).toBe('01DJN0001A');
    expect(result.nivel).toBe('PREESCOLAR');
    expect(result.grado).toBe(3);
    expect(result.metadata.turno).toBe('MATUTINO');
    expect(result.metadata.nombreEscuela).toBe('ANDRES OSUAN');
    expect(result.alumnos).toHaveLength(2);
    expect(result.alumnos[0]).toMatchObject({
      nombre: 'ADRIANA MANGUEN RODRIGUEZ',
      grupo: 'A',
    });
    expect(result.alumnos[0].evaluaciones).toHaveLength(11);
    expect(result.alumnos[0].curp).toHaveLength(18);
  });

  it('rechaza grupos inválidos aunque el archivo tenga datos', () => {
    const workbook = XLSX.utils.book_new();
    const escSheet = XLSX.utils.aoa_to_sheet([]);
    escSheet.C6 = { t: 's', v: 'PREESCOLAR' };
    escSheet.D9 = { t: 's', v: '01DJN0001A' };
    escSheet.D11 = { t: 's', v: 'MATUTINO' };
    escSheet.D13 = { t: 's', v: 'ANDRES OSUAN' };
    escSheet.D18 = { t: 's', v: 'pepe.arevalo74@gmail.com' };
    escSheet['!ref'] = 'A1:E20';
    XLSX.utils.book_append_sheet(workbook, escSheet, 'ESC');

    const tercero = XLSX.utils.json_to_sheet(
      [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        {
          B: 1,
          C: 'ADRIANA MANGUEN RODRIGUEZ',
          D: 'M',
          E: 'MATUTINO',
          F: 1,
          G: 2,
          H: 3,
          I: 3,
          J: 2,
          K: 1,
          L: 2,
          M: 3,
          N: 1,
          O: 2,
          P: 3,
        },
      ],
      { skipHeader: true }
    );
    tercero['!ref'] = 'A1:P11';
    XLSX.utils.book_append_sheet(workbook, tercero, 'TERCERO');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    const result = parseExcelAssessmentBuffer(buffer);

    expect(result.erroresEstructurados?.some(e => e.error.includes('una sola letra'))).toBe(true);
  });
});
