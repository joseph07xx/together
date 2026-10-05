import { prisma } from './prisma.js';

const INTERVAL_MS = 60 * 60 * 1000; // 1 hora

async function runCleanup(): Promise<void> {
  const now = new Date();
  try {
    const [sessions, invites] = await prisma.$transaction([
      prisma.session.deleteMany({
        where: {
          OR: [{ expiresAt: { lt: now } }, { revokedAt: { not: null } }],
        },
      }),
      prisma.inviteCode.deleteMany({
        where: { expiresAt: { lt: now } },
      }),
    ]);

    if (sessions.count > 0 || invites.count > 0) {
      console.log(
        `[cleanup] sessions=${sessions.count} invites=${invites.count}`,
      );
    }
  } catch (err) {
    console.error('[cleanup] error', err);
  }
}

export function startCleanupJob(): void {
  // Primera ejecución a los 30 s (deja arrancar la API)
  setTimeout(runCleanup, 30_000);
  // Y luego cada hora
  setInterval(runCleanup, INTERVAL_MS);
}