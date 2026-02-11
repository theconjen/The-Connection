import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

export interface Notification {
  id: number;
  userId: number;
  title: string;
  body: string;
  data?: any;
  category?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  status: string;
  success: boolean;
  data: {
    notifications: Notification[];
    nextCursor: string | null;
  };
}

export interface NotificationCountResponse {
  status: string;
  success: boolean;
  data: {
    count: number;
  };
}

/**
 * Fetch notifications list
 */
export const useNotifications = (options?: { unreadOnly?: boolean; limit?: number }) => {
  return useQuery({
    queryKey: ['notifications', options?.unreadOnly, options?.limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.unreadOnly) params.append('unreadOnly', 'true');
      if (options?.limit) params.append('limit', String(options.limit));

      const response = await apiClient.get(`/api/notifications?${params.toString()}`);

      // Handle both old format (array) and new format (structured response)
      if (Array.isArray(response.data)) {
        return response.data as Notification[];
      }
      return response.data?.data?.notifications || response.data?.notifications || [];
    },
    refetchInterval: 30000, // Poll every 30 seconds
  });
};

/**
 * Fetch unread notification count for badge display
 */
export const useNotificationCount = () => {
  return useQuery({
    queryKey: ['notification-count'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api/notifications/unread-count');

        // Handle both old format and new format
        if (response.data?.data?.count !== undefined) {
          return { count: response.data.data.count };
        }
        if (response.data?.count !== undefined) {
          return { count: response.data.count };
        }
        return { count: 0 };
      } catch (error) {
        return { count: 0 };
      }
    },
    refetchInterval: 30000, // Poll every 30 seconds
  });
};

/**
 * Mark a single notification as read
 */
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiClient.post(`/api/notifications/${notificationId}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    },
  });
};

/**
 * Mark all notifications as read
 */
export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/api/notifications/read-all');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    },
  });
};
