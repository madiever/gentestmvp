import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { subjectApi } from '../../api/subject.api';
import { Subject } from '../../types/subject.types';
import { Loader } from '../../components/ui/Loader';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { getApiErrorMessage } from '../../utils/error';

export const AdminDashboard: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await subjectApi.getSubjects();
        setSubjects(data);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="section-title">Предметы</h1>
        <Link to="/admin/subjects/new">
          <Button>Добавить предмет</Button>
        </Link>
      </div>

      {loading ? <Loader /> : null}
      {error ? <ErrorMessage message={error} /> : null}

      {!loading && !error && subjects.length === 0 ? (
        <div className="card text-sm text-slate-600">Пока нет предметов. Создайте первый.</div>
      ) : null}

      {!loading && !error && subjects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {subjects.map((subject) => (
            <div key={subject._id} className="card space-y-2">
              <h2 className="text-lg font-semibold text-slate-900">{subject.title}</h2>
              <p className="text-sm text-slate-600">{subject.description || 'Без описания'}</p>
              <p className="text-xs text-slate-500">Книг: {subject.books?.length ?? 0}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
