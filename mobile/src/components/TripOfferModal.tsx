import React, { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { Button } from './Button';
import { TextField } from './TextField';

import { colors, radius, shadow, spacing, typography } from '@/theme';

export function TripOfferModal({
  visible,
  loading,
  onDismiss,
  onConfirm,
}: {
  visible: boolean;
  loading?: boolean;
  onDismiss: () => void;
  onConfirm: (amount: number) => void;
}) {
  const [amount, setAmount] = useState('');
  const parsedAmount = Number(amount.replace(',', '.'));
  const valid = Number.isFinite(parsedAmount) && parsedAmount >= 1 && parsedAmount <= 9999.99;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal>
          <Text style={typography.h3}>Ofrece tu precio</Text>
          <Text style={styles.helper}>El pasajero comparará tu monto con otras ofertas.</Text>
          <TextField
            label="Monto en soles"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="10.00"
            autoFocus
          />
          <Button label="Enviar oferta" disabled={!valid} loading={loading} onPress={() => onConfirm(parsedAmount)} />
          <Button label="Ahora no" variant="outline" disabled={loading} onPress={onDismiss} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: 'rgba(0,0,0,0.72)' },
  card: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceElevated,
    ...shadow.card,
  },
  helper: { ...typography.caption, marginBottom: spacing.sm },
});
