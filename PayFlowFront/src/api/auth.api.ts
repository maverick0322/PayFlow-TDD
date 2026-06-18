import { apiClient } from './client';
import type { LoginRequest, RegisterRequest, TokenResponse } from '../types/auth.types';

const TOKEN_KEY = 'payflow_token';

export const authApi = {
  register: (body: RegisterRequest): Promise<TokenResponse> =>
    apiClient.post<TokenResponse>('/auth/register', body).then(r => r.data),

  login: (body: LoginRequest): Promise<TokenResponse> =>
    apiClient.post<TokenResponse>('/auth/login', body).then(r => r.data),

  getStoredToken: (): string | null => localStorage.getItem(TOKEN_KEY),

  saveToken: (token: string): void => localStorage.setItem(TOKEN_KEY, token),

  clearToken: (): void => localStorage.removeItem(TOKEN_KEY),
};
