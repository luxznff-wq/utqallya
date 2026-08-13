import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { Button, ScreenContainer, TextField } from '@/components';
import { authService } from '@/services/authService';
import { spacing, typography } from '@/theme';
import { AuthStackParamList } from '@/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      Alert.alert('Correo requerido', 'Ingresa el correo de tu cuenta');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.requestPasswordReset(normalizedEmail);
      Alert.alert('Revisa tu correo', 'Si existe una cuenta con ese correo, recibirás un código de 6 dígitos.');
      navigation.navigate('ResetPassword', { email: normalizedEmail });
    } catch (error) {
      Alert.alert('No se pudo enviar la solicitud', (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <Text style={[typography.h2, styles.title]}>Recupera tu contraseña</Text>
      <Text style={[typography.body, styles.description]}>
        Te enviaremos un código temporal para verificar que la cuenta es tuya.
      </Text>
      <TextField
        label="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder="tucorreo@ejemplo.com"
      />
      <Button label="Enviar código" onPress={handleSubmit} loading={isSubmitting} />
      <Button
        label="Volver al inicio de sesión"
        variant="outline"
        onPress={() => navigation.goBack()}
        style={styles.secondaryAction}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  description: {
    marginBottom: spacing.xl,
  },
  secondaryAction: {
    marginTop: spacing.md,
  },
});
