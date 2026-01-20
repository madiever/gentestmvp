import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';

/**
 * ERROR HANDLER MIDDLEWARE
 * Централизованная обработка ошибок
 * 
 * Обрабатывает:
 * - Ошибки валидации Mongoose
 * - Ошибки дублирования (unique constraint)
 * - Ошибки cast (неверный формат ObjectId)
 * - Общие ошибки
 */

interface CustomError extends Error {
  statusCode?: number;
  code?: number;
  keyValue?: any;
  errors?: any;
}

/**
 * Централизованный обработчик ошибок
 * Должен быть последним middleware в цепочке
 */
export const errorHandler = (
  err: CustomError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('❌ Error:', err);

  // По умолчанию 500 Internal Server Error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors: any[] = [];

  // Mongoose Validation Error
  if (err instanceof MongooseError.ValidationError) {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map((error: any) => ({
      field: error.path,
      message: error.message
    }));
  }

  // Mongoose Cast Error (неверный формат ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value';
    const field = Object.keys(err.keyValue || {})[0];
    errors = [{
      field,
      message: `${field} already exists`
    }];
  }

  // JWT Errors (обрабатываются в auth middleware, но на всякий случай)
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Обработчик для несуществующих маршрутов (404)
 */
export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
};

/**
 * Wrapper для async функций в контроллерах
 * Автоматически передает ошибки в error handler
 * 
 * Использование:
 * router.get('/route', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
