import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button, RatingStars, ScreenContainer, TextField } from '@/components';
import { useTrip } from '@/context/TripContext';
import { tripService } from '@/services/tripService';
import { spacing, typography } from '@/theme';
import { PassengerStackParamList } from '@/types';

type Props = NativeStackScreenProps<PassengerStackParamList, 'RateTrip'>;

/** Pantalla de fin de viaje: el pasajero califica al conductor de 1 a 5 estrellas. */
export function RateTripScreen({ navigation, route }: Props) {
  const { tripId } = route.params;
  const { stopTracking } = useTrip();
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      await tripService.rateTrip(tripId, score, comment || undefined);
      stopTracking();
      navigation.popToTop();
    } catch (error) {
      Alert.alert('No se pudo enviar la calificación', (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.emoji}>✅</Text>
        <Text style={[typography.h2, styles.title]}>¡Viaje finalizado!</Text>
        <Text style={styles.caption}>Cuéntanos cómo te fue con tu conductor</Text>

        <RatingStars value={score} onChange={setScore} />

        <TextField
          label="Comentario (opcional)"
          placeholder="Escribe algo sobre tu experiencia"
          value={comment}
          onChangeText={setComment}
          multiline
          style={styles.commentInput}
        />

        <Button label="Enviar calificación" onPress={handleSubmit} loading={isSubmitting} style={styles.submit} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  emoji: {
    fontSize: 40,
    textAlign: 'center',
  },
  title: {
    textAlign: 'center',
  },
  caption: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  commentInput: {
    height: 90,
    textAlignVertical: 'top',
    paddingTop: spacing.sm,
  },
  submit: {
    marginTop: spacing.md,
  },
});
