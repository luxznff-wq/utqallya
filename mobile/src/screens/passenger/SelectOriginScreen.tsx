import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, TextField } from '@/components';
import { DEFAULT_MAP_REGION } from '@/constants/config';
import { locationService } from '@/services/locationService';
import { colors, radius, spacing, typography } from '@/theme';
import { PassengerStackParamList } from '@/types';

type Props = NativeStackScreenProps<PassengerStackParamList, 'SelectOrigin'>;

/**
 * El pasajero fija su punto de recogida moviendo el mapa (el pin queda fijo
 * al centro de la pantalla, patrón estándar de apps de transporte).
 */
export function SelectOriginScreen({ navigation }: Props) {
  const [region, setRegion] = useState<Region>(DEFAULT_MAP_REGION);
  const [address, setAddress] = useState('');

  useEffect(() => {
    (async () => {
      const granted = await locationService.requestPermission();
      if (!granted) {
        return;
      }
      const position = await locationService.getCurrentPosition();
      setRegion((prev) => ({ ...prev, latitude: position.coords.latitude, longitude: position.coords.longitude }));
    })();
  }, []);

  function handleConfirm() {
    navigation.navigate('SelectDestination', {
      origin: { latitude: region.latitude, longitude: region.longitude, address: address || undefined },
    });
  }

  return (
    <View style={styles.container}>
      <MapView style={StyleSheet.absoluteFill} region={region} onRegionChangeComplete={setRegion} />
      <View pointerEvents="none" style={styles.centerPinWrapper}>
        <Text style={styles.pin}>📍</Text>
      </View>

      <View style={styles.topBar}>
        <Text style={typography.h3}>Punto de recogida</Text>
      </View>

      <View style={styles.bottomSheet}>
        <TextField
          label="Referencia (opcional)"
          placeholder="Ej. Plaza de Armas de Acarí"
          value={address}
          onChangeText={setAddress}
        />
        <Button label="Confirmar origen" onPress={handleConfirm} />
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
});
