import { formatRelative } from '../lib/relative-time';
import { useNow } from '../hooks/useNow';

type Props = {
  timestamps: (string | null | undefined)[];
};

export function LastUpdatedLine({ timestamps }: Props) {
  const now = useNow();

  const latest = timestamps
    .filter((t): t is string => typeof t === 'string')
    .map((t) => new Date(t).getTime())
    .reduce<number | null>((acc, t) => (acc === null || t > acc ? t : acc), null);

  if (latest === null) return null;

  return (
    <p className="text-center text-xs text-ink-700/60">
      Última actualización: {formatRelative(new Date(latest).toISOString(), now)}
    </p>
  );
}