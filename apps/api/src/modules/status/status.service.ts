import { prisma } from '../../lib/prisma.js';
import { findStatusByKey, CUSTOM_KEY } from '@together/shared';
import { badRequest } from '../../utils/errors.js';
import { emitToCouple } from '../realtime/socket.registry.js';

export type StatusView = {
  key: string;
  emoji: string;
  label: string;
  startedAt: string;
  updatedAt: string;
};

function toView(s: {
  key: string;
  emoji: string;
  label: string;
  startedAt: Date;
  updatedAt: Date;
}): StatusView {
  return {
    key: s.key,
    emoji: s.emoji,
    label: s.label,
    startedAt: s.startedAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

async function findCoupleForUser(userId: string) {
  const couple = await prisma.couple.findFirst({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    select: {
      id: true,
      userAId: true,
      userBId: true,
    },
  });

  if (!couple || !couple.userBId) {
    return null;
  }

  return couple;
}

// PUT /status
export async function setStatus(
  userId: string,
  input: {
    key: string;
    label?: string;
    emoji?: string;
  },
): Promise<StatusView> {
  let emoji: string;
  let label: string;

  if (input.key === CUSTOM_KEY) {
    emoji = input.emoji!;
    label = input.label!;
  } else {
    const def = findStatusByKey(input.key);

    if (!def) {
      throw badRequest('Estado desconocido');
    }

    emoji = input.emoji ?? def.emoji;
    label = input.label ?? def.label;
  }

  const existing = await prisma.status.findUnique({
    where: { userId },
  });

  const now = new Date();

  const startedAt =
    existing && existing.key === input.key
      ? existing.startedAt
      : now;

  const status = await prisma.status.upsert({
    where: {
      userId,
    },
    create: {
      userId,
      key: input.key,
      emoji,
      label,
      startedAt: now,
    },
    update: {
      key: input.key,
      emoji,
      label,
      startedAt,
    },
  });

  const couple = await findCoupleForUser(userId);

  if (couple) {
    emitToCouple(couple.id, 'partner:status', {
      status: toView(status),
    });
  }

  return toView(status);
}

// GET /status/me
export async function getMyStatus(
  userId: string,
): Promise<StatusView | null> {
  const status = await prisma.status.findUnique({
    where: { userId },
  });

  return status ? toView(status) : null;
}

// GET /status/partner
export type PartnerStatusResult =
  | {
      shared: false;
      reason:
        | 'no_couple'
        | 'partner_hidden'
        | 'paused'
        | 'no_status';
    }
  | {
      shared: true;
      status: StatusView;
    };

export async function getPartnerStatus(
  userId: string,
): Promise<PartnerStatusResult> {
  const couple = await prisma.couple.findFirst({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    select: {
      userAId: true,
      userBId: true,
    },
  });

  if (!couple || !couple.userBId) {
    return {
      shared: false,
      reason: 'no_couple',
    };
  }

  const partnerId =
    couple.userAId === userId
      ? couple.userBId
      : couple.userAId;

  const partnerPrivacy =
    await prisma.privacySettings.findUnique({
      where: {
        userId: partnerId,
      },
    });

  if (!partnerPrivacy || !partnerPrivacy.shareStatus) {
    return {
      shared: false,
      reason: 'partner_hidden',
    };
  }

  if (partnerPrivacy.paused) {
    return {
      shared: false,
      reason: 'paused',
    };
  }

  const status = await prisma.status.findUnique({
    where: {
      userId: partnerId,
    },
  });

  if (!status) {
    return {
      shared: false,
      reason: 'no_status',
    };
  }

  return {
    shared: true,
    status: toView(status),
  };
}