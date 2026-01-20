import React from 'react';

const variants: Record<'primary' | 'secondary' | 'ghost', string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-slate-200 text-slate-900 hover:bg-slate-300',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100'
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  isLoading = false,
  className = '',
  disabled,
  children,
  ...props
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition ${
        variants[variant]
      } ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
    >
      {isLoading ? 'Загрузка...' : children}
    </button>
  );
};
