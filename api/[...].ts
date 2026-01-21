import type { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import app from '../server/src/app';
import { connectDB } from '../server/src/config/db';

// Кешируем подключение к БД для serverless
let dbConnected = false;
let dbConnectionPromise: Promise<void> | null = null;

// Создаем serverless handler один раз (кешируется между вызовами)
let handler: ReturnType<typeof serverless> | null = null;

/**
 * Vercel Serverless Function Handler
 * Обрабатывает все API запросы через Express app
 */
export default async function vercelHandler(
    req: VercelRequest,
    res: VercelResponse
): Promise<VercelResponse> {
    // Таймаут для всего запроса (8 секунд для Vercel Hobby плана)
    const timeout = setTimeout(() => {
        if (!res.headersSent) {
            res.status(504).json({
                success: false,
                message: 'Request timeout',
                error: 'The request took too long to process'
            });
        }
    }, 8000);

    try {
        // Подключаемся к БД один раз (кешируем соединение)
        if (!dbConnected) {
            if (!dbConnectionPromise) {
                dbConnectionPromise = connectDB()
                    .then(() => {
                        dbConnected = true;
                        console.log('✅ MongoDB connected (serverless)');
                    })
                    .catch((error) => {
                        console.error('❌ MongoDB connection error:', error);
                        dbConnectionPromise = null;
                        dbConnected = false;
                        // Пробрасываем ошибку дальше
                        throw error;
                    });
            }

            // Таймаут для подключения к БД
            await Promise.race([
                dbConnectionPromise,
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Database connection timeout')), 5000)
                )
            ]);
        }

        // Создаем handler один раз
        if (!handler) {
            handler = serverless(app, {
                binary: ['image/*', 'application/pdf']
            });
        }

        // Обрабатываем через serverless-http
        // serverless-http возвращает Promise, который резолвится когда ответ отправлен
        const result = handler(req, res);

        // Если это Promise, ждем его
        if (result && typeof result.then === 'function') {
            await result;
        }

        clearTimeout(timeout);
        return res;
    } catch (error: any) {
        clearTimeout(timeout);
        console.error('❌ Serverless handler error:', error);

        // Проверяем, не отправлен ли уже ответ
        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : 'A server error has occurred'
            });
        }

        return res;
    }
}
