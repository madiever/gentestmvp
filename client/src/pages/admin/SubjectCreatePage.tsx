import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { subjectApi } from '../../api/subject.api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { getApiErrorMessage } from '../../utils/error';

const schema = z.object({
  title: z.string().min(1, 'Укажите название'),
  description: z.string().optional()
});

type SubjectForm = z.infer<typeof schema>;

export const SubjectCreatePage: React.FC = () => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<SubjectForm>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: SubjectForm) => {
    setServerError(null);
    setSuccess(null);
    try {
      await subjectApi.createSubject(values);
      setSuccess('Предмет успешно создан');
      reset();
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  };

  return (
    <div className="card space-y-4">
      <h1 className="section-title">Добавить предмет</h1>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input label="Название" error={errors.title?.message} {...register('title')} />
        <Input label="Описание" error={errors.description?.message} {...register('description')} />
        {serverError ? <ErrorMessage message={serverError} /> : null}
        {success ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}
        <Button type="submit" isLoading={isSubmitting}>
          Сохранить
        </Button>
      </form>
    </div>
  );
};
