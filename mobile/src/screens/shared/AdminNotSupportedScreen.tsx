import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing, typography } from '@/theme';

/**
 * El panel administrativo es una aplicación web separada (ver docs/ARCHITECTURE.md);
 * si una cuenta de administrador abre la app móvil, se le informa esto en vez
 * de intentar reutilizar las pantallas de pasajero/conductor.
 */
export function AdminNotSupportedScreen() {
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🖥️</Text>
      <Text style={[typography.h2, styles.title]}>Usa el panel web</Text>
      <Text style={styles.caption}>
        Las cuentas de administrador gestionan Utqallya desde el panel administrativo en la web, no desde esta app.
      </Text>
      <Button label="Cerrar sesión" variant="outline" onPress={logout} style={styles.action} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emoji: {
    fontSize: 40,
  },
  title: {
    textAlign: 'center',
  },
  caption: {
    ...typography.caption,
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.xl,
    alignSelf: 'stretch',
  },
});
