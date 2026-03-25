import { comprobantePdfService } from '../../src/services/comprobante-pdf.service';

describe('ComprobantePdfService', () => {
  it('genera un PDF valido en base64 con header %PDF', async () => {
    const base64 = await comprobantePdfService.generarBase64({
      consecutivo: '12345',
      fechaCarga: new Date('2026-03-24T10:15:00Z'),
      archivoOriginal: 'carga_eia.xlsx',
      hashArchivo: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      cct: '09ABC1234X',
      email: 'director@escuela.edu.mx',
    });

    const buffer = Buffer.from(base64, 'base64');

    expect(buffer.subarray(0, 4).toString('utf-8')).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(1000);
  });
});
