import { apiClient } from './api/client';

import { GeoPoint } from '@/types';

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface Route {
  distanceKm: number;
  durationMinutes: number;
  polyline: RoutePoint[];
}

/**
 * Ruta real por calles entre dos puntos. El backend cae a línea recta +
 * Haversine si Google Directions API no está configurada, así que esta
 * llamada siempre responde algo dibujable — no hace falta manejar un caso
 * especial de "sin ruta" en la UI.
 */
export const directionsService = {
  async getRoute(origin: GeoPoint, destination: GeoPoint): Promise<Route> {
    try {
      const { data } = await apiClient.get<Route>('/directions', {
        params: {
          originLat: origin.latitude,
          originLng: origin.longitude,
          destLat: destination.latitude,
          destLng: destination.longitude,
        },
      });
      return data;
    } catch {
      // Respaldo local para que un corte puntual de red no deje el mapa sin una ruta dibujable.
      const earthRadiusKm = 6371;
      const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
      const deltaLat = toRadians(destination.latitude - origin.latitude);
      const deltaLng = toRadians(destination.longitude - origin.longitude);
      const a =
        Math.sin(deltaLat / 2) ** 2 +
        Math.cos(toRadians(origin.latitude)) * Math.cos(toRadians(destination.latitude)) * Math.sin(deltaLng / 2) ** 2;
      const distanceKm = Math.round(earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 100) / 100;
      return {
        distanceKm,
        durationMinutes: Math.max(1, Math.ceil((distanceKm / 30) * 60)),
        polyline: [origin, destination],
      };
    }
  },
};
