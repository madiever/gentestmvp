import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { subjectApi } from '../../api/subject.api';
import { Book, Subject } from '../../types/subject.types';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Loader } from '../../components/ui/Loader';
import { getApiErrorMessage } from '../../utils/error';

const schema = z.object({
  subjectId: z.string().min(1, 'Выберите предмет'),
  bookId: z.string().min(1, 'Выберите книгу'),
  title: z.string().min(1, 'Введите название главы'),
  order: z.coerce.number().int().min(0, 'Порядок должен быть >= 0')
});

type ChapterForm = z.infer<typeof schema>;

export const ChapterCreatePage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset
  } = useForm<ChapterForm>({ resolver: zodResolver(schema) });

  const subjectId = watch('subjectId');

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
    const loadBooks = async () => {
      if (!subjectId) {
        setBooks([]);
        return;
      }
      try {
        const subject = await subjectApi.getSubjectById(subjectId);
        setBooks(subject.books || []);
      } catch (error) {
        setServerError(getApiErrorMessage(error));
      }
    };
    void loadBooks();
  }, [subjectId]);

  const onSubmit = async (values: ChapterForm) => {
    setServerError(null);
    setSuccess(null);
    try {
      await subjectApi.createChapter(values.subjectId, values.bookId, {
        title: values.title,
        order: values.order
      });
      setSuccess('Глава успешно добавлена');
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
      <h1 className="section-title">Добавить главу</h1>
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
          <Input label="Название главы" error={errors.title?.message} {...register('title')} />
          <Input label="Порядок" type="number" error={errors.order?.message} {...register('order')} />
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
