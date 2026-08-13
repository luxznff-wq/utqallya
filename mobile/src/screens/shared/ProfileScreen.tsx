import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, LoadingOverlay, ScreenContainer } from '@/components';
import { CorreoIcon, TelefonoIcon } from '@/components/icons';
import { useAuth } from '@/context/AuthContext';
import { driverService } from '@/services/driverService';
import { colors, radius, spacing, typography } from '@/theme';
import { DriverApprovalStatus, DriverProfile } from '@/types';
import { DriverStackParamList, PassengerStackParamList } from '@/types/navigation';

type SettingsNav = NativeStackNavigationProp<PassengerStackParamList | DriverStackParamList>;

const APPROVAL_LABEL: Record<DriverApprovalStatus, string> = {
  APPROVED: 'Verificado',
  PENDING: 'Pendiente de revisión',
  REJECTED: 'Rechazado',
  BLOCKED: 'Bloqueado',
};

const APPROVAL_COLOR: Record<DriverApprovalStatus, string> = {
  APPROVED: colors.success,
  PENDING: colors.warning,
  REJECTED: colors.danger,
  BLOCKED: colors.danger,
};

/**
 * Perfil del usuario. Pantalla compartida entre pasajero y conductor: cuando
 * el rol es DRIVER se agrega vehículo/calificación/documentos (evita
 * duplicar dos pantallas casi iguales). Solo se muestran datos reales del
 * backend — sin insignias de "verificación" decorativas que no existen.
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

  const initials = user.fullName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[typography.h2, styles.title]}>Perfil</Text>

        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user.fullName}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        <View style={styles.card}>
          <Row icon={<CorreoIcon size={16} color={colors.textSecondary} />} label="Correo" value={user.email} />
          <Row icon={<TelefonoIcon size={16} color={colors.textSecondary} />} label="Teléfono" value={user.phone} />
        </View>

        {driverProfile && (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Vehículo</Text>
              <Row
                icon={<Text style={styles.rowEmoji}>{driverProfile.vehicle?.type === 'MOTOTAXI' ? '🛺' : '🚗'}</Text>}
                label="Tipo"
                value={driverProfile.vehicle?.type === 'MOTOTAXI' ? 'Mototaxi' : 'Automóvil'}
              />
              <Row
                icon={<Text style={styles.rowEmoji}>🔢</Text>}
                label="Placa"
                value={driverProfile.vehicle?.plate ?? '-'}
              />
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.card, styles.statCard]}>
                <Text style={styles.statLabel}>Calificación</Text>
                <Text style={styles.statValue}>★ {driverProfile.ratingAverage.toFixed(2)}</Text>
              </View>
              <View style={[styles.card, styles.statCard]}>
                <Text style={styles.statLabel}>Viajes</Text>
                <Text style={styles.statValue}>{driverProfile.totalTrips}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Documentos</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: APPROVAL_COLOR[driverProfile.approvalStatus] }]} />
                <Text style={[styles.statusText, { color: APPROVAL_COLOR[driverProfile.approvalStatus] }]}>
                  {APPROVAL_LABEL[driverProfile.approvalStatus]}
                </Text>
              </View>
              <Row
                icon={<Text style={styles.rowEmoji}>📅</Text>}
                label="Licencia"
                value={driverProfile.licenseExpiresAt ?? 'Sin fecha'}
              />
              <Row
                icon={<Text style={styles.rowEmoji}>📅</Text>}
                label="SOAT"
                value={driverProfile.soatExpiresAt ?? 'Sin fecha'}
              />
            </View>
            <Button
              label="Renovar licencia o SOAT"
              variant="secondary"
              onPress={() => navigation.navigate('RenewDocuments' as never)}
              style={styles.action}
            />
          </>
        )}

        <Button
          label="Configuración"
          variant="secondary"
          onPress={() => navigation.navigate('Settings')}
          style={styles.action}
        />
        <Button label="Cerrar sesión" variant="outline" onPress={logout} style={styles.action} />
      </ScrollView>
    </ScreenContainer>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    color: colors.textOnAccent,
    fontSize: 28,
    fontWeight: '700',
  },
  name: {
    ...typography.h3,
  },
  email: {
    ...typography.caption,
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
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowIcon: {
    width: 22,
    alignItems: 'center',
  },
  rowEmoji: {
    fontSize: 16,
  },
  rowLabel: {
    ...typography.caption,
    width: 80,
  },
  rowValue: {
    ...typography.bodyStrong,
    fontSize: 14,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
  },
  statValue: {
    ...typography.h3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontWeight: '700',
    fontSize: 14,
  },
  action: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
});
