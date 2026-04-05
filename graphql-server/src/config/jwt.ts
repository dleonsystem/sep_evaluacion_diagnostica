import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    '[FATAL] JWT_SECRET environment variable is required. Server cannot start without it.'
  );
}

/**
 * Genera un token JWT para un usuario
 * @param user Datos del usuario a incluir en el token
 * @param expiresIn Tiempo de expiración (default: 8h)
 * @returns string Token JWT
 */
export const generateToken = (user: any, expiresIn: string = '8h'): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      rol: user.rol,
    },
    JWT_SECRET,
    { expiresIn: expiresIn as any }
  );
};

/**
 * Verifica un token JWT
 * @param token Token a verificar
 * @returns any Payload decodificado o null si es inválido
 */
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
