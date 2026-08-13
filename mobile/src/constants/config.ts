import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * "localhost" no significa lo mismo en cada entorno de desarrollo: en web/iOS
 * apunta a la propia máquina, pero en el emulador de Android apunta al propio
 * emulador (el host se alcanza vía el alias especial 10.0.2.2). Un dispositivo
 * físico necesita la IP de red local de tu PC — para eso sirve
 * EXPO_PUBLIC_API_URL en mobile/.env, que siempre tiene prioridad.
 */
const LOCAL_BACKEND_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8080/api' : 'http://localhost:8080/api';

/** URL base del backend, tomada de app.config.ts -> extra.apiUrl (variable EXPO_PUBLIC_API_URL). */
export const API_URL: string = Constants.expoConfig?.extra?.apiUrl ?? LOCAL_BACKEND_URL;

/** Clave usada para persistir el JWT en almacenamiento seguro del dispositivo. */
export const AUTH_TOKEN_STORAGE_KEY = 'utqallya.accessToken';
export const AUTH_USER_STORAGE_KEY = 'utqallya.user';

export const PRIVACY_URL: string | undefined = Constants.expoConfig?.extra?.privacyUrl;
export const TERMS_URL: string | undefined = Constants.expoConfig?.extra?.termsUrl;
export const SUPPORT_URL: string | undefined = Constants.expoConfig?.extra?.supportUrl;

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
