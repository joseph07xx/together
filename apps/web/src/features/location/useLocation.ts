import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchMyLocation,
  fetchPartnerLocation,
  fetchPartnerPresence,
  putLocation,
} from '../../api/location';

const MY = ['location', 'me'] as const;
const PARTNER = ['location', 'partner'] as const;
const PRESENCE = ['presence', 'partner'] as const;

export function useMyLocation() {
  return useQuery({
    queryKey: MY,
    queryFn: fetchMyLocation,
    select: (d) => d.location,
  });
}

export function usePartnerLocation() {
  return useQuery({
    queryKey: PARTNER,
    queryFn: fetchPartnerLocation,
  });
}

export function usePartnerPresence() {
  return useQuery({
    queryKey: PRESENCE,
    queryFn: fetchPartnerPresence,
    refetchInterval: 60_000,
  });
}

export function usePutLocation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: putLocation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MY });
    },
  });
}