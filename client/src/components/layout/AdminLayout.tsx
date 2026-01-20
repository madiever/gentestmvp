import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../store/auth.store';
import { Button } from '../ui/Button';

const linkClass = ({ isActive }: { isActive: boolean }): string =>
  `rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`;

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="container-page flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white">
              AI
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">Админ-панель</p>
              <h2 className="text-lg font-semibold text-slate-900">{user?.fullName}</h2>
            </div>
          </div>
          <Button variant="ghost" onClick={logout}>
            Выйти
          </Button>
        </div>
      </header>
      <div className="container-page grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Навигация</p>
            <div className="space-y-2">
              <NavLink to="/admin" className={linkClass}>
                Дашборд
              </NavLink>
              <NavLink to="/admin/subjects/new" className={linkClass}>
                Добавить предмет
              </NavLink>
              <NavLink to="/admin/books/new" className={linkClass}>
                Добавить книгу
              </NavLink>
              <NavLink to="/admin/chapters/new" className={linkClass}>
                Добавить главу
              </NavLink>
              <NavLink to="/admin/contents/new" className={linkClass}>
                Добавить контент
              </NavLink>
            </div>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
            Управляйте структурой контента и следите за качеством учебных материалов.
          </div>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
