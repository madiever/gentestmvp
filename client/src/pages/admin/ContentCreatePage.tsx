import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { subjectApi } from '../../api/subject.api';
import { Book, Chapter, Subject, Topic } from '../../types/subject.types';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Loader } from '../../components/ui/Loader';
import { getApiErrorMessage } from '../../utils/error';

const schema = z
  .object({
    subjectId: z.string().min(1, 'Выберите предмет'),
    bookId: z.string().min(1, 'Выберите книгу'),
    chapterId: z.string().min(1, 'Выберите главу'),
    topicId: z.string().optional(),
    topicTitle: z.string().optional(),
    paragraphOrder: z.coerce.number().int().min(0, 'Порядок должен быть >= 0'),
    contentText: z.string().min(1, 'Введите текст параграфа'),
    pages: z.string().min(1, 'Укажите страницы'),
    keywords: z.string().optional(),
    difficulty: z.string().optional(),
    source: z.string().optional()
  })
  .refine((data) => Boolean(data.topicId || data.topicTitle?.trim()), {
    message: 'Укажите тему или выберите существующую',
    path: ['topicTitle']
  });

type ContentForm = z.infer<typeof schema>;

export const ContentCreatePage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset
  } = useForm<ContentForm>({ resolver: zodResolver(schema) });

  const subjectId = watch('subjectId');
  const bookId = watch('bookId');
  const chapterId = watch('chapterId');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await subjectApi.getSubjects();
        setSubjects(data);
      } catch (error) {
        setServerError(getApiErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    const loadSubject = async () => {
      if (!subjectId) {
        setBooks([]);
        setChapters([]);
        setTopics([]);
        return;
      }
      try {
        const subject = await subjectApi.getSubjectById(subjectId);
        setBooks(subject.books || []);
      } catch (error) {
        setServerError(getApiErrorMessage(error));
      }
    };
    void loadSubject();
  }, [subjectId]);

  useEffect(() => {
    if (!bookId) {
      setChapters([]);
      setTopics([]);
      return;
    }
    const book = books.find((item) => item._id === bookId);
    setChapters(book?.chapters || []);
  }, [bookId, books]);

  useEffect(() => {
    if (!chapterId) {
      setTopics([]);
      return;
    }
    const chapter = chapters.find((item) => item._id === chapterId);
    setTopics(chapter?.topics || []);
  }, [chapterId, chapters]);

  const topicOptions = useMemo(() => topics, [topics]);

  const onSubmit = async (values: ContentForm) => {
    setServerError(null);
    setSuccess(null);
    try {
      let targetTopicId = values.topicId;

      if (!targetTopicId) {
        if (!values.topicTitle?.trim()) {
          throw new Error('Укажите тему');
        }
        const subject = await subjectApi.createTopic(values.subjectId, values.bookId, values.chapterId, {
          title: values.topicTitle.trim()
        });
        const createdBook = subject.books.find((book) => book._id === values.bookId);
        const createdChapter = createdBook?.chapters.find((chapter) => chapter._id === values.chapterId);
        const createdTopic = createdChapter?.topics?.[createdChapter.topics.length - 1];
        targetTopicId = createdTopic?._id;
      }

      if (!targetTopicId) {
        throw new Error('Не удалось определить тему');
      }

      const pages = values.pages
        .split(',')
        .map((page) => Number(page.trim()))
        .filter((page) => !Number.isNaN(page));

      const keywords = values.keywords
        ? values.keywords.split(',').map((item) => item.trim()).filter(Boolean)
        : [];

      await subjectApi.createParagraph(values.subjectId, values.bookId, values.chapterId, targetTopicId, {
        order: values.paragraphOrder,
        content: {
          text: values.contentText,
          pages,
          metadata: {
            keywords,
            difficulty: values.difficulty || undefined,
            source: values.source || undefined
          }
        }
      });

      setSuccess('Контент успешно добавлен');
      reset();
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="card space-y-4">
      <h1 className="section-title">Добавить контент</h1>
      {serverError ? <ErrorMessage message={serverError} /> : null}
      {subjects.length === 0 ? (
        <div className="text-sm text-slate-600">Нет предметов для выбора.</div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Select label="Предмет" error={errors.subjectId?.message} {...register('subjectId')}>
            <option value="">Выберите предмет</option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.title}
              </option>
            ))}
          </Select>
          <Select label="Книга" error={errors.bookId?.message} {...register('bookId')}>
            <option value="">Выберите книгу</option>
            {books.map((book) => (
              <option key={book._id} value={book._id}>
                {book.title}
              </option>
            ))}
          </Select>
          <Select label="Глава" error={errors.chapterId?.message} {...register('chapterId')}>
            <option value="">Выберите главу</option>
            {chapters.map((chapter) => (
              <option key={chapter._id} value={chapter._id}>
                {chapter.title}
              </option>
            ))}
          </Select>
          <Select label="Тема (если существует)" {...register('topicId')}>
            <option value="">Создать новую тему</option>
            {topicOptions.map((topic) => (
              <option key={topic._id} value={topic._id}>
                {topic.title}
              </option>
            ))}
          </Select>
          <Input label="Название темы" error={errors.topicTitle?.message} {...register('topicTitle')} />
          <Input
            label="Порядок параграфа"
            type="number"
            error={errors.paragraphOrder?.message}
            {...register('paragraphOrder')}
          />
          <Input
            label="Текст параграфа"
            error={errors.contentText?.message}
            {...register('contentText')}
          />
          <Input
            label="Страницы (через запятую)"
            error={errors.pages?.message}
            {...register('pages')}
          />
          <Input label="Ключевые слова" error={errors.keywords?.message} {...register('keywords')} />
          <Select label="Сложность" error={errors.difficulty?.message} {...register('difficulty')}>
            <option value="">Не указано</option>
            <option value="easy">Легко</option>
            <option value="medium">Средне</option>
            <option value="hard">Сложно</option>
          </Select>
          <Input label="Источник" error={errors.source?.message} {...register('source')} />
          {success ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}
          <Button type="submit" isLoading={isSubmitting}>
            Сохранить
          </Button>
        </form>
      )}
    </div>
  );
};
