import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/src/app';
import { connectDB } from '../server/src/config/db';
import { Request, Response } from 'express';

// Кешируем подключение к БД для serverless
let dbConnected = false;
let dbConnectionPromise: Promise<void> | null = null;

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

        console.log('🚀 Processing request through Express...');

        // Конвертируем Vercel request/response в Express формат
        const expressReq = req as unknown as Request;
        const expressRes = res as unknown as Response;

        // Обрабатываем через Express напрямую
        return new Promise<VercelResponse>((resolve, reject) => {
            // Обработчик завершения ответа
            const originalEnd = expressRes.end.bind(expressRes);
            expressRes.end = function (chunk?: any, encoding?: any, cb?: any) {
                console.log('✅ Express response ended');
                clearTimeout(timeout);
                const result = originalEnd(chunk, encoding, cb);
                resolve(res);
                return result;
            };

            // Обработчик ошибок
            expressRes.on('finish', () => {
                console.log('✅ Express response finished');
                clearTimeout(timeout);
                if (!res.headersSent) {
                    console.warn('⚠️ Response finished but headers not sent');
                }
                resolve(res);
            });

            // Обрабатываем запрос через Express
            app(expressReq, expressRes, (err: any) => {
                if (err) {
                    console.error('❌ Express error:', err);
                    clearTimeout(timeout);
                    if (!res.headersSent) {
                        res.status(500).json({
                            success: false,
                            message: 'Internal server error',
                            error: err.message
                        });
                    }
                    reject(err);
                }
            });
        });
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
