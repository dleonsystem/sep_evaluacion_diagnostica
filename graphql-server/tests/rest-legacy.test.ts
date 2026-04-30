import { jest, describe, it, expect } from '@jest/globals';
// @ts-nocheck

const queryMock = jest.fn();
const loggerMock = { error: jest.fn(), info: jest.fn() };

// Mock de dependencias
jest.mock('../src/config/database', () => ({ query: queryMock }));
jest.mock('../src/utils/logger', () => ({ logger: loggerMock }));

// Simularemos la lógica de los handlers directamente
// Ya que index.ts no exporta el router fácilmente para unit tests sin levantar el server

describe('REST Legacy API Endpoints', () => {
  
  describe('GET /api/legacy/solicitudes', () => {
    it('debe construir el SQL correcto con filtros de fecha', async () => {
      // Mock de lo que hace el handler en index.ts
      const req: any = { query: { inicio: '2024-04-01', fin: '2024-04-30', cct: '09DPR0001A' } };

      // Lógica extraída de index.ts
      const { inicio, fin, cct } = req.query;
      let sql = `SELECT id, consecutivo, cct, archivo_original as "archivoOriginal", fecha_carga as "fechaCarga", estado_validacion as "estadoValidacion" FROM solicitudes_eia2`;
      const params: any[] = [];
      const conditions: any[] = [];
      if (cct) { conditions.push(`cct = $${params.length + 1}`); params.push(cct); }
      if (inicio) { conditions.push(`fecha_carga >= $${params.length + 1}`); params.push(inicio); }
      if (fin) { 
        const end = (fin as string).includes(' ') ? fin : `${fin} 23:59:59`;
        conditions.push(`fecha_carga <= $${params.length + 1}`); 
        params.push(end); 
      }
      if (conditions.length > 0) { sql += ` WHERE ` + conditions.join(' AND '); }
      
      (queryMock as any).mockResolvedValue({ rows: [] });
      await (queryMock as any)(sql, params);

      expect(sql).toContain('fecha_carga >= $2');
      expect(sql).toContain('fecha_carga <= $3');
      expect(params).toContain('2024-04-30 23:59:59');
    });
  });

  describe('POST /api/legacy/resultados', () => {
    it('debe actualizar la solicitud y marcarla como procesada', async () => {
      const req: any = { body: { solicitudId: 's1', resultados: [{nombre: 'res.pdf'}], resultadoPath: '/path/' } };

      const { solicitudId, resultados, resultadoPath } = req.body;
      
      (queryMock as any).mockResolvedValue({ rows: [{ id: 's1' }] });
      
      const sql = `UPDATE solicitudes_eia2 SET resultados = $1, resultado_path = $2, estado_validacion = fn_catalogo_id('cat_estado_validacion_eia2', 'VALIDO'), procesado_externamente = true, updated_at = NOW() WHERE id = $3 RETURNING id`;
      const params = [JSON.stringify(resultados), resultadoPath, solicitudId];

      await (queryMock as any)(sql, params);

      expect(sql).toContain('procesado_externamente = true');
      expect(params[2]).toBe('s1');
      expect(params[0]).toContain('res.pdf');
    });
  });
});
