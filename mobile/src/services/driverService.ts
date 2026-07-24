import { apiClient } from './api/client';
import { DriverProfile } from '@/types';

export const driverService = {
  async getMyProfile(): Promise<DriverProfile> {
    const { data } = await apiClient.get<DriverProfile>('/drivers/me');
    return data;
  },

  async setAvailability(available: boolean): Promise<DriverProfile> {
    const { data } = await apiClient.patch<DriverProfile>('/drivers/me/availability', { available });
    return data;
  },

  async updateLocation(latitude: number, longitude: number, heading?: number): Promise<void> {
    await apiClient.post('/drivers/me/location', { latitude, longitude, heading });
  },
};
