import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <label className="flex w-full flex-col gap-2 text-sm font-medium text-slate-700">
        <span>{label}</span>
        <input
          ref={ref}
          className={`w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none ${
            className
          }`}
          {...props}
        />
        {error ? <span className="text-xs text-red-600">{error}</span> : null}
      </label>
    );
  }
);

Input.displayName = 'Input';
