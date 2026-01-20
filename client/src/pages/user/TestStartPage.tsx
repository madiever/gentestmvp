import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { subjectApi } from '../../api/subject.api';
import { testApi } from '../../api/test.api';
import { Subject } from '../../types/subject.types';
import { Loader } from '../../components/ui/Loader';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { getApiErrorMessage } from '../../utils/error';
import { saveCurrentTest } from '../../utils/session';

interface LocationState {
  subjectId?: string;
  bookId?: string;
  chapterId?: string;
  fullBook?: boolean;
}

export const TestStartPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  const subjectId = state?.subjectId;
  const bookId = state?.bookId;
  const chapterId = state?.chapterId;
  const fullBook = state?.fullBook ?? false;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subjectId) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await subjectApi.getSubjectById(subjectId);
        setSubject(data);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [subjectId]);

  if (!subjectId || !bookId) {
    return (
      <div className="card space-y-3">
        <p className="text-sm text-slate-600">Нет данных для старта теста.</p>
        <Link to="/user/subjects">
          <Button>Выбрать предмет</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const book = subject?.books.find((item) => item._id === bookId);
  const chapter = book?.chapters.find((item) => item._id === chapterId);

  const handleGenerate = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const test = await testApi.generateTest({
        subjectId,
        bookId,
        chapterId: fullBook ? undefined : chapterId,
        fullBook
      });
      saveCurrentTest(test);
      navigate('/user/test');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card space-y-4">
      <h1 className="section-title">Подтверждение</h1>
      <div className="text-sm text-slate-600">
        <p>Предмет: {subject?.title}</p>
        <p>Книга: {book?.title}</p>
        <p>Режим: {fullBook ? 'По всей книге' : `Глава: ${chapter?.title}`}</p>
      </div>
      {error ? <ErrorMessage message={error} /> : null}
      <Button isLoading={submitting} onClick={handleGenerate}>
        Сгенерировать тест
      </Button>
    </div>
  );
};
