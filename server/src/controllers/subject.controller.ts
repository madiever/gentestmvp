import { Request, Response } from 'express';
import { Subject } from '../models';
import {
  ICreateSubjectDTO,
  IAddBookDTO,
  IAddChapterDTO,
  IAddTopicDTO,
  IAddParagraphDTO
} from '../types';

/**
 * SUBJECT CONTROLLER
 * Контроллер для управления образовательным контентом
 * 
 * Endpoints:
 * - POST   /subjects                    - создать предмет (admin)
 * - GET    /subjects                    - получить все предметы
 * - GET    /subjects/:id                - получить предмет по ID
 * - POST   /subjects/:id/books          - добавить книгу (admin)
 * - POST   /books/:bookId/chapters      - добавить главу (admin)
 * - POST   /chapters/:chapterId/topics  - добавить тему (admin)
 * - POST   /topics/:topicId/paragraphs  - добавить параграф (admin)
 */

class SubjectController {
  /**
   * Создать новый предмет
   * POST /subjects
   * Body: { title, description? }
   * Access: Admin only
   */
  async createSubject(req: Request, res: Response): Promise<void> {
    try {
      const { title, description }: ICreateSubjectDTO = req.body;

      const subject = await Subject.create({
        title,
        description,
        books: []
      });

      res.status(201).json({
        success: true,
        message: 'Subject created successfully',
        data: subject
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to create subject',
        error: error.message
      });
    }
  }

  /**
   * Получить все предметы
   * GET /subjects
   * Access: Public (authenticated users)
   */
  async getAllSubjects(_req: Request, res: Response): Promise<void> {
    try {
      const subjects = await Subject.find().select('title description createdAt updatedAt');

      res.status(200).json({
        success: true,
        data: subjects
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subjects',
        error: error.message
      });
    }
  }

  /**
   * Получить предмет по ID с полной структурой
   * GET /subjects/:id
   * Access: Public (authenticated users)
   */
  async getSubjectById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const subject = await Subject.findById(id);

      if (!subject) {
        res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: subject
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subject',
        error: error.message
      });
    }
  }

  /**
   * Добавить книгу к предмету
   * POST /subjects/:id/books
   * Body: { title, author? }
   * Access: Admin only
   */
  async addBook(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, author }: IAddBookDTO = req.body;

      const subject = await Subject.findById(id);

      if (!subject) {
        res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
        return;
      }

      subject.books.push({
        title,
        author,
        chapters: []
      });

      await subject.save();

      res.status(201).json({
        success: true,
        message: 'Book added successfully',
        data: subject
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to add book',
        error: error.message
      });
    }
  }

  /**
   * Добавить главу к книге
   * POST /books/:bookId/chapters
   * Body: { title, order }
   * Params: subjectId (query), bookId (params)
   * Access: Admin only
   */
  async addChapter(req: Request, res: Response): Promise<void> {
    try {
      const { bookId } = req.params;
      const { subjectId } = req.query;
      const { title, order }: IAddChapterDTO = req.body;

      if (!subjectId) {
        res.status(400).json({
          success: false,
          message: 'subjectId is required in query params'
        });
        return;
      }

      const subject = await Subject.findById(subjectId);

      if (!subject) {
        res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
        return;
      }

      const book = subject.books.find((item) => item._id?.toString() === bookId);

      if (!book) {
        res.status(404).json({
          success: false,
          message: 'Book not found'
        });
        return;
      }

      book.chapters.push({
        title,
        order,
        topics: []
      });

      await subject.save();

      res.status(201).json({
        success: true,
        message: 'Chapter added successfully',
        data: subject
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to add chapter',
        error: error.message
      });
    }
  }

  /**
   * Добавить тему к главе
   * POST /chapters/:chapterId/topics
   * Body: { title }
   * Query: subjectId, bookId, chapterId
   * Access: Admin only
   */
  async addTopic(req: Request, res: Response): Promise<void> {
    try {
      const { chapterId } = req.params;
      const { subjectId, bookId } = req.query;
      const { title }: IAddTopicDTO = req.body;

      if (!subjectId || !bookId) {
        res.status(400).json({
          success: false,
          message: 'subjectId and bookId are required in query params'
        });
        return;
      }

      const subject = await Subject.findById(subjectId);

      if (!subject) {
        res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
        return;
      }

      const normalizedBookId = String(bookId);
      const book = subject.books.find((item) => item._id?.toString() === normalizedBookId);

      if (!book) {
        res.status(404).json({
          success: false,
          message: 'Book not found'
        });
        return;
      }

      const normalizedChapterId = String(chapterId);
      const chapter = book.chapters.find((item) => item._id?.toString() === normalizedChapterId);

      if (!chapter) {
        res.status(404).json({
          success: false,
          message: 'Chapter not found'
        });
        return;
      }

      chapter.topics.push({
        title,
        paragraphs: []
      });

      await subject.save();

      res.status(201).json({
        success: true,
        message: 'Topic added successfully',
        data: subject
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to add topic',
        error: error.message
      });
    }
  }

  /**
   * Добавить параграф к теме
   * POST /topics/:topicId/paragraphs
   * Body: { order, content: { text, pages, metadata } }
   * Query: subjectId, bookId, chapterId, topicId
   * Access: Admin only
   */
  async addParagraph(req: Request, res: Response): Promise<void> {
    try {
      const { topicId } = req.params;
      const { subjectId, bookId, chapterId } = req.query;
      const { order, content }: IAddParagraphDTO = req.body;

      if (!subjectId || !bookId || !chapterId) {
        res.status(400).json({
          success: false,
          message: 'subjectId, bookId, and chapterId are required in query params'
        });
        return;
      }

      const subject = await Subject.findById(subjectId);

      if (!subject) {
        res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
        return;
      }

      const normalizedBookId = String(bookId);
      const book = subject.books.find((item) => item._id?.toString() === normalizedBookId);

      if (!book) {
        res.status(404).json({
          success: false,
          message: 'Book not found'
        });
        return;
      }

      const normalizedChapterId = String(chapterId);
      const chapter = book.chapters.find((item) => item._id?.toString() === normalizedChapterId);

      if (!chapter) {
        res.status(404).json({
          success: false,
          message: 'Chapter not found'
        });
        return;
      }

      const normalizedTopicId = String(topicId);
      const topic = chapter.topics.find((item) => item._id?.toString() === normalizedTopicId);

      if (!topic) {
        res.status(404).json({
          success: false,
          message: 'Topic not found'
        });
        return;
      }

      topic.paragraphs.push({
        order,
        content
      });

      await subject.save();

      res.status(201).json({
        success: true,
        message: 'Paragraph added successfully',
        data: subject
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to add paragraph',
        error: error.message
      });
    }
  }
}

export const subjectController = new SubjectController();
