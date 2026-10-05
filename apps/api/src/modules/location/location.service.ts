import { prisma } from '../../lib/prisma.js';
import { reverseGeocode } from '../../lib/geocoding.js';
import { forbidden, notFound } from '../../utils/errors.js';
import { emitToCouple } from '../realtime/socket.registry.js';

export type LocationView = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  placeLabel: string | null;
  updatedAt: string;
};

function toView(l: {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  placeLabel: string | null;
  updatedAt: Date;
}): LocationView {
  return {
    latitude: l.latitude,
    longitude: l.longitude,
    accuracy: l.accuracy,
    placeLabel: l.placeLabel,
    updatedAt: l.updatedAt.toISOString(),
  };
}

// PUT /location
export async function updateLocation(
  userId: string,
  input: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  },
): Promise<LocationView> {
  const privacy = await prisma.privacySettings.findUnique({
    where: { userId },
  });

  if (!privacy) {
    throw forbidden('Privacidad no configurada');
  }

  if (!privacy.shareLocation) {
    throw forbidden('No estás compartiendo tu ubicación');
  }

  if (privacy.paused) {
    throw forbidden('Has pausado compartir información');
  }

  const placeLabel = await reverseGeocode(
    input.latitude,
    input.longitude,
  );

  const location = await prisma.location.upsert({
    where: { userId },
    create: {
      userId,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy ?? null,
      placeLabel,
    },
    update: {
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy ?? null,
      placeLabel,
    },
  });

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

  if (couple && couple.userBId) {
    emitToCouple(couple.id, 'partner:location', {
      location: toView(location),
    });
  }

  return toView(location);
}

// GET /location/me
export async function getMyLocation(
  userId: string,
): Promise<LocationView | null> {
  const location = await prisma.location.findUnique({
    where: { userId },
  });

  return location ? toView(location) : null;
}

// GET /location/partner
export type PartnerLocationResult =
  | {
      shared: false;
      reason:
        | 'no_couple'
        | 'partner_hidden'
        | 'paused'
        | 'no_location';
    }
  | {
      shared: true;
      location: LocationView;
    };

export async function getPartnerLocation(
  userId: string,
): Promise<PartnerLocationResult> {
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

  const privacy = await prisma.privacySettings.findUnique({
    where: { userId: partnerId },
  });

  if (!privacy || !privacy.shareLocation) {
    return {
      shared: false,
      reason: 'partner_hidden',
    };
  }

  if (privacy.paused) {
    return {
      shared: false,
      reason: 'paused',
    };
  }

  const location = await prisma.location.findUnique({
    where: { userId: partnerId },
  });

  if (!location) {
    return {
      shared: false,
      reason: 'no_location',
    };
  }

  return {
    shared: true,
    location: toView(location),
  };
}

// GET /location/partner/presence
export type PartnerPresenceResult =
  | {
      shared: false;
      reason: 'no_couple' | 'partner_hidden' | 'paused';
    }
  | {
      shared: true;
      online: boolean;
      lastSeenAt: string;
    };

export async function getPartnerPresence(
  userId: string,
): Promise<PartnerPresenceResult> {
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

  const privacy = await prisma.privacySettings.findUnique({
    where: { userId: partnerId },
  });

  if (!privacy || !privacy.shareLastSeen) {
    return {
      shared: false,
      reason: 'partner_hidden',
    };
  }

  if (privacy.paused) {
    return {
      shared: false,
      reason: 'paused',
    };
  }

  const partner = await prisma.user.findUnique({
    where: { id: partnerId },
    select: {
      lastSeenAt: true,
    },
  });

  if (!partner) {
    throw notFound('Pareja no encontrada');
  }

  const online =
    Date.now() - partner.lastSeenAt.getTime() < 120_000;

  return {
    shared: true,
    online,
    lastSeenAt: partner.lastSeenAt.toISOString(),
  };
}