import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, TextField } from '@/components';
import MapView, { Marker, Region } from '@/components/AppMap';
import { DestinoIcon, MapaIcon, MarcadorIcon } from '@/components/icons';
import { DEFAULT_MAP_REGION } from '@/constants/config';
import { locationService } from '@/services/locationService';
import { colors, radius, shadow, spacing, typography } from '@/theme';
import { GeoPoint, PassengerStackParamList, PassengerTabParamList } from '@/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<PassengerTabParamList, 'Home'>,
  NativeStackScreenProps<PassengerStackParamList>
>;

type ActiveField = 'origin' | 'destination' | null;
type IconComponent = React.ComponentType<{ size?: number; color?: string }>;

const FIELD_COPY: Record<'origin' | 'destination', { title: string; pin: IconComponent; placeholder: string }> = {
  origin: { title: 'Punto de recogida', pin: MarcadorIcon, placeholder: 'Ej. Plaza de Armas de Acarí' },
  destination: { title: 'Destino', pin: DestinoIcon, placeholder: 'Ej. Mercado de Bella Unión' },
};

/**
 * Inicio del pasajero: un solo mapa para todo. Fijar un punto (tocando el
 * botón 🗺️ de cualquiera de los dos campos) pasa este mismo mapa a "modo
 * selección" en vez de navegar a otra pantalla — todo ocurre en el mismo
 * lugar, sin transición de pantalla, como en apps de referencia.
 */
export function HomeMapScreen({ navigation }: Props) {
  const [region, setRegion] = useState<Region>(DEFAULT_MAP_REGION);
  const [origin, setOrigin] = useState<GeoPoint | null>(null);
  const [destination, setDestination] = useState<GeoPoint | null>(null);

  const [activeField, setActiveField] = useState<ActiveField>(null);
  const [pickerRegion, setPickerRegion] = useState<Region>(DEFAULT_MAP_REGION);
  const [pickerAddress, setPickerAddress] = useState('');

  useEffect(() => {
    (async () => {
      const granted = await locationService.requestPermission();
      if (!granted) {
        return;
      }
      const position = await locationService.getCurrentPosition();
      const current: GeoPoint = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        address: 'Tu ubicación actual',
      };
      setRegion({
        latitude: current.latitude,
        longitude: current.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
      setOrigin(current);
    })();
  }, []);

  function openPicker(field: 'origin' | 'destination') {
    const existing = field === 'origin' ? origin : destination;
    setPickerRegion(
      existing ? { ...DEFAULT_MAP_REGION, latitude: existing.latitude, longitude: existing.longitude } : region
    );
    setPickerAddress(existing?.address ?? '');
    setActiveField(field);
  }

  function confirmPicker() {
    const point: GeoPoint = {
      latitude: pickerRegion.latitude,
      longitude: pickerRegion.longitude,
      address: pickerAddress || undefined,
    };
    if (activeField === 'origin') {
      setOrigin(point);
    } else if (activeField === 'destination') {
      setDestination(point);
    }
    setActiveField(null);
  }

  function handleTypeOrigin(text: string) {
    setOrigin(
      text.trim()
        ? {
            latitude: origin?.latitude ?? region.latitude,
            longitude: origin?.longitude ?? region.longitude,
            address: text,
          }
        : null
    );
  }

  function handleTypeDestination(text: string) {
    setDestination(
      text.trim()
        ? {
            latitude: destination?.latitude ?? region.latitude,
            longitude: destination?.longitude ?? region.longitude,
            address: text,
          }
        : null
    );
  }

  function handleSearch() {
    if (!origin || !destination) {
      return;
    }
    navigation.navigate('ChooseVehicle', { origin, destination });
  }

  if (activeField) {
    const copy = FIELD_COPY[activeField];
    const PinIcon = copy.pin;
    return (
      <View style={styles.container}>
        <MapView style={StyleSheet.absoluteFill} region={pickerRegion} onRegionChangeComplete={setPickerRegion} />
        <View pointerEvents="none" style={styles.centerPinWrapper}>
          <PinIcon size={32} color={colors.accent} />
        </View>

        <View style={styles.topBar}>
          <Pressable onPress={() => setActiveField(null)} hitSlop={12}>
            <Text style={styles.back}>✕</Text>
          </Pressable>
          <Text style={typography.h3}>{copy.title}</Text>
          <View style={styles.backSpacer} />
        </View>

        <View style={styles.bottomSheet}>
          <TextField
            label="Referencia (opcional)"
            placeholder={copy.placeholder}
            value={pickerAddress}
            onChangeText={setPickerAddress}
          />
          <Button label="Confirmar" onPress={confirmPicker} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView style={StyleSheet.absoluteFill} region={region} showsUserLocation showsMyLocationButton>
        {origin && <Marker coordinate={origin} pinColor={colors.accent} title="Origen" />}
        {destination && <Marker coordinate={destination} pinColor={colors.success} title="Destino" />}
      </MapView>

      <View style={styles.header}>
        <Text style={styles.brand}>Utqallya</Text>
      </View>

      <View style={styles.requestCard}>
        <LocationRow
          icon={MarcadorIcon}
          placeholder="Tu ubicación actual"
          value={origin ? origin.address || 'Punto en el mapa' : ''}
          onChangeText={handleTypeOrigin}
          onPickOnMap={() => openPicker('origin')}
        />
        <View style={styles.divider} />
        <LocationRow
          icon={DestinoIcon}
          placeholder="¿A dónde vamos?"
          value={destination ? destination.address || 'Punto en el mapa' : ''}
          onChangeText={handleTypeDestination}
          onPickOnMap={() => openPicker('destination')}
        />

        <Button label="Buscar vehículo" onPress={handleSearch} disabled={!origin || !destination} style={styles.cta} />
      </View>
    </View>
  );
}

function LocationRow({
  icon: Icon,
  placeholder,
  value,
  onChangeText,
  onPickOnMap,
}: {
  icon: IconComponent;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onPickOnMap: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Icon size={18} color={colors.textSecondary} />
      </View>
      <TextInput
        style={styles.rowInput}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="done"
      />
      <Pressable
        onPress={onPickOnMap}
        hitSlop={8}
        style={({ pressed }) => [styles.mapButton, pressed && styles.mapButtonPressed]}
      >
        <MapaIcon size={16} color={colors.textSecondary} />
      </Pressable>
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
  },
  brand: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 20,
  },
  requestCard: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    padding: spacing.md,
    ...shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowIcon: {
    width: 24,
    alignItems: 'center',
  },
  rowInput: {
    flex: 1,
    height: 44,
    ...typography.bodyStrong,
  },
  mapButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapButtonPressed: {
    opacity: 0.7,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  cta: {
    marginTop: spacing.md,
  },
  centerPinWrapper: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -16,
    marginTop: -32,
  },
  topBar: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadow.card,
  },
  back: {
    color: colors.textSecondary,
    fontSize: 18,
    width: 24,
  },
  backSpacer: {
    width: 24,
  },
  bottomSheet: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadow.card,
  },
});
