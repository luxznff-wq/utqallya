import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme';

/** Splash de marca: muestra el nombre "Utqallya" al abrir la app. */
export function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Utqallya</Text>
      <Text style={styles.tagline}>Transporte local · Acarí y Bella Unión</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  brand: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
