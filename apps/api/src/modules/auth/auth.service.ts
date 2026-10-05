import crypto from 'node:crypto';
import { prisma } from '../../lib/prisma.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt.js';
import { hashToken } from '../../lib/tokens.js';
import { env } from '../../config/env.js';
import { conflict, unauthorized } from '../../utils/errors.js';
import {
  findActiveSessionByToken,
  revokeAllUserSessions,
  revokeSession,
} from './session.service.js';

function ttlToMs(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) throw new Error(`TTL inválido: ${ttl}`);
  const value = Number(match[1]);
  const unit = match[2];
  const mult = unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
  return value * mult;
}

export async function registerUser(input: {
  email: string;
  password: string;
  displayName: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw conflict('Ya existe una cuenta con ese correo');

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      displayName: input.displayName,
      privacy: {
        create: {
          shareLocation: false,
          shareStatus: true,
          shareLastSeen: true,
          paused: false,
        },
      },
    },
    select: { id: true, email: true, displayName: true },
  });

  return user;
}

export async function loginUser(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw unauthorized('Credenciales inválidas');

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) throw unauthorized('Credenciales inválidas');

  await prisma.user.update({
    where: { id: user.id },
    data: { lastSeenAt: new Date() },
  });

  return { id: user.id, email: user.email, displayName: user.displayName };
}

export async function issueTokens(params: {
  userId: string;
  userAgent?: string;
  ipAddress?: string;
}) {
  const sessionId = crypto.randomUUID();

  const accessToken = signAccessToken(params.userId);
  const refreshToken = signRefreshToken(params.userId, sessionId);

  const expiresAt = new Date(Date.now() + ttlToMs(env.JWT_REFRESH_TTL));

  await prisma.session.create({
    data: {
      id: sessionId,
      userId: params.userId,
      refreshToken: hashToken(refreshToken),
      userAgent: params.userAgent?.slice(0, 255),
      ipAddress: params.ipAddress?.slice(0, 64),
      expiresAt,
    },
  });

  return { accessToken, refreshToken, sessionId };
}

export async function rotateRefreshToken(params: {
  currentRefreshToken: string;
  userAgent?: string;
  ipAddress?: string;
}) {
  let payload;
  try {
    payload = verifyRefreshToken(params.currentRefreshToken);
  } catch {
    throw unauthorized('Refresh token inválido o expirado');
  }

  const session = await findActiveSessionByToken(params.currentRefreshToken);
  if (!session) throw unauthorized('Sesión no encontrada');

  if (session.revokedAt) {
    // Reuso: revocamos todo y forzamos login
    await revokeAllUserSessions(session.userId);
    throw unauthorized('Sesión revocada. Vuelve a iniciar sesión.');
  }

  if (session.expiresAt.getTime() < Date.now()) {
    await revokeSession(session.id);
    throw unauthorized('Sesión expirada');
  }

  await revokeSession(session.id);

  return issueTokens({
    userId: payload.sub,
    userAgent: params.userAgent,
    ipAddress: params.ipAddress,
  });
}

export async function logoutByRefreshToken(refreshToken: string) {
  const session = await findActiveSessionByToken(refreshToken);
  if (session && !session.revokedAt) {
    await revokeSession(session.id);
  }
}