import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components';
import { colors, radius, shadow, spacing, typography } from '@/theme';
import { AuthStackParamList } from '@/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ChooseUserType'>;

/** Paso previo al registro: elegir si la cuenta es de pasajero o de conductor. */
export function ChooseUserTypeScreen({ navigation }: Props) {
  return (
    <ScreenContainer>
      <Text style={[typography.h2, styles.title]}>¿Cómo quieres usar Utqallya?</Text>
      <Text style={styles.subtitle}>Puedes cambiar de opinión más adelante creando otra cuenta</Text>

      <Pressable style={styles.card} onPress={() => navigation.navigate('RegisterPassenger')}>
        <Text style={styles.icon}>🧍</Text>
        <View style={styles.cardText}>
          <Text style={typography.h3}>Soy pasajero</Text>
          <Text style={styles.cardCaption}>Quiero solicitar viajes</Text>
        </View>
      </Pressable>

      <Pressable style={styles.card} onPress={() => navigation.navigate('RegisterDriver')}>
        <Text style={styles.icon}>🚗</Text>
        <View style={styles.cardText}>
          <Text style={typography.h3}>Soy conductor</Text>
          <Text style={styles.cardCaption}>Tengo auto o mototaxi y quiero dar viajes</Text>
        </View>
      </Pressable>

      <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
        <Text style={styles.backLinkText}>Ya tengo una cuenta</Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: spacing.xxl,
  },
  subtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  icon: {
    fontSize: 32,
  },
  cardText: {
    gap: 2,
  },
  cardCaption: {
    ...typography.caption,
  },
  backLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  backLinkText: {
    color: colors.accent,
    fontWeight: '600',
  },
});
