import { ExpoConfig, ConfigContext } from 'expo/config';

function validateProductionEnvironment() {
  if (process.env.EAS_BUILD_PROFILE !== 'production') {
    return;
  }
  const required = [
    'EXPO_PUBLIC_API_URL',
    'EXPO_PUBLIC_EAS_PROJECT_ID',
    'EXPO_PUBLIC_PRIVACY_URL',
    'EXPO_PUBLIC_TERMS_URL',
    'EXPO_PUBLIC_SUPPORT_URL',
  ];
  if (process.env.EAS_BUILD_PLATFORM === 'android') {
    required.push('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID');
  }
  if (process.env.EAS_BUILD_PLATFORM === 'ios') {
    required.push('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS');
  }
  const missing = required.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) {
    throw new Error(`Faltan variables obligatorias para producción: ${missing.join(', ')}`);
  }
}

/**
 * Configuración de la app Expo. Las claves de Google Maps se inyectan por
 * variable de entorno para no comprometerlas en el repositorio (ver .env.example).
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  validateProductionEnvironment();
  return {
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
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'Utqallya comparte la ubicación del conductor durante su disponibilidad y viajes, incluso con la pantalla apagada.',
        UIBackgroundModes: ['location', 'remote-notification'],
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
    },
    plugins: [
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Permite que Utqallya use tu ubicación mientras estás disponible o realizando un viaje.',
          isAndroidBackgroundLocationEnabled: true,
          isIosBackgroundLocationEnabled: true,
        },
      ],
      'expo-secure-store',
      'expo-notifications',
    ],
    extra: {
      // Sin valor por defecto aquí a propósito: el fallback correcto depende de
      // la plataforma (localhost en web/iOS, 10.0.2.2 en el emulador Android),
      // y eso solo se puede resolver en runtime — ver src/constants/config.ts.
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      eas: {
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
      },
      privacyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL,
      termsUrl: process.env.EXPO_PUBLIC_TERMS_URL,
      supportUrl: process.env.EXPO_PUBLIC_SUPPORT_URL,
    },
  };
};
