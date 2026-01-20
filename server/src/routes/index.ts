import { Router } from 'express';
import authRoutes from './auth.routes';
import subjectRoutes from './subject.routes';
import testRoutes from './test.routes';
import userRoutes from './user.routes';

/**
 * ROUTES INDEX
 * Центральный роутер для всех API маршрутов
 */

const router = Router();

// API версия
router.use('/auth', authRoutes);
router.use('/subjects', subjectRoutes);
router.use('/tests', testRoutes);
router.use('/users', userRoutes);

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

export default router;
