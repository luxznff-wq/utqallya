import { apiClient } from './api/client';

import { UserProfile } from '@/types';

export const userService = {
  async getMyProfile(): Promise<UserProfile> {
    const { data } = await apiClient.get<UserProfile>('/users/me');
    return data;
  },

  async registerPushToken(pushToken: string): Promise<void> {
    await apiClient.patch('/users/me/push-token', { pushToken });
  },

  async removePushToken(): Promise<void> {
    await apiClient.delete('/users/me/push-token');
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.patch('/users/me/password', { currentPassword, newPassword });
  },

  async updateEmergencyContact(name: string, phone: string): Promise<UserProfile> {
    const { data } = await apiClient.patch<UserProfile>('/users/me/emergency-contact', { name, phone });
    return data;
  },

  async revokeSessions(): Promise<void> {
    await apiClient.post('/users/me/sessions/revoke');
  },

  async deleteAccount(): Promise<void> {
    await apiClient.delete('/users/me');
  },
};
