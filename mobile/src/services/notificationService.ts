import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { apiClient } from './api/client';

import { PagedResponse } from '@/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type NotificationType =
  | 'TRIP_REQUEST'
  | 'TRIP_OFFER_RECEIVED'
  | 'TRIP_OFFER_SELECTED'
  | 'TRIP_ACCEPTED'
  | 'DRIVER_ARRIVED'
  | 'TRIP_STARTED'
  | 'TRIP_FINISHED'
  | 'TRIP_CANCELLED'
  | 'PAYMENT_CONFIRMED'
  | 'DRIVER_APPROVED'
  | 'DRIVER_REJECTED'
  | 'DOCUMENT_EXPIRING'
  | 'DOCUMENT_EXPIRED'
  | 'INCIDENT_UPDATED'
  | 'ACCOUNT_BLOCKED';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedTripId: string | null;
  read: boolean;
  createdAt: string;
}

/**
 * Registra el dispositivo en Firebase Cloud Messaging (a través de Expo Notifications)
 * y devuelve el token push a persistir en el backend. Devuelve null en emuladores
 * o si el usuario no otorga permisos, sin bloquear el resto del flujo.
 */
export const notificationService = {
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
    const token = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getDevicePushTokenAsync();
    return token.data;
  },

  /**
   * Notificaciones persistidas del usuario (el backend las guarda siempre,
   * llegue o no el push — ver FcmNotificationServiceImpl). Se usa para el
   * sondeo de respaldo del conductor: ver DriverHomeScreen.
   */
  async getMyNotifications(page = 0, size = 5): Promise<PagedResponse<NotificationItem>> {
    const { data } = await apiClient.get<PagedResponse<NotificationItem>>('/notifications/me', {
      params: { page, size },
    });
    return data;
  },

  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.patch(`/notifications/${notificationId}/read`);
  },
};
