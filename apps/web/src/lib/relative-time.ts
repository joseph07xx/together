/**
 * Devuelve una cadena en español tipo "hace 2 min", "hace 1 h", "hace 3 días".
 * Para intervalos < 60s devuelve "hace unos segundos".
 */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  const diffMs = now.getTime() - then;

  if (diffMs < 0) return 'ahora';
  const sec = Math.floor(diffMs / 1000);
  if (sec < 10) return 'hace unos segundos';
  if (sec < 60) return `hace ${sec} s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `hace ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  const days = Math.floor(hr / 24);
  if (days === 1) return 'hace 1 día';
  if (days < 7) return `hace ${days} días`;
  return new Date(iso).toLocaleDateString();
}

/**
 * Igual que formatRelative pero desde el punto de vista "Desde hace X".
 * Se usa para el tiempo activo del estado.
 */
export function formatElapsed(iso: string, now: Date = new Date()): string {
  const rel = formatRelative(iso, now);
  // "hace 42 min" → "42 min"
  return rel.replace(/^hace\s+/, '');
}

export function formatLastSeen(iso: string, now: Date = new Date()): string {
  const rel = formatRelative(iso, now);
  // "hace 2 min" → "Última conexión hace 2 min"
  return `Última conexión ${rel}`;
}