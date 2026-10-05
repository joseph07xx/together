import { useEffect, useState } from 'react';

/**
 * Devuelve la hora actual, refrescada cada `intervalMs`.
 * Sirve para que los textos "hace X" se actualicen sin tocar el servidor.
 */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}