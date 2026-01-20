import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { errorHandler, notFound } from './middlewares';

/**
 * EXPRESS APPLICATION SETUP
 * Конфигурация Express приложения
 * 
 * Middleware:
 * - cors: разрешает кросс-доменные запросы
 * - express.json: парсинг JSON в body
 * - express.urlencoded: парсинг URL-encoded данных
 * 
 * Routes:
 * - /api/v1/*: все API эндпоинты
 * 
 * Error handling:
 * - notFound: обработка несуществующих маршрутов (404)
 * - errorHandler: централизованная обработка ошибок
 */

const app: Application = express();

// ==================== MIDDLEWARE ====================

// CORS configuration
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging (в development режиме)
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
  });
}

// ==================== ROUTES ====================

// Root endpoint
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Educational AI Test Platform API',
    version: '1.0.0',
    documentation: '/api/v1/health'
  });
});

// API routes
app.use('/api/v1', routes);

// ==================== ERROR HANDLING ====================

// 404 handler - должен быть перед errorHandler
app.use(notFound);

// Централизованный обработчик ошибок - должен быть последним
app.use(errorHandler);

export default app;
