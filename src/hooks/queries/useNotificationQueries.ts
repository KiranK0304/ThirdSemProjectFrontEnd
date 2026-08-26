import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getNotificationsApi,
  getUnreadNotificationCountApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
} from '../../api/notifications';

export const useNotifications = (enabled = true) => useQuery({
  queryKey: ['notifications'],
  queryFn: getNotificationsApi,
  enabled,
  refetchInterval: enabled ? 30000 : false,
});

export const useUnreadNotificationCount = (enabled = true) => useQuery({
  queryKey: ['notifications', 'unread-count'],
  queryFn: getUnreadNotificationCountApi,
  enabled,
  refetchInterval: enabled ? 30000 : false,
});

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
