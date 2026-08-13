import { apiClient } from './api/client';

import { PickedPhoto } from '@/components/PhotoPickerField';
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

  async updateDocuments(
    licenseExpiresAt: string,
    soatExpiresAt: string,
    licensePhoto: PickedPhoto,
    soatPhoto: PickedPhoto
  ): Promise<DriverProfile> {
    const form = new FormData();
    form.append('data', new Blob([JSON.stringify({ licenseExpiresAt, soatExpiresAt })], { type: 'application/json' }));
    form.append('licensePhoto', licensePhoto as unknown as Blob);
    form.append('soatPhoto', soatPhoto as unknown as Blob);
    const { data } = await apiClient.patch<DriverProfile>('/drivers/me/documents', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async updatePaymentDetails(yapeHolderName: string, yapePhone: string): Promise<DriverProfile> {
    const { data } = await apiClient.patch<DriverProfile>('/drivers/me/payment-details', {
      yapeHolderName,
      yapePhone,
    });
    return data;
  },
};
