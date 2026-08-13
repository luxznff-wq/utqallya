import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LoadingOverlay, ScreenContainer } from '@/components';
import { Incident, IncidentCategory, IncidentStatus, incidentService } from '@/services/incidentService';
import { colors, radius, spacing, typography } from '@/theme';

const CATEGORY_LABELS: Record<IncidentCategory, string> = {
  SAFETY: 'Riesgo de seguridad',
  ACCIDENT: 'Accidente',
  HARASSMENT: 'Acoso o conducta inapropiada',
  LOST_ITEM: 'Objeto perdido',
  PAYMENT_DISPUTE: 'Desacuerdo sobre el pago',
  OTHER: 'Otro',
};

const STATUS_LABELS: Record<IncidentStatus, string> = {
  OPEN: 'Recibido',
  IN_REVIEW: 'En revisión',
  RESOLVED: 'Resuelto',
};

export function MyIncidentsScreen() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const page = await incidentService.getMine();
      setIncidents(page.content);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => undefined);
    }, [load])
  );

  if (isLoading) return <LoadingOverlay message="Cargando reportes..." />;

  return (
    <ScreenContainer>
      <Text style={[typography.h2, styles.title]}>Mis reportes</Text>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              load();
            }}
          />
        }
      >
        {incidents.length === 0 ? (
          <Text style={styles.empty}>Todavía no has reportado incidentes.</Text>
        ) : (
          incidents.map((incident) => (
            <View key={incident.id} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.category}>{CATEGORY_LABELS[incident.category]}</Text>
                <Text style={[styles.status, incident.status === 'RESOLVED' && styles.resolved]}>
                  {STATUS_LABELS[incident.status]}
                </Text>
              </View>
              <Text style={styles.date}>{new Date(incident.createdAt).toLocaleString('es-PE')}</Text>
              <Text style={styles.description}>{incident.description}</Text>
              {incident.adminNote ? (
                <View style={styles.response}>
                  <Text style={styles.responseLabel}>Respuesta de soporte</Text>
                  <Text style={styles.responseText}>{incident.adminNote}</Text>
                </View>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.lg, marginBottom: spacing.lg },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  category: { ...typography.bodyStrong, flex: 1 },
  status: { ...typography.caption, color: colors.warning },
  resolved: { color: colors.success },
  date: { ...typography.caption, marginTop: spacing.xs },
  description: { ...typography.body, marginTop: spacing.md },
  response: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface },
  responseLabel: { ...typography.caption, color: colors.accent, marginBottom: spacing.xs },
  responseText: { ...typography.body },
});
