import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HistoryScreen } from '@/screens/shared/HistoryScreen';
import { ProfileScreen } from '@/screens/shared/ProfileScreen';
import { SettingsScreen } from '@/screens/shared/SettingsScreen';
import { DriverFoundScreen } from '@/screens/passenger/DriverFoundScreen';
import { HomeMapScreen } from '@/screens/passenger/HomeMapScreen';
import { RateTripScreen } from '@/screens/passenger/RateTripScreen';
import { SearchingDriverScreen } from '@/screens/passenger/SearchingDriverScreen';
import { SelectDestinationScreen } from '@/screens/passenger/SelectDestinationScreen';
import { SelectOriginScreen } from '@/screens/passenger/SelectOriginScreen';
import { TripTrackingScreen } from '@/screens/passenger/TripTrackingScreen';
import { colors } from '@/theme';
import { PassengerStackParamList, PassengerTabParamList } from '@/types';

const Tab = createBottomTabNavigator<PassengerTabParamList>();
const Stack = createNativeStackNavigator<PassengerStackParamList>();

const TAB_ICONS: Record<keyof PassengerTabParamList, string> = {
  Home: '🏠',
  History: '🕓',
  Profile: '👤',
};

function PassengerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{TAB_ICONS[route.name as keyof PassengerTabParamList]}</Text>,
      })}
    >
      <Tab.Screen name="Home" component={HomeMapScreen} options={{ title: 'Inicio' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'Historial' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

/**
 * Navegador del pasajero: pestañas principales (Inicio/Historial/Perfil) +
 * flujo de viaje apilado encima (seleccionar origen/destino, buscar
 * conductor, seguimiento y calificación).
 */
export function PassengerNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="PassengerTabs" component={PassengerTabs} />
      <Stack.Screen name="SelectOrigin" component={SelectOriginScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="SelectDestination" component={SelectDestinationScreen} />
      <Stack.Screen name="SearchingDriver" component={SearchingDriverScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="DriverFound" component={DriverFoundScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="TripTracking" component={TripTrackingScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="RateTrip" component={RateTripScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
