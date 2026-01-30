/**
 * Hook to get real-time notification and message counts
 * Uses React Query with socket invalidation for real-time updates
 *
 * PERFORMANCE: These hooks are optimized to:
 * - Not block initial render (retry: false on first load)
 * - Have long stale times to reduce API calls
 * - Silently fail without throwing errors
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from './use-auth';

/**
 * Hook to get unread notification count
 * Automatically invalidated by SocketContext when notif:new events are received
 */
export function useNotificationCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['/api/notifications/unread-count'],
    queryFn: async (): Promise<{ count: number }> => {
      try {
        const res = await fetch('/api/notifications/unread-count', {
          credentials: 'include',
        });
        if (!res.ok) return { count: 0 };
        const json = await res.json();
        return { count: json.data?.count || 0 };
      } catch {
        return { count: 0 };
      }
    },
    enabled: !!user,
    refetchInterval: 120000, // Poll every 2 minutes as backup
    staleTime: 60000, // Consider fresh for 1 minute
    retry: false, // Don't retry on failure
    refetchOnWindowFocus: false, // Don't refetch on window focus
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
      try {
        const res = await fetch('/api/dms/unread-count', {
          credentials: 'include',
        });
        if (!res.ok) return { count: 0 };
        const json = await res.json();
        return { count: json.count || 0 };
      } catch {
        return { count: 0 };
      }
    },
    enabled: !!user,
    refetchInterval: 120000, // Poll every 2 minutes as backup
    staleTime: 60000, // Consider fresh for 1 minute
    retry: false,
    refetchOnWindowFocus: false,
  });
}
