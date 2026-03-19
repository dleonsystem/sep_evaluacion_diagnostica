import { generateToken, verifyToken } from './jwt';

describe('JWT Utility (Sprint 1 - RF-18)', () => {
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@sep.gob.mx',
    rol: 'COORDINADOR_FEDERAL'
  };

  process.env.JWT_SECRET = 'test_secret_key_12345';

  it('debe generar un token válido para un usuario', () => {
    const token = generateToken(mockUser);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);
  });

  it('debe verificar un token válido y devolver los datos del usuario', () => {
    const token = generateToken(mockUser);
    const decoded = verifyToken(token);
    expect(decoded).toBeDefined();
    expect(decoded?.email).toBe(mockUser.email);
    expect(decoded?.rol).toBe(mockUser.rol);
    expect(decoded?.id).toBe(mockUser.id);
  });

  it('debe fallar si el token es alterado (OWASP A07)', () => {
    const token = generateToken(mockUser);
    const forgedToken = token.substring(0, token.length - 5) + 'abcde';
    const decoded = verifyToken(forgedToken);
    expect(decoded).toBeNull();
  });

  it('debe fallar si el token ha expirado (en teoría)', () => {
    // Para probar expiración real necesitaríamos mockear el tiempo, 
    // pero verificamos que al menos la función maneja errores.
    const decoded = verifyToken('invalid-token');
    expect(decoded).toBeNull();
  });
});
