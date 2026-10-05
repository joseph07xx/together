import { prisma } from '../lib/prisma.js';

async function main() {
  const userCount = await prisma.user.count();
  const coupleCount = await prisma.couple.count();
  const statusCount = await prisma.status.count();
  const locationCount = await prisma.location.count();
  const privacyCount = await prisma.privacySettings.count();

  console.log('[smoke] Conexión a PostgreSQL OK');
  console.log(`[smoke] users=${userCount}`);
  console.log(`[smoke] couples=${coupleCount}`);
  console.log(`[smoke] statuses=${statusCount}`);
  console.log(`[smoke] locations=${locationCount}`);
  console.log(`[smoke] privacy=${privacyCount}`);
}

main()
  .catch((err) => {
    console.error('[smoke] Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });