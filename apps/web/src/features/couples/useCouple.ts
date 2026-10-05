import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createInvite,
  fetchCoupleState,
  joinCouple,
  unlinkCouple,
} from '../../api/couples';

const KEY = ['couple'] as const;

export function useCoupleState() {
  return useQuery({
    queryKey: KEY,
    queryFn: fetchCoupleState,
  });
}

export function useCreateInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createInvite,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useJoinCouple() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: joinCouple,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUnlinkCouple() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: unlinkCouple,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}