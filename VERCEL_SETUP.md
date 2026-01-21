# Пошаговая инструкция по развертыванию на Vercel

## Шаг 1: Войдите в Vercel

1. Зайдите на https://vercel.com
2. Войдите через GitHub (если еще не авторизованы)
3. Нажмите **"Add New Project"** или **"New Project"**

## Шаг 2: Выберите репозиторий

1. Найдите репозиторий **`madiever/genTestMVP`**
2. Нажмите **"Import"**

## Шаг 3: Настройте проект

### Основные настройки:

- **Framework Preset:** `Other` (или оставьте пустым, Vercel определит автоматически)
- **Root Directory:** `.` (точка - корень проекта)
- **Build Command:** `cd client && npm install && npm run build`
- **Output Directory:** `client/dist`
- **Install Command:** `npm install && cd server && npm install && cd ../client && npm install`

### Или используйте автоматическое определение:
Vercel может определить настройки автоматически, но лучше указать явно.

## Шаг 4: Добавьте переменные окружения

**ВАЖНО:** Добавьте все переменные ДО первого деплоя!

Нажмите **"Environment Variables"** и добавьте:

### Обязательные переменные:

```
MONGODB_URI=mongodb+srv://madieverr_db_user:kEPDznvfy5srpht5@cluster0.frrgxng.mongodb.net/edu-ai-test-platform?retryWrites=true&w=majority
```

```
JWT_SECRET=Jzd5VD8CzPKdVlRYqf/fHA8lJodIqQAWQCeyaU+UJTE=
```
💡 Сгенерируйте через: `openssl rand -base64 32`

```
OPENAI_API_KEY=your_openai_api_key_here
```

### Опциональные (можно добавить позже):

```
CORS_ORIGIN=https://your-app.vercel.app
```
⚠️ Обновите после первого деплоя на реальный URL

```
NODE_ENV=production
```

```
JWT_EXPIRES_IN=7d
```

## Шаг 5: Deploy

1. Нажмите **"Deploy"**
2. Дождитесь завершения сборки (обычно 2-5 минут)
3. После успешного деплоя вы получите URL вида: `https://gen-test-mvp.vercel.app`

## Шаг 6: Обновите CORS_ORIGIN

После первого деплоя:

1. Скопируйте URL вашего приложения (например: `https://gen-test-mvp-xxx.vercel.app`)
2. В Vercel Dashboard → Settings → Environment Variables
3. Обновите `CORS_ORIGIN` на ваш реальный URL
4. Передеплойте (Settings → Deployments → выберите последний → Redeploy)

## Шаг 7: Создайте администратора

### Вариант 1: Через временный API endpoint

Создайте файл `api/create-admin.ts`:

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../server/src/config/db';
import { User } from '../server/src/models';
import { UserRole } from '../server/src/types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const existingAdmin = await User.findOne({ userName: 'admin' });
    if (existingAdmin) {
      return res.json({ message: 'Admin already exists', user: existingAdmin.userName });
    }

    const admin = await User.create({
      fullName: 'System Administrator',
      userName: 'admin',
      password: 'admin123',
      role: UserRole.ADMIN,
      testHistory: []
    });

    res.json({ 
      message: 'Admin created successfully',
      username: admin.userName,
      warning: '⚠️ Change password after first login!'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
```

Затем вызовите:
```bash
curl -X POST https://your-app.vercel.app/api/create-admin
```

Или через браузер откройте: `https://your-app.vercel.app/api/create-admin` (но это не сработает для POST, лучше через curl или Postman)

### Вариант 2: Через Vercel CLI

```bash
# Установите Vercel CLI
npm i -g vercel

# Войдите
vercel login

# Подключите проект
vercel link

# Выполните команду создания админа (требует настройки)
```

## Шаг 8: Проверьте работу

1. Откройте ваш Vercel URL
2. Попробуйте зарегистрироваться или войти как `admin` / `admin123`
3. Проверьте Network tab в DevTools:
   - Запросы должны идти на `/api/v1/*`
   - Не должно быть CORS ошибок

## Troubleshooting

### Ошибка сборки

**"Cannot find module"**
- Проверьте, что все зависимости указаны в `package.json`
- Убедитесь, что `server/package.json` содержит `serverless-http` и `@vercel/node`

**"TypeScript errors"**
- Проверьте логи сборки в Vercel Dashboard
- Убедитесь, что все файлы закоммичены

### Ошибки при работе

**MongoDB connection errors**
- Проверьте `MONGODB_URI` в переменных окружения
- Убедитесь, что IP whitelist в MongoDB Atlas включает `0.0.0.0/0`

**CORS errors**
- Обновите `CORS_ORIGIN` на ваш Vercel URL
- Передеплойте после изменения

**404 на API routes**
- Проверьте, что файл `api/[...].ts` существует
- Убедитесь, что `vercel.json` настроен правильно

**Timeout errors**
- Vercel Hobby план: максимум 10 секунд
- Vercel Pro план: максимум 60 секунд
- Если генерация тестов долгая, рассмотрите асинхронную обработку

## Полезные ссылки

- Vercel Dashboard: https://vercel.com/dashboard
- Документация Vercel: https://vercel.com/docs
- Логи деплоя: Vercel Dashboard → ваш проект → Deployments → выберите деплой → Logs

## После успешного деплоя

✅ Удалите временный `api/create-admin.ts` (если создавали)
✅ Измените пароль администратора после первого входа
✅ Настройте кастомный домен (опционально)
✅ Настройте мониторинг и алерты
