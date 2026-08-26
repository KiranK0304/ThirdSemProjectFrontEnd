import { api } from './client';
import { Notification } from './types';

export const getNotificationsApi = async (): Promise<Notification[]> => {
  const response = await api.get<Notification[]>('/api/notifications/');
  return response.data;
};

export const getUnreadNotificationCountApi = async (): Promise<number> => {
  const response = await api.get<{ count: number }>('/api/notifications/unread-count/');
  return response.data.count;
};

export const markNotificationReadApi = async (id: number): Promise<Notification> => {
  const response = await api.patch<Notification>(`/api/notifications/${id}/read/`);
  return response.data;
};

export const markAllNotificationsReadApi = async (): Promise<void> => {
  await api.post('/api/notifications/read-all/');
};
