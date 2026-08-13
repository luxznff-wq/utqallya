import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';

import { Button, ScreenContainer, TextField } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { spacing, typography } from '@/theme';
import { AuthStackParamList } from '@/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'RegisterPassenger'>;

/** Registro de pasajero: solo nombre, correo, teléfono y contraseña (sin nada más). */
export function RegisterPassengerScreen({ navigation }: Props) {
  const { registerPassenger } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!fullName || !email || !phone || !password) {
      Alert.alert('Datos incompletos', 'Completa todos los campos');
      return;
    }
    setIsSubmitting(true);
    try {
      await registerPassenger({ fullName, email: email.trim(), phone, password });
    } catch (error) {
      Alert.alert('No se pudo crear la cuenta', (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={[typography.h2, styles.title]}>Crea tu cuenta de pasajero</Text>

        <TextField label="Nombre completo" value={fullName} onChangeText={setFullName} placeholder="Ej. María Quispe" />
        <TextField
          label="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="tucorreo@ejemplo.com"
        />
        <TextField
          label="Teléfono"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={9}
          placeholder="9XXXXXXXX"
        />
        <TextField
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Mínimo 8 caracteres"
        />

        <Button label="Registrarme" onPress={handleSubmit} loading={isSubmitting} style={styles.submit} />
        <Button label="Volver" variant="outline" onPress={() => navigation.goBack()} style={styles.secondaryAction} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  submit: {
    marginTop: spacing.sm,
  },
  secondaryAction: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});
