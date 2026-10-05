import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl bg-white shadow-sm p-6 sm:p-8 ${className}`}>{children}</div>
  );
}