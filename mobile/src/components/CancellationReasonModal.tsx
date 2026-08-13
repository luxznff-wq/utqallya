import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from './Button';
import { TextField } from './TextField';

import { colors, radius, shadow, spacing, typography } from '@/theme';

const REASONS = [
  'Cambio de planes',
  'Demora excesiva',
  'No pude contactar a la otra persona',
  'Problema de seguridad',
] as const;

interface CancellationReasonModalProps {
  visible: boolean;
  loading?: boolean;
  onDismiss: () => void;
  onConfirm: (reason: string) => void;
}

export function CancellationReasonModal({ visible, loading, onDismiss, onConfirm }: CancellationReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const reason = selectedReason === 'OTHER' ? otherReason.trim() : selectedReason;

  function dismiss() {
    if (!loading) {
      setSelectedReason('');
      setOtherReason('');
      onDismiss();
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal>
          <Text style={typography.h3}>¿Por qué cancelas?</Text>
          <Text style={styles.helper}>El motivo se guardará para soporte y seguridad.</Text>

          {REASONS.map((item) => (
            <Pressable
              key={item}
              style={[styles.option, selectedReason === item && styles.optionSelected]}
              onPress={() => setSelectedReason(item)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selectedReason === item }}
            >
              <Text style={styles.optionText}>{item}</Text>
            </Pressable>
          ))}

          <Pressable
            style={[styles.option, selectedReason === 'OTHER' && styles.optionSelected]}
            onPress={() => setSelectedReason('OTHER')}
            accessibilityRole="radio"
            accessibilityState={{ checked: selectedReason === 'OTHER' }}
          >
            <Text style={styles.optionText}>Otro motivo</Text>
          </Pressable>

          {selectedReason === 'OTHER' && (
            <TextField
              label="Describe el motivo"
              value={otherReason}
              onChangeText={setOtherReason}
              maxLength={255}
              autoFocus
            />
          )}

          <Button
            label="Confirmar cancelación"
            variant="danger"
            disabled={reason.length < 3}
            loading={loading}
            onPress={() => onConfirm(reason)}
          />
          <Button label="Volver" variant="outline" disabled={loading} onPress={dismiss} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadow.card,
  },
  helper: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  option: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  optionText: {
    ...typography.body,
    color: colors.textPrimary,
  },
});
