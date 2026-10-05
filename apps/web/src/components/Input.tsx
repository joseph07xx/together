import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, id, className = '', ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  return (
    <label htmlFor={inputId} className="block space-y-1">
      <span className="text-sm font-medium text-ink-700">{label}</span>
      <input
        ref={ref}
        id={inputId}
        {...rest}
        className={`w-full rounded-2xl border border-ink-100 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-700/40 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-200 ${
          error ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''
        } ${className}`}
      />
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </label>
  );
});