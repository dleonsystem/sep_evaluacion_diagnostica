import { jest, describe, it, expect, beforeEach } from '@jest/globals';

process.env.JWT_SECRET = 'test-secret';

jest.mock('crypto', () => {
  const actual = jest.requireActual('crypto') as any;
  return {
    ...actual,
    timingSafeEqual: jest.fn().mockReturnValue(true),
    scryptSync: jest.fn(),
  };
});

jest.mock('../../src/config/database', () => ({
  query: jest.fn<(text: string, params?: any[]) => Promise<{ rows: any[] }>>(),
  getClient: jest.fn<() => Promise<any>>(),
}));

jest.mock('../../src/services/sftp.service', () => ({
  SftpService: jest.fn().mockImplementation(() => ({
    ensureDir: jest.fn<(path: string) => Promise<boolean>>(),
    uploadBuffer: jest.fn<(buf: Buffer, path: string) => Promise<boolean>>(),
    connect: jest.fn<() => Promise<boolean>>(),
  })),
}));

jest.mock('../../src/services/mailing.service', () => ({
  MailingService: jest.fn().mockImplementation(() => ({
    sendCredentials: jest.fn<(email: string, cct: string, pass: string) => Promise<boolean>>(),
    sendPasswordRecovery: jest.fn<(email: string, pass: string) => Promise<boolean>>(),
    sendAdminPasswordReset: jest.fn<(email: string, pass: string) => Promise<boolean>>(),
  })),
}));

jest.mock('../../src/services/report-consolidator.service', () => ({
  ReportConsolidatorService: jest.fn().mockImplementation(() => ({
    simulateProcessing: jest.fn<(id: string) => Promise<boolean>>(),
  })),
}));

jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn<(msg: string) => void>(),
    warn: jest.fn<(msg: string) => void>(),
    error: jest.fn<(msg: string, err?: any) => void>(),
    debug: jest.fn<(msg: string) => void>(),
  },
}));

import resolvers from '../../src/schema/resolvers';
import { query } from '../../src/config/database';
import { verifyToken } from '../../src/config/jwt';
import * as crypto from 'crypto';

describe('authenticateUser Resolver Tests', () => {
  const queryMock = query as unknown as jest.Mock<(text: string, params?: any[]) => Promise<{ rows: any[] }>>;
  
  beforeEach(() => {
    jest.clearAllMocks();
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

      (crypto.scryptSync as unknown as jest.Mock).mockReturnValue(Buffer.from('hash', 'hex'));

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

      (crypto.timingSafeEqual as unknown as jest.Mock).mockReturnValue(false);

      const result = await (resolvers.Mutation as any).authenticateUser(
        null, 
        { input: { email: 'attacker@example.com', password: 'wrong' } }, 
        { req: { headers: {} } }
      );

      expect(result.ok).toBe(false);
      expect(result.message).toContain('bloqueada');
      
      const lastUpdateCall = queryMock.mock.calls.find(call => 
        (call[0] as string).includes('UPDATE usuarios') && (call[0] as string).includes('bloqueado_hasta')
      );
      expect(lastUpdateCall).toBeDefined();
      if (lastUpdateCall) {
        expect((lastUpdateCall[1] as any[])[0]).toBe(5);
      }
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
