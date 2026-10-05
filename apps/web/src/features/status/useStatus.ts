import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchMyStatus,
  fetchPartnerStatus,
  putStatus,
  type StatusView,
} from '../../api/status';

const MY_KEY = ['status', 'me'] as const;
const PARTNER_KEY = ['status', 'partner'] as const;

export function useMyStatus() {
  return useQuery({
    queryKey: MY_KEY,
    queryFn: fetchMyStatus,
    select: (data) => data.status,
  });
}

export function usePartnerStatus() {
  return useQuery({
    queryKey: PARTNER_KEY,
    queryFn: fetchPartnerStatus,
  });
}

export function useSetStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: putStatus,
    onSuccess: (data) => {
      // Actualizamos el cache propio sin esperar refetch
      qc.setQueryData<{ status: StatusView | null }>(MY_KEY, { status: data.status });
      // Pedimos al backend que nos confirme el estado del partner la próxima vez
      qc.invalidateQueries({ queryKey: PARTNER_KEY });
    },
  });
}