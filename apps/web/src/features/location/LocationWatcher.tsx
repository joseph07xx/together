import { useEffect, useRef } from 'react';
import { usePrivacy } from '../privacy/usePrivacy';
import { usePutLocation } from './useLocation';
import { ApiError } from '../../api/client';

const MIN_INTERVAL_MS = 30_000;
const MIN_DISTANCE_M = 50;

function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function LocationWatcher() {
  const { data: privacy } = usePrivacy();
  const putLocation = usePutLocation();
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<{ at: number; lat: number; lng: number } | null>(null);

  useEffect(() => {
    const enabled = privacy?.shareLocation && !privacy.paused;

    if (!enabled) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!('geolocation' in navigator)) {
      console.warn('[location] Geolocalización no soportada');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        const last = lastSentRef.current;
        const tooSoon = last && now - last.at < MIN_INTERVAL_MS;
        const tooClose =
          last &&
          distanceMeters(
            { lat: last.lat, lng: last.lng },
            { lat: pos.coords.latitude, lng: pos.coords.longitude },
          ) < MIN_DISTANCE_M;
        if (tooSoon && tooClose) return;

        lastSentRef.current = {
          at: now,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        putLocation.mutate(
          {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          },
          {
            onError: (err) => {
              if (err instanceof ApiError && err.status === 403) {
                // El backend nos dice que no podemos: probablemente paused cambió.
                // No hacemos nada, el próximo render del hook reaccionará.
              }
            },
          },
        );
      },
      (err) => {
        console.warn('[location] Error de geolocalización:', err.message);
      },
      {
        enableHighAccuracy: false,
        maximumAge: 15_000,
        timeout: 20_000,
      },
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [privacy?.shareLocation, privacy?.paused, putLocation]);

  return null;
}