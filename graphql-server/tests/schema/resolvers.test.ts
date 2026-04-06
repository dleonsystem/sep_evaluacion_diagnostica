import { jest, describe, it, expect, beforeEach } from '@jest/globals';
// @ts-nocheck
// Pattern matching tests/schema/generateComprobante.test.ts
jest.mock('../../src/config/database', () => ({
  query: jest.fn() as any,
  getClient: jest.fn() as any,
}));

jest.mock('../../src/services/sftp.service', () => ({
  SftpService: jest.fn().mockImplementation(() => ({
    ensureDir: (jest.fn() as any).mockResolvedValue(true),
    uploadBuffer: (jest.fn() as any).mockResolvedValue(true),
    connect: (jest.fn() as any).mockResolvedValue(true),
  })),
}));

jest.mock('../../src/services/mailing.service', () => ({
  MailingService: jest.fn().mockImplementation(() => ({
    sendCredentials: (jest.fn() as any).mockResolvedValue(true),
    sendPasswordRecovery: (jest.fn() as any).mockResolvedValue(true),
    sendAdminPasswordReset: (jest.fn() as any).mockResolvedValue(true),
  })),
}));

jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn() as any,
    warn: jest.fn() as any,
    debug: jest.fn() as any,
    error: jest.fn() as any,
  },
}));

import resolvers from '../../src/schema/resolvers';
import { query, getClient } from '../../src/config/database';

describe('Resolvers GraphQL - Coverage #272', () => {
  const queryMock = query as any;
  const getClientMock = getClient as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.getMyTickets', () => {
    it('retorna vacio sin datos', async () => {
      const result = await (resolvers.Query as any).getMyTickets(null, { correo: null }, { user: null, loaders: {} });
      expect(result).toEqual([]);
    });

    it('busca por correo', async () => {
      queryMock.mockResolvedValueOnce({ rows: [{ id: 'u1', email: 'test@test.com' }] })
               .mockResolvedValueOnce({ rows: [{ id: 't1', numeroTicket: 'T1' }] });
      const result = await (resolvers.Query as any).getMyTickets(null, { correo: 'test@test.com' }, { user: null, loaders: {} });
      expect(result[0].numeroTicket).toBe('T1');
    });
  });

  describe('Mutation.authenticateUser', () => {
    it('autentica con éxito', async () => {
      // Mock de crypto.scryptSync indirectamente o usar password plano si el resolver lo permite (no lo permite)
      // Pero podemos mockear el comportamiento de crypto.timingSafeEqual si es necesario
      const mockUser = {
        id: 'u1',
        email: 'admin@sep.gob.mx',
        password_hash: 'salt:hash', // No importa el hash real si mockeamos la comparación
        rol: 'ADMIN',
        activo: true,
        intentosFallidos: 0,
        bloqueadoHasta: null
      };

      queryMock.mockResolvedValueOnce({ rows: [mockUser] });
      queryMock.mockResolvedValue({ rows: [] });

      // Mock de crypto
      const crypto = await import('crypto');
      jest.spyOn(crypto.default || crypto, 'timingSafeEqual').mockReturnValue(true as any);

      const result = await (resolvers.Mutation as any).authenticateUser(null, { input: { email: 'admin@sep.gob.mx', password: 'p' } }, { req: { headers: {} } });
      expect(result.ok).toBe(true);
    });
  });

  describe('Mutation.createTicket', () => {
    it('crea ticket', async () => {
      const mockClient = {
        query: (jest.fn() as any)
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce({ rows: [{ id: 'u1' }] })
          .mockResolvedValueOnce({ rows: [{ seq: 1 }] })
          .mockResolvedValueOnce({ rows: [{ id: 't1', numeroTicket: 'T1' }] })
          .mockResolvedValueOnce({ rows: [] }),
        release: jest.fn() as any
      };
      getClientMock.mockResolvedValue(mockClient as any);
      const result = await (resolvers.Mutation as any).createTicket(null, { input: { motivo: 'M', descripcion: 'D', correo: 'test@test.com' } }, { user: null, loaders: {} });
      expect(result.numeroTicket).toBe('T1');
    });
  });
});
