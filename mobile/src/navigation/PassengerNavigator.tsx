import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { HistorialIcon, InicioIcon, PerfilIcon } from '@/components/icons';
import { useTrip } from '@/context/TripContext';
import { ChooseVehicleScreen } from '@/screens/passenger/ChooseVehicleScreen';
import { DriverFoundScreen } from '@/screens/passenger/DriverFoundScreen';
import { HomeMapScreen } from '@/screens/passenger/HomeMapScreen';
import { RateTripScreen } from '@/screens/passenger/RateTripScreen';
import { SearchingDriverScreen } from '@/screens/passenger/SearchingDriverScreen';
import { TripTrackingScreen } from '@/screens/passenger/TripTrackingScreen';
import { HistoryScreen } from '@/screens/shared/HistoryScreen';
import { IncidentReportScreen } from '@/screens/shared/IncidentReportScreen';
import { MyIncidentsScreen } from '@/screens/shared/MyIncidentsScreen';
import { ProfileScreen } from '@/screens/shared/ProfileScreen';
import { SettingsScreen } from '@/screens/shared/SettingsScreen';
import { colors } from '@/theme';
import { PassengerStackParamList, PassengerTabParamList } from '@/types';

const Tab = createBottomTabNavigator<PassengerTabParamList>();
const Stack = createNativeStackNavigator<PassengerStackParamList>();

const TAB_ICONS: Record<keyof PassengerTabParamList, React.ComponentType<{ size?: number; color?: string }>> = {
  Home: InicioIcon,
  History: HistorialIcon,
  Profile: PerfilIcon,
};

function PassengerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarIcon: ({ color, size }) => {
          const TabIcon = TAB_ICONS[route.name as keyof PassengerTabParamList];
          return <TabIcon size={size} color={color} />;
        },
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
  const { trip } = useTrip();
  const recoveryRoute =
    trip?.status === 'SEARCHING_DRIVER' ? 'SearchingDriver' : trip ? 'TripTracking' : 'PassengerTabs';

  return (
    <Stack.Navigator
      initialRouteName={recoveryRoute}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="PassengerTabs" component={PassengerTabs} />
      <Stack.Screen
        name="ChooseVehicle"
        component={ChooseVehicleScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="SearchingDriver"
        component={SearchingDriverScreen}
        initialParams={trip ? { tripId: trip.id } : undefined}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="DriverFound" component={DriverFoundScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen
        name="TripTracking"
        component={TripTrackingScreen}
        initialParams={trip ? { tripId: trip.id } : undefined}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="RateTrip" component={RateTripScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="IncidentReport" component={IncidentReportScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="MyIncidents" component={MyIncidentsScreen} />
    </Stack.Navigator>
  );
}
