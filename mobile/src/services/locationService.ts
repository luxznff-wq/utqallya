import * as Location from 'expo-location';

/**
 * Envuelve expo-location para que el resto de la app no dependa directamente
 * del SDK nativo (facilita testear/mockear y aislar permisos en un solo lugar).
 */
export const locationService = {
  async requestPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  async getCurrentPosition(): Promise<Location.LocationObject> {
    return Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  },

  /** Suscribe a actualizaciones continuas de posición (usado por el conductor mientras está activo). */
  watchPosition(onUpdate: (location: Location.LocationObject) => void): Promise<Location.LocationSubscription> {
    return Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 15 },
      onUpdate
    );
  },
};
