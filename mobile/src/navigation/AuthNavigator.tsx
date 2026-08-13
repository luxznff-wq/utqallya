import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { ChooseUserTypeScreen } from '@/screens/auth/ChooseUserTypeScreen';
import { ForgotPasswordScreen } from '@/screens/auth/ForgotPasswordScreen';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { RegisterDriverScreen } from '@/screens/auth/RegisterDriverScreen';
import { RegisterPassengerScreen } from '@/screens/auth/RegisterPassengerScreen';
import { ResetPasswordScreen } from '@/screens/auth/ResetPasswordScreen';
import { colors } from '@/theme';
import { AuthStackParamList } from '@/types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/** Flujo de autenticación: login y registro (elige tipo de usuario primero). */
export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="ChooseUserType" component={ChooseUserTypeScreen} />
      <Stack.Screen name="RegisterPassenger" component={RegisterPassengerScreen} />
      <Stack.Screen name="RegisterDriver" component={RegisterDriverScreen} />
    </Stack.Navigator>
  );
}
