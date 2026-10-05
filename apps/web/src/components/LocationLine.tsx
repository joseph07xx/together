import { formatElapsed } from '../lib/relative-time';
import { useNow } from '../hooks/useNow';

type Props = {
  placeLabel: string | null;
  latitude: number;
  longitude: number;
  updatedAt: string;
};

export function LocationLine({ placeLabel, latitude, longitude, updatedAt }: Props) {
  const now = useNow();
  const coords = `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
  return (
    <div className="flex flex-col items-center gap-0.5 text-xs">
      <span className="inline-flex items-center gap-1 font-medium text-ink-900">
        <span aria-hidden>📍</span>
        <span className="truncate max-w-[12rem]">{placeLabel ?? coords}</span>
      </span>
      <span className="text-ink-700/70">
        Actualizada hace {formatElapsed(updatedAt, now)}
      </span>
    </div>
  );
}