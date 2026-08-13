import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button, CancellationReasonModal, LoadingOverlay, StatusBadge, TextField } from '@/components';
import MapView, { Marker, Polyline } from '@/components/AppMap';
import { useTrip } from '@/context/TripContext';
import { directionsService, RoutePoint } from '@/services/directionsService';
import { emergencyService } from '@/services/emergencyService';
import { tripService } from '@/services/tripService';
import { colors, radius, shadow, spacing, typography } from '@/theme';
import { DriverStackParamList } from '@/types';

type Props = NativeStackScreenProps<DriverStackParamList, 'DriverTrip'>;

/**
 * Pantalla única y adaptativa del viaje activo del conductor: cambia sus
 * acciones según el estado (llegar, confirmar código, finalizar), igual que
 * {@code TripTrackingScreen} en el lado del pasajero, y con el mismo lenguaje
 * visual (ruta real por calles, tarjeta de datos, fila de métricas).
 */
export function DriverTripScreen({ navigation, route }: Props) {
  const { tripId } = route.params;
  const { trip, track, stopTracking } = useTrip();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [routePolyline, setRoutePolyline] = useState<RoutePoint[] | null>(null);
  const [showCancellation, setShowCancellation] = useState(false);

  useEffect(() => {
    track(tripId);
    return () => stopTracking();
  }, [tripId, track, stopTracking]);

  useEffect(() => {
    if (trip?.status === 'CANCELLED') {
      Alert.alert('Viaje cancelado', 'El pasajero canceló el viaje');
      navigation.popToTop();
    }
  }, [trip, navigation]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.origin.latitude, trip?.origin.longitude, trip?.destination.latitude, trip?.destination.longitude]);

  async function handleArrived() {
    setIsSubmitting(true);
    try {
      await tripService.markArrived(tripId);
    } catch (error) {
      Alert.alert('No se pudo actualizar el viaje', (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmCode() {
    setIsSubmitting(true);
    try {
      await tripService.confirmCode(tripId, code);
    } catch (error) {
      Alert.alert('Código incorrecto', (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleFinish() {
    setIsSubmitting(true);
    try {
      await tripService.finishTrip(tripId);
      navigation.popToTop();
    } catch (error) {
      Alert.alert('No se pudo finalizar el viaje', (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel(reason: string) {
    setIsSubmitting(true);
    try {
      await tripService.cancelTrip(tripId, reason);
      setShowCancellation(false);
      navigation.popToTop();
    } catch (error) {
      Alert.alert('No se pudo cancelar', (error as Error).message);
    } finally {
      setIsSubmitting(false);
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

  const passengerInitials = trip.passenger.fullName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...trip.origin, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
      >
        <Marker coordinate={trip.origin} pinColor={colors.accent} title="Origen" />
        <Marker coordinate={trip.destination} pinColor={colors.success} title="Destino" />
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
        <View style={styles.passengerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{passengerInitials}</Text>
          </View>
          <View style={styles.passengerInfo}>
            <Text style={typography.h3}>{trip.passenger.fullName}</Text>
            <Text style={styles.caption}>Pasajero · {trip.paymentMethod.displayName}</Text>
          </View>
        </View>

        <View style={styles.tripInfoRow}>
          <Text style={styles.tripInfoText}>{trip.distanceKm} km</Text>
          <Text style={styles.tripInfoDivider}>·</Text>
          <Text style={styles.tripInfoText}>{trip.estimatedDurationMinutes} min</Text>
          {trip.agreedFare != null && (
            <Text style={styles.tripInfoText}>· S/ {Number(trip.agreedFare).toFixed(2)}</Text>
          )}
        </View>
        <Text style={styles.paymentInstruction}>
          {trip.paymentMethod.code === 'YAPE'
            ? `Cobro por Yape: ${trip.driver?.yapePhone ?? 'configura tus datos en Ajustes'}`
            : 'Cobro en efectivo directamente al pasajero'}
        </Text>

        {trip.status === 'DRIVER_ARRIVING' && (
          <Button
            label="Llegué al punto de recogida"
            onPress={handleArrived}
            loading={isSubmitting}
            style={styles.action}
          />
        )}

        {trip.status === 'WAITING_CONFIRMATION' && (
          <>
            <TextField
              label="Código dictado por el pasajero"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="0000"
            />
            <Button label="Confirmar código" onPress={handleConfirmCode} loading={isSubmitting} style={styles.action} />
          </>
        )}

        {trip.status === 'IN_PROGRESS' && (
          <Button label="Finalizar viaje" onPress={handleFinish} loading={isSubmitting} style={styles.action} />
        )}

        {trip.status !== 'IN_PROGRESS' && (
          <Button
            label="Cancelar viaje"
            variant="outline"
            onPress={() => setShowCancellation(true)}
            style={styles.cancel}
          />
        )}
        <Button
          label="Reportar un incidente"
          variant="danger"
          onPress={() => navigation.navigate('IncidentReport', { tripId })}
        />
        <Button label="SOS / emergencia" variant="danger" onPress={handleEmergency} />
      </View>
      <CancellationReasonModal
        visible={showCancellation}
        loading={isSubmitting}
        onDismiss={() => setShowCancellation(false)}
        onConfirm={handleCancel}
      />
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
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.textOnAccent,
    fontSize: 18,
    fontWeight: '700',
  },
  passengerInfo: {
    flex: 1,
    gap: 2,
  },
  caption: {
    ...typography.caption,
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
  action: {
    marginTop: spacing.xs,
  },
  cancel: {
    marginTop: spacing.xs,
  },
  paymentInstruction: {
    ...typography.caption,
    color: colors.accent,
  },
});
