import { formatRelative } from '../lib/relative-time';
import { useNow } from '../hooks/useNow';

type Props = {
  online: boolean;
  lastSeenAt: string;
};

export function PresencePill({ online, lastSeenAt }: Props) {
  const now = useNow();

  if (online) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700">
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse-soft"
        />
        En línea
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-700/70">
      <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-ink-200" />
      {formatRelative(lastSeenAt, now)}
    </span>
  );
}