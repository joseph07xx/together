import { apiRequest } from './client';

export type StatusView = {
  key: string;
  emoji: string;
  label: string;
  startedAt: string;
  updatedAt: string;
};

export type PartnerStatusResult =
  | { shared: false; reason: 'no_couple' | 'partner_hidden' | 'paused' | 'no_status' }
  | { shared: true; status: StatusView };

export function fetchMyStatus(): Promise<{ status: StatusView | null }> {
  return apiRequest('/status/me');
}

export function fetchPartnerStatus(): Promise<PartnerStatusResult> {
  return apiRequest('/status/partner');
}

export function putStatus(input: {
  key: string;
  label?: string;
  emoji?: string;
}): Promise<{ status: StatusView }> {
  return apiRequest('/status', { method: 'PUT', body: input });
}