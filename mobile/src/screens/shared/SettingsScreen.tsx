import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, ScreenContainer } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { colors, radius, spacing, typography } from '@/theme';

/** Configuración básica de la cuenta. Deliberadamente simple: sin funciones innecesarias. */
export function SettingsScreen() {
  const { logout } = useAuth();

  return (
    <ScreenContainer>
      <Text style={[typography.h2, styles.title]}>Configuración</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Versión de la app</Text>
        <Text style={styles.value}>Utqallya 0.1.0</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Zona de cobertura</Text>
        <Text style={styles.value}>Acarí y Bella Unión — Caravelí, Arequipa</Text>
      </View>

      <Button label="Cerrar sesión" variant="danger" onPress={logout} style={styles.logout} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.bodyStrong,
    fontSize: 14,
  },
  logout: {
    marginTop: spacing.lg,
  },
});
