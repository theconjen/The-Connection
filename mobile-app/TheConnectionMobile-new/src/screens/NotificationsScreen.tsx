/**
 * NOTIFICATIONS SCREEN - The Connection Mobile App
 * ------------------------------------------------
 * Display user notifications for engagement activities
 * - Events
 * - Invitations
 * - Likes
 * - Replies
 * - Comments
 * - Community updates
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text,  } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { PageHeader } from './AppHeader';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/apiClient';
import { formatDistanceToNow } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

interface Notification {
  id: number;
  userId: number;
  title: string;
  body: string;
  data?: any;
  category?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsScreenProps {
  onBackPress?: () => void;
}

// ============================================================================
// API HOOKS
// ============================================================================

function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const response = await apiClient.get('/api/notifications');
      return response.data;
    },
  });
}

function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiClient.patch(`/api/notifications/${notificationId}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });
}

function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/api/notifications/mark-all-read');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });
}

// ============================================================================
// COMPONENTS
// ============================================================================

function NotificationCard({
  notification,
  onPress,
}: {
  notification: Notification;
  onPress: () => void;
}) {
  const { colors, spacing, radii } = useTheme();

  // Get icon based on category
  const getNotificationIcon = (category?: string) => {
    switch (category) {
      case 'event':
        return { name: 'calendar', color: '#3B82F6', bg: '#DBEAFE' };
      case 'invitation':
        return { name: 'mail', color: '#8B5CF6', bg: '#EDE9FE' };
      case 'like':
        return { name: 'heart', color: '#EF4444', bg: '#FEE2E2' };
      case 'comment':
        return { name: 'chatbubble', color: '#10B981', bg: '#D1FAE5' };
      case 'reply':
        return { name: 'arrow-undo', color: '#F59E0B', bg: '#FEF3C7' };
      case 'community':
        return { name: 'people', color: '#6366F1', bg: '#E0E7FF' };
      default:
        return { name: 'notifications', color: '#6B7280', bg: '#F3F4F6' };
    }
  };

  const icon = getNotificationIcon(notification.category);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        padding: spacing.md,
        gap: spacing.md,
        backgroundColor: notification.isRead
          ? 'transparent'
          : `${colors.primary}08`,
        borderLeftWidth: notification.isRead ? 0 : 3,
        borderLeftColor: colors.primary,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {/* Icon */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: icon.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon.name as any} size={20} color={icon.color} />
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text
          variant="bodySmall"
          style={{
            fontWeight: notification.isRead ? '500' : '700',
            marginBottom: 2,
          }}
        >
          {notification.title}
        </Text>
        <Text
          variant="caption"
          color="mutedForeground"
          numberOfLines={2}
          style={{ marginBottom: 4 }}
        >
          {notification.body}
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: colors.mutedForeground,
          }}
        >
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </Text>
      </View>

      {/* Unread indicator */}
      {!notification.isRead && (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.primary,
            marginTop: 4,
          }}
        />
      )}
    </Pressable>
  );
}

// ============================================================================
// MAIN SCREEN
// ============================================================================

export function NotificationsScreen({ onBackPress }: NotificationsScreenProps) {
  const { colors, spacing } = useTheme();
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data: notifications = [], isLoading, refetch } = useNotifications();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    // TODO: Navigate to the relevant screen based on notification.data
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Filter notifications
  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PageHeader
        title="Notifications"
        onBackPress={onBackPress}
        rightElement={
          unreadCount > 0 ? (
            <Pressable
              onPress={handleMarkAllAsRead}
              style={({ pressed }) => ({
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                variant="caption"
                style={{
                  color: colors.primary,
                  fontWeight: '600',
                }}
              >
                Mark all read
              </Text>
            </Pressable>
          ) : undefined
        }
      />

      {/* Filter Tabs */}
      <View
        style={{
          flexDirection: 'row',
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable
          onPress={() => setFilter('all')}
          style={({ pressed }) => ({
            flex: 1,
            paddingVertical: spacing.sm,
            borderRadius: spacing.md,
            backgroundColor: filter === 'all' ? colors.primary : colors.muted,
            alignItems: 'center',
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text
            variant="bodySmall"
            style={{
              fontWeight: '600',
              color: filter === 'all' ? colors.primaryForeground : colors.foreground,
            }}
          >
            All ({notifications.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setFilter('unread')}
          style={({ pressed }) => ({
            flex: 1,
            paddingVertical: spacing.sm,
            borderRadius: spacing.md,
            backgroundColor: filter === 'unread' ? colors.primary : colors.muted,
            alignItems: 'center',
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text
            variant="bodySmall"
            style={{
              fontWeight: '600',
              color: filter === 'unread' ? colors.primaryForeground : colors.foreground,
            }}
          >
            Unread ({unreadCount})
          </Text>
        </Pressable>
      </View>

      {/* Notifications List */}
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {isLoading && !notifications.length ? (
          <View style={{ alignItems: 'center', paddingVertical: spacing.xl * 2 }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              variant="bodySmall"
              color="mutedForeground"
              style={{ marginTop: spacing.md }}
            >
              Loading notifications...
            </Text>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View
            style={{
              alignItems: 'center',
              paddingVertical: spacing.xl * 3,
              paddingHorizontal: spacing.lg,
            }}
          >
            <Ionicons name="notifications-off-outline" size={64} color={colors.mutedForeground} />
            <Text
              variant="body"
              style={{
                fontWeight: '600',
                marginTop: spacing.md,
                textAlign: 'center',
              }}
            >
              {filter === 'unread' ? 'No Unread Notifications' : 'No Notifications Yet'}
            </Text>
            <Text
              variant="bodySmall"
              color="mutedForeground"
              style={{ marginTop: spacing.sm, textAlign: 'center' }}
            >
              {filter === 'unread'
                ? "You're all caught up!"
                : 'Notifications about events, invitations, and engagement will appear here.'}
            </Text>
          </View>
        ) : (
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
            {filteredNotifications.map((notification) => (
              <View
                key={notification.id}
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <NotificationCard
                  notification={notification}
                  onPress={() => handleNotificationPress(notification)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
});
