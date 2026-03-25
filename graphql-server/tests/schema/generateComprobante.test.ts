jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../src/services/sftp.service', () => ({
  SftpService: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../src/services/mailing.service', () => ({
  MailingService: jest.fn().mockImplementation(() => ({
    sendEmail: jest.fn(),
    sendPasswordRecovery: jest.fn(),
    sendCredentials: jest.fn(),
  })),
}));

jest.mock('../../src/services/report-consolidator.service', () => ({
  ReportConsolidatorService: jest.fn().mockImplementation(() => ({
    simulateProcessing: jest.fn(),
  })),
}));

import resolvers, { GraphQLContext } from '../../src/schema/resolvers';
import { query } from '../../src/config/database';

describe('generateComprobante resolver', () => {
  const queryMock = query as jest.MockedFunction<typeof query>;

  const createContext = (user?: GraphQLContext['user']): GraphQLContext =>
    ({
      user,
      loaders: {} as GraphQLContext['loaders'],
    }) as GraphQLContext;

  beforeEach(() => {
    queryMock.mockReset();
  });

  it('retorna un PDF real para el propietario de la solicitud', async () => {
    queryMock.mockResolvedValue({
      rows: [
        {
          id: 'sol-1',
          consecutivo: 123,
          fechaCarga: new Date('2026-03-24T10:15:00Z'),
          archivoOriginal: 'archivo_original.xlsx',
          hashArchivo: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
          cct: '09ABC1234X',
          usuarioId: 'user-1',
          email: 'director@escuela.edu.mx',
        },
      ],
    } as Awaited<ReturnType<typeof query>>);

    const result = await resolvers.Query.generateComprobante(
      null,
      { solicitudId: 'sol-1' },
      createContext({ id: 'user-1', email: 'director@escuela.edu.mx', rol: 'DIRECTOR' })
    );

    expect(result.success).toBe(true);
    expect(result.fileName).toBe('Comprobante_123.pdf');
    expect(Buffer.from(result.contentBase64, 'base64').subarray(0, 4).toString('utf-8')).toBe('%PDF');
  });

  it('rechaza a un usuario sin permisos sobre la solicitud', async () => {
    queryMock.mockResolvedValue({
      rows: [
        {
          id: 'sol-2',
          consecutivo: 456,
          fechaCarga: new Date('2026-03-24T10:15:00Z'),
          archivoOriginal: 'archivo.xlsx',
          hashArchivo: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          cct: '09ABC1234X',
          usuarioId: 'user-owner',
          email: 'owner@escuela.edu.mx',
        },
      ],
    } as Awaited<ReturnType<typeof query>>);

    await expect(
      resolvers.Query.generateComprobante(
        null,
        { solicitudId: 'sol-2' },
        createContext({ id: 'user-2', email: 'otro@escuela.edu.mx', rol: 'DIRECTOR' })
      )
    ).rejects.toThrow('No tienes permiso para generar este comprobante');
  });

  it('retorna error controlado cuando hash_archivo es nulo', async () => {
    queryMock.mockResolvedValue({
      rows: [
        {
          id: 'sol-3',
          consecutivo: 789,
          fechaCarga: new Date('2026-03-24T10:15:00Z'),
          archivoOriginal: 'archivo.xlsx',
          hashArchivo: null,
          cct: '09ABC1234X',
          usuarioId: 'user-1',
          email: 'director@escuela.edu.mx',
        },
      ],
    } as Awaited<ReturnType<typeof query>>);

    await expect(
      resolvers.Query.generateComprobante(
        null,
        { solicitudId: 'sol-3' },
        createContext({ id: 'user-1', email: 'director@escuela.edu.mx', rol: 'DIRECTOR' })
      )
    ).rejects.toThrow(
      'No se puede generar el comprobante porque la solicitud no cuenta con hash_archivo registrado'
    );
  });
});
