import axios, { AxiosError } from 'axios';

import { API_URL, AUTH_TOKEN_STORAGE_KEY } from '@/constants/config';
import { secureStorage } from '@/services/secureStorage';

/**
 * Cliente HTTP central de la app. Toda la capa de servicios pasa por aquí,
 * lo que centraliza autenticación y manejo de errores (DRY, Single Responsibility).
 */
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  config.headers['X-Request-ID'] = `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const token = await secureStorage.getItemAsync(AUTH_TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Callback opcional que AuthContext registra para reaccionar a un 401 (sesión expirada). */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export interface ApiErrorBody {
  message: string;
  details?: string[];
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401) {
      onUnauthorized?.();
    }
    const message = error.response?.data?.message ?? 'No se pudo conectar con el servidor. Inténtalo nuevamente.';
    return Promise.reject(new Error(message));
  }
);
