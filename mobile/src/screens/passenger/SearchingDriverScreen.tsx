import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '@/components';
import { useTrip } from '@/context/TripContext';
import { tripService } from '@/services/tripService';
import { colors, spacing, typography } from '@/theme';
import { PassengerStackParamList } from '@/types';

type Props = NativeStackScreenProps<PassengerStackParamList, 'SearchingDriver'>;

/** Se muestra mientras el viaje está en SEARCHING_DRIVER, esperando que algún conductor acepte. */
export function SearchingDriverScreen({ navigation, route }: Props) {
  const { tripId } = route.params;
  const { trip, track, stopTracking } = useTrip();

  useEffect(() => {
    track(tripId);
  }, [tripId, track]);

  useEffect(() => {
    if (!trip) {
      return;
    }
    if (trip.status === 'CANCELLED') {
      stopTracking();
      Alert.alert('Viaje cancelado', trip.cancelReason ?? 'No se encontró un conductor disponible');
      navigation.popToTop();
      return;
    }
    if (trip.status !== 'SEARCHING_DRIVER' && trip.status !== 'REQUESTED') {
      navigation.replace('DriverFound', { tripId });
    }
  }, [trip, navigation, tripId, stopTracking]);

  async function handleCancel() {
    try {
      await tripService.cancelTrip(tripId, 'El pasajero canceló la búsqueda');
    } finally {
      stopTracking();
      navigation.popToTop();
    }
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={[typography.h2, styles.title]}>Buscando conductor cercano…</Text>
      <Text style={styles.caption}>Notificamos a los conductores disponibles en tu zona</Text>

      <Button label="Cancelar búsqueda" variant="outline" onPress={handleCancel} style={styles.cancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  caption: {
    ...typography.caption,
    textAlign: 'center',
  },
  cancel: {
    marginTop: spacing.xxl,
    alignSelf: 'stretch',
  },
});
