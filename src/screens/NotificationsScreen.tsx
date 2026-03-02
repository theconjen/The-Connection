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
 *
 * Features:
 * - Swipe left to delete
 * - Time-based grouping (Today, Last 7 Days, Last 30 Days, Older)
 */

import React, { useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Animated,
  PanResponder,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { PageHeader } from './AppHeader';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/apiClient';
import { formatDistanceToNow, isToday, isWithinInterval, subDays, startOfDay } from 'date-fns';
import { useRouter } from 'expo-router';
import { setBadgeCount } from '../services/notificationService';

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

type TimeGroup = 'today' | 'last7days' | 'last30days' | 'older';

interface GroupedNotifications {
  today: Notification[];
  last7days: Notification[];
  last30days: Notification[];
  older: Notification[];
}

// ============================================================================
// API HOOKS
// ============================================================================

function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const response = await apiClient.get('/api/notifications');
      // Handle both old format (array) and new format (structured response)
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return response.data?.data?.notifications || response.data?.notifications || [];
    },
  });
}

function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiClient.post(`/api/notifications/${notificationId}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    },
  });
}

function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/api/notifications/read-all');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
      setBadgeCount(0);
    },
  });
}

function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiClient.delete(`/api/notifications/${notificationId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message
        || error.response?.data?.diagnostics?.reason
        || 'Failed to delete notification';
      Alert.alert('Error', message);
    },
  });
}

// ============================================================================
// FOLLOW REQUEST HOOKS
// ============================================================================

interface FollowRequest {
  id: number;
  followerId: number;
  follower: {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    profileImageUrl?: string;
  };
  createdAt: string;
}

function useFollowRequests() {
  return useQuery<FollowRequest[]>({
    queryKey: ['follow-requests'],
    queryFn: async () => {
      const response = await apiClient.get('/api/follow-requests');
      return response.data || [];
    },
  });
}

function useAcceptFollowRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiClient.post(`/api/follow-requests/${userId}/accept`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-requests'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to accept request');
    },
  });
}

function useDenyFollowRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiClient.post(`/api/follow-requests/${userId}/deny`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-requests'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to deny request');
    },
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function groupNotificationsByTime(notifications: Notification[]): GroupedNotifications {
  const now = new Date();
  const todayStart = startOfDay(now);
  const sevenDaysAgo = subDays(todayStart, 7);
  const thirtyDaysAgo = subDays(todayStart, 30);

  const grouped: GroupedNotifications = {
    today: [],
    last7days: [],
    last30days: [],
    older: [],
  };

  notifications.forEach((notification) => {
    const createdAt = new Date(notification.createdAt);

    if (isToday(createdAt)) {
      grouped.today.push(notification);
    } else if (isWithinInterval(createdAt, { start: sevenDaysAgo, end: todayStart })) {
      grouped.last7days.push(notification);
    } else if (isWithinInterval(createdAt, { start: thirtyDaysAgo, end: sevenDaysAgo })) {
      grouped.last30days.push(notification);
    } else {
      grouped.older.push(notification);
    }
  });

  return grouped;
}

// ============================================================================
// SWIPEABLE NOTIFICATION CARD COMPONENT
// ============================================================================

function SwipeableNotificationCard({
  notification,
  onPress,
  onDelete,
}: {
  notification: Notification;
  onPress: () => void;
  onDelete: () => void;
}) {
  const { colors, spacing } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteThreshold = -80;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow swiping left (negative values)
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -120));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < deleteThreshold) {
          // Swipe past threshold - delete
          Animated.timing(translateX, {
            toValue: -400,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onDelete();
          });
        } else {
          // Bounce back
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  // Get icon based on category - use theme-aware colors
  const getNotificationIcon = (category?: string) => {
    switch (category) {
      case 'event':
        return { name: 'calendar', color: colors.info };
      case 'invitation':
        return { name: 'mail', color: colors.accent };
      case 'like':
        return { name: 'heart', color: colors.destructive };
      case 'comment':
        return { name: 'chatbubble', color: colors.success };
      case 'reply':
        return { name: 'arrow-undo', color: colors.warning };
      case 'community':
        return { name: 'people', color: colors.primary };
      case 'follow':
        return { name: 'person-add', color: colors.accent };
      case 'message':
        return { name: 'chatbubble-ellipses', color: colors.info };
      default:
        return { name: 'notifications', color: colors.textSecondary };
    }
  };

  const icon = getNotificationIcon(notification.category);

  return (
    <View style={{ overflow: 'hidden' }}>
      {/* Delete background - tappable */}
      <Pressable
        onPress={onDelete}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 120,
          backgroundColor: '#EF4444',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', fontSize: 12, marginTop: 4, fontWeight: '600' }}>Delete</Text>
      </Pressable>

      {/* Card content */}
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          transform: [{ translateX }],
          backgroundColor: colors.surface,
        }}
      >
        <Pressable
          onPress={onPress}
          style={({ pressed }) => ({
            flexDirection: 'row',
            padding: spacing.md,
            gap: spacing.md,
            backgroundColor: notification.isRead
              ? colors.surface
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
              backgroundColor: colors.surfaceMuted,
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
              color="textMuted"
              numberOfLines={2}
              style={{ marginBottom: 4 }}
            >
              {notification.body}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: colors.textMuted,
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
      </Animated.View>
    </View>
  );
}

// ============================================================================
// GROUP HEADER COMPONENT
// ============================================================================

function GroupHeader({ title, count }: { title: string; count: number }) {
  const { colors, spacing } = useTheme();

  return (
    <View
      style={{
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        backgroundColor: colors.surfaceMuted,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSubtle,
      }}
    >
      <Text
        variant="caption"
        style={{
          fontWeight: '700',
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {title} ({count})
      </Text>
    </View>
  );
}

// ============================================================================
// CONNECTION REQUESTS SECTION
// ============================================================================

function FollowRequestCard({
  request,
  onAccept,
  onDeny,
  isAccepting,
  isDenying,
}: {
  request: FollowRequest;
  onAccept: () => void;
  onDeny: () => void;
  isAccepting: boolean;
  isDenying: boolean;
}) {
  const { colors, spacing } = useTheme();
  const follower = request.follower;
  const avatarUrl = follower.profileImageUrl || follower.avatarUrl;
  const displayName = follower.displayName || follower.username;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSubtle,
      }}
    >
      {/* Avatar */}
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.surfaceMuted,
          }}
        />
      ) : (
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {/* User Info */}
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={{ fontWeight: '600', color: colors.textPrimary, fontSize: 15 }}>
          {displayName}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>
          @{follower.username}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={onDeny}
          disabled={isDenying || isAccepting}
          style={({ pressed }) => ({
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
            opacity: isDenying ? 0.5 : 1,
          })}
        >
          <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 13 }}>
            {isDenying ? '...' : 'Deny'}
          </Text>
        </Pressable>
        <Pressable
          onPress={onAccept}
          disabled={isAccepting || isDenying}
          style={({ pressed }) => ({
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: pressed ? `${colors.primary}dd` : colors.primary,
            opacity: isAccepting ? 0.5 : 1,
          })}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>
            {isAccepting ? '...' : 'Accept'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function FollowRequestsSection() {
  const { colors, spacing } = useTheme();
  const { data: requests = [], isLoading } = useFollowRequests();
  const acceptMutation = useAcceptFollowRequest();
  const denyMutation = useDenyFollowRequest();
  const [processingIds, setProcessingIds] = useState<{ [key: number]: 'accept' | 'deny' }>({});

  const handleAccept = (userId: number) => {
    setProcessingIds(prev => ({ ...prev, [userId]: 'accept' }));
    acceptMutation.mutate(userId, {
      onSettled: () => {
        setProcessingIds(prev => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      },
    });
  };

  const handleDeny = (userId: number) => {
    setProcessingIds(prev => ({ ...prev, [userId]: 'deny' }));
    denyMutation.mutate(userId, {
      onSettled: () => {
        setProcessingIds(prev => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      },
    });
  };

  if (isLoading || requests.length === 0) {
    return null;
  }

  return (
    <View>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          backgroundColor: `${colors.primary}10`,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSubtle,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="person-add" size={16} color={colors.primary} />
          <Text
            style={{
              fontWeight: '700',
              color: colors.primary,
              fontSize: 13,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Connection Requests ({requests.length})
          </Text>
        </View>
      </View>

      {/* Request Cards */}
      {requests.map((request) => (
        <FollowRequestCard
          key={request.id}
          request={request}
          onAccept={() => handleAccept(request.follower.id)}
          onDeny={() => handleDeny(request.follower.id)}
          isAccepting={processingIds[request.follower.id] === 'accept'}
          isDenying={processingIds[request.follower.id] === 'deny'}
        />
      ))}
    </View>
  );
}

// ============================================================================
// MAIN SCREEN
// ============================================================================

export function NotificationsScreen({ onBackPress }: NotificationsScreenProps) {
  const { colors, spacing } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const { data: notifications = [], isLoading, refetch } = useNotifications();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteNotificationMutation = useDeleteNotification();

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate based on notification category and data
    const data = notification.data || {};

    switch (notification.category) {
      case 'event':
        if (data.eventId) {
          router.push(`/events/${data.eventId}`);
        }
        break;

      case 'invitation':
        // Could be event or community invitation
        if (data.eventId) {
          router.push(`/events/${data.eventId}`);
        } else if (data.communityId) {
          router.push(`/communities/${data.communityId}`);
        }
        break;

      case 'like':
      case 'comment':
      case 'reply':
        // Navigate to the post or microblog
        if (data.postId) {
          router.push(`/posts/${data.postId}`);
        } else if (data.microblogId) {
          router.push(`/microblogs/${data.microblogId}`);
        }
        break;

      case 'community':
        if (data.communityId) {
          router.push(`/communities/${data.communityId}`);
        } else if (data.communitySlug) {
          router.push(`/communities/${data.communitySlug}`);
        }
        break;

      case 'follow':
        if (data.userId) {
          router.push(`/profile/${data.userId}`);
        } else if (data.followerId) {
          router.push(`/profile/${data.followerId}`);
        }
        break;

      case 'message':
        if (data.senderId) {
          router.push(`/messages/${data.senderId}`);
        } else if (data.conversationId) {
          router.push(`/messages/${data.conversationId}`);
        }
        break;

      default:
        // For unknown categories, try to infer from data
        if (data.eventId) {
          router.push(`/events/${data.eventId}`);
        } else if (data.postId) {
          router.push(`/posts/${data.postId}`);
        } else if (data.communityId) {
          router.push(`/communities/${data.communityId}`);
        } else if (data.userId) {
          router.push(`/profile/${data.userId}`);
        }
        break;
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDeleteNotification = (notificationId: number) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  // Ensure notifications is an array
  const notificationsList = Array.isArray(notifications) ? notifications : [];
  const unreadCount = notificationsList.filter((n) => !n.isRead).length;

  // Group notifications by time
  const groupedNotifications = groupNotificationsByTime(notificationsList);

  const renderGroup = (group: TimeGroup, title: string) => {
    const items = groupedNotifications[group];
    if (items.length === 0) return null;

    return (
      <View key={group}>
        <GroupHeader title={title} count={items.length} />
        {items.map((notification) => (
          <View
            key={notification.id}
            style={{
              borderBottomWidth: 1,
              borderBottomColor: colors.borderSubtle,
            }}
          >
            <SwipeableNotificationCard
              notification={notification}
              onPress={() => handleNotificationPress(notification)}
              onDelete={() => handleDeleteNotification(notification.id)}
            />
          </View>
        ))}
      </View>
    );
  };

  const hasAnyNotifications = notificationsList.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.header }} edges={['top']}>
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

      {/* Swipe hint */}
      {hasAnyNotifications && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            paddingVertical: spacing.xs,
            backgroundColor: colors.surfaceMuted,
          }}
        >
          <Ionicons name="arrow-back" size={12} color={colors.textMuted} />
          <Text style={{ fontSize: 11, color: colors.textMuted }}>
            Swipe left to delete
          </Text>
        </View>
      )}

      {/* Notifications List */}
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.surface }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {isLoading && !notifications.length ? (
          <View style={{ alignItems: 'center', paddingVertical: spacing.xl * 2 }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              variant="bodySmall"
              color="textMuted"
              style={{ marginTop: spacing.md }}
            >
              Loading notifications...
            </Text>
          </View>
        ) : (
          <View>
            {/* Connection Requests Section - Always at top */}
            <FollowRequestsSection />

            {/* Regular Notifications */}
            {hasAnyNotifications ? (
              <>
                {renderGroup('today', 'Today')}
                {renderGroup('last7days', 'Last 7 Days')}
                {renderGroup('last30days', 'Last 30 Days')}
                {renderGroup('older', 'Older')}
              </>
            ) : (
              <View
                style={{
                  alignItems: 'center',
                  paddingVertical: spacing.xl * 3,
                  paddingHorizontal: spacing.lg,
                }}
              >
                <Ionicons name="notifications-off-outline" size={64} color={colors.textMuted} />
                <Text
                  variant="body"
                  style={{
                    fontWeight: '600',
                    marginTop: spacing.md,
                    textAlign: 'center',
                  }}
                >
                  No Notifications Yet
                </Text>
                <Text
                  variant="bodySmall"
                  color="textMuted"
                  style={{ marginTop: spacing.sm, textAlign: 'center' }}
                >
                  Notifications about events, invitations, and engagement will appear here.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
