import type { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function setIO(server: SocketIOServer): void {
  io = server;
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error('Socket.IO no inicializado');
  return io;
}

export function userRoom(userId: string): string {
  return `user:${userId}`;
}

export function coupleRoom(coupleId: string): string {
  return `couple:${coupleId}`;
}

/**
 * Emite a todos los sockets de una pareja, opcionalmente excluyendo
 * el socket que originó el cambio (para no duplicar lo que el cliente ya sabe).
 */
export function emitToCouple(
  coupleId: string,
  event: string,
  payload: unknown,
  exceptSocketId?: string,
): void {
  if (!io) return;
  const room = coupleRoom(coupleId);
  if (exceptSocketId) {
    io.to(room).except(exceptSocketId).emit(event, payload);
  } else {
    io.to(room).emit(event, payload);
  }
}

export function emitToUser(userId: string, event: string, payload: unknown): void {
  if (!io) return;
  io.to(userRoom(userId)).emit(event, payload);
}