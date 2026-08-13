import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { driverService } from '@/services/driverService';

const DRIVER_BACKGROUND_LOCATION_TASK = 'utqallya-driver-background-location';

TaskManager.defineTask(DRIVER_BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error || !data) return;
  const latest = (data as { locations: Location.LocationObject[] }).locations.at(-1);
  if (!latest) return;
  try {
    await driverService.updateLocation(
      latest.coords.latitude,
      latest.coords.longitude,
      latest.coords.heading ?? undefined
    );
  } catch {
    // Un fallo de red aislado no debe cancelar futuras entregas del sistema operativo.
  }
});

/**
 * Envuelve expo-location para que el resto de la app no dependa directamente
 * del SDK nativo (facilita testear/mockear y aislar permisos en un solo lugar).
 */
export const locationService = {
  async requestPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  async requestBackgroundPermission(): Promise<boolean> {
    const foreground = await Location.requestForegroundPermissionsAsync();
    if (foreground.status !== 'granted') return false;
    const background = await Location.requestBackgroundPermissionsAsync();
    return background.status === 'granted';
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

  async startDriverBackgroundUpdates(): Promise<boolean> {
    if (await Location.hasStartedLocationUpdatesAsync(DRIVER_BACKGROUND_LOCATION_TASK)) return true;
    if (!(await this.requestBackgroundPermission())) return false;
    await Location.startLocationUpdatesAsync(DRIVER_BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: 10000,
      distanceInterval: 20,
      deferredUpdatesDistance: 50,
      deferredUpdatesInterval: 30000,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Utqallya está compartiendo tu ubicación',
        notificationBody: 'Mantén la ubicación activa mientras recibes o realizas viajes.',
        notificationColor: '#8B5CF6',
      },
    });
    return true;
  },

  async stopDriverBackgroundUpdates(): Promise<void> {
    if (await Location.hasStartedLocationUpdatesAsync(DRIVER_BACKGROUND_LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(DRIVER_BACKGROUND_LOCATION_TASK);
    }
  },
};
