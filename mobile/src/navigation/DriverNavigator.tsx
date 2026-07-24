import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DriverHomeScreen } from '@/screens/driver/DriverHomeScreen';
import { DriverTripScreen } from '@/screens/driver/DriverTripScreen';
import { HistoryScreen } from '@/screens/shared/HistoryScreen';
import { ProfileScreen } from '@/screens/shared/ProfileScreen';
import { SettingsScreen } from '@/screens/shared/SettingsScreen';
import { colors } from '@/theme';
import { DriverStackParamList, DriverTabParamList } from '@/types';

const Tab = createBottomTabNavigator<DriverTabParamList>();
const Stack = createNativeStackNavigator<DriverStackParamList>();

const TAB_ICONS: Record<keyof DriverTabParamList, string> = {
  Home: '🚗',
  History: '🕓',
  Profile: '👤',
};

function DriverTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{TAB_ICONS[route.name as keyof DriverTabParamList]}</Text>,
      })}
    >
      <Tab.Screen name="Home" component={DriverHomeScreen} options={{ title: 'Inicio' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'Historial' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

/** Navegador del conductor: pestañas principales + pantalla de viaje activo apilada encima. */
export function DriverNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="DriverTabs" component={DriverTabs} />
      <Stack.Screen name="DriverTrip" component={DriverTripScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
