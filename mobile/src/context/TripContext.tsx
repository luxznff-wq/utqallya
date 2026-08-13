import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { TRIP_POLL_INTERVAL_MS } from '@/constants/config';
import { useAuth } from '@/context/AuthContext';
import { tripService } from '@/services/tripService';
import { Trip } from '@/types';

const TERMINAL_STATUSES: Trip['status'][] = ['FINISHED', 'RATED', 'CANCELLED'];

interface TripContextValue {
  trip: Trip | null;
  isLoading: boolean;
  /** Empieza a rastrear un viaje por id (sondeo periódico de su estado). */
  track: (tripId: string) => void;
  /** Deja de rastrear el viaje activo, p.ej. al salir de la pantalla de viaje. */
  stopTracking: () => void;
  refresh: () => Promise<void>;
}

const TripContext = createContext<TripContextValue | undefined>(undefined);

/**
 * Mantiene el estado del viaje activo sincronizado con el backend mediante
 * sondeo (polling) simple. Se eligió polling en vez de WebSockets para el MVP:
 * a la escala de Acarí y Bella Unión es suficientemente responsivo y evita
 * la complejidad operativa de mantener conexiones persistentes (KISS).
 */
export function TripProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [tripId, setTripId] = useState<string | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTrip = useCallback(async (id: string) => {
    try {
      const data = await tripService.getTrip(id);
      setTrip(data);
      if (TERMINAL_STATUSES.includes(data.status) && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch {
      // Un fallo puntual de red no debe tumbar el sondeo; se reintenta en el próximo ciclo.
    }
  }, []);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    if (!user || user.role === 'ADMIN') {
      setTripId(null);
      setTrip(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    tripService
      .getMyActiveTrip()
      .then((activeTrip) => {
        setTrip(activeTrip);
        setTripId(activeTrip?.id ?? null);
      })
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
  }, [isAuthLoading, user]);

  useEffect(() => {
    if (!tripId) {
      return;
    }
    setIsLoading(true);
    fetchTrip(tripId).finally(() => setIsLoading(false));

    intervalRef.current = setInterval(() => fetchTrip(tripId), TRIP_POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [tripId, fetchTrip]);

  const track = useCallback((id: string) => setTripId(id), []);

  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTripId(null);
    setTrip(null);
  }, []);

  const refresh = useCallback(async () => {
    if (tripId) {
      await fetchTrip(tripId);
    }
  }, [tripId, fetchTrip]);

  const value = useMemo(
    () => ({ trip, isLoading, track, stopTracking, refresh }),
    [trip, isLoading, track, stopTracking, refresh]
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip(): TripContextValue {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrip debe usarse dentro de un <TripProvider>');
  }
  return context;
}
