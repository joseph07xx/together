import { apiRequest } from './client';

export type LocationView = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  placeLabel: string | null;
  updatedAt: string;
};

export type PartnerLocationResult =
  | { shared: false; reason: 'no_couple' | 'partner_hidden' | 'paused' | 'no_location' }
  | { shared: true; location: LocationView };

export type PartnerPresenceResult =
  | { shared: false; reason: 'no_couple' | 'partner_hidden' | 'paused' }
  | { shared: true; online: boolean; lastSeenAt: string };

export function putLocation(input: {
  latitude: number;
  longitude: number;
  accuracy?: number;
}): Promise<{ location: LocationView }> {
  return apiRequest('/location', { method: 'PUT', body: input });
}

export function fetchMyLocation(): Promise<{ location: LocationView | null }> {
  return apiRequest('/location/me');
}

export function fetchPartnerLocation(): Promise<PartnerLocationResult> {
  return apiRequest('/location/partner');
}

export function fetchPartnerPresence(): Promise<PartnerPresenceResult> {
  return apiRequest('/location/partner/presence');
}