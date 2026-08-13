import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

import { Button, ScreenContainer, TextField } from '@/components';
import { PRIVACY_URL, SUPPORT_URL, TERMS_URL } from '@/constants/config';
import { useAuth } from '@/context/AuthContext';
import { driverService } from '@/services/driverService';
import { userService } from '@/services/userService';
import { colors, radius, spacing, typography } from '@/theme';

/** Configuración básica de la cuenta. Deliberadamente simple: sin funciones innecesarias. */
export function SettingsScreen() {
  const navigation = useNavigation();
  const { logout, user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [emergencyName, setEmergencyName] = useState(user?.emergencyContactName ?? '');
  const [emergencyPhone, setEmergencyPhone] = useState(user?.emergencyContactPhone ?? '');
  const [isSavingEmergency, setIsSavingEmergency] = useState(false);
  const [yapeHolderName, setYapeHolderName] = useState('');
  const [yapePhone, setYapePhone] = useState('');
  const [isSavingYape, setIsSavingYape] = useState(false);
  const openExternalUrl = (url?: string) => {
    if (url) {
      Linking.openURL(url).catch(() => Alert.alert('No se pudo abrir el enlace'));
    }
  };

  useEffect(() => {
    userService
      .getMyProfile()
      .then((profile) => {
        setEmergencyName(profile.emergencyContactName ?? '');
        setEmergencyPhone(profile.emergencyContactPhone ?? '');
      })
      .catch(() => undefined);
    if (user?.role === 'DRIVER') {
      driverService
        .getMyProfile()
        .then((profile) => {
          setYapeHolderName(profile.yapeHolderName ?? '');
          setYapePhone(profile.yapePhone ?? '');
        })
        .catch(() => undefined);
    }
  }, [user?.role]);

  const handleChangePassword = async () => {
    if (!currentPassword || newPassword.length < 8) {
      Alert.alert('Revisa los datos', 'Ingresa tu contraseña actual y una nueva de al menos 8 caracteres.');
      return;
    }
    setIsChangingPassword(true);
    try {
      await userService.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert('Contraseña actualizada', 'Por seguridad, inicia sesión nuevamente.');
      await logout();
    } catch (error) {
      Alert.alert('No se pudo cambiar', error instanceof Error ? error.message : 'Inténtalo nuevamente.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRevokeSessions = () => {
    Alert.alert('Cerrar todas las sesiones', 'Tendrás que iniciar sesión nuevamente en todos tus dispositivos.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar todas',
        style: 'destructive',
        onPress: async () => {
          try {
            await userService.revokeSessions();
            await logout();
          } catch (error) {
            Alert.alert('No se pudieron cerrar', error instanceof Error ? error.message : 'Inténtalo nuevamente.');
          }
        },
      },
    ]);
  };

  const handleSaveEmergencyContact = async () => {
    if (!emergencyName.trim() || !/^\+?[0-9]{7,15}$/.test(emergencyPhone.trim())) {
      Alert.alert('Revisa el contacto', 'Ingresa un nombre y teléfono válido, incluyendo código de país.');
      return;
    }
    setIsSavingEmergency(true);
    try {
      await userService.updateEmergencyContact(emergencyName.trim(), emergencyPhone.trim());
      Alert.alert('Contacto guardado', 'Estará disponible desde el botón SOS durante un viaje.');
    } catch (error) {
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : 'Inténtalo nuevamente.');
    } finally {
      setIsSavingEmergency(false);
    }
  };

  const handleSaveYape = async () => {
    if (!yapeHolderName.trim() || !/^9[0-9]{8}$/.test(yapePhone.trim())) {
      Alert.alert('Revisa los datos de Yape', 'Ingresa el titular y un celular peruano válido de 9 dígitos.');
      return;
    }
    setIsSavingYape(true);
    try {
      await driverService.updatePaymentDetails(yapeHolderName.trim(), yapePhone.trim());
      Alert.alert('Yape configurado', 'Los pasajeros lo verán únicamente cuando aceptes un viaje con Yape.');
    } catch (error) {
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : 'Inténtalo nuevamente.');
    } finally {
      setIsSavingYape(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar cuenta',
      'Esta acción elimina tus datos personales y no se puede deshacer. No es posible hacerlo durante un viaje activo.',
      [
        { text: 'Conservar cuenta', style: 'cancel' },
        {
          text: 'Eliminar definitivamente',
          style: 'destructive',
          onPress: async () => {
            try {
              await userService.deleteAccount();
              await logout();
            } catch (error) {
              Alert.alert('No se pudo eliminar', error instanceof Error ? error.message : 'Inténtalo nuevamente.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <Text style={[typography.h2, styles.title]}>Configuración</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Versión de la app</Text>
        <Text style={styles.value}>Utqallya 0.1.0</Text>
      </View>

      <Text style={styles.sectionTitle}>Seguridad</Text>
      <TextField label="Contraseña actual" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
      <TextField
        label="Nueva contraseña"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        placeholder="Mínimo 8 caracteres"
      />
      <Button label="Cambiar contraseña" onPress={handleChangePassword} loading={isChangingPassword} />
      <Button
        label="Cerrar sesiones en todos los dispositivos"
        variant="outline"
        onPress={handleRevokeSessions}
        style={styles.revokeSessions}
      />
      <Button
        label="Mis reportes de incidentes"
        variant="secondary"
        onPress={() => navigation.navigate('MyIncidents' as never)}
        style={styles.revokeSessions}
      />

      <Text style={styles.sectionTitle}>Contacto de emergencia</Text>
      <TextField label="Nombre" value={emergencyName} onChangeText={setEmergencyName} maxLength={120} />
      <TextField
        label="Teléfono con código de país"
        value={emergencyPhone}
        onChangeText={setEmergencyPhone}
        keyboardType="phone-pad"
        placeholder="+51999999999"
        maxLength={16}
      />
      <Button label="Guardar contacto" onPress={handleSaveEmergencyContact} loading={isSavingEmergency} />

      {user?.role === 'DRIVER' && (
        <>
          <Text style={styles.sectionTitle}>Cobro por Yape</Text>
          <TextField label="Titular de Yape" value={yapeHolderName} onChangeText={setYapeHolderName} maxLength={120} />
          <TextField
            label="Número de Yape"
            value={yapePhone}
            onChangeText={setYapePhone}
            keyboardType="phone-pad"
            maxLength={9}
            placeholder="999999999"
          />
          <Button label="Guardar datos de Yape" onPress={handleSaveYape} loading={isSavingYape} />
        </>
      )}

      <View style={styles.card}>
        <Text style={styles.label}>Zona de cobertura</Text>
        <Text style={styles.value}>Acarí y Bella Unión — Caravelí, Arequipa</Text>
      </View>

      <Button label="Cerrar sesión" variant="danger" onPress={logout} style={styles.logout} />
      <Button label="Eliminar mi cuenta" variant="outline" onPress={handleDeleteAccount} style={styles.deleteAccount} />
      <Text style={styles.sectionTitle}>Información y ayuda</Text>
      {PRIVACY_URL ? (
        <Button label="Política de privacidad" variant="secondary" onPress={() => openExternalUrl(PRIVACY_URL)} />
      ) : null}
      {TERMS_URL ? (
        <Button label="Términos y condiciones" variant="secondary" onPress={() => openExternalUrl(TERMS_URL)} />
      ) : null}
      {SUPPORT_URL ? (
        <Button label="Ayuda y soporte" variant="secondary" onPress={() => openExternalUrl(SUPPORT_URL)} />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.bodyStrong,
    fontSize: 14,
  },
  logout: {
    marginTop: spacing.lg,
  },
  revokeSessions: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  deleteAccount: {
    marginTop: spacing.md,
  },
});
