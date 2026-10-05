/**
 * Geocoding inverso con Nominatim (OpenStreetMap).
 * Sin API key. Requiere User-Agent identificable y rate limit ~1 req/s.
 * Cache en memoria por celda aproximada de 1 km².
 */

const USER_AGENT = 'TogetherApp/0.1 (contact: dev@together.local)';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora
const NOMINATIM_TIMEOUT_MS = 3000;

type CacheEntry = { label: string | null; expiresAt: number };

const cache = new Map<string, CacheEntry>();

// Serializamos las llamadas a Nominatim para no exceder 1 req/s.
let lastCallAt = 0;
const MIN_INTERVAL_MS = 1000;

function cacheKey(lat: number, lng: number): string {
  // Redondeo a 2 decimales ≈ 1.1 km en latitud, ~0.9 km en longitud a 45°.
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

async function waitForSlot(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastCallAt;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - elapsed));
  }
  lastCallAt = Date.now();
}

type NominatimAddress = {
  road?: string;
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
  country?: string;
};

type NominatimResponse = {
  display_name?: string;
  address?: NominatimAddress;
  error?: string;
};

function simplify(response: NominatimResponse): string | null {
  const a = response.address;
  if (!a) return null;

  // Preferimos una etiqueta corta y humana
  const street = a.road ?? a.neighbourhood ?? a.suburb;
  const city = a.city ?? a.town ?? a.village ?? a.municipality;

  if (street && city) return `${street}, ${city}`;
  if (city) return city;
  if (a.state) return a.state;
  if (a.country) return a.country;

  // Fallback al display_name truncado
  if (response.display_name) {
    const parts = response.display_name.split(',').map((p) => p.trim());
    return parts.slice(0, 2).join(', ');
  }
  return null;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const key = cacheKey(lat, lng);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.label;
  }

  await waitForSlot();

  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'json');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('zoom', '16');
  url.searchParams.set('addressdetails', '1');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NOMINATIM_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'es' },
      signal: controller.signal,
    });
    if (!res.ok) {
      cache.set(key, { label: null, expiresAt: Date.now() + CACHE_TTL_MS });
      return null;
    }
    const data = (await res.json()) as NominatimResponse;
    if (data.error) {
      cache.set(key, { label: null, expiresAt: Date.now() + CACHE_TTL_MS });
      return null;
    }
    const label = simplify(data);
    cache.set(key, { label, expiresAt: Date.now() + CACHE_TTL_MS });
    return label;
  } catch {
    // Silencioso: la ubicación se guarda sin placeLabel
    cache.set(key, { label: null, expiresAt: Date.now() + CACHE_TTL_MS });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}