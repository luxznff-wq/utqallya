import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Notifications from 'expo-notifications';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { LoadingOverlay } from '@/components';
import { DEFAULT_MAP_REGION, DRIVER_LOCATION_UPDATE_INTERVAL_MS } from '@/constants/config';
import { driverService } from '@/services/driverService';
import { locationService } from '@/services/locationService';
import { tripService } from '@/services/tripService';
import { colors, radius, shadow, spacing, typography } from '@/theme';
import { DriverProfile, DriverStackParamList, DriverTabParamList } from '@/types';

type Props = CompositeScreenProps<BottomTabScreenProps<DriverTabParamList, 'Home'>, NativeStackScreenProps<DriverStackParamList>>;

/**
 * Pantalla principal del conductor: mapa, toggle de disponibilidad y escucha
 * de solicitudes de viaje entrantes (notificaciones push). No hay negociación:
 * el primer conductor que presiona "Aceptar" se queda con el viaje.
 */
export function DriverHomeScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_MAP_REGION);
  const [isLoading, setIsLoading] = useState(true);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const data = await driverService.getMyProfile();
      setProfile(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Envía la posición del conductor periódicamente mientras está disponible.
  useEffect(() => {
    if (profile?.availability !== 'AVAILABLE') {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
      return;
    }

    const sendLocation = async () => {
      const granted = await locationService.requestPermission();
      if (!granted) return;
      const position = await locationService.getCurrentPosition();
      setRegion((prev) => ({ ...prev, latitude: position.coords.latitude, longitude: position.coords.longitude }));
      await driverService.updateLocation(
        position.coords.latitude,
        position.coords.longitude,
        position.coords.heading ?? undefined
      );
    };

    sendLocation();
    locationIntervalRef.current = setInterval(sendLocation, DRIVER_LOCATION_UPDATE_INTERVAL_MS);
    return () => {
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    };
  }, [profile?.availability]);

  // Escucha notificaciones push de nuevos viajes disponibles.
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const tripId = notification.request.content.data?.tripId as string | undefined;
      if (tripId) {
        promptTripRequest(tripId);
      }
    });
    return () => subscription.remove();
  }, []);

  function promptTripRequest(tripId: string) {
    Alert.alert('Nuevo viaje disponible', '¿Deseas aceptar este viaje?', [
      { text: 'Ignorar', style: 'cancel' },
      {
        text: 'Aceptar',
        onPress: async () => {
          try {
            await tripService.acceptTrip(tripId);
            navigation.navigate('DriverTrip', { tripId });
          } catch (error) {
            Alert.alert('Viaje no disponible', (error as Error).message);
          }
        },
      },
    ]);
  }

  async function toggleAvailability(value: boolean) {
    try {
      const updated = await driverService.setAvailability(value);
      setProfile(updated);
    } catch (error) {
      Alert.alert('No se pudo actualizar tu disponibilidad', (error as Error).message);
    }
  }

  if (isLoading || !profile) {
    return <LoadingOverlay message="Cargando tu perfil..." />;
  }

  const isPending = profile.approvalStatus !== 'APPROVED';

  return (
    <View style={styles.container}>
      <MapView style={StyleSheet.absoluteFill} region={region}>
        <Marker coordinate={region} />
      </MapView>

      <View style={styles.statusCard}>
        {isPending ? (
          <>
            <Text style={typography.h3}>Cuenta en revisión</Text>
            <Text style={styles.caption}>
              {profile.approvalStatus === 'REJECTED'
                ? `Tu solicitud fue rechazada: ${profile.rejectionReason ?? 'contacta al administrador'}`
                : 'Un administrador revisará tu documentación pronto'}
            </Text>
          </>
        ) : (
          <View style={styles.availabilityRow}>
            <View>
              <Text style={typography.h3}>{profile.availability === 'AVAILABLE' ? 'Disponible' : 'No disponible'}</Text>
              <Text style={styles.caption}>
                {profile.availability === 'AVAILABLE' ? 'Recibiendo solicitudes de viaje' : 'Actívate para recibir viajes'}
              </Text>
            </View>
            <Switch
              value={profile.availability === 'AVAILABLE'}
              onValueChange={toggleAvailability}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.white}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statusCard: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadow.card,
  },
  caption: {
    ...typography.caption,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
