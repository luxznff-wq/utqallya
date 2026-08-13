import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';

import { AuthNavigator } from './AuthNavigator';
import { DriverNavigator } from './DriverNavigator';
import { PassengerNavigator } from './PassengerNavigator';

import { LoadingOverlay } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { useTrip } from '@/context/TripContext';
import { SplashScreen as BrandSplashScreen } from '@/screens/auth/SplashScreen';
import { AdminNotSupportedScreen } from '@/screens/shared/AdminNotSupportedScreen';

const navigationRef = createNavigationContainerRef<Record<string, object | undefined>>();

/**
 * Punto de entrada de la navegación: decide qué flujo mostrar según la sesión.
 * El panel administrativo es web (fuera del alcance de la app móvil), así que
 * un usuario ADMIN que abra la app solo ve un aviso informativo.
 */
export function RootNavigator() {
  const { user, isLoading } = useAuth();
  const { isLoading: isTripLoading } = useTrip();
  const [showBrandSplash, setShowBrandSplash] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
    const timer = setTimeout(() => setShowBrandSplash(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!user) return;

    const openNotification = (response: Notifications.NotificationResponse | null) => {
      if (!response || !navigationRef.isReady()) return;
      const data = response.notification.request.content.data;
      const tripId = typeof data.tripId === 'string' ? data.tripId : undefined;
      const notificationType = typeof data.notificationType === 'string' ? data.notificationType : undefined;
      if (notificationType === 'INCIDENT_UPDATED') {
        navigationRef.navigate('MyIncidents');
        return;
      }
      if (!tripId) return;

      if (user.role === 'DRIVER') {
        if (notificationType === 'TRIP_REQUEST') {
          navigationRef.navigate('DriverTabs');
        } else {
          navigationRef.navigate('DriverTrip', { tripId });
        }
      } else if (user.role === 'PASSENGER') {
        if (notificationType === 'TRIP_FINISHED') {
          navigationRef.navigate('RateTrip', { tripId });
        } else if (notificationType === 'TRIP_OFFER_RECEIVED') {
          navigationRef.navigate('SearchingDriver', { tripId });
        } else {
          navigationRef.navigate('TripTracking', { tripId });
        }
      }
    };

    const subscription = Notifications.addNotificationResponseReceivedListener(openNotification);
    Notifications.getLastNotificationResponseAsync()
      .then(openNotification)
      .catch(() => undefined);
    return () => subscription.remove();
  }, [user]);

  if (showBrandSplash) {
    return <BrandSplashScreen />;
  }

  if (isLoading || (user != null && isTripLoading)) {
    return <LoadingOverlay />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {!user && <AuthNavigator />}
      {user?.role === 'PASSENGER' && <PassengerNavigator />}
      {user?.role === 'DRIVER' && <DriverNavigator />}
      {user?.role === 'ADMIN' && <AdminNotSupportedScreen />}
    </NavigationContainer>
  );
}
