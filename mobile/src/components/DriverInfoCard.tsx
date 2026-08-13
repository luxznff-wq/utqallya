import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadow, spacing, typography } from '@/theme';
import { DriverProfile } from '@/types';

/** Tarjeta con los datos del conductor asignado: vehículo, placa y calificación. */
export function DriverInfoCard({ driver }: { driver: DriverProfile }) {
  return (
    <View style={styles.card}>
      <Image source={driver.vehicle?.photoUrl ? { uri: driver.vehicle.photoUrl } : undefined} style={styles.photo} />
      <View style={styles.info}>
        <Text style={typography.h3}>{driver.user.fullName}</Text>
        <Text style={styles.subtitle}>
          {driver.vehicle?.type === 'MOTOTAXI' ? 'Mototaxi' : 'Automóvil'} · {driver.vehicle?.plate}
        </Text>
        <View style={styles.ratingRow}>
          <Text style={styles.star}>★</Text>
          <Text style={styles.rating}>{driver.ratingAverage.toFixed(1)}</Text>
          <Text style={styles.tripsCount}>({driver.totalTrips} viajes)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    ...shadow.card,
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  subtitle: {
    ...typography.caption,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  star: {
    color: colors.warning,
    fontSize: 14,
  },
  rating: {
    ...typography.bodyStrong,
    fontSize: 13,
  },
  tripsCount: {
    ...typography.caption,
  },
});
