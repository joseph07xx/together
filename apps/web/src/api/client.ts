import type { z } from 'zod';

const API_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Evita el refresh automático (para /auth/login, /auth/register, etc.) */
  skipRefresh?: boolean;
};

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  // Evita múltiples refreshes en paralelo
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        return res.ok;
      } catch {
        return false;
      } finally {
        // Liberamos en el siguiente tick para que todos los que esperaban reciban el resultado
        setTimeout(() => {
          refreshPromise = null;
        }, 0);
      }
    })();
  }
  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const doRequest = async (): Promise<Response> => {
    const headers: Record<string, string> = {};
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';

    return fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      credentials: 'include',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  };

  let res = await doRequest();

  if (res.status === 401 && !options.skipRefresh && path !== '/auth/refresh') {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await doRequest();
    }
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const error = data?.error ?? {};
    throw new ApiError(
      res.status,
      error.code ?? 'UNKNOWN',
      error.message ?? 'Error de red',
      error.details,
    );
  }

  return data as T;
}

/** Helper para validar la respuesta con Zod en desarrollo */
export function parseWith<T>(schema: z.ZodType<T>, data: unknown): T {
  return schema.parse(data);
}