import jwt, { type SignOptions } from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../config/env.js';

export type AccessPayload = {
  sub: string; // userId
  type: 'access';
  jti: string; // id único del token, evita colisiones en el mismo segundo
};

export type RefreshPayload = {
  sub: string; // userId
  sid: string; // sessionId
  type: 'refresh';
  jti: string;
};

export function signAccessToken(userId: string): string {
  const payload: AccessPayload = {
    sub: userId,
    type: 'access',
    jti: crypto.randomUUID(),
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL as SignOptions['expiresIn'],
  });
}

export function signRefreshToken(userId: string, sessionId: string): string {
  const payload: RefreshPayload = {
    sub: userId,
    sid: sessionId,
    type: 'refresh',
    jti: crypto.randomUUID(),
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL as SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  if (typeof decoded !== 'object' || decoded === null || (decoded as any).type !== 'access') {
    throw new Error('Invalid access token');
  }
  return decoded as AccessPayload;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  if (typeof decoded !== 'object' || decoded === null || (decoded as any).type !== 'refresh') {
    throw new Error('Invalid refresh token');
  }
  return decoded as RefreshPayload;
}