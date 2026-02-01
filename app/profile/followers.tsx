/**
 * Connections List Screen
 * Shows a list of connections or connecting based on the 'tab' query param
 */

import React, { useState } from 'react';
import {
  View,
  FlatList,
  Pressable,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text } from '../../src/theme';
import { useTheme } from '../../src/contexts/ThemeContext';
import { AppHeader } from '../../src/screens/AppHeader';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../src/lib/apiClient';

interface User {
  id: number;
  username: string;
  displayName?: string;
  profileImageUrl?: string;
  bio?: string;
}

export default function FollowersScreen() {
  const { colors, colorScheme } = useTheme();
  const router = useRouter();
  const { userId, tab: initialTab } = useLocalSearchParams<{ userId: string; tab: 'followers' | 'following' }>();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab || 'followers');

  const targetUserId = userId ? parseInt(userId, 10) : 0;

  // Fetch followers
  const { data: followers, isLoading: loadingFollowers } = useQuery({
    queryKey: ['followers', targetUserId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/users/${targetUserId}/followers`);
      return response.data as User[];
    },
    enabled: !!targetUserId,
  });

  // Fetch following
  const { data: following, isLoading: loadingFollowing } = useQuery({
    queryKey: ['following', targetUserId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/users/${targetUserId}/following`);
      return response.data as User[];
    },
    enabled: !!targetUserId,
  });

  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleUserPress = (user: User) => {
    router.push(`/profile/${user.id}`);
  };

  const renderUser = ({ item }: { item: User }) => (
    <Pressable
      style={[styles.userItem, { borderBottomColor: colors.borderSubtle }]}
      onPress={() => handleUserPress(item)}
    >
      {item.profileImageUrl ? (
        <Image source={{ uri: item.profileImageUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
            {getInitials(item.displayName || item.username)}
          </Text>
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={[styles.displayName, { color: colors.textPrimary }]}>
          {item.displayName || item.username}
        </Text>
        <Text style={[styles.username, { color: colors.textSecondary }]}>
          @{item.username}
        </Text>
        {item.bio && (
          <Text style={[styles.bio, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.bio}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </Pressable>
  );

  const currentData = activeTab === 'followers' ? followers : following;
  const isLoading = activeTab === 'followers' ? loadingFollowers : loadingFollowing;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.header }}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      <AppHeader
        showCenteredLogo={true}
        showBackInCenteredMode={true}
        onBackPress={() => router.back()}
      />

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle }]}>
        <Pressable
          style={[
            styles.tab,
            activeTab === 'followers' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('followers')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'followers' ? colors.primary : colors.textSecondary },
            ]}
          >
            Connections
          </Text>
          <Text
            style={[
              styles.tabCount,
              { color: activeTab === 'followers' ? colors.primary : colors.textMuted },
            ]}
          >
            {followers?.length || 0}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tab,
            activeTab === 'following' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('following')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'following' ? colors.primary : colors.textSecondary },
            ]}
          >
            Connected
          </Text>
          <Text
            style={[
              styles.tabCount,
              { color: activeTab === 'following' ? colors.primary : colors.textMuted },
            ]}
          >
            {following?.length || 0}
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <View style={{ flex: 1, backgroundColor: colors.surface }}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : currentData && currentData.length > 0 ? (
          <FlatList
            data={currentData}
            renderItem={renderUser}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons
              name={activeTab === 'followers' ? 'people-outline' : 'person-add-outline'}
              size={48}
              color={colors.textMuted}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {activeTab === 'followers' ? 'No connections yet' : 'Not connected to anyone yet'}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tabCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
  },
  username: {
    fontSize: 14,
    marginTop: 2,
  },
  bio: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
});
