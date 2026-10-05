import { create } from 'zustand';
import { apiRequest, ApiError } from '../api/client';

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
  lastSeenAt: string;
  privacy: {
    shareLocation: boolean;
    shareStatus: boolean;
    shareLastSeen: boolean;
    paused: boolean;
  };
};

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

type AuthState = {
  user: AuthUser | null;
  status: AuthStatus;
  bootstrap: () => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: { email: string; password: string; displayName: string }) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',

  async bootstrap() {
    set({ status: 'loading' });
    try {
      const { user } = await apiRequest<{ user: AuthUser }>('/auth/me');
      set({ user, status: 'authenticated' });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        set({ user: null, status: 'unauthenticated' });
      } else {
        // Error de red u otro: dejamos sin autenticar pero no rompemos la app
        set({ user: null, status: 'unauthenticated' });
      }
    }
  },

  async login(input) {
    const { user } = await apiRequest<{ user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: input,
      skipRefresh: true,
    });
    set({ user, status: 'authenticated' });
  },

  async register(input) {
    const { user } = await apiRequest<{ user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: input,
      skipRefresh: true,
    });
    set({ user, status: 'authenticated' });
  },

  async logout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST', skipRefresh: true });
    } catch {
      // Ignoramos: aunque falle en red, limpiamos local
    }
    set({ user: null, status: 'unauthenticated' });
  },
  
}));

