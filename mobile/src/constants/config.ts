import Constants from 'expo-constants';

/** URL base del backend, tomada de app.config.ts -> extra.apiUrl (variable EXPO_PUBLIC_API_URL). */
export const API_URL: string = Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:8080/api';

/** Clave usada para persistir el JWT en almacenamiento seguro del dispositivo. */
export const AUTH_TOKEN_STORAGE_KEY = 'utqallya.accessToken';
export const AUTH_USER_STORAGE_KEY = 'utqallya.user';

/** Cada cuánto el conductor envía su posición al backend mientras está activo (ms). */
export const DRIVER_LOCATION_UPDATE_INTERVAL_MS = 8000;

/** Cada cuánto el pasajero refresca el estado del viaje mientras espera/viaja (ms). */
export const TRIP_POLL_INTERVAL_MS = 4000;

/** Región inicial del mapa: centrada en Acarí, Caravelí, Arequipa. */
export const DEFAULT_MAP_REGION = {
  latitude: -15.4419,
  longitude: -74.617,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};
