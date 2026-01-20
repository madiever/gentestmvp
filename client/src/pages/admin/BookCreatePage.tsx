import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { subjectApi } from '../../api/subject.api';
import { Subject } from '../../types/subject.types';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Loader } from '../../components/ui/Loader';
import { getApiErrorMessage } from '../../utils/error';

const schema = z.object({
  subjectId: z.string().min(1, 'Выберите предмет'),
  title: z.string().min(1, 'Введите название книги'),
  author: z.string().optional()
});

type BookForm = z.infer<typeof schema>;

export const BookCreatePage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<BookForm>({ resolver: zodResolver(schema) });

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

  const onSubmit = async (values: BookForm) => {
    setServerError(null);
    setSuccess(null);
    try {
      await subjectApi.createBook(values.subjectId, {
        title: values.title,
        author: values.author
      });
      setSuccess('Книга успешно добавлена');
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
      <h1 className="section-title">Добавить книгу</h1>
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
          <Input label="Название книги" error={errors.title?.message} {...register('title')} />
          <Input label="Автор" error={errors.author?.message} {...register('author')} />
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
