import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { Button } from '@/components';
import { DEFAULT_MAP_REGION } from '@/constants/config';
import { locationService } from '@/services/locationService';
import { colors, radius, shadow, spacing, typography } from '@/theme';
import { PassengerStackParamList, PassengerTabParamList } from '@/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<PassengerTabParamList, 'Home'>,
  NativeStackScreenProps<PassengerStackParamList>
>;

/** Pantalla de inicio del pasajero: mapa centrado en su ubicación + acceso a pedir un viaje. */
export function HomeMapScreen({ navigation }: Props) {
  const [region, setRegion] = useState<Region>(DEFAULT_MAP_REGION);

  useEffect(() => {
    (async () => {
      const granted = await locationService.requestPermission();
      if (!granted) {
        return;
      }
      const position = await locationService.getCurrentPosition();
      setRegion({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    })();
  }, []);

  return (
    <View style={styles.container}>
      <MapView style={StyleSheet.absoluteFill} region={region} showsUserLocation showsMyLocationButton>
        <Marker coordinate={region} />
      </MapView>

      <View style={styles.header}>
        <Text style={styles.brand}>Utqallya</Text>
      </View>

      <View style={styles.requestCard}>
        <Text style={typography.h3}>¿A dónde vamos?</Text>
        <Text style={styles.caption}>Elige tu punto de partida y tu destino en Acarí o Bella Unión</Text>
        <Button label="Solicitar un viaje" onPress={() => navigation.navigate('SelectOrigin')} style={styles.cta} />
      </View>
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
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadow.card,
  },
  caption: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  cta: {
    marginTop: spacing.xs,
  },
});
