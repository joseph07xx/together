import { z } from 'zod';

export const updatePrivacySchema = z
  .object({
    shareLocation: z.boolean().optional(),
    shareStatus: z.boolean().optional(),
    shareLastSeen: z.boolean().optional(),
    paused: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Debes enviar al menos un campo',
  });

export type UpdatePrivacyInput = z.infer<typeof updatePrivacySchema>;