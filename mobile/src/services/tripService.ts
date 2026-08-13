import { apiClient } from './api/client';

import { CreateTripPayload, PagedResponse, Trip, TripOffer } from '@/types';

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

  async getMyActiveTrip(): Promise<Trip | null> {
    const response = await apiClient.get<Trip>('/trips/me/active');
    return response.status === 204 ? null : response.data;
  },

  async createOffer(tripId: string, amount: number): Promise<TripOffer> {
    const { data } = await apiClient.post<TripOffer>(`/trips/${tripId}/offers`, { amount });
    return data;
  },

  async getOffers(tripId: string): Promise<TripOffer[]> {
    const { data } = await apiClient.get<TripOffer[]>(`/trips/${tripId}/offers`);
    return data;
  },

  async getMyOffers(): Promise<TripOffer[]> {
    const { data } = await apiClient.get<TripOffer[]>('/trips/offers/me');
    return data;
  },

  async withdrawOffer(tripId: string): Promise<void> {
    await apiClient.delete(`/trips/${tripId}/offers/me`);
  },

  async selectOffer(tripId: string, offerId: string): Promise<Trip> {
    const { data } = await apiClient.post<Trip>(`/trips/${tripId}/offers/${offerId}/select`);
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

  async confirmPayment(tripId: string): Promise<Trip> {
    const { data } = await apiClient.post<Trip>(`/trips/${tripId}/confirm-payment`);
    return data;
  },

  async rateTrip(tripId: string, score: number, comment?: string): Promise<void> {
    await apiClient.post(`/trips/${tripId}/rating`, { score, comment });
  },
};
