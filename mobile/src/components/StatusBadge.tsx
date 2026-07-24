import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TRIP_STATUS_META } from '@/constants/tripStatus';
import { radius, spacing } from '@/theme';
import { TripStatus } from '@/types';

/** Pastilla de color + texto para mostrar el estado del viaje en cualquier pantalla. */
export function StatusBadge({ status }: { status: TripStatus }) {
  const meta = TRIP_STATUS_META[status];
  return (
    <View style={[styles.badge, { backgroundColor: meta.color + '26', borderColor: meta.color }]}>
      <View style={[styles.dot, { backgroundColor: meta.color }]} />
      <Text style={[styles.label, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
});
