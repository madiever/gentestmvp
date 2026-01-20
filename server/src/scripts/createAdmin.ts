import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../models';
import { UserRole } from '../types';
import { connectDB } from '../config/db';

/**
 * SCRIPT: Create Admin User
 * Скрипт для создания администратора
 * 
 * Использование:
 * ts-node src/scripts/createAdmin.ts
 */

dotenv.config();

const createAdmin = async () => {
  try {
    await connectDB();

    console.log('🔧 Creating admin user...');

    // Проверяем, существует ли уже admin
    const existingAdmin = await User.findOne({ userName: 'admin' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log(`Username: ${existingAdmin.userName}`);
      console.log(`Full Name: ${existingAdmin.fullName}`);
      process.exit(0);
    }

    // Создаем admin пользователя
    await User.create({
      fullName: 'System Administrator',
      userName: 'admin',
      password: 'admin123', // ВАЖНО: Измените пароль после первого входа!
      role: UserRole.ADMIN,
      testHistory: []
    });

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('📋 Login credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the password after first login!');
    console.log('');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
