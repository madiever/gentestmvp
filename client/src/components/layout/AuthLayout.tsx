import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const linkClass = ({ isActive }: { isActive: boolean }): string =>
  `text-sm font-medium ${isActive ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'}`;

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container-page flex min-h-screen flex-col justify-center">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-slate-900">AI Test Platform</h1>
            <p className="mt-2 text-sm text-slate-500">Войдите или создайте аккаунт</p>
          </div>
          <div className="flex items-center justify-center gap-4">
            <NavLink to="/login" className={linkClass}>
              Вход
            </NavLink>
            <NavLink to="/register" className={linkClass}>
              Регистрация
            </NavLink>
          </div>
          <div className="card">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};
