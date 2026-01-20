import mongoose, { Schema, Document, Model } from 'mongoose';
import { ITest, IQuestion, IRelatedContent } from '../types';

/**
 * TEST MODEL
 * Модель для хранения сгенерированных тестов
 * 
 * Особенности:
 * - sourceContentHash используется для кеширования - если контент не изменился,
 *   можем переиспользовать тест
 * - relatedContent в каждом вопросе позволяет показать пользователю,
 *   где искать ответ в книге
 * - options всегда содержит ровно 4 варианта ответа
 */

// ==================== SUB-SCHEMAS ====================

const RelatedContentSchema = new Schema<IRelatedContent>({
  chapterId: { 
    type: Schema.Types.ObjectId
  },
  topicId: { 
    type: Schema.Types.ObjectId 
  },
  pages: [{ 
    type: Number, 
    required: true 
  }]
}, { _id: false });

const QuestionSchema = new Schema<IQuestion>({
  questionText: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 500
  },
  options: {
    type: [{ type: String, required: true, trim: true }],
    required: true,
    validate: {
      validator: function(options: string[]) {
        return options.length === 4;
      },
      message: 'Question must have exactly 4 options'
    }
  },
  correctOption: { 
    type: String, 
    required: true,
    trim: true,
    validate: {
      validator: function(this: any, correctOption: string) {
        return this.options && this.options.includes(correctOption);
      },
      message: 'Correct option must be one of the provided options'
    }
  },
  aiExplanation: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 1000
  },
  relatedContent: { 
    type: RelatedContentSchema, 
    required: true 
  }
}, { _id: false });

// ==================== MAIN SCHEMA ====================

type ITestDocument = Document & Omit<ITest, '_id'>;

const TestSchema = new Schema<ITestDocument>({
  subjectId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Subject',
    required: true,
    index: true
  },
  bookId: { 
    type: Schema.Types.ObjectId, 
    required: true,
    index: true
  },
  chapterId: { 
    type: Schema.Types.ObjectId,
    index: true
  },
  questions: [QuestionSchema],
  sourceContentHash: { 
    type: String, 
    required: true,
    index: true
  }
}, { 
  timestamps: true,
  collection: 'tests'
});

// ==================== INDEXES ====================
// Составной индекс для поиска кешированных тестов
TestSchema.index({ subjectId: 1, bookId: 1, chapterId: 1, sourceContentHash: 1 });
TestSchema.index({ createdAt: -1 });

TestSchema.path('questions').validate(
  (questions: IQuestion[]) => questions.length === 10,
  'Test must contain exactly 10 questions'
);

// ==================== STATIC METHODS ====================

/**
 * Поиск кешированного теста по хешу контента
 * Если контент не изменился, можем переиспользовать тест
 */
TestSchema.statics.findCachedTest = async function(
  subjectId: string,
  bookId: string,
  chapterId: string | undefined,
  sourceContentHash: string
) {
  const query: any = {
    subjectId,
    bookId,
    sourceContentHash
  };

  if (chapterId) {
    query.chapterId = chapterId;
  } else {
    query.chapterId = { $exists: false };
  }

  return this.findOne(query).sort({ createdAt: -1 });
};

/**
 * Получить хеши всех вопросов теста
 * Используется для добавления в историю пользователя
 */
TestSchema.methods.getQuestionHashes = function(): string[] {
  return this.questions.map((q: IQuestion) => 
    // Простой хеш на основе текста вопроса
    Buffer.from(q.questionText).toString('base64')
  );
};

// ==================== MODEL ====================

export const Test: Model<ITestDocument> = mongoose.model<ITestDocument>('Test', TestSchema);
