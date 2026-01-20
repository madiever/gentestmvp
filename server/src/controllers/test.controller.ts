import { Request, Response } from 'express';
import { Subject, Test, User } from '../models';
import { aiService } from '../services';
import {
  IGenerateTestDTO,
  ISubmitTestDTO,
  IContentForAI,
  IUserAnswer,
  ITestHistory
} from '../types';

/**
 * TEST CONTROLLER
 * Контроллер для работы с тестами
 * 
 * Endpoints:
 * - POST /tests/generate - генерация теста на основе контента
 * - POST /tests/submit   - отправка ответов и получение результатов
 * - GET  /tests/:id      - получение теста по ID
 */

class TestController {
  /**
   * Генерация теста
   * POST /tests/generate
   * 
   * Body: {
   *   subjectId: string,
   *   bookId: string,
   *   chapterId?: string,
   *   fullBook?: boolean
   * }
   * 
   * Логика:
   * 1. Получить контент из Subject
   * 2. Проверить кеш (по хешу контента)
   * 3. Если нет в кеше - генерировать через AI
   * 4. Сохранить тест
   * 5. Вернуть тест (без правильных ответов)
   */
  async generateTest(req: Request, res: Response): Promise<void> {
    try {
      const { subjectId, bookId, chapterId, fullBook }: IGenerateTestDTO = req.body;
      const userId = req.user!.userId;

      // Получаем предмет
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
        return;
      }

      // Получаем книгу
      const book = subject.books.find((item) => item._id?.toString() === bookId);
      if (!book) {
        res.status(404).json({
          success: false,
          message: 'Book not found'
        });
        return;
      }

      // Собираем контент в зависимости от параметров
      let contentText = '';
      let chapterTitle = '';
      const topics: string[] = [];

      if (fullBook || !chapterId) {
        // Генерация по всей книге
        contentText = subject.getBookContent(bookId);
        chapterTitle = 'Вся книга';
        book.chapters.forEach((ch) => {
          ch.topics.forEach((t) => topics.push(t.title));
        });
      } else {
        // Генерация по конкретной главе
        const chapter = book.chapters.find((item) => item._id?.toString() === chapterId);
        if (!chapter) {
          res.status(404).json({
            success: false,
            message: 'Chapter not found'
          });
          return;
        }
        contentText = subject.getChapterContent(bookId, chapterId);
        chapterTitle = chapter.title;
        chapter.topics.forEach((t) => topics.push(t.title));
      }

      if (!contentText || contentText.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'No content available for test generation'
        });
        return;
      }

      // Подготавливаем метаданные для AI
      const contentForAI: IContentForAI = {
        text: contentText,
        metadata: {
          subjectTitle: subject.title,
          bookTitle: book.title,
          chapterTitle: fullBook ? undefined : chapterTitle,
          topics
        }
      };

      // Получаем историю вопросов пользователя для избежания повторений
      const user = await User.findById(userId);
      const previousQuestions = user?.getAllQuestionHashes(subjectId, bookId) || [];

      // Генерируем тест через AI
      const generatedTest = await aiService.generateTest(contentForAI, previousQuestions);

      if (chapterId) {
        generatedTest.questions = generatedTest.questions.map((question) => ({
          ...question,
          relatedContent: {
            ...question.relatedContent,
            chapterId: chapterId as any
          }
        }));
      }

      // Проверяем кеш - может уже есть тест с таким же контентом
      const useCache = !process.env.OPENAI_API_KEY;
      const cachedTest = useCache
        ? await Test.findOne({
            subjectId,
            bookId,
            chapterId: chapterId || { $exists: false },
            sourceContentHash: generatedTest.sourceContentHash
          }).sort({ createdAt: -1 })
        : null;

      let test;
      
      if (cachedTest) {
        // Используем кешированный тест
        test = cachedTest;
        console.log('📦 Using cached test');
      } else {
        // Сохраняем новый тест
        test = await Test.create({
          subjectId,
          bookId,
          chapterId: chapterId || undefined,
          questions: generatedTest.questions,
          sourceContentHash: generatedTest.sourceContentHash
        });
        console.log('✨ Generated new test');
      }

      // Возвращаем тест БЕЗ правильных ответов и объяснений
      const testForUser = {
        _id: test._id,
        subjectId: test.subjectId,
        bookId: test.bookId,
        chapterId: test.chapterId,
        questions: test.questions.map(q => ({
          questionText: q.questionText,
          options: q.options,
          // НЕ отправляем correctOption и aiExplanation
        })),
        createdAt: test.createdAt
      };

      res.status(201).json({
        success: true,
        message: 'Test generated successfully',
        data: testForUser
      });
    } catch (error: any) {
      console.error('Error generating test:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate test',
        error: error.message
      });
    }
  }

  /**
   * Отправка ответов на тест
   * POST /tests/submit
   * 
   * Body: {
   *   testId: string,
   *   answers: [{ questionText: string, selectedOption: string }]
   * }
   * 
   * Логика:
   * 1. Получить тест с правильными ответами
   * 2. Проверить ответы пользователя
   * 3. Отправить в AI для анализа и feedback
   * 4. Сохранить результаты в историю пользователя
   * 5. Вернуть результаты с feedback
   */
  async submitTest(req: Request, res: Response): Promise<void> {
    try {
      const { testId, answers }: ISubmitTestDTO = req.body;
      const userId = req.user!.userId;

      // Получаем тест
      const test = await Test.findById(testId);
      if (!test) {
        res.status(404).json({
          success: false,
          message: 'Test not found'
        });
        return;
      }

      // Проверяем количество ответов
      if (answers.length !== test.questions.length) {
        res.status(400).json({
          success: false,
          message: `Expected ${test.questions.length} answers, received ${answers.length}`
        });
        return;
      }

      // Проверяем ответы
      const userAnswers: IUserAnswer[] = [];
      let correctCount = 0;

      for (let i = 0; i < test.questions.length; i++) {
        const question = test.questions[i];
        const userAnswer = answers.find(a => a.questionText === question.questionText);

        if (!userAnswer) {
          res.status(400).json({
            success: false,
            message: `Missing answer for question: "${question.questionText}"`
          });
          return;
        }

        const isCorrect = userAnswer.selectedOption === question.correctOption;
        if (isCorrect) correctCount++;

        userAnswers.push({
          question: question.questionText,
          selectedOption: userAnswer.selectedOption,
          isCorrect
        });
      }

      // Вычисляем результат
      const totalQuestions = test.questions.length;
      const scorePercent = Math.round((correctCount / totalQuestions) * 100);

      // Получаем метаданные для AI feedback
      const subject = await Subject.findById(test.subjectId);
      if (!subject) {
        res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
        return;
      }

      const book = subject.books.find((item) => item._id?.toString() === test.bookId.toString());
      const chapter = test.chapterId 
        ? book?.chapters.find((item) => item._id?.toString() === test.chapterId!.toString())
        : undefined;

      // Генерируем AI feedback
      const correctAnswersData = test.questions.map(q => ({
        question: q.questionText,
        correctOption: q.correctOption,
        explanation: q.aiExplanation
      }));

      const aiFeedback = await aiService.analyzeAnswers(
        correctAnswersData,
        userAnswers,
        {
          subjectTitle: subject.title,
          bookTitle: book?.title || '',
          chapterTitle: chapter?.title,
          topics: []
        }
      );

      // Получаем хеши вопросов для истории
      const questionHashes = test.questions.map(q =>
        Buffer.from(q.questionText).toString('base64')
      );

      // Сохраняем в историю пользователя
      const testHistory: ITestHistory = {
        subjectId: test.subjectId,
        bookId: test.bookId,
        chapterId: test.chapterId,
        generatedQuestionsHash: questionHashes,
        answers: userAnswers,
        result: {
          totalQuestions,
          correctAnswers: correctCount,
          scorePercent
        },
        aiFeedback
      };

      await User.findByIdAndUpdate(
        userId,
        { $push: { testHistory } },
        { new: true }
      );

      // Возвращаем полные результаты с правильными ответами
      const detailedResults = {
        testId: test._id,
        result: {
          totalQuestions,
          correctAnswers: correctCount,
          scorePercent
        },
        aiFeedback,
        detailedAnswers: test.questions.map((q, index) => ({
          questionText: q.questionText,
          options: q.options,
          correctOption: q.correctOption,
          selectedOption: userAnswers[index].selectedOption,
          isCorrect: userAnswers[index].isCorrect,
          explanation: q.aiExplanation,
          relatedContent: q.relatedContent
        }))
      };

      res.status(200).json({
        success: true,
        message: 'Test submitted successfully',
        data: detailedResults
      });
    } catch (error: any) {
      console.error('Error submitting test:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit test',
        error: error.message
      });
    }
  }

  /**
   * Получить тест по ID
   * GET /tests/:id
   * 
   * Возвращает тест БЕЗ правильных ответов
   * (используется если пользователь хочет повторно пройти тест)
   */
  async getTestById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const test = await Test.findById(id);
      if (!test) {
        res.status(404).json({
          success: false,
          message: 'Test not found'
        });
        return;
      }

      // Возвращаем тест БЕЗ правильных ответов
      const testForUser = {
        _id: test._id,
        subjectId: test.subjectId,
        bookId: test.bookId,
        chapterId: test.chapterId,
        questions: test.questions.map(q => ({
          questionText: q.questionText,
          options: q.options
        })),
        createdAt: test.createdAt
      };

      res.status(200).json({
        success: true,
        data: testForUser
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch test',
        error: error.message
      });
    }
  }
}

export const testController = new TestController();
