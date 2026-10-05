import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPrivacy, putPrivacy, type PrivacyView } from '../../api/privacy';

const KEY = ['privacy', 'me'] as const;

export function usePrivacy() {
  return useQuery({
    queryKey: KEY,
    queryFn: fetchPrivacy,
    select: (d) => d.privacy,
  });
}

export function useUpdatePrivacy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: putPrivacy,
    onSuccess: (data) => {
      qc.setQueryData<{ privacy: PrivacyView }>(KEY, data);
      // Cambios de privacidad afectan a lo que el partner ve de nosotros
      // (a nosotros no nos cambia lo que vemos de él, así que no invalidamos partner)
    },
  });
}