import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components';
import { useTrip } from '@/context/TripContext';
import { tripService } from '@/services/tripService';
import { colors, radius, spacing, typography } from '@/theme';
import { PassengerStackParamList, TripOffer } from '@/types';

type Props = NativeStackScreenProps<PassengerStackParamList, 'SearchingDriver'>;

const RING_COUNT = 3;
const RING_DELAY_MS = 500;
const PULSE_DURATION_MS = 2200;

/** Se muestra mientras el viaje está en SEARCHING_DRIVER, esperando que algún conductor acepte. */
export function SearchingDriverScreen({ navigation, route }: Props) {
  const { tripId } = route.params;
  const { trip, track, stopTracking } = useTrip();
  const rings = useMemo(() => Array.from({ length: RING_COUNT }, () => new Animated.Value(0)), []);
  const cancelledRef = useRef(false);
  const [offers, setOffers] = useState<TripOffer[]>([]);
  const [selectingOfferId, setSelectingOfferId] = useState<string | null>(null);

  useEffect(() => {
    track(tripId);
  }, [tripId, track]);

  useEffect(() => {
    const animations = rings.map((ring, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * RING_DELAY_MS),
          Animated.timing(ring, {
            toValue: 1,
            duration: PULSE_DURATION_MS,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ring, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
    );
    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [rings]);

  useEffect(() => {
    const loadOffers = () => {
      tripService
        .getOffers(tripId)
        .then(setOffers)
        .catch(() => undefined);
    };
    loadOffers();
    const interval = setInterval(loadOffers, 3000);
    return () => clearInterval(interval);
  }, [tripId]);

  useEffect(() => {
    if (!trip || cancelledRef.current) {
      return;
    }
    if (trip.status === 'CANCELLED') {
      stopTracking();
      Alert.alert('Viaje cancelado', trip.cancelReason ?? 'No se encontró un conductor disponible');
      navigation.popToTop();
      return;
    }
    if (trip.status !== 'SEARCHING_DRIVER' && trip.status !== 'REQUESTED') {
      navigation.replace('DriverFound', { tripId });
    }
  }, [trip, navigation, tripId, stopTracking]);

  async function handleCancel() {
    cancelledRef.current = true;
    try {
      await tripService.cancelTrip(tripId, 'El pasajero canceló la búsqueda');
    } finally {
      stopTracking();
      navigation.popToTop();
    }
  }

  async function selectOffer(offer: TripOffer) {
    setSelectingOfferId(offer.id);
    try {
      await tripService.selectOffer(tripId, offer.id);
      navigation.replace('DriverFound', { tripId });
    } catch (error) {
      Alert.alert('Oferta no disponible', (error as Error).message);
      setOffers(await tripService.getOffers(tripId).catch(() => []));
    } finally {
      setSelectingOfferId(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.radarWrapper}>
        {rings.map((ring, index) => (
          <Animated.View
            key={index}
            style={[
              styles.ring,
              {
                opacity: ring.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.55, 0.2, 0] }),
                transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }],
              },
            ]}
          />
        ))}
        <View style={styles.carBadge}>
          <Text style={styles.carIcon}>🚗</Text>
        </View>
      </View>

      <Text style={[typography.h2, styles.title]}>{offers.length ? 'Elige una oferta' : 'Esperando ofertas…'}</Text>
      <Text style={styles.caption}>
        {offers.length
          ? 'Los precios los proponen los conductores. Revisa conductor, vehículo y calificación.'
          : 'Notificamos a los conductores disponibles en tu zona'}
      </Text>

      {offers.length > 0 && (
        <ScrollView style={styles.offers} contentContainerStyle={styles.offersContent}>
          {offers.map((offer) => (
            <View key={offer.id} style={styles.offerCard}>
              <View style={styles.offerHeader}>
                <View style={styles.offerDriver}>
                  <Text style={styles.driverName}>{offer.driver.user.fullName}</Text>
                  <Text style={styles.offerMeta}>
                    ★ {offer.driver.ratingAverage.toFixed(1)} · {offer.driver.vehicle?.plate ?? 'Sin placa'}
                  </Text>
                </View>
                <Text style={styles.amount}>S/ {Number(offer.amount).toFixed(2)}</Text>
              </View>
              <Button
                label="Elegir esta oferta"
                onPress={() => selectOffer(offer)}
                loading={selectingOfferId === offer.id}
                disabled={selectingOfferId !== null && selectingOfferId !== offer.id}
              />
            </View>
          ))}
        </ScrollView>
      )}

      <Button label="Cancelar búsqueda" variant="outline" onPress={handleCancel} style={styles.cancel} />
    </View>
  );
}

const RADAR_SIZE = 220;
const RING_SIZE = 120;
const CAR_BADGE_SIZE = 72;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  radarWrapper: {
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  carBadge: {
    width: CAR_BADGE_SIZE,
    height: CAR_BADGE_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carIcon: {
    fontSize: 30,
  },
  title: {
    textAlign: 'center',
  },
  caption: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  cancel: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
  offers: { width: '100%', maxHeight: 300, marginTop: spacing.md },
  offersContent: { gap: spacing.sm },
  offerCard: {
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
  },
  offerHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  offerDriver: { flex: 1 },
  driverName: { ...typography.bodyStrong },
  offerMeta: { ...typography.caption },
  amount: { ...typography.h3, color: colors.accent },
});
