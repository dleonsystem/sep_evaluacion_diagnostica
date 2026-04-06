import { jest, describe, it, expect, beforeEach } from '@jest/globals';
// @ts-nocheck

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
import * as crypto from 'crypto';

describe('Resolvers GraphQL - Coverage #272', () => {
  const queryMock = query as jest.Mock;
  const getClientMock = getClient as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(crypto, 'timingSafeEqual').mockImplementation(() => true);
  });

  describe('Query.getMyTickets', () => {
    it('retorna vacio sin datos', async () => {
      const result = await (resolvers.Query as any).getMyTickets(null, { correo: null }, { user: null, loaders: {} });
      expect(result).toEqual([]);
    });

    it('busca por correo', async () => {
      queryMock.mockImplementationOnce(() => Promise.resolve({ rows: [{ id: 'u1', email: 'test@test.com' }] }))
               .mockImplementationOnce(() => Promise.resolve({ rows: [{ id: 't1', numeroTicket: 'T1' }] }));
      const result = await (resolvers.Query as any).getMyTickets(null, { correo: 'test@test.com' }, { user: null, loaders: {} });
      expect(result[0].numeroTicket).toBe('T1');
    });
  });

  describe('Mutation.authenticateUser', () => {
    it('autentica con éxito', async () => {
      const mockUser = {
        id: 'u1',
        email: 'admin@sep.gob.mx',
        password_hash: 'salt:hash',
        rol: 'ADMIN',
        activo: true,
        intentosFallidos: 0,
        bloqueadoHasta: null
      };

      queryMock.mockImplementationOnce(() => Promise.resolve({ rows: [mockUser] }));
      queryMock.mockImplementation(() => Promise.resolve({ rows: [] }));

      const result = await (resolvers.Mutation as any).authenticateUser(null, { input: { email: 'admin@sep.gob.mx', password: 'p' } }, { req: { headers: {} } });
      expect(result.ok).toBe(true);
    });
  });

  describe('Mutation.createTicket', () => {
    it('crea ticket', async () => {
      const mockClient = {
        query: (jest.fn() as any)
          .mockImplementationOnce(() => Promise.resolve({ rows: [] }))
          .mockImplementationOnce(() => Promise.resolve({ rows: [{ id: 'u1' }] }))
          .mockImplementationOnce(() => Promise.resolve({ rows: [{ seq: 1 }] }))
          .mockImplementationOnce(() => Promise.resolve({ rows: [{ id: 't1', numeroTicket: 'T1' }] }))
          .mockImplementationOnce(() => Promise.resolve({ rows: [] })),
        release: jest.fn() as any
      };
      getClientMock.mockImplementation(() => Promise.resolve(mockClient as any));
      const result = await (resolvers.Mutation as any).createTicket(null, { input: { motivo: 'M', descripcion: 'D', correo: 'test@test.com' } }, { user: null, loaders: {} });
      expect(result.numeroTicket).toBe('T1');
    });
  });
});
