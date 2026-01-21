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
                    // В serverless не выходим, просто логируем
                });
        }
        await dbConnectionPromise;
    }

    // Создаем handler один раз
    if (!handler) {
        handler = serverless(app, {
            binary: ['image/*', 'application/pdf']
        });
    }

    // Обрабатываем через serverless-http
    return handler(req, res) as Promise<VercelResponse>;
}
