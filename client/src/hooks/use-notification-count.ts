/**
 * Hook to get real-time notification and message counts
 * Uses React Query with socket invalidation for real-time updates
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from './use-auth';

interface NotificationCountResponse {
  status: string;
  success: boolean;
  data: {
    count: number;
  };
}

interface UnreadMessageCountResponse {
  count: number;
}

/**
 * Hook to get unread notification count
 * Automatically invalidated by SocketContext when notif:new events are received
 */
export function useNotificationCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['/api/notifications/unread-count'],
    queryFn: async (): Promise<{ count: number }> => {
      const res = await fetch('/api/notifications/unread-count', {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to fetch notification count');
      }
      const json: NotificationCountResponse = await res.json();
      // Extract count from the nested data structure
      return { count: json.data?.count || 0 };
    },
    enabled: !!user,
    refetchInterval: 60000, // Poll every minute as backup
    staleTime: 30000, // Consider fresh for 30 seconds
  });
}

/**
 * Hook to get unread DM message count
 * Automatically invalidated by SocketContext when dm:new events are received
 */
export function useUnreadMessageCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['/api/dms/unread-count'],
    queryFn: async (): Promise<{ count: number }> => {
      const res = await fetch('/api/dms/unread-count', {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to fetch unread message count');
      }
      const json: UnreadMessageCountResponse = await res.json();
      return { count: json.count || 0 };
    },
    enabled: !!user,
    refetchInterval: 60000, // Poll every minute as backup
    staleTime: 30000,
  });
}
