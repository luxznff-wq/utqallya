import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { HistorialIcon, InicioIcon, PerfilIcon } from '@/components/icons';
import { useTrip } from '@/context/TripContext';
import { DriverHomeScreen } from '@/screens/driver/DriverHomeScreen';
import { DriverTripScreen } from '@/screens/driver/DriverTripScreen';
import { RenewDocumentsScreen } from '@/screens/driver/RenewDocumentsScreen';
import { HistoryScreen } from '@/screens/shared/HistoryScreen';
import { IncidentReportScreen } from '@/screens/shared/IncidentReportScreen';
import { MyIncidentsScreen } from '@/screens/shared/MyIncidentsScreen';
import { ProfileScreen } from '@/screens/shared/ProfileScreen';
import { SettingsScreen } from '@/screens/shared/SettingsScreen';
import { colors } from '@/theme';
import { DriverStackParamList, DriverTabParamList } from '@/types';

const Tab = createBottomTabNavigator<DriverTabParamList>();
const Stack = createNativeStackNavigator<DriverStackParamList>();

const TAB_ICONS: Record<keyof DriverTabParamList, React.ComponentType<{ size?: number; color?: string }>> = {
  Home: InicioIcon,
  History: HistorialIcon,
  Profile: PerfilIcon,
};

function DriverTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarIcon: ({ color, size }) => {
          const TabIcon = TAB_ICONS[route.name as keyof DriverTabParamList];
          return <TabIcon size={size} color={color} />;
        },
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
  const { trip } = useTrip();

  return (
    <Stack.Navigator
      initialRouteName={trip ? 'DriverTrip' : 'DriverTabs'}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="DriverTabs" component={DriverTabs} />
      <Stack.Screen
        name="DriverTrip"
        component={DriverTripScreen}
        initialParams={trip ? { tripId: trip.id } : undefined}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="IncidentReport" component={IncidentReportScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="MyIncidents" component={MyIncidentsScreen} />
      <Stack.Screen name="RenewDocuments" component={RenewDocumentsScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
