import type { ReactNode } from 'react';

type Props = {
  icon?: ReactNode;
  title: string;
  hint?: string;
};

export function EmptyState({ icon, title, hint }: Props) {
  return (
    <div className="flex flex-col items-center gap-1 text-center px-2">
      {icon ? <div className="text-xl opacity-70">{icon}</div> : null}
      <p className="text-xs font-medium text-ink-700">{title}</p>
      {hint ? <p className="text-[11px] text-ink-700/60">{hint}</p> : null}
    </div>
  );
}