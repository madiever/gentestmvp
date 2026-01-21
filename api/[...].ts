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
    console.log(`📨 [${req.method}] ${req.url}`);

    // Таймаут для всего запроса (8 секунд для Vercel Hobby плана)
    const timeout = setTimeout(() => {
        if (!res.headersSent) {
            console.error('⏱️ Request timeout after 8 seconds');
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
                console.log('🔌 Connecting to MongoDB...');
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
        } else {
            console.log('✅ MongoDB already connected');
        }

        // Создаем handler один раз
        if (!handler) {
            console.log('🔧 Creating serverless handler...');
            handler = serverless(app, {
                binary: ['image/*', 'application/pdf']
            });
        }

        console.log('🚀 Processing request through Express...');

        // Обрабатываем через serverless-http
        // serverless-http возвращает Promise, который резолвится когда ответ отправлен
        const result = handler(req, res);

        // Если это Promise, ждем его
        if (result && typeof result.then === 'function') {
            console.log('⏳ Waiting for Express response...');
            await result;
            console.log('✅ Express response received');
        } else {
            console.log('✅ Express handler completed synchronously');
        }

        // Даем время на отправку ответа
        await new Promise(resolve => setTimeout(resolve, 100));

        // Убеждаемся, что ответ отправлен
        if (!res.headersSent) {
            console.warn('⚠️ Response headers not sent, sending default response');
            res.status(500).json({
                success: false,
                message: 'Response was not sent by Express'
            });
        } else {
            console.log('✅ Response headers sent:', res.statusCode);
            console.log('✅ Response finished:', res.finished);
            console.log('✅ Response writable ended:', res.writableEnded);
        }

        clearTimeout(timeout);
        console.log('✅ Request completed successfully');

        // Не вызываем res.end() явно - это может конфликтовать с serverless-http
        // Vercel сам завершит ответ когда функция вернет значение
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
