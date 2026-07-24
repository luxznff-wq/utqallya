import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { colors, radius, spacing, typography } from '@/theme';

export interface PickedPhoto {
  uri: string;
  name: string;
  type: string;
}

interface PhotoPickerFieldProps {
  label: string;
  value: PickedPhoto | null;
  onChange: (photo: PickedPhoto) => void;
}

/**
 * Selector de una foto (cámara o galería) reutilizado por las cuatro fotos
 * que exige el registro de conductor: DNI, licencia, SOAT y vehículo.
 */
export function PhotoPickerField({ label, value, onChange }: PhotoPickerFieldProps) {
  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onChange({
        uri: asset.uri,
        name: asset.fileName ?? `${label.toLowerCase().replace(/\s+/g, '-')}.jpg`,
        type: 'image/jpeg',
      });
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.picker} onPress={pickImage}>
        {value ? (
          <Image source={{ uri: value.uri }} style={styles.preview} />
        ) : (
          <Text style={styles.placeholder}>Toca para subir foto</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  picker: {
    height: 96,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  placeholder: {
    ...typography.caption,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
});
