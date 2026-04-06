import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/**
 * User Payload interface for JWT
 */
interface UserPayload {
  id: string;
  email: string;
  rol: string;
}

/**
 * Helper method to safely access the JWT_SECRET
 * Implements lazy validation to avoid blocking test suites that don't use JWT
 */
const getSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      '[FATAL] JWT_SECRET environment variable is required. Server cannot start without it.'
    );
  }
  return secret;
};

/**
 * Genera un token JWT para un usuario
 * @param user Datos del usuario a incluir en el token
 * @param expiresIn Tiempo de expiración (default: 8h)
 * @returns string Token JWT
 */
export const generateToken = (user: UserPayload, expiresIn: string = '8h'): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      rol: user.rol,
    },
    getSecret(),
    { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
  );
};

/**
 * Verifica un token JWT
 * @param token Token a verificar
 * @returns UserPayload | null Payload decodificado o null si es inválido
 */
export const verifyToken = (token: string): UserPayload | null => {
  try {
    return jwt.verify(token, getSecret()) as UserPayload;
  } catch (error) {
    return null;
  }
};
