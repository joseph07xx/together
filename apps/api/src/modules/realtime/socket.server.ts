import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import { parse as parseCookie } from 'cookie';
import { verifyAccessToken } from '../../lib/jwt.js';
import { ACCESS_COOKIE } from '../../lib/cookies.js';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import {
  coupleRoom,
  emitToCouple,
  setIO,
  userRoom,
} from './socket.registry.js';

type SocketData = {
  userId: string;
  displayName: string;
};

type AuthedSocket = Socket<
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  SocketData
>;

export function initRealtime(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.WEB_ORIGIN,
      credentials: true,
    },
    // Path por defecto: /socket.io
  });

  setIO(io);

  // Middleware de autenticación
  io.use(async (socket, next) => {
    try {
      const origin = socket.handshake.headers.origin;

      // Permitimos conexiones sin Origin (apps nativas, smoke tests)
      // y únicamente el Origin configurado para nuestra web.
      if (origin && origin !== env.WEB_ORIGIN) {
        return next(new Error('forbidden_origin'));
      }

      const rawCookie = socket.handshake.headers.cookie;
      if (!rawCookie) return next(new Error('unauthorized'));

      const cookies = parseCookie(rawCookie);
      const token = cookies[ACCESS_COOKIE];
      if (!token) return next(new Error('unauthorized'));

      let payload;
      try {
        payload = verifyAccessToken(token);
      } catch {
        return next(new Error('unauthorized'));
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, displayName: true },
      });
      if (!user) return next(new Error('unauthorized'));

      const data = socket.data as SocketData;
      data.userId = user.id;
      data.displayName = user.displayName;

      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', async (rawSocket) => {
    const socket = rawSocket as AuthedSocket;
    const { userId } = socket.data;

    // Unimos al usuario a su room personal
    await socket.join(userRoom(userId));

    // ¿Está en una pareja? Unimos a la room de pareja
    const couple = await prisma.couple.findFirst({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      select: { id: true, userAId: true, userBId: true },
    });

    let partnerId: string | null = null;
    if (couple && couple.userBId) {
      partnerId = couple.userAId === userId ? couple.userBId : couple.userAId;
      await socket.join(coupleRoom(couple.id));
    }

    // Actualizamos lastSeenAt y avisamos al partner
    await prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
    });

    if (couple && couple.userBId) {
      emitToCouple(
        couple.id,
        'partner:presence',
        { online: true, lastSeenAt: new Date().toISOString() },
        socket.id,
      );
    }

    // Al desconectar: actualizar lastSeenAt y avisar
    socket.on('disconnect', async () => {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { lastSeenAt: new Date() },
        });

        if (couple && couple.userBId) {
          emitToCouple(couple.id, 'partner:presence', {
            online: false,
            lastSeenAt: new Date().toISOString(),
          });
        }
      } catch {
        // Silencioso: la desconexión no debe romper nada
      }
    });

    // Evento opcional: latido del cliente para mantener lastSeenAt fresco
    socket.on('heartbeat', async () => {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { lastSeenAt: new Date() },
        });
      } catch {
        /* silencioso */
      }
    });
  });

  return io;
}