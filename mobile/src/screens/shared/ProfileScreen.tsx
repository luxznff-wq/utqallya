import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button, LoadingOverlay, ScreenContainer } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { driverService } from '@/services/driverService';
import { colors, radius, spacing, typography } from '@/theme';
import { DriverProfile } from '@/types';
import { DriverStackParamList, PassengerStackParamList } from '@/types/navigation';

type SettingsNav = NativeStackNavigationProp<PassengerStackParamList | DriverStackParamList>;

/**
 * Perfil del usuario. Pantalla compartida entre pasajero y conductor: cuando
 * el rol es DRIVER se agrega la sección de vehículo/calificación/viajes que
 * pide el spec de "Perfil conductor" (evita duplicar dos pantallas casi iguales).
 */
export function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<SettingsNav>();
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [isLoading, setIsLoading] = useState(user?.role === 'DRIVER');

  useEffect(() => {
    if (user?.role === 'DRIVER') {
      driverService
        .getMyProfile()
        .then(setDriverProfile)
        .finally(() => setIsLoading(false));
    }
  }, [user?.role]);

  if (!user || isLoading) {
    return <LoadingOverlay />;
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[typography.h2, styles.title]}>Perfil</Text>

        <View style={styles.card}>
          <Row label="Nombre" value={user.fullName} />
          <Row label="Correo" value={user.email} />
          <Row label="Teléfono" value={user.phone} />
        </View>

        {driverProfile && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Vehículo</Text>
            <Row label="Tipo" value={driverProfile.vehicle?.type === 'MOTOTAXI' ? 'Mototaxi' : 'Automóvil'} />
            <Row label="Placa" value={driverProfile.vehicle?.plate ?? '-'} />
            <Row label="Calificación" value={`★ ${driverProfile.ratingAverage.toFixed(1)}`} />
            <Row label="Viajes realizados" value={String(driverProfile.totalTrips)} />
            <Row label="Estado" value={driverProfile.approvalStatus === 'APPROVED' ? 'Aprobado' : driverProfile.approvalStatus} />
          </View>
        )}

        <Button label="Configuración" variant="secondary" onPress={() => navigation.navigate('Settings')} style={styles.action} />
        <Button label="Cerrar sesión" variant="outline" onPress={logout} style={styles.action} />
      </ScrollView>
    </ScreenContainer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
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
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowLabel: {
    ...typography.caption,
  },
  rowValue: {
    ...typography.bodyStrong,
    fontSize: 14,
  },
  action: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
});
