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
};
