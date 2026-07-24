import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';

import { LoadingOverlay } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { AdminNotSupportedScreen } from '@/screens/shared/AdminNotSupportedScreen';
import { SplashScreen as BrandSplashScreen } from '@/screens/auth/SplashScreen';
import { AuthNavigator } from './AuthNavigator';
import { DriverNavigator } from './DriverNavigator';
import { PassengerNavigator } from './PassengerNavigator';

/**
 * Punto de entrada de la navegación: decide qué flujo mostrar según la sesión.
 * El panel administrativo es web (fuera del alcance de la app móvil), así que
 * un usuario ADMIN que abra la app solo ve un aviso informativo.
 */
export function RootNavigator() {
  const { user, isLoading } = useAuth();
  const [showBrandSplash, setShowBrandSplash] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
    const timer = setTimeout(() => setShowBrandSplash(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (showBrandSplash) {
    return <BrandSplashScreen />;
  }

  if (isLoading) {
    return <LoadingOverlay />;
  }

  return (
    <NavigationContainer>
      {!user && <AuthNavigator />}
      {user?.role === 'PASSENGER' && <PassengerNavigator />}
      {user?.role === 'DRIVER' && <DriverNavigator />}
      {user?.role === 'ADMIN' && <AdminNotSupportedScreen />}
    </NavigationContainer>
  );
}
