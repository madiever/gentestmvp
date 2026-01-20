import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { testApi } from '../../api/test.api';
import { TestHistoryItem } from '../../types/test.types';
import { Loader } from '../../components/ui/Loader';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { getApiErrorMessage } from '../../utils/error';
import { useAuth } from '../../store/auth.store';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<TestHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await testApi.getMyTests();
        setHistory(data);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="card space-y-2">
        <h1 className="section-title">Здравствуйте, {user?.fullName}</h1>
        <p className="text-sm text-slate-600">Готовы проверить знания? Запустите новый тест.</p>
        <Link to="/user/subjects">
          <Button>Начать тест</Button>
        </Link>
      </div>

      <div className="space-y-4">
        <h2 className="section-title">История тестов</h2>
        {loading ? <Loader /> : null}
        {error ? <ErrorMessage message={error} /> : null}
        {!loading && !error && history.length === 0 ? (
          <div className="card text-sm text-slate-600">Пока нет результатов тестов.</div>
        ) : null}
        {!loading && !error && history.length > 0 ? (
          <div className="grid gap-3">
            {history.map((item) => (
              <div key={item._id} className="card flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {item.subjectTitle ?? 'Предмет'} • {item.bookTitle ?? 'Книга'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleString('ru-RU')}
                  </p>
                </div>
                <div className="text-sm font-semibold text-blue-600">{item.scorePercent}%</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};
