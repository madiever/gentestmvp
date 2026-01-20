import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { testApi } from '../../api/test.api';
import { Button } from '../../components/ui/Button';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { getApiErrorMessage } from '../../utils/error';
import { clearCurrentTest, saveLastResult, getCurrentTest } from '../../utils/session';

interface AnswerForm {
  answers: string[];
}

export const TestPage: React.FC = () => {
  const navigate = useNavigate();
  const test = getCurrentTest();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<AnswerForm>({
    defaultValues: { answers: test?.questions.map(() => '') ?? [] }
  });

  if (!test) {
    return (
      <div className="card space-y-3">
        <p className="text-sm text-slate-600">Нет активного теста.</p>
        <Link to="/user/subjects">
          <Button>Создать тест</Button>
        </Link>
      </div>
    );
  }

  const onSubmit = async (values: AnswerForm) => {
    setServerError(null);
    const hasEmpty = values.answers.some((value) => !value);
    if (hasEmpty) {
      setServerError('Ответьте на все вопросы перед отправкой.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await testApi.submitTest({
        testId: test._id,
        answers: test.questions.map((question, index) => ({
          questionText: question.questionText,
          selectedOption: values.answers[index]
        }))
      });
      saveLastResult(result);
      clearCurrentTest();
      navigate('/user/test/result');
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="section-title">Тест</h1>
      {serverError ? <ErrorMessage message={serverError} /> : null}
      {errors.answers ? <ErrorMessage message="Ответьте на все вопросы" /> : null}

      <div className="space-y-4">
        {test.questions.map((question, index) => (
          <div key={question.questionText} className="card space-y-3">
            <p className="text-sm font-medium text-slate-900">
              {index + 1}. {question.questionText}
            </p>
            <div className="space-y-2">
              {question.options.map((option) => (
                <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    value={option}
                    {...register(`answers.${index}` as const)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button type="submit" isLoading={submitting}>
        Завершить тест
      </Button>
    </form>
  );
};
