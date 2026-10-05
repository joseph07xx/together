import { prisma } from '../../lib/prisma.js';
import { generateInviteCode } from '../../lib/tokens.js';
import { badRequest, conflict, notFound } from '../../utils/errors.js';
import { getIO, coupleRoom, userRoom } from '../realtime/socket.registry.js';

const INVITE_TTL_MS = 15 * 60 * 1000; // 15 minutos

export type CoupleState =
  | { status: 'single' }
  | { status: 'inviting'; code: string; expiresAt: Date }
  | {
      status: 'linked';
      coupleId: string;
      partner: {
        id: string;
        displayName: string;
        avatarUrl: string | null;
      };
    };

// GET /couples/me
export async function getCoupleState(userId: string): Promise<CoupleState> {
  const couple = await prisma.couple.findFirst({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    include: {
      userA: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      userB: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (couple && couple.userBId && couple.userB) {
    const partner = couple.userAId === userId ? couple.userB : couple.userA;

    return {
      status: 'linked',
      coupleId: couple.id,
      partner: {
        id: partner.id,
        displayName: partner.displayName,
        avatarUrl: partner.avatarUrl,
      },
    };
  }

  const invite = await prisma.inviteCode.findUnique({
    where: { ownerId: userId },
  });

  if (invite && invite.expiresAt.getTime() > Date.now()) {
    return {
      status: 'inviting',
      code: invite.code,
      expiresAt: invite.expiresAt,
    };
  }

  if (invite) {
    await prisma.inviteCode.delete({
      where: { id: invite.id },
    });
  }

  return { status: 'single' };
}

// POST /couples/invite
export async function createInvite(userId: string) {
  const existing = await prisma.couple.findFirst({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    select: {
      id: true,
      userBId: true,
    },
  });

  if (existing && existing.userBId) {
    throw conflict('Ya tienes una pareja vinculada');
  }

  let coupleId: string;

  if (existing) {
    coupleId = existing.id;
  } else {
    const created = await prisma.couple.create({
      data: {
        userAId: userId,
      },
      select: {
        id: true,
      },
    });

    coupleId = created.id;
  }

  let code = generateInviteCode();

  for (let i = 0; i < 5; i++) {
    const clash = await prisma.inviteCode.findUnique({
      where: { code },
    });

    if (!clash) {
      break;
    }

    code = generateInviteCode();
  }

  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  await prisma.inviteCode.upsert({
    where: {
      ownerId: userId,
    },
    create: {
      code,
      ownerId: userId,
      expiresAt,
    },
    update: {
      code,
      expiresAt,
    },
  });

  return {
    code,
    expiresAt,
    coupleId,
  };
}

// POST /couples/join
export async function joinByCode(userId: string, rawCode: string) {
  const code = rawCode.trim().toUpperCase();

  const own = await prisma.couple.findFirst({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    select: {
      id: true,
      userBId: true,
      userAId: true,
    },
  });

  if (own && own.userBId) {
    throw conflict('Ya tienes una pareja vinculada');
  }

  const invite = await prisma.inviteCode.findUnique({
    where: {
      code,
    },
    include: {
      owner: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!invite) {
    throw notFound('Código inválido');
  }

  if (invite.expiresAt.getTime() < Date.now()) {
    await prisma.inviteCode.delete({
      where: {
        id: invite.id,
      },
    });

    throw badRequest('El código ha expirado');
  }

  if (invite.ownerId === userId) {
    throw badRequest('No puedes vincularte contigo mismo');
  }

  const ownerCouple = await prisma.couple.findFirst({
    where: {
      OR: [{ userAId: invite.ownerId }, { userBId: invite.ownerId }],
    },
    select: {
      id: true,
      userAId: true,
      userBId: true,
    },
  });

  let coupleId: string;

  if (!ownerCouple) {
    const created = await prisma.couple.create({
      data: {
        userAId: invite.ownerId,
      },
      select: {
        id: true,
      },
    });

    coupleId = created.id;
  } else if (ownerCouple.userBId) {
    throw conflict('Esa persona ya tiene pareja');
  } else {
    coupleId = ownerCouple.id;
  }

  if (own) {
    await prisma.couple.delete({
      where: {
        id: own.id,
      },
    });

    await prisma.inviteCode.deleteMany({
      where: {
        ownerId: userId,
      },
    });
  }

  const [, updated] = await prisma.$transaction([
    prisma.inviteCode.deleteMany({
      where: {
        ownerId: invite.ownerId,
      },
    }),
    prisma.couple.update({
      where: {
        id: coupleId,
      },
      data: {
        userBId: userId,
      },
      include: {
        userA: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        userB: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    }),
  ]);

  if (!updated.userB) {
    throw new Error('La pareja no tiene usuario B');
  }

  const userA = updated.userA;
  const userB = updated.userB;

  const io = getIO();

  io.in(userRoom(userA.id)).socketsJoin(coupleRoom(updated.id));
  io.in(userRoom(userB.id)).socketsJoin(coupleRoom(updated.id));

  io.to(userRoom(userA.id)).emit('couple:linked', {
    coupleId: updated.id,
    partner: userB,
  });

  io.to(userRoom(userB.id)).emit('couple:linked', {
    coupleId: updated.id,
    partner: userA,
  });

  return updated;
}

// DELETE /couples/me
export async function unlinkCouple(userId: string) {
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

  if (!couple) {
    throw notFound('No tienes pareja vinculada');
  }

  const io = getIO();

  io.to(coupleRoom(couple.id)).emit('couple:unlinked', {
    coupleId: couple.id,
  });

  io.in(coupleRoom(couple.id)).socketsLeave(coupleRoom(couple.id));

  await prisma.$transaction([
    prisma.inviteCode.deleteMany({
      where: {
        ownerId: userId,
      },
    }),
    prisma.couple.delete({
      where: {
        id: couple.id,
      },
    }),
  ]);
}