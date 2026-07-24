import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { LoadingOverlay, ScreenContainer, StatusBadge } from '@/components';
import { tripService } from '@/services/tripService';
import { colors, radius, spacing, typography } from '@/theme';
import { Trip } from '@/types';

/**
 * Historial de viajes. El endpoint "/trips/me" ya devuelve la vista correcta
 * (pasajero o conductor) según el rol autenticado, así que esta pantalla se
 * reutiliza sin ninguna rama de código específica por rol.
 */
export function HistoryScreen() {
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
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={<Text style={styles.empty}>Todavía no tienes viajes registrados</Text>}
        renderItem={({ item }) => <TripHistoryCard trip={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

function TripHistoryCard({ trip }: { trip: Trip }) {
  const date = new Date(trip.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.date}>{date}</Text>
        <StatusBadge status={trip.status} />
      </View>
      <Text style={styles.address} numberOfLines={1}>
        Desde: {trip.origin.address ?? 'Punto en el mapa'}
      </Text>
      <Text style={styles.address} numberOfLines={1}>
        Hasta: {trip.destination.address ?? 'Punto en el mapa'}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={styles.fare}>S/ {trip.fare.toFixed(2)}</Text>
        <Text style={styles.payment}>{trip.paymentMethod.displayName}</Text>
      </View>
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
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  date: {
    ...typography.caption,
  },
  address: {
    ...typography.body,
    fontSize: 13,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  fare: {
    ...typography.bodyStrong,
  },
  payment: {
    ...typography.caption,
  },
});
