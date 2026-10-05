import crypto from 'node:crypto';

// Guardamos solo el hash del refresh token en BD.
// Si la BD se filtra, los tokens no son usables.
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Genera códigos tipo "AB7K92": 6 chars sin ambigüedad.
// Se usará en el Paso 4, pero lo dejamos aquí por cohesión.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin I, O, 0, 1
export function generateInviteCode(length = 6): string {
  let out = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return out;
}