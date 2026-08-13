import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components';
import MapView, { Marker, Polyline } from '@/components/AppMap';
import { directionsService, Route } from '@/services/directionsService';
import { tripService } from '@/services/tripService';
import { colors, radius, shadow, spacing, typography } from '@/theme';
import { PassengerStackParamList } from '@/types';
import { VehicleType } from '@/types/driver';
import { PaymentMethodCode } from '@/types/trip';

type Props = NativeStackScreenProps<PassengerStackParamList, 'ChooseVehicle'>;

const VEHICLE_OPTIONS: { type: VehicleType; icon: string; label: string; description: string }[] = [
  { type: 'MOTOTAXI', icon: '🛺', label: 'Mototaxi', description: 'Rápido, ideal para trayectos cortos' },
  { type: 'CAR', icon: '🚗', label: 'Automóvil', description: 'Más espacio y comodidad' },
];

const PAYMENT_OPTIONS: { code: PaymentMethodCode; label: string }[] = [
  { code: 'CASH', label: 'Efectivo' },
  { code: 'YAPE', label: 'Yape' },
];

/**
 * El pasajero elige tipo de vehículo y método de pago, y confirma el pedido.
 * El precio no se muestra aquí: lo define el conductor al aceptar, no hay
 * negociación ni tarifa dinámica (ver spec original del producto).
 */
export function ChooseVehicleScreen({ navigation, route }: Props) {
  const { origin, destination } = route.params;
  const [vehicleType, setVehicleType] = useState<VehicleType>('MOTOTAXI');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodCode>('CASH');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [computedRoute, setComputedRoute] = useState<Route | null>(null);

  useEffect(() => {
    directionsService
      .getRoute(origin, destination)
      .then(setComputedRoute)
      .catch(() => {
        // Sin ruta calculada, el mapa igual muestra la línea recta entre los puntos.
      });
  }, [origin, destination]);

  async function handleConfirm() {
    setIsSubmitting(true);
    try {
      const trip = await tripService.requestTrip({ origin, destination, paymentMethod, vehicleType });
      navigation.replace('SearchingDriver', { tripId: trip.id });
    } catch (error) {
      Alert.alert('No se pudo solicitar el viaje', (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapPreview}>
        <MapView
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: origin.latitude,
            longitude: origin.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <Marker coordinate={origin} pinColor={colors.accent} title="Origen" />
          <Marker coordinate={destination} pinColor={colors.success} title="Destino" />
          <Polyline
            coordinates={computedRoute?.polyline ?? [origin, destination]}
            strokeColor={colors.accent}
            strokeWidth={3}
          />
        </MapView>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={12}>
          <Text style={styles.backText}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.sheet}>
        <Text style={typography.h3}>Elige un vehículo</Text>
        {computedRoute && (
          <Text style={styles.routeSummary}>
            {computedRoute.distanceKm.toFixed(1)} km · {computedRoute.durationMinutes} min
          </Text>
        )}

        <View style={styles.vehicleList}>
          {VEHICLE_OPTIONS.map((option) => {
            const active = vehicleType === option.type;
            return (
              <Pressable
                key={option.type}
                onPress={() => setVehicleType(option.type)}
                style={[styles.vehicleCard, active && styles.vehicleCardActive]}
              >
                <Text style={styles.vehicleIcon}>{option.icon}</Text>
                <View style={styles.vehicleText}>
                  <Text style={styles.vehicleLabel}>{option.label}</Text>
                  <Text style={styles.vehicleDescription}>{option.description}</Text>
                </View>
                <View style={[styles.radio, active && styles.radioActive]} />
              </Pressable>
            );
          })}
        </View>

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
        <Text style={styles.paymentNotice}>
          El pago se realiza directamente al conductor. Utqallya no recibe ni procesa el dinero.
        </Text>

        <Button label="Confirmar pedido" onPress={handleConfirm} loading={isSubmitting} style={styles.submit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapPreview: {
    height: '38%',
  },
  backButton: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  backText: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    marginTop: -spacing.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadow.card,
  },
  routeSummary: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  vehicleList: {
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
  },
  vehicleCardActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  vehicleIcon: {
    fontSize: 28,
  },
  vehicleText: {
    flex: 1,
  },
  vehicleLabel: {
    ...typography.bodyStrong,
  },
  vehicleDescription: {
    ...typography.caption,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border,
  },
  radioActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
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
  paymentNotice: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  submit: {
    marginTop: 'auto',
  },
});
