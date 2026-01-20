import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

/**
 * VALIDATION MIDDLEWARE
 * Middleware для валидации входных данных с помощью express-validator
 * 
 * Использование:
 * router.post('/route', [...validationRules], validate, controller)
 */

/**
 * Middleware для проверки результатов валидации
 * Если есть ошибки валидации, возвращает 400 с деталями
 */
export const validate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.type === 'field' ? error.path : undefined,
        message: error.msg
      }))
    });
    return;
  }
  
  next();
};

/**
 * Helper функция для применения массива валидаций
 * Используется для последовательного применения правил валидации
 */
export const validateRequest = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Применяем все правила валидации
    await Promise.all(validations.map(validation => validation.run(req)));
    
    // Проверяем результаты
    validate(req, res, next);
  };
};
