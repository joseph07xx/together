import { prisma } from '../../lib/prisma.js';
import { hashToken } from '../../lib/tokens.js';
import { env } from '../../config/env.js';

function ttlToMs(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) throw new Error(`TTL inválido: ${ttl}`);
  const value = Number(match[1]);
  const unit = match[2];
  const mult = unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
  return value * mult;
}

export async function createSession(params: {
  userId: string;
  refreshToken: string;
  userAgent?: string;
  ipAddress?: string;
}) {
  const refreshTokenHash = hashToken(params.refreshToken);
  const expiresAt = new Date(Date.now() + ttlToMs(env.JWT_REFRESH_TTL));

  return prisma.session.create({
    data: {
      userId: params.userId,
      refreshToken: refreshTokenHash,
      userAgent: params.userAgent?.slice(0, 255),
      ipAddress: params.ipAddress?.slice(0, 64),
      expiresAt,
    },
    select: { id: true },
  });
}

export async function findActiveSessionByToken(refreshToken: string) {
  const hash = hashToken(refreshToken);
  return prisma.session.findUnique({ where: { refreshToken: hash } });
}

export async function revokeSession(sessionId: string) {
  await prisma.session.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });
}

// Si detectamos reuso de un refresh token revocado,
// cerramos TODAS las sesiones del usuario.
export async function revokeAllUserSessions(userId: string) {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}