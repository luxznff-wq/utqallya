import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, DriverInfoCard, LoadingOverlay, StatusBadge, TripCodeDisplay } from '@/components';
import { TRIP_POLL_INTERVAL_MS } from '@/constants/config';
import { useTrip } from '@/context/TripContext';
import { DriverLocationDto, tripService } from '@/services/tripService';
import { colors, radius, shadow, spacing, typography } from '@/theme';
import { PassengerStackParamList } from '@/types';

type Props = NativeStackScreenProps<PassengerStackParamList, 'TripTracking'>;

const CANCELLABLE_STATUSES = ['SEARCHING_DRIVER', 'ACCEPTED', 'DRIVER_ARRIVING'];

/**
 * Pantalla única y adaptativa para todo el tramo activo del viaje (conductor
 * en camino → esperando confirmación → en viaje). Evita duplicar tres
 * pantallas casi idénticas: el contenido cambia según {@code trip.status}.
 */
export function TripTrackingScreen({ navigation, route }: Props) {
  const { tripId } = route.params;
  const { trip, track, stopTracking } = useTrip();
  const [driverLocation, setDriverLocation] = useState<DriverLocationDto | null>(null);

  useEffect(() => {
    track(tripId);
  }, [tripId, track]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const location = await tripService.getDriverLocation(tripId);
      if (location) {
        setDriverLocation(location);
      }
    }, TRIP_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [tripId]);

  useEffect(() => {
    if (!trip) {
      return;
    }
    if (trip.status === 'CANCELLED') {
      stopTracking();
      Alert.alert('Viaje cancelado', trip.cancelReason ?? 'El viaje fue cancelado');
      navigation.popToTop();
    }
    if (trip.status === 'FINISHED') {
      navigation.replace('RateTrip', { tripId });
    }
  }, [trip, navigation, tripId, stopTracking]);

  async function handleCancel() {
    Alert.alert('Cancelar viaje', '¿Seguro que deseas cancelar este viaje?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          await tripService.cancelTrip(tripId);
          stopTracking();
          navigation.popToTop();
        },
      },
    ]);
  }

  if (!trip) {
    return <LoadingOverlay message="Cargando viaje..." />;
  }

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: trip.origin.latitude,
          longitude: trip.origin.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
      >
        <Marker coordinate={trip.origin} pinColor={colors.accent} title="Origen" />
        <Marker coordinate={trip.destination} pinColor={colors.success} title="Destino" />
        {driverLocation && <Marker coordinate={driverLocation} title="Tu conductor" />}
        <Polyline coordinates={[trip.origin, trip.destination]} strokeColor={colors.accent} strokeWidth={3} />
      </MapView>

      <View style={styles.topBar}>
        <StatusBadge status={trip.status} />
      </View>

      <View style={styles.bottomSheet}>
        {trip.driver && <DriverInfoCard driver={trip.driver} />}

        <View style={styles.tripInfoRow}>
          <Text style={styles.tripInfoText}>{trip.distanceKm} km</Text>
          <Text style={styles.tripInfoDivider}>·</Text>
          <Text style={styles.tripInfoText}>{trip.estimatedDurationMinutes} min</Text>
          <Text style={styles.tripInfoDivider}>·</Text>
          <Text style={styles.tripInfoText}>S/ {trip.fare.toFixed(2)}</Text>
        </View>

        {trip.status === 'WAITING_CONFIRMATION' && trip.confirmationCode && (
          <TripCodeDisplay code={trip.confirmationCode} />
        )}

        {CANCELLABLE_STATUSES.includes(trip.status) && (
          <Button label="Cancelar viaje" variant="outline" onPress={handleCancel} style={styles.cancel} />
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
  topBar: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
  },
  bottomSheet: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.card,
  },
  tripInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tripInfoText: {
    ...typography.bodyStrong,
  },
  tripInfoDivider: {
    color: colors.textMuted,
  },
  cancel: {
    marginTop: spacing.xs,
  },
});
