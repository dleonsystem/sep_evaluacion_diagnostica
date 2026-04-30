import { jest, describe, it, expect, beforeEach } from '@jest/globals';
// @ts-nocheck

jest.mock('../../src/config/database', () => ({
  query: jest.fn() as any,
  getClient: jest.fn() as any,
}));

jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn() as any,
    warn: jest.fn() as any,
    debug: jest.fn() as any,
    error: jest.fn() as any,
  },
}));

import { resolvers } from '../../src/schema/resolvers';
import { query } from '../../src/config/database';

describe('Resolvers GraphQL - getSolicitudes con Fechas', () => {
  const queryMock = query as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe incluir filtros de fecha en el SQL si se proporcionan', async () => {
    queryMock.mockImplementation((sql: any, _params: any) => {
      if (sql.includes('cat_estado_validacion_eia2')) {
        return Promise.resolve({ rows: [{ id: 1, codigo: 'VALIDO' }] });
      }
      return Promise.resolve({ rows: [] });
    });

    const context: any = {
      user: { id: 'u1', rol: 'COORDINADOR_FEDERAL', email: 'admin@sep.gob.mx' },
      loaders: {}
    };

    const args = {
      fechaInicio: '2024-04-01',
      fechaFin: '2024-04-30'
    };

    await (resolvers.Query as any).getSolicitudes(null, args, context);

    // Verificar que el SQL contenga los filtros de fecha
    const lastQueryCall = queryMock.mock.calls.find((call: any) => call[0].includes('SELECT') && call[0].includes('solicitudes_eia2'));
    const sql = lastQueryCall[0];
    const params = lastQueryCall[1];

    expect(sql).toContain('s.fecha_carga >=');
    expect(sql).toContain('s.fecha_carga <=');
    expect(params).toContain('2024-04-01');
    expect(params).toContain('2024-04-30 23:59:59');
  });
});
