import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, ScreenContainer, TextField } from '@/components';
import { IncidentCategory, incidentService } from '@/services/incidentService';
import { colors, radius, spacing, typography } from '@/theme';

type RouteParams = { IncidentReport: { tripId: string } };

const CATEGORIES: { value: IncidentCategory; label: string }[] = [
  { value: 'SAFETY', label: 'Riesgo de seguridad' },
  { value: 'ACCIDENT', label: 'Accidente' },
  { value: 'HARASSMENT', label: 'Acoso o conducta inapropiada' },
  { value: 'LOST_ITEM', label: 'Objeto perdido' },
  { value: 'PAYMENT_DISPUTE', label: 'Desacuerdo sobre el pago' },
  { value: 'OTHER', label: 'Otro' },
];

export function IncidentReportScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'IncidentReport'>>();
  const [category, setCategory] = useState<IncidentCategory>('SAFETY');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (description.trim().length < 10) {
      Alert.alert('Falta información', 'Describe lo ocurrido con al menos 10 caracteres');
      return;
    }
    setIsSubmitting(true);
    try {
      await incidentService.report(route.params.tripId, category, description.trim());
      Alert.alert('Reporte recibido', 'El equipo de Utqallya revisará el incidente.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('No se pudo enviar el reporte', (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <Text style={[typography.h2, styles.title]}>Reportar un incidente</Text>
      <Text style={styles.description}>
        Este reporte queda asociado al viaje. Si existe peligro inmediato, contacta directamente a los servicios de
        emergencia de tu localidad.
      </Text>
      <Text style={styles.label}>¿Qué ocurrió?</Text>
      <View style={styles.categories}>
        {CATEGORIES.map((item) => (
          <Pressable
            key={item.value}
            onPress={() => setCategory(item.value)}
            style={[styles.category, category === item.value && styles.categorySelected]}
          >
            <Text style={category === item.value ? styles.categoryTextSelected : styles.categoryText}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <TextField
        label="Descripción"
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={1000}
        placeholder="Describe lo sucedido y cualquier dato que ayude a revisarlo"
        style={styles.textArea}
      />
      <Button label="Enviar reporte" onPress={handleSubmit} loading={isSubmitting} />
      <Button label="Cancelar" variant="outline" onPress={() => navigation.goBack()} style={styles.cancel} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.lg, marginBottom: spacing.md },
  description: { ...typography.body, color: colors.textMuted, marginBottom: spacing.lg },
  label: { ...typography.caption, marginBottom: spacing.sm },
  categories: { gap: spacing.sm, marginBottom: spacing.lg },
  category: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceElevated,
  },
  categorySelected: { borderColor: colors.accent, backgroundColor: colors.surface },
  categoryText: { color: colors.textPrimary },
  categoryTextSelected: { color: colors.accent, fontWeight: '700' },
  textArea: { height: 120, paddingTop: spacing.md, textAlignVertical: 'top' },
  cancel: { marginTop: spacing.md, marginBottom: spacing.xl },
});
