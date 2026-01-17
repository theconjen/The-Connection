import React from 'react';
import { View, ScrollView, Pressable, ActivityIndicator, StyleSheet, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text,  } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { PageHeader } from './AppHeader';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { safetyAPI } from '../lib/apiClient';

interface BlockedUsersScreenProps {
  onBackPress?: () => void;
}

interface BlockedUser {
  blockedUser: {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  createdAt: string;
}

export function BlockedUsersScreen({ onBackPress }: BlockedUsersScreenProps) {
  const { colors, spacing } = useTheme();
  const queryClient = useQueryClient();

  const { data: blockedUsers = [], isLoading } = useQuery<BlockedUser[]>({
    queryKey: ['/api/blocked-users'],
    queryFn: () => safetyAPI.getBlockedUsers(),
  });

  const unblockMutation = useMutation({
    mutationFn: (userId: number) => safetyAPI.unblockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blocked-users'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to unblock user';
      Alert.alert('Error', message);
    },
  });

  const handleUnblock = (user: BlockedUser) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock @${user.blockedUser.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: () => unblockMutation.mutate(user.blockedUser.id),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.header }]} edges={['top']}>
      <PageHeader title="Blocked Users" onBackPress={onBackPress} />

      <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {isLoading ? (
        <View style={{ alignItems: 'center', paddingVertical: spacing.xl * 2 }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            variant="bodySmall"
            color="mutedForeground"
            style={{ marginTop: spacing.md }}
          >
            Loading blocked users...
          </Text>
        </View>
      ) : blockedUsers.length === 0 ? (
        <View
          style={{
            alignItems: 'center',
            paddingVertical: spacing.xl * 3,
            paddingHorizontal: spacing.lg,
          }}
        >
          <Ionicons name="ban-outline" size={64} color={colors.mutedForeground} />
          <Text
            variant="body"
            style={{
              fontWeight: '600',
              marginTop: spacing.md,
              textAlign: 'center',
            }}
          >
            No Blocked Users
          </Text>
          <Text
            variant="bodySmall"
            color="mutedForeground"
            style={{ marginTop: spacing.sm, textAlign: 'center' }}
          >
            You haven't blocked any users yet.
          </Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }}>
          {/* Info */}
          <View
            style={{
              backgroundColor: `${colors.primary}10`,
              padding: spacing.md,
              marginHorizontal: spacing.lg,
              marginVertical: spacing.md,
              borderRadius: spacing.md,
              borderLeftWidth: 3,
              borderLeftColor: colors.primary,
            }}
          >
            <Text variant="caption" color="mutedForeground">
              Blocked users can't see your posts or send you messages. You can unblock them
              anytime.
            </Text>
          </View>

          {/* Blocked Users List */}
          <View style={{ paddingHorizontal: spacing.lg }}>
            {blockedUsers.map((item) => (
              <View
                key={item.blockedUser.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                {/* Avatar */}
                {item.blockedUser.avatarUrl ? (
                  <Image
                    source={{ uri: item.blockedUser.avatarUrl }}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: colors.muted,
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
                    <Text
                      style={{
                        color: colors.primaryForeground,
                        fontSize: 18,
                        fontWeight: '700',
                      }}
                    >
                      {item.blockedUser.username.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}

                {/* User Info */}
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text variant="body" style={{ fontWeight: '600' }}>
                    {item.blockedUser.displayName || item.blockedUser.username}
                  </Text>
                  <Text variant="caption" color="mutedForeground">
                    @{item.blockedUser.username}
                  </Text>
                </View>

                {/* Unblock Button */}
                <Pressable
                  onPress={() => handleUnblock(item)}
                  disabled={unblockMutation.isPending}
                  style={({ pressed }) => ({
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: spacing.md,
                    backgroundColor: colors.destructive,
                    opacity: pressed || unblockMutation.isPending ? 0.7 : 1,
                  })}
                >
                  <Text
                    variant="caption"
                    style={{ color: '#FFFFFF', fontWeight: '600' }}
                  >
                    Unblock
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
});
