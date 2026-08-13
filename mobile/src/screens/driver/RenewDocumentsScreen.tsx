import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';

import { Button, PhotoPickerField, PickedPhoto, ScreenContainer, TextField } from '@/components';
import { driverService } from '@/services/driverService';
import { spacing, typography } from '@/theme';
import { DriverStackParamList } from '@/types';

type Props = NativeStackScreenProps<DriverStackParamList, 'RenewDocuments'>;

export function RenewDocumentsScreen({ navigation }: Props) {
  const [licensePhoto, setLicensePhoto] = useState<PickedPhoto | null>(null);
  const [soatPhoto, setSoatPhoto] = useState<PickedPhoto | null>(null);
  const [licenseExpiresAt, setLicenseExpiresAt] = useState('');
  const [soatExpiresAt, setSoatExpiresAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    if (!licensePhoto || !soatPhoto || !licenseExpiresAt || !soatExpiresAt) {
      Alert.alert('Datos incompletos', 'Adjunta ambos documentos e ingresa sus fechas de vencimiento.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(licenseExpiresAt) || !/^\d{4}-\d{2}-\d{2}$/.test(soatExpiresAt)) {
      Alert.alert('Fechas inválidas', 'Usa el formato AAAA-MM-DD.');
      return;
    }
    setIsSubmitting(true);
    try {
      await driverService.updateDocuments(licenseExpiresAt, soatExpiresAt, licensePhoto, soatPhoto);
      Alert.alert(
        'Documentos enviados',
        'Tu perfil volvió a revisión y permanecerás no disponible hasta que el administrador lo apruebe.',
        [{ text: 'Entendido', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('No se pudo enviar', (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <ScrollView keyboardShouldPersistTaps="handled">
        <Text style={[typography.h2, styles.title]}>Renovar documentos</Text>
        <Text style={styles.description}>
          Adjunta licencia y SOAT vigentes. La actualización requiere una nueva revisión administrativa.
        </Text>
        <PhotoPickerField label="Nueva licencia" value={licensePhoto} onChange={setLicensePhoto} />
        <TextField
          label="Vencimiento de licencia (AAAA-MM-DD)"
          value={licenseExpiresAt}
          onChangeText={setLicenseExpiresAt}
          maxLength={10}
        />
        <PhotoPickerField label="Nuevo SOAT" value={soatPhoto} onChange={setSoatPhoto} />
        <TextField
          label="Vencimiento del SOAT (AAAA-MM-DD)"
          value={soatExpiresAt}
          onChangeText={setSoatExpiresAt}
          maxLength={10}
        />
        <Button label="Enviar a revisión" onPress={submit} loading={isSubmitting} />
        <Button label="Volver" variant="outline" onPress={() => navigation.goBack()} style={styles.back} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.lg, marginBottom: spacing.sm },
  description: { ...typography.body, marginBottom: spacing.lg },
  back: { marginTop: spacing.md, marginBottom: spacing.xl },
});
