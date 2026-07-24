import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

/**
 * Muestra en grande el código numérico que el pasajero debe dictar al
 * conductor para iniciar el viaje (pantalla "Esperando confirmación").
 */
export function TripCodeDisplay({ code }: { code: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.caption}>Dicta este código a tu conductor</Text>
      <Text style={typography.code}>{code}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  caption: {
    ...typography.caption,
  },
});
