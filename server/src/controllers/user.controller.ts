import { Request, Response } from 'express';
import { User } from '../models';

/**
 * USER CONTROLLER
 * Контроллер для работы с пользователями
 * 
 * Endpoints:
 * - GET /users/me        - получить текущего пользователя
 * - GET /users/me/tests  - получить историю тестов текущего пользователя
 * - GET /users/me/stats  - получить статистику пользователя
 */

class UserController {
  /**
   * Получить информацию о текущем пользователе
   * GET /users/me
   */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      const user = await User.findById(userId).select('-password');
      
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
        message: 'Failed to fetch user',
        error: error.message
      });
    }
  }

  /**
   * Получить историю тестов пользователя
   * GET /users/me/tests
   * 
   * Query params:
   * - subjectId?: фильтр по предмету
   * - limit?: количество записей (по умолчанию все)
   * - sortBy?: 'createdAt' | 'scorePercent' (по умолчанию 'createdAt')
   * - order?: 'asc' | 'desc' (по умолчанию 'desc')
   */
  async getTestHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { subjectId, limit, sortBy = 'createdAt', order = 'desc' } = req.query;

      const user = await User.findById(userId)
        .select('testHistory')
        .populate('testHistory.subjectId', 'title');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      let testHistory = user.testHistory || [];

      // Фильтр по предмету
      if (subjectId) {
        testHistory = testHistory.filter(
          test => test.subjectId.toString() === subjectId
        );
      }

      // Сортировка
      testHistory.sort((a, b) => {
        const aValue = sortBy === 'scorePercent' ? a.result.scorePercent : new Date(a.createdAt!).getTime();
        const bValue = sortBy === 'scorePercent' ? b.result.scorePercent : new Date(b.createdAt!).getTime();
        
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      });

      // Лимит
      if (limit) {
        testHistory = testHistory.slice(0, parseInt(limit as string));
      }

      res.status(200).json({
        success: true,
        data: {
          total: testHistory.length,
          tests: testHistory
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch test history',
        error: error.message
      });
    }
  }

  /**
   * Получить статистику пользователя
   * GET /users/me/stats
   * 
   * Возвращает:
   * - Общее количество пройденных тестов
   * - Средний процент правильных ответов
   * - Количество тестов по предметам
   * - Лучший и худший результат
   * - Прогресс (улучшение со временем)
   */
  async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      const user = await User.findById(userId)
        .select('testHistory')
        .populate('testHistory.subjectId', 'title');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const testHistory = user.testHistory || [];

      if (testHistory.length === 0) {
        res.status(200).json({
          success: true,
          data: {
            totalTests: 0,
            averageScore: 0,
            testsBySubject: {},
            bestResult: null,
            worstResult: null,
            recentProgress: []
          }
        });
        return;
      }

      // Общая статистика
      const totalTests = testHistory.length;
      const averageScore = testHistory.reduce((sum, test) => sum + test.result.scorePercent, 0) / totalTests;

      // Статистика по предметам
      const testsBySubject: Record<string, { count: number; averageScore: number }> = {};
      
      testHistory.forEach(test => {
        const subjectId = test.subjectId.toString();
        if (!testsBySubject[subjectId]) {
          testsBySubject[subjectId] = { count: 0, averageScore: 0 };
        }
        testsBySubject[subjectId].count++;
        testsBySubject[subjectId].averageScore += test.result.scorePercent;
      });

      Object.keys(testsBySubject).forEach(subjectId => {
        testsBySubject[subjectId].averageScore = 
          testsBySubject[subjectId].averageScore / testsBySubject[subjectId].count;
      });

      // Лучший и худший результат
      const sortedByScore = [...testHistory].sort((a, b) => b.result.scorePercent - a.result.scorePercent);
      const bestResult = {
        testId: sortedByScore[0]._id,
        score: sortedByScore[0].result.scorePercent,
        date: sortedByScore[0].createdAt
      };
      const worstResult = {
        testId: sortedByScore[sortedByScore.length - 1]._id,
        score: sortedByScore[sortedByScore.length - 1].result.scorePercent,
        date: sortedByScore[sortedByScore.length - 1].createdAt
      };

      // Прогресс (последние 5 тестов)
      const recentProgress = testHistory
        .slice(-5)
        .map(test => ({
          testId: test._id,
          score: test.result.scorePercent,
          date: test.createdAt
        }));

      res.status(200).json({
        success: true,
        data: {
          totalTests,
          averageScore: Math.round(averageScore),
          testsBySubject,
          bestResult,
          worstResult,
          recentProgress
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user statistics',
        error: error.message
      });
    }
  }

  /**
   * Получить детальную информацию о конкретном тесте из истории
   * GET /users/me/tests/:testHistoryId
   */
  async getTestHistoryDetails(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { testHistoryId } = req.params;

      const user = await User.findById(userId)
        .select('testHistory')
        .populate('testHistory.subjectId', 'title');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const testHistory = user.testHistory.find(
        test => test._id?.toString() === testHistoryId
      );

      if (!testHistory) {
        res.status(404).json({
          success: false,
          message: 'Test history not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: testHistory
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch test history details',
        error: error.message
      });
    }
  }
}

export const userController = new UserController();
