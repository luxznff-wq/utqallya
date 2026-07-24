import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, DriverInfoCard, LoadingOverlay } from '@/components';
import { useTrip } from '@/context/TripContext';
import { colors, spacing, typography } from '@/theme';
import { PassengerStackParamList } from '@/types';

type Props = NativeStackScreenProps<PassengerStackParamList, 'DriverFound'>;

/** Confirmación breve de que un conductor aceptó el viaje, antes de pasar al seguimiento en vivo. */
export function DriverFoundScreen({ navigation, route }: Props) {
  const { tripId } = route.params;
  const { trip, track } = useTrip();

  useEffect(() => {
    track(tripId);
  }, [tripId, track]);

  if (!trip?.driver) {
    return <LoadingOverlay message="Confirmando conductor..." />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🎉</Text>
      <Text style={[typography.h2, styles.title]}>¡Conductor encontrado!</Text>
      <Text style={styles.caption}>Va en camino a tu punto de recogida</Text>

      <DriverInfoCard driver={trip.driver} />

      <Button label="Ver seguimiento" onPress={() => navigation.replace('TripTracking', { tripId })} style={styles.cta} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emoji: {
    fontSize: 40,
    textAlign: 'center',
  },
  title: {
    textAlign: 'center',
  },
  caption: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  cta: {
    marginTop: spacing.xl,
  },
});
