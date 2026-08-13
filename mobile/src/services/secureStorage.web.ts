/**
 * Sustituto web de secureStorage: expo-secure-store no funciona en el
 * navegador (no hay keystore del sistema operativo). Se usa localStorage
 * como respaldo funcional solo para poder previsualizar la app en web;
 * el almacenamiento seguro real de la sesión ocurre en la app nativa.
 */
export const secureStorage = {
  async getItemAsync(key: string): Promise<string | null> {
    return window.localStorage.getItem(key);
  },
  async setItemAsync(key: string, value: string): Promise<void> {
    window.localStorage.setItem(key, value);
  },
  async deleteItemAsync(key: string): Promise<void> {
    window.localStorage.removeItem(key);
  },
};
