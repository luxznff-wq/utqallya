import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, PhotoPickerField, ScreenContainer, TextField } from '@/components';
import { PickedPhoto } from '@/components/PhotoPickerField';
import { useAuth } from '@/context/AuthContext';
import { colors, radius, spacing, typography } from '@/theme';
import { AuthStackParamList } from '@/types';
import { VehicleType } from '@/types/driver';

type Props = NativeStackScreenProps<AuthStackParamList, 'RegisterDriver'>;

/**
 * Registro de conductor: datos personales, datos del vehículo y las 4 fotos
 * requeridas. La cuenta queda "pendiente de aprobación" hasta que un
 * administrador la revise (no puede iniciar viajes todavía).
 */
export function RegisterDriverScreen({ navigation }: Props) {
  const { registerDriver } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [dniNumber, setDniNumber] = useState('');
  const [plate, setPlate] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('CAR');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');

  const [dniPhoto, setDniPhoto] = useState<PickedPhoto | null>(null);
  const [licensePhoto, setLicensePhoto] = useState<PickedPhoto | null>(null);
  const [soatPhoto, setSoatPhoto] = useState<PickedPhoto | null>(null);
  const [vehiclePhoto, setVehiclePhoto] = useState<PickedPhoto | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!fullName || !email || !phone || !password || !dniNumber || !plate) {
      Alert.alert('Datos incompletos', 'Completa todos los campos obligatorios');
      return;
    }
    if (!dniPhoto || !licensePhoto || !soatPhoto || !vehiclePhoto) {
      Alert.alert('Fotos faltantes', 'Debes subir las 4 fotos: DNI, licencia, SOAT y vehículo');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerDriver(
        {
          fullName,
          email: email.trim(),
          phone,
          password,
          dniNumber,
          plate: plate.toUpperCase(),
          vehicleType,
          vehicleBrand: vehicleBrand || undefined,
          vehicleModel: vehicleModel || undefined,
          vehicleColor: vehicleColor || undefined,
        },
        { dniPhoto, licensePhoto, soatPhoto, vehiclePhoto }
      );
      Alert.alert('Solicitud enviada', 'Tu cuenta quedó pendiente de aprobación. Te avisaremos cuando puedas empezar a recibir viajes.');
    } catch (error) {
      Alert.alert('No se pudo crear la cuenta', (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={[typography.h2, styles.title]}>Crea tu cuenta de conductor</Text>
        <Text style={styles.subtitle}>Solo se aceptan automóviles y mototaxis</Text>

        <Text style={styles.sectionTitle}>Datos personales</Text>
        <TextField label="Nombre completo" value={fullName} onChangeText={setFullName} />
        <TextField label="Correo electrónico" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextField label="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={9} />
        <TextField label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
        <TextField label="Número de DNI" value={dniNumber} onChangeText={setDniNumber} keyboardType="number-pad" maxLength={8} />

        <Text style={styles.sectionTitle}>Vehículo</Text>
        <View style={styles.vehicleTypeRow}>
          {(['CAR', 'MOTOTAXI'] as VehicleType[]).map((type) => (
            <Pressable
              key={type}
              onPress={() => setVehicleType(type)}
              style={[styles.vehicleTypeChip, vehicleType === type && styles.vehicleTypeChipActive]}
            >
              <Text style={[styles.vehicleTypeText, vehicleType === type && styles.vehicleTypeTextActive]}>
                {type === 'CAR' ? 'Automóvil' : 'Mototaxi'}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextField label="Placa" value={plate} onChangeText={setPlate} autoCapitalize="characters" maxLength={10} />
        <TextField label="Marca (opcional)" value={vehicleBrand} onChangeText={setVehicleBrand} />
        <TextField label="Modelo (opcional)" value={vehicleModel} onChangeText={setVehicleModel} />
        <TextField label="Color (opcional)" value={vehicleColor} onChangeText={setVehicleColor} />

        <Text style={styles.sectionTitle}>Documentos</Text>
        <PhotoPickerField label="Foto del DNI" value={dniPhoto} onChange={setDniPhoto} />
        <PhotoPickerField label="Foto de la licencia de conducir" value={licensePhoto} onChange={setLicensePhoto} />
        <PhotoPickerField label="Foto del SOAT" value={soatPhoto} onChange={setSoatPhoto} />
        <PhotoPickerField label="Foto del vehículo" value={vehiclePhoto} onChange={setVehiclePhoto} />

        <Button label="Enviar solicitud" onPress={handleSubmit} loading={isSubmitting} style={styles.submit} />
        <Button label="Volver" variant="outline" onPress={() => navigation.goBack()} style={styles.secondaryAction} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: spacing.lg,
  },
  subtitle: {
    ...typography.caption,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    color: colors.accent,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  vehicleTypeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  vehicleTypeChip: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleTypeChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  vehicleTypeText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  vehicleTypeTextActive: {
    color: colors.textOnAccent,
  },
  submit: {
    marginTop: spacing.md,
  },
  secondaryAction: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});
