import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/context/AuthContext';
import { TripProvider } from '@/context/TripContext';
import { RootNavigator } from '@/navigation/RootNavigator';

/**
 * Raíz de la aplicación Utqallya. Los proveedores de contexto envuelven la
 * navegación para que cualquier pantalla pueda acceder a sesión y viaje activo.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <TripProvider>
          <StatusBar style="light" backgroundColor="#0B0B0B" />
          <RootNavigator />
        </TripProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
