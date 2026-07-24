import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, TextField } from '@/components';
import { DEFAULT_MAP_REGION } from '@/constants/config';
import { tripService } from '@/services/tripService';
import { colors, radius, spacing, typography } from '@/theme';
import { PassengerStackParamList } from '@/types';
import { PaymentMethodCode } from '@/types/trip';

type Props = NativeStackScreenProps<PassengerStackParamList, 'SelectDestination'>;

const PAYMENT_OPTIONS: { code: PaymentMethodCode; label: string }[] = [
  { code: 'CASH', label: 'Efectivo' },
  { code: 'YAPE', label: 'Yape' },
];

/** El pasajero fija el destino y el método de pago, y solicita el viaje. */
export function SelectDestinationScreen({ navigation, route }: Props) {
  const { origin } = route.params;
  const [region, setRegion] = useState<Region>({ ...DEFAULT_MAP_REGION, latitude: origin.latitude, longitude: origin.longitude });
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodCode>('CASH');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    setIsSubmitting(true);
    try {
      const trip = await tripService.requestTrip({
        origin,
        destination: { latitude: region.latitude, longitude: region.longitude, address: address || undefined },
        paymentMethod,
      });
      navigation.replace('SearchingDriver', { tripId: trip.id });
    } catch (error) {
      Alert.alert('No se pudo solicitar el viaje', (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <MapView style={StyleSheet.absoluteFill} region={region} onRegionChangeComplete={setRegion} />
      <View pointerEvents="none" style={styles.centerPinWrapper}>
        <Text style={styles.pin}>🏁</Text>
      </View>

      <View style={styles.topBar}>
        <Text style={typography.h3}>Destino</Text>
      </View>

      <View style={styles.bottomSheet}>
        <TextField
          label="Referencia (opcional)"
          placeholder="Ej. Mercado de Bella Unión"
          value={address}
          onChangeText={setAddress}
        />

        <Text style={styles.label}>Método de pago</Text>
        <View style={styles.paymentRow}>
          {PAYMENT_OPTIONS.map((option) => (
            <Pressable
              key={option.code}
              onPress={() => setPaymentMethod(option.code)}
              style={[styles.paymentChip, paymentMethod === option.code && styles.paymentChipActive]}
            >
              <Text style={[styles.paymentText, paymentMethod === option.code && styles.paymentTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Button label="Buscar conductor" onPress={handleConfirm} loading={isSubmitting} style={styles.submit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerPinWrapper: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -16,
    marginTop: -32,
  },
  pin: {
    fontSize: 32,
  },
  topBar: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  bottomSheet: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  label: {
    ...typography.caption,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  paymentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  paymentChip: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  paymentText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  paymentTextActive: {
    color: colors.textOnAccent,
  },
  submit: {
    marginTop: spacing.xs,
  },
});
