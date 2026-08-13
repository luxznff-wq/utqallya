import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import {
  Button,
  CancellationReasonModal,
  DriverInfoCard,
  LoadingOverlay,
  StatusBadge,
  TripCodeDisplay,
} from '@/components';
import MapView, { Marker, Polyline } from '@/components/AppMap';
import { TRIP_POLL_INTERVAL_MS } from '@/constants/config';
import { useTrip } from '@/context/TripContext';
import { directionsService, RoutePoint } from '@/services/directionsService';
import { emergencyService } from '@/services/emergencyService';
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
  const [routePolyline, setRoutePolyline] = useState<RoutePoint[] | null>(null);
  const [showCancellation, setShowCancellation] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    track(tripId);
  }, [tripId, track]);

  useEffect(() => {
    if (!trip) {
      return;
    }
    directionsService
      .getRoute(trip.origin, trip.destination)
      .then((computed) => setRoutePolyline(computed.polyline))
      .catch(() => {
        // Sin ruta calculada, el mapa igual muestra la línea recta entre los puntos.
      });
    // Coordenadas primitivas a propósito: trip.origin/destination cambian de
    // referencia en cada sondeo (ver TripContext) aunque el punto sea el
    // mismo, y no queremos recalcular la ruta cada TRIP_POLL_INTERVAL_MS.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.origin.latitude, trip?.origin.longitude, trip?.destination.latitude, trip?.destination.longitude]);

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

  async function handleCancel(reason: string) {
    setIsCancelling(true);
    try {
      await tripService.cancelTrip(tripId, reason);
      setShowCancellation(false);
      stopTracking();
      navigation.popToTop();
    } catch (error) {
      Alert.alert('No se pudo cancelar', (error as Error).message);
    } finally {
      setIsCancelling(false);
    }
  }

  function handleEmergency() {
    Alert.alert(
      'Activar SOS',
      'Se registrará una alerta de seguridad y se abrirá la llamada a tu contacto de emergencia.',
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Activar SOS',
          style: 'destructive',
          onPress: async () => {
            try {
              await emergencyService.trigger(tripId);
            } catch (error) {
              Alert.alert('No se pudo activar', (error as Error).message);
            }
          },
        },
      ]
    );
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
        <Polyline
          coordinates={routePolyline ?? [trip.origin, trip.destination]}
          strokeColor={colors.accent}
          strokeWidth={3}
        />
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
          {trip.agreedFare != null && (
            <Text style={styles.tripInfoText}>· S/ {Number(trip.agreedFare).toFixed(2)}</Text>
          )}
        </View>

        {trip.paymentMethod.code === 'YAPE' && trip.driver && (
          <View style={styles.paymentCard}>
            <Text style={styles.paymentTitle}>Paga directamente por Yape</Text>
            <Text style={styles.paymentValue}>{trip.driver.yapePhone ?? 'Número no disponible'}</Text>
            <Text style={styles.paymentCaption}>
              {trip.driver.yapeHolderName ?? 'Confirma el titular con el conductor'}
            </Text>
          </View>
        )}
        {trip.paymentMethod.code === 'CASH' && (
          <Text style={styles.paymentCaption}>Pago en efectivo directamente al conductor.</Text>
        )}

        {trip.status === 'WAITING_CONFIRMATION' && trip.confirmationCode && (
          <TripCodeDisplay code={trip.confirmationCode} />
        )}

        {CANCELLABLE_STATUSES.includes(trip.status) && (
          <Button
            label="Cancelar viaje"
            variant="outline"
            onPress={() => setShowCancellation(true)}
            style={styles.cancel}
          />
        )}
        {trip.status !== 'SEARCHING_DRIVER' && (
          <Button
            label="Reportar un incidente"
            variant="danger"
            onPress={() => navigation.navigate('IncidentReport', { tripId })}
          />
        )}
      </View>
      <CancellationReasonModal
        visible={showCancellation}
        loading={isCancelling}
        onDismiss={() => setShowCancellation(false)}
        onConfirm={handleCancel}
      />
      <Button label="SOS / emergencia" variant="danger" onPress={handleEmergency} />
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
  paymentCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  paymentTitle: { ...typography.caption, color: colors.accent },
  paymentValue: { ...typography.h3, marginTop: spacing.xs },
  paymentCaption: { ...typography.caption, marginTop: spacing.xs },
});
