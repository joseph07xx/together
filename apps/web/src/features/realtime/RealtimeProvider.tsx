import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket, disconnectSocket, getSocket } from '../../lib/socket';
import { useAuthStore } from '../../stores/auth.store';

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status !== 'authenticated') {
      disconnectSocket();
      return;
    }

    connectSocket();
    const socket = getSocket();

    // ── partner:status ────────────────────────────────────
    const onPartnerStatus = () => {
      queryClient.invalidateQueries({ queryKey: ['status', 'partner'] });
    };

    // ── partner:location ──────────────────────────────────
    const onPartnerLocation = () => {
      queryClient.invalidateQueries({ queryKey: ['location', 'partner'] });
    };

    // ── partner:presence ──────────────────────────────────
    const onPartnerPresence = () => {
      queryClient.invalidateQueries({ queryKey: ['presence', 'partner'] });
      // La presencia también invalida el couple state, porque lastSeenAt
      // está en el user. Aunque hoy no lo mostramos, no cuesta nada.
      queryClient.invalidateQueries({ queryKey: ['couple'] });
    };

    // ── partner:privacy ───────────────────────────────────
    const onPartnerPrivacy = () => {
      // Todo lo que podamos mostrar del partner puede haber cambiado
      queryClient.invalidateQueries({ queryKey: ['status', 'partner'] });
      queryClient.invalidateQueries({ queryKey: ['location', 'partner'] });
      queryClient.invalidateQueries({ queryKey: ['presence', 'partner'] });
    };

    // ── couple:linked ─────────────────────────────────────
    const onCoupleLinked = () => {
      queryClient.invalidateQueries({ queryKey: ['couple'] });
    };

    // ── couple:unlinked ───────────────────────────────────
    const onCoupleUnlinked = () => {
      queryClient.invalidateQueries({ queryKey: ['couple'] });
      // Limpiamos lo del partner para no mostrar datos obsoletos
      queryClient.removeQueries({ queryKey: ['status', 'partner'] });
      queryClient.removeQueries({ queryKey: ['location', 'partner'] });
      queryClient.removeQueries({ queryKey: ['presence', 'partner'] });
    };

    socket.on('partner:status', onPartnerStatus);
    socket.on('partner:location', onPartnerLocation);
    socket.on('partner:presence', onPartnerPresence);
    socket.on('partner:privacy', onPartnerPrivacy);
    socket.on('couple:linked', onCoupleLinked);
    socket.on('couple:unlinked', onCoupleUnlinked);

    // Si el socket reconecta tras un corte, invalidamos todo lo del partner
    const onReconnect = () => {
      queryClient.invalidateQueries({ queryKey: ['status', 'partner'] });
      queryClient.invalidateQueries({ queryKey: ['location', 'partner'] });
      queryClient.invalidateQueries({ queryKey: ['presence', 'partner'] });
      queryClient.invalidateQueries({ queryKey: ['couple'] });
    };
    socket.io.on('reconnect', onReconnect);

    return () => {
      socket.off('partner:status', onPartnerStatus);
      socket.off('partner:location', onPartnerLocation);
      socket.off('partner:presence', onPartnerPresence);
      socket.off('partner:privacy', onPartnerPrivacy);
      socket.off('couple:linked', onCoupleLinked);
      socket.off('couple:unlinked', onCoupleUnlinked);
      socket.io.off('reconnect', onReconnect);
    };
  }, [status, queryClient]);

  return <>{children}</>;
}