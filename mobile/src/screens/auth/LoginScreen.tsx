import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button, ScreenContainer, TextField } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing, typography } from '@/theme';
import { AuthStackParamList } from '@/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

/** Inicio de sesión, común para pasajeros y conductores (el rol viene del backend). */
export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Datos incompletos', 'Ingresa tu correo y contraseña');
      return;
    }
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (error) {
      Alert.alert('No se pudo iniciar sesión', (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.brand}>Utqallya</Text>
        <Text style={typography.h2}>Bienvenido de vuelta</Text>
        <Text style={styles.subtitle}>Ingresa para pedir o dar viajes en Acarí y Bella Unión</Text>
      </View>

      <TextField
        label="Correo electrónico"
        placeholder="tucorreo@ejemplo.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextField
        label="Contraseña"
        placeholder="••••••••"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button label="Iniciar sesión" onPress={handleLogin} loading={isSubmitting} style={styles.submit} />

      <Button
        label="Olvidé mi contraseña"
        variant="secondary"
        onPress={() => navigation.navigate('ForgotPassword')}
        style={styles.secondaryAction}
      />

      <Button
        label="Crear una cuenta"
        variant="outline"
        onPress={() => navigation.navigate('ChooseUserType')}
        style={styles.secondaryAction}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  brand: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.caption,
  },
  submit: {
    marginTop: spacing.sm,
  },
  secondaryAction: {
    marginTop: spacing.md,
  },
});
