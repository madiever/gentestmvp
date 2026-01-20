import jwt, { SignOptions } from 'jsonwebtoken';
import { IJWTPayload } from '../types';

/**
 * JWT UTILITIES
 * Вспомогательные функции для работы с JWT токенами
 */

/**
 * Генерация JWT токена
 * 
 * @param payload - данные для включения в токен
 * @returns JWT токен
 */
export const generateToken = (payload: IJWTPayload): string => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(payload, jwtSecret as jwt.Secret, {
    expiresIn: jwtExpiresIn as SignOptions['expiresIn']
  });
};

/**
 * Верификация JWT токена
 * 
 * @param token - токен для проверки
 * @returns расшифрованные данные или null если токен невалиден
 */
export const verifyToken = (token: string): IJWTPayload | null => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  try {
    return jwt.verify(token, jwtSecret as jwt.Secret) as IJWTPayload;
  } catch (error) {
    return null;
  }
};
