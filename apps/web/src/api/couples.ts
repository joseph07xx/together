import { apiRequest } from './client';

export type CoupleState =
  | { status: 'single' }
  | { status: 'inviting'; code: string; expiresAt: string }
  | {
      status: 'linked';
      coupleId: string;
      partner: { id: string; displayName: string; avatarUrl: string | null };
    };

export function fetchCoupleState(): Promise<CoupleState> {
  return apiRequest<CoupleState>('/couples/me');
}

export function createInvite(): Promise<{ code: string; expiresAt: string }> {
  return apiRequest('/couples/invite', { method: 'POST' });
}

export function joinCouple(code: string): Promise<{ couple: unknown }> {
  return apiRequest('/couples/join', { method: 'POST', body: { code } });
}

export function unlinkCouple(): Promise<void> {
  return apiRequest('/couples/me', { method: 'DELETE' });
}