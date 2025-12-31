/**
 * Blocked Users Screen - The Connection App
 * 
 * View and manage blocked users
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/shared/ThemeProvider';
import { apiClient } from '../../src/lib/apiClient';

interface BlockedUser {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  blockedAt: string;
}

export default function BlockedUsersScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnblocking, setIsUnblocking] = useState<number | null>(null);

  // Load blocked users
  const loadBlockedUsers = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/user/blocked');
      setBlockedUsers(response.data || []);
    } catch (error) {
      console.error('Error loading blocked users:', error);
      Alert.alert('Error', 'Failed to load blocked users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBlockedUsers();
  }, [loadBlockedUsers]);

  // Unblock a user
  const handleUnblock = async (user: BlockedUser) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${user.displayName || user.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            setIsUnblocking(user.id);
            try {
              await apiClient.delete(`/api/user/blocked/${user.id}`);
              setBlockedUsers(prev => prev.filter(u => u.id !== user.id));
            } catch (error) {
              console.error('Error unblocking user:', error);
              Alert.alert('Error', 'Failed to unblock user');
            } finally {
              setIsUnblocking(null);
            }
          },
        },
      ]
    );
  };

  const styles = createStyles(colors);

  // Get avatar URL or fallback
  const getAvatarUrl = (user: BlockedUser) => {
    if (user.avatarUrl) return user.avatarUrl;
    const name = encodeURIComponent(user.displayName || user.username);
    return `https://ui-avatars.com/api/?name=${name}&background=0B132B&color=fff&size=80`;
  };

  // Render a blocked user row
  const renderBlockedUser = ({ item }: { item: BlockedUser }) => (
    <View style={styles.userRow}>
      <Image 
        source={{ uri: getAvatarUrl(item) }} 
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.displayName || item.username}</Text>
        <Text style={styles.userHandle}>@{item.username}</Text>
      </View>
      <TouchableOpacity
        style={styles.unblockButton}
        onPress={() => handleUnblock(item)}
        disabled={isUnblocking === item.id}
      >
        {isUnblocking === item.id ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={styles.unblockText}>Unblock</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // Empty state
  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="ban-outline" size={48} color={colors.textSecondary} />
      </View>
      <Text style={styles.emptyTitle}>No Blocked Users</Text>
      <Text style={styles.emptyText}>
        When you block someone, they won't be able to see your profile, posts, or message you.
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Blocked Users</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Blocked Users</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Info Banner */}
      {blockedUsers.length > 0 && (
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={styles.infoBannerText}>
            Blocked users cannot see your profile, posts, or send you messages
          </Text>
        </View>
      )}

      {/* User List */}
      <FlatList
        data={blockedUsers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBlockedUser}
        contentContainerStyle={blockedUsers.length === 0 ? styles.emptyContainer : styles.listContainer}
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      paddingTop: 60,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 4,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    placeholder: {
      width: 40,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    infoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      margin: 16,
      marginBottom: 0,
      backgroundColor: `${colors.primary}15`,
      borderRadius: 10,
      gap: 10,
    },
    infoBannerText: {
      flex: 1,
      fontSize: 13,
      color: colors.primary,
    },
    listContainer: {
      padding: 16,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.surfaceSecondary,
    },
    userInfo: {
      flex: 1,
      marginLeft: 12,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    userHandle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    unblockButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.primary,
      minWidth: 80,
      alignItems: 'center',
    },
    unblockText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    emptyState: {
      alignItems: 'center',
      padding: 32,
    },
    emptyIcon: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.surfaceSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
}
