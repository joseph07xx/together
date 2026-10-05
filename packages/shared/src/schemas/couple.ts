import { z } from 'zod';

// Código de invitación: 6 caracteres sin ambigüedad (sin O/0/I/1)
export const inviteCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-HJ-NP-Z2-9]{6}$/, 'Código de invitación inválido');

export const joinCoupleSchema = z.object({
  code: inviteCodeSchema,
});

export type JoinCoupleInput = z.infer<typeof joinCoupleSchema>;