import { colors } from '@/theme';
import { TripStatus } from '@/types';

interface TripStatusMeta {
  label: string;
  color: string;
}

/** Texto y color a mostrar por cada estado del viaje. Única fuente de verdad para toda la UI. */
export const TRIP_STATUS_META: Record<TripStatus, TripStatusMeta> = {
  REQUESTED: { label: 'Solicitando viaje', color: colors.tripSearching },
  SEARCHING_DRIVER: { label: 'Buscando conductor', color: colors.tripSearching },
  ACCEPTED: { label: 'Conductor asignado', color: colors.tripActive },
  DRIVER_ARRIVING: { label: 'Conductor en camino', color: colors.tripActive },
  WAITING_CONFIRMATION: { label: 'Esperando confirmación', color: colors.tripActive },
  IN_PROGRESS: { label: 'En viaje', color: colors.tripActive },
  FINISHED: { label: 'Viaje finalizado', color: colors.tripFinished },
  RATED: { label: 'Viaje calificado', color: colors.tripFinished },
  CANCELLED: { label: 'Viaje cancelado', color: colors.tripCancelled },
};
