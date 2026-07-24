import { apiClient } from './api/client';
import { CreateTripPayload, PagedResponse, Trip } from '@/types';

export interface DriverLocationDto {
  latitude: number;
  longitude: number;
  heading: number;
}

export const tripService = {
  async requestTrip(payload: CreateTripPayload): Promise<Trip> {
    const { data } = await apiClient.post<Trip>('/trips', payload);
    return data;
  },

  async getTrip(tripId: string): Promise<Trip> {
    const { data } = await apiClient.get<Trip>(`/trips/${tripId}`);
    return data;
  },

  async getDriverLocation(tripId: string): Promise<DriverLocationDto | null> {
    try {
      const { data } = await apiClient.get<DriverLocationDto>(`/trips/${tripId}/driver-location`);
      return data;
    } catch {
      // El conductor puede no haber reportado ubicación todavía; no es un error fatal para la UI.
      return null;
    }
  },

  async getMyHistory(page = 0, size = 20): Promise<PagedResponse<Trip>> {
    const { data } = await apiClient.get<PagedResponse<Trip>>('/trips/me', { params: { page, size } });
    return data;
  },

  async acceptTrip(tripId: string): Promise<Trip> {
    const { data } = await apiClient.post<Trip>(`/trips/${tripId}/accept`);
    return data;
  },

  async markArrived(tripId: string): Promise<Trip> {
    const { data } = await apiClient.post<Trip>(`/trips/${tripId}/arrived`);
    return data;
  },

  async confirmCode(tripId: string, code: string): Promise<Trip> {
    const { data } = await apiClient.post<Trip>(`/trips/${tripId}/confirm-code`, { code });
    return data;
  },

  async finishTrip(tripId: string): Promise<Trip> {
    const { data } = await apiClient.post<Trip>(`/trips/${tripId}/finish`);
    return data;
  },

  async cancelTrip(tripId: string, reason?: string): Promise<Trip> {
    const { data } = await apiClient.post<Trip>(`/trips/${tripId}/cancel`, { reason });
    return data;
  },

  async rateTrip(tripId: string, score: number, comment?: string): Promise<void> {
    await apiClient.post(`/trips/${tripId}/rating`, { score, comment });
  },
};
