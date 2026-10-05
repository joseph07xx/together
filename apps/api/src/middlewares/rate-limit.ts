import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

function keyByUser(req: Request): string {
  return req.user?.id ?? req.ip ?? '0.0.0.0';
}

// 20 intentos cada 15 min por IP en login/register
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Demasiados intentos, intenta más tarde',
    },
  },
});

// 60 escrituras cada 5 min por usuario en PUT /status, /location, /privacy
export const writeRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 60,
  keyGenerator: keyByUser,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Vas demasiado rápido, espera un momento',
    },
  },
});

// 10 intentos cada 15 min por usuario en POST /couples/join (evita fuerza bruta de códigos)
export const joinRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: keyByUser,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Demasiados intentos, intenta más tarde',
    },
  },
});