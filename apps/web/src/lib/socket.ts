import { io, type Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL;

let socket: Socket | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, {
      // El navegador envía la cookie automatically.
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10_000,
    });

    // Heartbeat: actualiza lastSeenAt en el backend cada 60 s
    socket.on('connect', () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      heartbeatInterval = setInterval(() => {
        socket?.emit('heartbeat');
      }, 60_000);
    });

    socket.on('disconnect', () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
    });
  }
  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) s.connect();
}

export function disconnectSocket(): void {
  if (socket?.connected) socket.disconnect();
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}