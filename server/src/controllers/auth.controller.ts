import { Request, Response } from 'express';
import { User } from '../models';
import { IRegisterDTO, ILoginDTO, IAuthResponse, UserRole } from '../types';
import { generateToken } from '../utils';

/**
 * AUTH CONTROLLER
 * Контроллер для аутентификации пользователей
 * 
 * Endpoints:
 * - POST /auth/register - регистрация нового пользователя
 * - POST /auth/login - вход в систему
 */

class AuthController {
  private setAuthCookie(res: Response, token: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    const maxAge = 7 * 24 * 60 * 60 * 1000;

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      maxAge
    });
  }
  /**
   * Регистрация нового пользователя
   * POST /auth/register
   * 
   * Body: { fullName, userName, password }
   * Returns: { token, user }
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { fullName, userName, password }: IRegisterDTO = req.body;

      // Проверяем, существует ли пользователь
      const existingUser = await User.findOne({ userName: userName.toLowerCase() });
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'User with this userName already exists'
        });
        return;
      }

      // Создаем нового пользователя
      // Пароль автоматически хешируется в pre-save hook модели
      const user = await User.create({
        fullName,
        userName: userName.toLowerCase(),
        password,
        role: UserRole.USER,
        testHistory: []
      });

      // Генерируем JWT токен
      const token = generateToken({
        userId: user._id!.toString(),
        role: user.role
      });

      // Формируем ответ
      const response: IAuthResponse = {
        token,
        user: {
          id: user._id!.toString(),
          fullName: user.fullName,
          userName: user.userName,
          role: user.role
        }
      };

      this.setAuthCookie(res, token);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: response
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message
      });
    }
  }

  /**
   * Вход в систему
   * POST /auth/login
   * 
   * Body: { userName, password }
   * Returns: { token, user }
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { userName, password }: ILoginDTO = req.body;

      // Находим пользователя (с паролем, который по умолчанию не возвращается)
      const user = await User.findOne({ 
        userName: userName.toLowerCase() 
      }).select('+password');

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
        return;
      }

      // Проверяем пароль
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
        return;
      }

      // Генерируем JWT токен
      const token = generateToken({
        userId: user._id!.toString(),
        role: user.role
      });

      // Формируем ответ
      const response: IAuthResponse = {
        token,
        user: {
          id: user._id!.toString(),
          fullName: user.fullName,
          userName: user.userName,
          role: user.role
        }
      };

      this.setAuthCookie(res, token);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: response
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  }

  /**
   * Получение информации о текущем пользователе
   * GET /auth/me
   * Requires: Authentication
   */
  async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
        return;
      }

      const user = await User.findById(req.user.userId).select('-password');
      
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user data',
        error: error.message
      });
    }
  }
}

export const authController = new AuthController();
