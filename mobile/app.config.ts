import { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Configuración de la app Expo. Las claves de Google Maps se inyectan por
 * variable de entorno para no comprometerlas en el repositorio (ver .env.example).
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Utqallya',
  slug: 'utqallya',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  scheme: 'utqallya',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0B0B0B',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'pe.utqallya.app',
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS,
    },
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'Utqallya usa tu ubicación para mostrar tu posición en el mapa y calcular viajes.',
    },
  },
  android: {
    package: 'pe.utqallya.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0B0B0B',
    },
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID,
      },
    },
    permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
  },
  plugins: ['expo-location', 'expo-secure-store'],
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api',
  },
});
