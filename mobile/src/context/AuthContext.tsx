import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

import { AUTH_TOKEN_STORAGE_KEY, AUTH_USER_STORAGE_KEY } from '@/constants/config';
import { setUnauthorizedHandler } from '@/services/api/client';
import { authService, RegisterDriverPayload, RegisterDriverPhotos, RegisterPassengerPayload } from '@/services/authService';
import { notificationService } from '@/services/notificationService';
import { userService } from '@/services/userService';
import { AuthResponse, UserProfile } from '@/types';

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerPassenger: (payload: RegisterPassengerPayload) => Promise<void>;
  registerDriver: (payload: RegisterDriverPayload, photos: RegisterDriverPhotos) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function persistSession(response: AuthResponse) {
  await SecureStore.setItemAsync(AUTH_TOKEN_STORAGE_KEY, response.accessToken);
  await SecureStore.setItemAsync(AUTH_USER_STORAGE_KEY, JSON.stringify(response.user));
}

async function clearSession() {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_STORAGE_KEY);
  await SecureStore.deleteItemAsync(AUTH_USER_STORAGE_KEY);
}

/** Intenta registrar el push token en el backend; nunca bloquea el login si falla. */
async function trySyncPushToken() {
  try {
    const pushToken = await notificationService.registerForPushNotifications();
    if (pushToken) {
      await userService.registerPushToken(pushToken);
    }
  } catch {
    // Silencioso: las notificaciones push son un extra, no un requisito para usar la app.
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession().finally(() => setUser(null));
    });
  }, []);

  useEffect(() => {
    (async () => {
      const [token, storedUser] = await Promise.all([
        SecureStore.getItemAsync(AUTH_TOKEN_STORAGE_KEY),
        SecureStore.getItemAsync(AUTH_USER_STORAGE_KEY),
      ]);
      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authService.loginPassengerOrDriver(email, password);
    await persistSession(response);
    setUser(response.user);
    void trySyncPushToken();
  }, []);

  const registerPassenger = useCallback(async (payload: RegisterPassengerPayload) => {
    const response = await authService.registerPassenger(payload);
    await persistSession(response);
    setUser(response.user);
    void trySyncPushToken();
  }, []);

  const registerDriver = useCallback(async (payload: RegisterDriverPayload, photos: RegisterDriverPhotos) => {
    const response = await authService.registerDriver(payload, photos);
    await persistSession(response);
    setUser(response.user);
    void trySyncPushToken();
  }, []);

  const logout = useCallback(async () => {
    await clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, registerPassenger, registerDriver, logout }),
    [user, isLoading, login, registerPassenger, registerDriver, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un <AuthProvider>');
  }
  return context;
}
