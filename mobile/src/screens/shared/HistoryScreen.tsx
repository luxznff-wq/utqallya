import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Button, LoadingOverlay, ScreenContainer, StatusBadge } from '@/components';
import { DestinoIcon, PerfilIcon } from '@/components/icons';
import { useAuth } from '@/context/AuthContext';
import { tripService } from '@/services/tripService';
import { colors, radius, spacing, typography } from '@/theme';
import { Trip } from '@/types';

const COMPLETED_STATUSES: Trip['status'][] = ['FINISHED', 'RATED'];

/**
 * Historial de viajes. El endpoint "/trips/me" ya devuelve la vista correcta
 * (pasajero o conductor) según el rol autenticado, así que esta pantalla se
 * reutiliza sin ninguna rama de código específica por rol.
 */
export function HistoryScreen() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    const page = await tripService.getMyHistory();
    setTrips(page.content);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }

  if (!trips) {
    return <LoadingOverlay message="Cargando historial..." />;
  }

  return (
    <ScreenContainer>
      <Text style={[typography.h2, styles.title]}>Historial de viajes</Text>
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
        }
        ListEmptyComponent={<Text style={styles.empty}>Todavía no tienes viajes registrados</Text>}
        renderItem={({ item }) => <TripHistoryCard trip={item} role={user?.role} onConfirmed={load} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

function TripHistoryCard({
  trip,
  role,
  onConfirmed,
}: {
  trip: Trip;
  role?: 'PASSENGER' | 'DRIVER' | 'ADMIN';
  onConfirmed: () => Promise<void>;
}) {
  const date = new Date(trip.createdAt).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const isCompleted = COMPLETED_STATUSES.includes(trip.status);
  const hasConfirmed =
    role === 'DRIVER' ? trip.driverPaymentConfirmedAt != null : trip.passengerPaymentConfirmedAt != null;

  async function confirmPayment() {
    try {
      await tripService.confirmPayment(trip.id);
      await onConfirmed();
      Alert.alert('Pago confirmado', 'La confirmación quedó registrada.');
    } catch (error) {
      Alert.alert('No se pudo confirmar', (error as Error).message);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.date}>{date}</Text>
        <StatusBadge status={trip.status} />
      </View>

      <View style={styles.body}>
        <RouteIcon />
        <View style={styles.addresses}>
          <Text style={styles.address} numberOfLines={1}>
            Desde: {trip.origin.address ?? 'Punto en el mapa'}
          </Text>
          <Text style={styles.address} numberOfLines={1}>
            Hasta: {trip.destination.address ?? 'Punto en el mapa'}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.payment}>{trip.paymentMethod.displayName}</Text>
        </View>
        {isCompleted && trip.driver && (
          <View style={styles.driverBadges}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconCircleText}>{trip.driver.vehicle?.type === 'MOTOTAXI' ? '🛺' : '🚗'}</Text>
            </View>
            <View style={styles.iconCircle}>
              <PerfilIcon size={14} color={colors.textSecondary} />
            </View>
          </View>
        )}
      </View>
      {isCompleted && trip.agreedFare != null && (
        <View style={styles.paymentConfirmation}>
          <Text style={styles.fare}>Tarifa acordada: S/ {Number(trip.agreedFare).toFixed(2)}</Text>
          {hasConfirmed ? (
            <Text style={styles.confirmed}>Pago confirmado por ti</Text>
          ) : (
            <Button
              label={role === 'DRIVER' ? 'Confirmar pago recibido' : 'Confirmar pago realizado'}
              variant="secondary"
              onPress={confirmPayment}
            />
          )}
        </View>
      )}
    </View>
  );
}

function RouteIcon() {
  return (
    <View style={styles.routeIcon}>
      <View style={styles.routeDot} />
      <View style={styles.routeLine} />
      <DestinoIcon size={12} color={colors.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  list: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  empty: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    ...typography.caption,
  },
  body: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  routeIcon: {
    width: 20,
    alignItems: 'center',
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginTop: 4,
  },
  routeLine: {
    flex: 1,
    minHeight: 12,
    width: 1,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    marginVertical: 2,
  },
  addresses: {
    flex: 1,
    gap: spacing.xs,
  },
  address: {
    ...typography.body,
    fontSize: 13,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  payment: {
    ...typography.caption,
  },
  driverBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleText: {
    fontSize: 14,
  },
  paymentConfirmation: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  fare: { ...typography.bodyStrong },
  confirmed: { ...typography.caption, color: colors.success },
});
