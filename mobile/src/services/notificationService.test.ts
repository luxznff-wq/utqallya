import { apiClient } from './api/client';
import { notificationService } from './notificationService';

jest.mock('./api/client', () => ({
  apiClient: { get: jest.fn(), patch: jest.fn() },
}));
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  AndroidImportance: { HIGH: 4 },
}));
jest.mock('expo-device', () => ({ isDevice: false }));

beforeEach(() => jest.clearAllMocks());

it('obtiene las notificaciones paginadas', async () => {
  const page = { content: [{ id: 'n1' }], totalElements: 1 };
  (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: page });
  await expect(notificationService.getMyNotifications(2, 10)).resolves.toBe(page);
  expect(apiClient.get).toHaveBeenCalledWith('/notifications/me', { params: { page: 2, size: 10 } });
});

it('marca una notificación como leída', async () => {
  (apiClient.patch as jest.Mock).mockResolvedValueOnce({});
  await notificationService.markAsRead('n1');
  expect(apiClient.patch).toHaveBeenCalledWith('/notifications/n1/read');
});
