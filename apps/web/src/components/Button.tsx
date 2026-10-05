import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
  loading?: boolean;
};

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className = '',
  ...rest
}: Props) {
  const base =
    'inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed';
  const styles =
    variant === 'primary'
      ? 'bg-rose-500 text-white hover:bg-rose-600 active:scale-[0.98] shadow-sm'
      : 'bg-transparent text-ink-700 hover:bg-ink-100';

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`${base} ${styles} ${className}`}
    >
      {loading ? 'Un momento…' : children}
    </button>
  );
}