import mongoose from 'mongoose';

/**
 * Подключение к MongoDB
 * Использует строку подключения из переменных окружения
 * Настроены опции для оптимальной работы с Mongoose
 * 
 * Для serverless (Vercel): кеширует соединение между вызовами
 */
let cachedConnection: typeof mongoose | null = null;

export const connectDB = async (): Promise<void> => {
  try {
    // Если уже подключены (serverless кеш), возвращаемся
    if (cachedConnection && mongoose.connection.readyState === 1) {
      return;
    }

    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Опции для serverless окружения
    const options = {
      maxPoolSize: 10, // Ограничиваем пул соединений для serverless
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(mongoURI, options);
    cachedConnection = mongoose;

    console.log('✅ MongoDB connected successfully');

    // Обработка событий подключения
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
      cachedConnection = null;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
      cachedConnection = null;
    });

    // Graceful shutdown (только для обычного сервера, не serverless)
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('MongoDB connection closed due to app termination');
        process.exit(0);
      });
    }

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    cachedConnection = null;
    // В serverless не выходим из процесса, просто пробрасываем ошибку
    if (process.env.VERCEL) {
      throw error;
    }
    process.exit(1);
  }
};
