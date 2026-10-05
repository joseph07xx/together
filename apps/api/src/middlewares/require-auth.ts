import type { RequestHandler } from 'express';
import { verifyAccessToken } from '../lib/jwt.js';
import { ACCESS_COOKIE } from '../lib/cookies.js';
import { unauthorized } from '../utils/errors.js';
import { prisma } from '../lib/prisma.js';

// Extendemos Request con `user`.
// Mantenemos aquí el tipo mínimo que necesitamos.
export type AuthedUser = {
  id: string;
  email: string;
  displayName: string;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthedUser;
    }
  }
}

function extractToken(headerValue: string | undefined, cookieValue: string | undefined): string | null {
  if (cookieValue) return cookieValue;
  if (headerValue?.startsWith('Bearer ')) return headerValue.slice(7).trim();
  return null;
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = extractToken(req.header('authorization') ?? undefined, req.cookies?.[ACCESS_COOKIE]);
    if (!token) throw unauthorized('Token no presente');

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw unauthorized('Token inválido o expirado');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, displayName: true },
    });
    if (!user) throw unauthorized('Usuario no encontrado');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};