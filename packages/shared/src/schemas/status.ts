import { z } from 'zod';

import { CUSTOM_KEY } from '../status/catalog.js';

const allKeys = [
  'available',
  'studying',
  'working',
  'gaming',
  'eating',
  'sleeping',
  'moving',
  'watching',
  'thinking_of_you',
  'do_not_disturb',
  CUSTOM_KEY,
] as const;

export const statusKeySchema = z.enum(allKeys);

// Reglas:
//
// - Si key === 'custom': label obligatorio (1-60), emoji obligatorio (1-8).
//
// - Si key !== 'custom': label y emoji son opcionales. Si no se envían,
//   el servidor los rellena desde el catálogo. Si se envían, se respetan
//   (por si en el futuro el usuario quiere personalizar el label de un preset).

export const setStatusSchema = z
  .object({
    key: statusKeySchema,
    label: z.string().trim().min(1).max(60).optional(),
    emoji: z.string().trim().min(1).max(8).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.key === CUSTOM_KEY) {
      if (!value.label) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['label'],
          message: 'El estado personalizado necesita un texto',
        });
      }

      if (!value.emoji) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['emoji'],
          message: 'El estado personalizado necesita un emoji',
        });
      }
    }
  });