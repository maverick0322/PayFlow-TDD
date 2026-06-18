import { create } from 'zustand';
import { authApi } from '../api/auth.api';
import type { UserInfo, LoginRequest, RegisterRequest } from '../types/auth.types';

interface AuthState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login:    (body: LoginRequest)    => Promise<void>;
  register: (body: RegisterRequest) => Promise<void>;
  logout:   () => void;
  initFromStorage: () => void;
}

/** Parses the JWT payload without verifying the signature (client-side only). */
function parseJwtPayload(token: string): { sub: string; email: string } | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user:            null,
  isAuthenticated: false,
  isLoading:       false,
  error:           null,

  initFromStorage: () => {
    const token = authApi.getStoredToken();
    if (!token) return;

    const payload = parseJwtPayload(token);
    if (!payload) {
      authApi.clearToken();
      return;
    }
    // Restore minimal user info from the token until the next API response.
    set({
      isAuthenticated: true,
      user: { id: parseInt(payload.sub), email: payload.email, nombre: '' },
    });
  },

  login: async (body) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(body);
      authApi.saveToken(response.access_token);
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      throw err;
    }
  },

  register: async (body) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register(body);
      authApi.saveToken(response.access_token);
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    authApi.clearToken();
    set({ user: null, isAuthenticated: false, error: null });
    window.location.href = '/login';
  },
}));
