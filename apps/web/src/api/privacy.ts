import { apiRequest } from './client';

export type PrivacyView = {
  shareLocation: boolean;
  shareStatus: boolean;
  shareLastSeen: boolean;
  paused: boolean;
};

export function fetchPrivacy(): Promise<{ privacy: PrivacyView }> {
  return apiRequest('/privacy/me');
}

export function putPrivacy(input: Partial<PrivacyView>): Promise<{ privacy: PrivacyView }> {
  return apiRequest('/privacy', { method: 'PUT', body: input });
}