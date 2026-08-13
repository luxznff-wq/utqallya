import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { Button, ScreenContainer, TextField } from '@/components';
import { authService } from '@/services/authService';
import { spacing, typography } from '@/theme';
import { AuthStackParamList } from '@/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ navigation, route }: Props) {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!/^\d{6}$/.test(code)) {
      Alert.alert('Código inválido', 'Ingresa los 6 dígitos recibidos por correo');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Contraseña inválida', 'Debe tener al menos 8 caracteres');
      return;
    }
    if (password !== confirmation) {
      Alert.alert('Las contraseñas no coinciden', 'Vuelve a escribir la misma contraseña');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.resetPassword(route.params.email, code, password);
      Alert.alert('Contraseña actualizada', 'Ya puedes iniciar sesión con tu nueva contraseña');
      navigation.popToTop();
    } catch (error) {
      Alert.alert('No se pudo cambiar la contraseña', (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <Text style={[typography.h2, styles.title]}>Ingresa el código</Text>
      <Text style={[typography.body, styles.description]}>
        Enviamos un código a {route.params.email}. Caduca pronto y solo puede usarse una vez.
      </Text>
      <TextField
        label="Código de 6 dígitos"
        value={code}
        onChangeText={(value) => setCode(value.replace(/\D/g, ''))}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="000000"
      />
      <TextField
        label="Nueva contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Mínimo 8 caracteres"
      />
      <TextField
        label="Repite la nueva contraseña"
        value={confirmation}
        onChangeText={setConfirmation}
        secureTextEntry
        placeholder="Mínimo 8 caracteres"
      />
      <Button label="Cambiar contraseña" onPress={handleSubmit} loading={isSubmitting} />
      <Button
        label="Solicitar otro código"
        variant="outline"
        onPress={() => navigation.navigate('ForgotPassword')}
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
