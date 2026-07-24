import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme';

interface RatingStarsProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
}

/** Selector de calificación de 1 a 5 estrellas, usado al finalizar un viaje. */
export function RatingStars({ value, onChange, size = 40 }: RatingStarsProps) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onChange(star)} hitSlop={8}>
          <Text style={[styles.star, { fontSize: size, color: star <= value ? colors.warning : colors.border }]}>★</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  star: {
    fontWeight: '700',
  },
});
