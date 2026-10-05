import type { Response } from 'express';
import { env } from '../config/env.js';

export const ACCESS_COOKIE = 'together_at';
export const REFRESH_COOKIE = 'together_rt';

const isProd = env.NODE_ENV === 'production';

// Access token: 15 min. Refresh: 7 días.
function ttlToMs(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) throw new Error(`TTL inválido: ${ttl}`);
  const value = Number(match[1]);
  const unit = match[2];
  const mult = unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
  return value * mult;
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: ttlToMs(env.JWT_ACCESS_TTL),
  });

  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/auth/refresh', // cookie solo viaja a este endpoint
    maxAge: ttlToMs(env.JWT_REFRESH_TTL),
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_COOKIE, { path: '/auth/refresh' });
}