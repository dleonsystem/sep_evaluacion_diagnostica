// @ts-nocheck
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('../../src/config/database', () => ({
  query: jest.fn() as any,
  getClient: jest.fn() as any,
}));

jest.mock('../../src/services/sftp.service', () => ({
  SftpService: jest.fn().mockImplementation(() => ({
    ensureDir: jest.fn() as any,
    uploadBuffer: jest.fn() as any,
    connect: jest.fn() as any,
  })),
}));

jest.mock('../../src/services/mailing.service', () => ({
  MailingService: jest.fn().mockImplementation(() => ({
    sendCredentials: jest.fn() as any,
    sendPasswordRecovery: jest.fn() as any,
    sendAdminPasswordReset: jest.fn() as any,
  })),
}));

jest.mock('../../src/services/report-consolidator.service', () => ({
  ReportConsolidatorService: jest.fn().mockImplementation(() => ({
    simulateProcessing: jest.fn() as any,
  })),
}));

jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn() as any,
    warn: jest.fn() as any,
    error: jest.fn() as any,
    debug: jest.fn() as any,
  },
}));

import resolvers from '../../src/schema/resolvers';
import { query } from '../../src/config/database';
import { verifyToken } from '../../src/config/jwt';
import * as crypto from 'crypto';

describe('authenticateUser Resolver Tests', () => {
  const queryMock = query as any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(crypto, 'timingSafeEqual').mockImplementation(() => true);
  });

  describe('JWT Integrity', () => {
    it('verifyToken debería retornar null para un token forjado o mal formado', () => {
      const forgedToken = 'header.payload.signature_fake';
      const decoded = verifyToken(forgedToken);
      expect(decoded).toBeNull();
    });

    it('verifyToken debería retornar null para un payload b64 simple sin firma real', () => {
      const fakeToken = btoa(JSON.stringify({ id: 1, rol: 'ADMIN' }));
      const decoded = verifyToken(fakeToken);
      expect(decoded).toBeNull();
    });
  });

  describe('Account Lockout (RN-18) & Auth Success', () => {
    it('debería retornar un token JWT con formato válido para login exitoso', async () => {
      const mockUser = {
        id: 'u-1',
        email: 'test@example.com',
        password_hash: 'salt:hash',
        rol: 'COORDINADOR_FEDERAL',
        activo: true,
        intentosFallidos: 0,
        bloqueadoHasta: null
      };

      queryMock.mockResolvedValueOnce({ rows: [mockUser] }); // Buscar
      queryMock.mockResolvedValueOnce({ rows: [] });      // Update success

      jest.spyOn(crypto, 'timingSafeEqual').mockReturnValue(true);
      jest.spyOn(crypto, 'scryptSync').mockReturnValue(Buffer.from('hash', 'hex'));

      const result = await (resolvers.Mutation as any).authenticateUser(
        null, 
        { input: { email: 'test@example.com', password: 'correct' } }, 
        { req: { headers: {} } }
      );

      expect(result.ok).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.token).toMatch(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*$/);
    });

    it('debería bloquear la cuenta después de 5 intentos fallidos', async () => {
      const mockUser = {
        id: 'u-1',
        email: 'attacker@example.com',
        password_hash: 'salt:hash',
        rol: 'CONSULTA',
        activo: true,
        intentosFallidos: 4,
        bloqueadoHasta: null
      };

      queryMock.mockImplementationOnce(() => Promise.resolve({ rows: [mockUser] })); // Buscar
      queryMock.mockImplementationOnce(() => Promise.resolve({ rows: [] }));      // Update lockout

      jest.spyOn(crypto, 'timingSafeEqual').mockReturnValue(false);

      const result = await (resolvers.Mutation as any).authenticateUser(
        null, 
        { input: { email: 'attacker@example.com', password: 'wrong' } }, 
        { req: { headers: {} } }
      );

      expect(result.ok).toBe(false);
      expect(result.message).toContain('bloqueada');
      
      const lastUpdateCall = queryMock.mock.calls.find(call => 
        call[0].includes('UPDATE usuarios') && call[0].includes('bloqueado_hasta')
      );
      expect(lastUpdateCall).toBeDefined();
      expect(lastUpdateCall[1][0]).toBe(5);
    });

    it('debería rechazar login si la cuenta ya está bloqueada', async () => {
      const lockDate = new Date();
      lockDate.setHours(lockDate.getHours() + 1);

      const mockUser = {
        id: 'u-1',
        email: 'locked@example.com',
        bloqueadoHasta: lockDate.toISOString(),
        activo: true,
        intentosFallidos: 5
      };

      queryMock.mockImplementationOnce(() => Promise.resolve({ rows: [mockUser] }));

      const result = await (resolvers.Mutation as any).authenticateUser(
        null, 
        { input: { email: 'locked@example.com', password: 'any' } }, 
        { req: { headers: {} } }
      );

      expect(result.ok).toBe(false);
      expect(result.message).toContain('bloqueada');
    });
  });
});
