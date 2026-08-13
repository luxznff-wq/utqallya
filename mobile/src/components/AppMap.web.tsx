/**
 * Reemplazo para web de react-native-maps, que no soporta esta plataforma.
 * Muestra un aviso en vez de romper el bundle. La app está pensada para
 * usarse en Expo Go / build nativa; la vista web sirve para revisar el
 * resto de la interfaz rápidamente desde el navegador.
 */
import React from 'react';
import { StyleSheet, Text, View, ViewProps } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface MapViewProps extends ViewProps {
  region?: Region;
  initialRegion?: Region;
  onRegionChangeComplete?: (region: Region) => void;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  children?: React.ReactNode;
}

export default function MapView({ style, children }: MapViewProps) {
  return (
    <View style={[styles.placeholder, style]}>
      <Text style={styles.emoji}>🗺️</Text>
      <Text style={typography.bodyStrong}>El mapa no está disponible en la vista web</Text>
      <Text style={styles.caption}>Pruébala en Expo Go o en un emulador Android/iOS</Text>
      {children}
    </View>
  );
}

interface MarkerProps {
  coordinate: { latitude: number; longitude: number };
  pinColor?: string;
  title?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Marker(_props: MarkerProps) {
  return null;
}

interface PolylineProps {
  coordinates: { latitude: number; longitude: number }[];
  strokeColor?: string;
  strokeWidth?: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Polyline(_props: PolylineProps) {
  return null;
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  emoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  caption: {
    ...typography.caption,
    textAlign: 'center',
  },
});
