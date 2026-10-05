import { prisma } from '../../lib/prisma.js';
import { notFound } from '../../utils/errors.js';
import { emitToCouple } from '../realtime/socket.registry.js';

export type PrivacyView = {
  shareLocation: boolean;
  shareStatus: boolean;
  shareLastSeen: boolean;
  paused: boolean;
};

function toView(p: {
  shareLocation: boolean;
  shareStatus: boolean;
  shareLastSeen: boolean;
  paused: boolean;
}): PrivacyView {
  return {
    shareLocation: p.shareLocation,
    shareStatus: p.shareStatus,
    shareLastSeen: p.shareLastSeen,
    paused: p.paused,
  };
}

export async function getPrivacy(
  userId: string,
): Promise<PrivacyView> {
  const p = await prisma.privacySettings.findUnique({
    where: { userId },
  });

  if (!p) {
    throw notFound('Preferencias no encontradas');
  }

  return toView(p);
}

export async function updatePrivacy(
  userId: string,
  input: Partial<PrivacyView>,
): Promise<PrivacyView> {
  const p = await prisma.privacySettings.update({
    where: { userId },
    data: input,
  });

  const couple = await prisma.couple.findFirst({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    select: {
      id: true,
      userBId: true,
    },
  });

  if (couple && couple.userBId) {
    emitToCouple(couple.id, 'partner:privacy', {
      shareLocation: p.shareLocation,
      shareStatus: p.shareStatus,
      shareLastSeen: p.shareLastSeen,
      paused: p.paused,
    });
  }

  return toView(p);
}