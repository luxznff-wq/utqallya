/**
 * Envuelve expo-secure-store para las plataformas nativas (iOS/Android),
 * donde sí existe un keystore seguro. Existe una variante
 * `secureStorage.web.ts` porque expo-secure-store no tiene backend en web
 * (la app está pensada para uso nativo; web es solo una vista de apoyo).
 */
import * as SecureStore from 'expo-secure-store';

export const secureStorage = {
  getItemAsync: (key: string) => SecureStore.getItemAsync(key),
  setItemAsync: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  deleteItemAsync: (key: string) => SecureStore.deleteItemAsync(key),
};
