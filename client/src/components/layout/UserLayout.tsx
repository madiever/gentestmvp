import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../store/auth.store';
import { Button } from '../ui/Button';

const linkClass = ({ isActive }: { isActive: boolean }): string =>
  `rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`;

export const UserLayout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="container-page flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-sm font-semibold text-white">
              UT
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">Личный кабинет</p>
              <h2 className="text-lg font-semibold text-slate-900">{user?.fullName}</h2>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <NavLink to="/user" className={linkClass}>
              Дашборд
            </NavLink>
            <NavLink to="/user/subjects" className={linkClass}>
              Начать тест
            </NavLink>
            <Button variant="ghost" onClick={logout}>
              Выйти
            </Button>
          </div>
        </div>
      </header>
      <div className="container-page">
        <div className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          Добро пожаловать! Выберите предмет и начните тестирование.
        </div>
        <Outlet />
      </div>
    </div>
  );
};
