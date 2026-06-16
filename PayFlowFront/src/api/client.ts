import axios from 'axios';

// Base URL injected via Vite env. Set VITE_API_URL in .env.local when the backend is ready.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token here when auth is implemented.
apiClient.interceptors.request.use((config) => {
  return config;
});

// Response interceptor — centralized error handling.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // TODO: Handle 401 → redirect to login once auth is added.
    return Promise.reject(error);
  }
);
