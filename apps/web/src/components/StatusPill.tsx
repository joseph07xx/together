import { formatElapsed } from '../lib/relative-time';
import { useNow } from '../hooks/useNow';

type Props = {
  emoji: string;
  label: string;
  startedAt?: string;
  size?: 'sm' | 'md';
};

export function StatusPill({ emoji, label, startedAt, size = 'md' }: Props) {
  const now = useNow();

  const text = size === 'sm' ? 'text-sm' : 'text-base';
  const emojiSize = size === 'sm' ? 'text-base' : 'text-lg';

  return (
    <div className="inline-flex flex-col items-center gap-0.5">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-3 py-1 font-medium text-ink-900 ${text}`}
      >
        <span aria-hidden className={emojiSize}>
          {emoji}
        </span>
        <span className="truncate max-w-[12rem]">{label}</span>
      </span>
      {startedAt ? (
        <span className="text-xs text-ink-700/70">
          Desde hace {formatElapsed(startedAt, now)}
        </span>
      ) : null}
    </div>
  );
}