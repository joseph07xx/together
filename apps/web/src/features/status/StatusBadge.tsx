import type { StatusView } from '../../api/status';
import { formatElapsed } from '../../lib/relative-time';
import { useNow } from '../../hooks/useNow';

export function StatusBadge({ status }: { status: StatusView }) {
  const now = useNow();
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2 text-lg font-medium text-ink-900">
        <span aria-hidden>{status.emoji}</span>
        <span>{status.label}</span>
      </div>
      <div className="text-xs text-ink-700/70">
        Desde hace {formatElapsed(status.startedAt, now)}
      </div>
    </div>
  );
}