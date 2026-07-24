import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, LoadingOverlay, StatusBadge, TextField } from '@/components';
import { useTrip } from '@/context/TripContext';
import { tripService } from '@/services/tripService';
import { colors, radius, shadow, spacing, typography } from '@/theme';
import { DriverStackParamList } from '@/types';

type Props = NativeStackScreenProps<DriverStackParamList, 'DriverTrip'>;

/**
 * Pantalla única y adaptativa del viaje activo del conductor: cambia sus
 * acciones según el estado (llegar, confirmar código, finalizar), igual que
 * {@code TripTrackingScreen} en el lado del pasajero.
 */
export function DriverTripScreen({ navigation, route }: Props) {
  const { tripId } = route.params;
  const { trip, track, stopTracking } = useTrip();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  async function handleCancel() {
    Alert.alert('Cancelar viaje', '¿Seguro que deseas cancelar?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          await tripService.cancelTrip(tripId);
          navigation.popToTop();
        },
      },
    ]);
  }

  if (!trip) {
    return <LoadingOverlay message="Cargando viaje..." />;
  }

  const destinationForLeg = trip.status === 'IN_PROGRESS' ? trip.destination : trip.origin;

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...trip.origin, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
      >
        <Marker coordinate={trip.origin} pinColor={colors.accent} title="Origen" />
        <Marker coordinate={trip.destination} pinColor={colors.success} title="Destino" />
        <Polyline coordinates={[trip.origin, destinationForLeg]} strokeColor={colors.accent} strokeWidth={3} />
      </MapView>

      <View style={styles.topBar}>
        <StatusBadge status={trip.status} />
      </View>

      <View style={styles.bottomSheet}>
        <Text style={typography.h3}>{trip.passenger.fullName}</Text>
        <Text style={styles.caption}>
          {trip.distanceKm} km · {trip.estimatedDurationMinutes} min · S/ {trip.fare.toFixed(2)} (
          {trip.paymentMethod.displayName})
        </Text>

        {trip.status === 'DRIVER_ARRIVING' && (
          <Button label="Llegué al punto de recogida" onPress={handleArrived} loading={isSubmitting} style={styles.action} />
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
    gap: spacing.sm,
    ...shadow.card,
  },
  caption: {
    ...typography.caption,
  },
  action: {
    marginTop: spacing.sm,
  },
  cancel: {
    marginTop: spacing.xs,
  },
});
