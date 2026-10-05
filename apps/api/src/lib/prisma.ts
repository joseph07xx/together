import { PrismaClient } from '@prisma/client';

const isDev = process.env.NODE_ENV !== 'production';

// Evitamos múltiples instancias en dev con hot-reload de tsx
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: isDev ? ['warn', 'error'] : ['error'],
  });

if (isDev) {
  global.__prisma = prisma;
}