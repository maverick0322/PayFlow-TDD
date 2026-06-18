import axios, { AxiosError } from 'axios';
import { authApi } from './auth.api';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT Bearer token from localStorage on every request.
apiClient.interceptors.request.use((config) => {
  const token = authApi.getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralized error handling:
//   - 401 → clear token and redirect to /login.
//   - FastAPI validation errors (422) → surface the first `detail` message.
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail: string | { msg: string }[] }>) => {
    if (error.response?.status === 401) {
      authApi.clearToken();
      window.location.href = '/login';
      return Promise.reject(new Error('Sesión expirada. Por favor inicia sesión de nuevo.'));
    }

    // Extract FastAPI's `detail` field into a readable message.
    const detail = error.response?.data?.detail;
    let message: string;

    if (typeof detail === 'string') {
      message = detail;
    } else if (Array.isArray(detail)) {
      message = detail.map((d) => d.msg).join(', ');
    } else {
      message = error.message ?? 'Error desconocido';
    }

    return Promise.reject(new Error(message));
  }
);
