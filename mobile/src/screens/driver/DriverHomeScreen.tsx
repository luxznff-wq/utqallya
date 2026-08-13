import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { Button, LoadingOverlay, TripOfferModal } from '@/components';
import MapView, { Marker, Region } from '@/components/AppMap';
import { DEFAULT_MAP_REGION, DRIVER_LOCATION_UPDATE_INTERVAL_MS } from '@/constants/config';
import { driverService } from '@/services/driverService';
import { locationService } from '@/services/locationService';
import { notificationService } from '@/services/notificationService';
import { tripService } from '@/services/tripService';
import { colors, radius, shadow, spacing, typography } from '@/theme';
import { DriverProfile, DriverStackParamList, DriverTabParamList, TripOffer } from '@/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<DriverTabParamList, 'Home'>,
  NativeStackScreenProps<DriverStackParamList>
>;

/**
 * Pantalla principal del conductor: mapa, toggle de disponibilidad y escucha
 * de solicitudes de viaje entrantes. No hay negociación: el primer conductor
 * que presiona "Aceptar" se queda con el viaje.
 *
 * La detección de viajes nuevos tiene dos vías: notificación push (si está
 * disponible) y sondeo de respaldo (ver más abajo) — Expo Go no soporta push
 * remoto en Android desde el SDK 53, y aun con un build nativo el push puede
 * fallar (permisos, dispositivo apagado, etc.), así que depender solo de él
 * dejaría al conductor sin forma de enterarse de un viaje.
 */
export function DriverHomeScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_MAP_REGION);
  const [isLoading, setIsLoading] = useState(true);
  const promptedTripIds = useRef<Set<string>>(new Set());
  const [offerTripId, setOfferTripId] = useState<string | null>(null);
  const [isOffering, setIsOffering] = useState(false);
  const [pendingOffers, setPendingOffers] = useState<TripOffer[]>([]);

  const loadProfile = useCallback(async () => {
    try {
      const data = await driverService.getMyProfile();
      setProfile(data);
      setPendingOffers(await tripService.getMyOffers().catch(() => []));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // useFocusEffect ya cubre la carga inicial (se dispara también al montar)
  // y además refresca el perfil cada vez que la pestaña vuelve a enfocarse — evita
  // mostrar "disponible" desactualizado después de que un viaje termina
  // (el backend reactiva la disponibilidad automáticamente en finishTrip).
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  // Mantiene la ubicación incluso con la pantalla apagada mediante una tarea nativa.
  useEffect(() => {
    if (profile?.availability !== 'AVAILABLE') {
      locationService.stopDriverBackgroundUpdates().catch(() => undefined);
      return;
    }

    const startLocation = async () => {
      const backgroundGranted = await locationService.startDriverBackgroundUpdates();
      if (!backgroundGranted) {
        Alert.alert(
          'Ubicación en segundo plano requerida',
          'Para recibir viajes con la pantalla apagada, habilita el permiso “Permitir siempre”.'
        );
        return;
      }
      const position = await locationService.getCurrentPosition();
      setRegion((prev) => ({ ...prev, latitude: position.coords.latitude, longitude: position.coords.longitude }));
      await driverService.updateLocation(
        position.coords.latitude,
        position.coords.longitude,
        position.coords.heading ?? undefined
      );
    };

    startLocation().catch(() => {
      Alert.alert('No se pudo activar la ubicación', 'Revisa los permisos de ubicación del dispositivo.');
    });
  }, [profile?.availability]);

  // Escucha notificaciones push de nuevos viajes disponibles.
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const tripId = notification.request.content.data?.tripId as string | undefined;
      const notificationType = notification.request.content.data?.notificationType as string | undefined;
      if (tripId && notificationType === 'TRIP_REQUEST') {
        promptTripRequest(tripId);
      } else if (tripId && notificationType === 'TRIP_OFFER_SELECTED') {
        navigation.navigate('DriverTrip', { tripId });
      }
    });
    return () => subscription.remove();
  }, []);

  // Sondeo de respaldo: el backend persiste toda notificación TRIP_REQUEST
  // aunque el push nunca llegue (ver FcmNotificationServiceImpl). Sin esto,
  // un conductor sin push funcional jamás vería una solicitud de viaje.
  useEffect(() => {
    if (profile?.approvalStatus !== 'APPROVED' || profile?.availability !== 'AVAILABLE') {
      return;
    }

    const poll = async () => {
      try {
        const page = await notificationService.getMyNotifications(0, 5);
        const pending = page.content.find((item) => item.type === 'TRIP_REQUEST' && !item.read && item.relatedTripId);
        if (pending?.relatedTripId) {
          await notificationService.markAsRead(pending.id);
          promptTripRequest(pending.relatedTripId);
        }
      } catch {
        // Un fallo puntual de sondeo no debe interrumpir al conductor; se reintenta en el próximo ciclo.
      }
    };

    poll();
    const interval = setInterval(poll, DRIVER_LOCATION_UPDATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [profile?.approvalStatus, profile?.availability]);

  function promptTripRequest(tripId: string) {
    if (promptedTripIds.current.has(tripId)) {
      return;
    }
    promptedTripIds.current.add(tripId);

    Alert.alert('Nuevo viaje disponible', '¿Deseas proponer un precio al pasajero?', [
      { text: 'Ignorar', style: 'cancel' },
      {
        text: 'Ofertar',
        onPress: () => setOfferTripId(tripId),
      },
    ]);
  }

  async function submitOffer(amount: number) {
    if (!offerTripId) return;
    setIsOffering(true);
    try {
      await tripService.createOffer(offerTripId, amount);
      setOfferTripId(null);
      setPendingOffers(await tripService.getMyOffers());
      Alert.alert('Oferta enviada', 'Te avisaremos si el pasajero elige tu propuesta.');
    } catch (error) {
      Alert.alert('No se pudo ofertar', (error as Error).message);
    } finally {
      setIsOffering(false);
    }
  }

  async function withdrawOffer(tripId: string) {
    try {
      await tripService.withdrawOffer(tripId);
      setPendingOffers((current) => current.filter((offer) => offer.tripId !== tripId));
    } catch (error) {
      Alert.alert('No se pudo retirar', (error as Error).message);
    }
  }

  async function toggleAvailability(value: boolean) {
    try {
      if (value && !(await locationService.startDriverBackgroundUpdates())) {
        Alert.alert('Permiso requerido', 'Debes permitir la ubicación en segundo plano para quedar disponible.');
        return;
      }
      const updated = await driverService.setAvailability(value);
      setProfile(updated);
      if (!value) await locationService.stopDriverBackgroundUpdates();
    } catch (error) {
      Alert.alert('No se pudo actualizar tu disponibilidad', (error as Error).message);
    }
  }

  if (isLoading || !profile) {
    return <LoadingOverlay message="Cargando tu perfil..." />;
  }

  const isPending = profile.approvalStatus !== 'APPROVED';

  return (
    <View style={styles.container}>
      <MapView style={StyleSheet.absoluteFill} region={region}>
        <Marker coordinate={region} />
      </MapView>

      <View style={styles.header}>
        <Text style={styles.brand}>Utqallya</Text>
        {!isPending && (
          <View style={styles.statsChip}>
            <Text style={styles.star}>★</Text>
            <Text style={styles.statsText}>{profile.ratingAverage.toFixed(1)}</Text>
            <Text style={styles.statsDivider}>·</Text>
            <Text style={styles.statsText}>{profile.totalTrips} viajes</Text>
          </View>
        )}
      </View>

      <View style={styles.statusCard}>
        {isPending ? (
          <>
            <Text style={typography.h3}>Cuenta en revisión</Text>
            <Text style={styles.caption}>
              {profile.approvalStatus === 'REJECTED'
                ? `Tu solicitud fue rechazada: ${profile.rejectionReason ?? 'contacta al administrador'}`
                : 'Un administrador revisará tu documentación pronto'}
            </Text>
          </>
        ) : (
          <>
            <View style={styles.availabilityRow}>
              <View style={styles.availabilityInfo}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: profile.availability === 'AVAILABLE' ? colors.success : colors.textMuted },
                  ]}
                />
                <View>
                  <Text style={typography.h3}>
                    {profile.availability === 'AVAILABLE' ? 'Disponible' : 'No disponible'}
                  </Text>
                  <Text style={styles.caption}>
                    {profile.availability === 'AVAILABLE'
                      ? 'Recibiendo solicitudes de viaje'
                      : 'Actívate para recibir viajes'}
                  </Text>
                </View>
              </View>
              <Switch
                value={profile.availability === 'AVAILABLE'}
                onValueChange={toggleAvailability}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.white}
              />
            </View>
            {pendingOffers.map((offer) => (
              <View key={offer.id} style={styles.pendingOffer}>
                <Text style={styles.pendingOfferText}>Oferta pendiente: S/ {Number(offer.amount).toFixed(2)}</Text>
                <Button label="Retirar oferta" variant="outline" onPress={() => withdrawOffer(offer.tripId)} />
              </View>
            ))}
          </>
        )}
      </View>
      <TripOfferModal
        visible={offerTripId !== null}
        loading={isOffering}
        onDismiss={() => setOfferTripId(null)}
        onConfirm={submitOffer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 20,
  },
  statsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    ...shadow.card,
  },
  star: {
    color: colors.warning,
    fontSize: 13,
  },
  statsText: {
    ...typography.bodyStrong,
    fontSize: 13,
  },
  statsDivider: {
    color: colors.textMuted,
  },
  statusCard: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadow.card,
  },
  caption: {
    ...typography.caption,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availabilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pendingOffer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pendingOfferText: {
    ...typography.bodyStrong,
    color: colors.accent,
  },
});
