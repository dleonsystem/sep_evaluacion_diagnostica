import { jest, describe, it, expect, beforeEach } from '@jest/globals';
// @ts-nocheck
// Pattern matching tests/schema/generateComprobante.test.ts
jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
}));

jest.mock('../../src/services/sftp.service', () => ({
  SftpService: jest.fn().mockImplementation(() => ({
    ensureDir: jest.fn().mockResolvedValue(true),
    uploadBuffer: jest.fn().mockResolvedValue(true),
    connect: jest.fn().mockResolvedValue(true),
  })),
}));

jest.mock('../../src/services/mailing.service', () => ({
  MailingService: jest.fn().mockImplementation(() => ({
    sendCredentials: jest.fn().mockResolvedValue(true),
    sendPasswordRecovery: jest.fn().mockResolvedValue(true),
    sendAdminPasswordReset: jest.fn().mockResolvedValue(true),
  })),
}));

jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
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
        intentosFallidos: 0
      };

      queryMock.mockResolvedValueOnce({ rows: [mockUser] });
      queryMock.mockResolvedValue({ rows: [] });

      // Mock de crypto
      const crypto = require('crypto');
      jest.spyOn(crypto, 'timingSafeEqual').mockReturnValue(true);

      const result = await (resolvers.Mutation as any).authenticateUser(null, { input: { email: 'admin@sep.gob.mx', password: 'p' } }, { req: { headers: {} } });
      expect(result.ok).toBe(true);
    });
  });

  describe('Mutation.createTicket', () => {
    it('crea ticket', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce({ rows: [{ id: 'u1' }] })
          .mockResolvedValueOnce({ rows: [{ seq: 1 }] })
          .mockResolvedValueOnce({ rows: [{ id: 't1', numeroTicket: 'T1' }] })
          .mockResolvedValueOnce({ rows: [] }),
        release: jest.fn()
      };
      getClientMock.mockResolvedValue(mockClient);
      const result = await (resolvers.Mutation as any).createTicket(null, { input: { motivo: 'M', descripcion: 'D' } }, { user: null, loaders: {} });
      expect(result.id).toBe('t1');
    });
  });
});
