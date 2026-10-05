import type { RequestHandler } from 'express';
import { loginSchema, registerSchema } from '@together/shared';
import {
  issueTokens,
  loginUser,
  logoutByRefreshToken,
  registerUser,
  rotateRefreshToken,
} from './auth.service.js';
import { setAuthCookies, clearAuthCookies, REFRESH_COOKIE } from '../../lib/cookies.js';
import { unauthorized } from '../../utils/errors.js';
import { prisma } from '../../lib/prisma.js';

function clientInfo(req: Parameters<RequestHandler>[0]) {
  return {
    userAgent: req.header('user-agent') ?? undefined,
    ipAddress: req.ip ?? undefined,
  };
}

export const registerHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const user = await registerUser(input);
    const tokens = await issueTokens({ userId: user.id, ...clientInfo(req) });
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
};

export const loginHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await loginUser(input);
    const tokens = await issueTokens({ userId: user.id, ...clientInfo(req) });
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

export const refreshHandler: RequestHandler = async (req, res, next) => {
  try {
    const current = req.cookies?.[REFRESH_COOKIE];
    if (!current) throw unauthorized('Refresh token ausente');

    const tokens = await rotateRefreshToken({
      currentRefreshToken: current,
      ...clientInfo(req),
    });
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    res.json({ ok: true });
  } catch (err) {
    clearAuthCookies(res);
    next(err);
  }
};

export const logoutHandler: RequestHandler = async (req, res, next) => {
  try {
    const current = req.cookies?.[REFRESH_COOKIE];
    if (current) await logoutByRefreshToken(current);
    clearAuthCookies(res);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

export const meHandler: RequestHandler = async (req, res, next) => {
  try {
    // requireAuth garantiza req.user
    const user = req.user!;
    const full = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
        lastSeenAt: true,
        privacy: {
          select: {
            shareLocation: true,
            shareStatus: true,
            shareLastSeen: true,
            paused: true,
          },
        },
      },
    });
    res.json({ user: full });
  } catch (err) {
    next(err);
  }
};