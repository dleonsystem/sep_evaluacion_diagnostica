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
import * as crypto from 'crypto';

describe('Resolvers GraphQL - Coverage #272', () => {
  const queryMock = query as any;
  const getClientMock = getClient as any;
  const buildPasswordHash = (password: string, salt = 'fixed-salt-for-tests') => {
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret-jwt';
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
        password_hash: buildPasswordHash('p'),
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
