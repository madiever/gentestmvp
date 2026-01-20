import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { getApiErrorMessage } from '../../utils/error';
import { useAuth } from '../../store/auth.store';

const schema = z.object({
  fullName: z.string().min(2, 'Введите имя'),
  userName: z.string().min(3, 'Минимум 3 символа'),
  password: z.string().min(6, 'Минимум 6 символов')
});

type RegisterForm = z.infer<typeof schema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<RegisterForm>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: RegisterForm) => {
    setServerError(null);
    setSuccess(null);
    try {
      const user = await registerUser(values);
      setSuccess('Регистрация прошла успешно');
      reset();
      navigate(user.role === 'admin' ? '/admin' : '/user', { replace: true });
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <Input label="Имя и фамилия" error={errors.fullName?.message} {...register('fullName')} />
      <Input label="Логин" error={errors.userName?.message} {...register('userName')} />
      <Input
        label="Пароль"
        type="password"
        error={errors.password?.message}
        {...register('password')}
      />
      {serverError ? <ErrorMessage message={serverError} /> : null}
      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}
      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        Зарегистрироваться
      </Button>
    </form>
  );
};
