import { apiClient } from './api/client';
import { AuthResponse } from '@/types';

export interface RegisterPassengerPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface RegisterDriverPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  dniNumber: string;
  plate: string;
  vehicleType: 'CAR' | 'MOTOTAXI';
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleColor?: string;
}

export interface RegisterDriverPhotos {
  dniPhoto: { uri: string; name: string; type: string };
  licensePhoto: { uri: string; name: string; type: string };
  soatPhoto: { uri: string; name: string; type: string };
  vehiclePhoto: { uri: string; name: string; type: string };
}

export const authService = {
  async loginPassengerOrDriver(email: string, password: string): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },

  async registerPassenger(payload: RegisterPassengerPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/register/passenger', payload);
    return data;
  },

  async registerDriver(payload: RegisterDriverPayload, photos: RegisterDriverPhotos): Promise<AuthResponse> {
    const form = new FormData();
    // El backend (Spring) espera esta parte con Content-Type "application/json" para poder
    // deserializarla como RegisterDriverRequest; un Blob tipado logra exactamente eso en RN.
    form.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    form.append('dniPhoto', photos.dniPhoto as unknown as Blob);
    form.append('licensePhoto', photos.licensePhoto as unknown as Blob);
    form.append('soatPhoto', photos.soatPhoto as unknown as Blob);
    form.append('vehiclePhoto', photos.vehiclePhoto as unknown as Blob);

    const { data } = await apiClient.post<AuthResponse>('/auth/register/driver', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
