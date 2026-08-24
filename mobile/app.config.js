// Config de Expo en JavaScript (CommonJS) en vez de TypeScript: EAS/Expo
// transpila mal los app.config.ts en algunos entornos ("Cannot read properties
// of undefined (reading 'CommonJS')"), y en JS plano se carga sin problemas.
// Las claves de Google Maps se inyectan por variable de entorno (ver .env.example).

function validateEasEnvironment() {
  if (!process.env.EAS_BUILD_PROFILE) {
    return;
  }
  // Esencial en cualquier build (sin esto la app no se conecta ni carga el mapa).
  const required = ['EXPO_PUBLIC_API_URL', 'EXPO_PUBLIC_EAS_PROJECT_ID'];
  if (process.env.EAS_BUILD_PLATFORM === 'android') {
    required.push('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID');
  }
  if (process.env.EAS_BUILD_PLATFORM === 'ios') {
    required.push('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS');
  }
  // URLs legales: obligatorias solo para publicar en tiendas (perfil production).
  // Un APK de piloto (preview) no las necesita.
  if (process.env.EAS_BUILD_PROFILE === 'production') {
    required.push('EXPO_PUBLIC_PRIVACY_URL', 'EXPO_PUBLIC_TERMS_URL', 'EXPO_PUBLIC_SUPPORT_URL');
  }
  const missing = required.filter((name) => {
    const value = process.env[name];
    return !value || !value.trim();
  });
  if (missing.length > 0) {
    throw new Error(`Faltan variables obligatorias para el build (${process.env.EAS_BUILD_PROFILE}): ${missing.join(', ')}`);
  }
}

module.exports = ({ config }) => {
  validateEasEnvironment();
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
