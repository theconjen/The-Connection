/**
 * ForumsScreen - Native React Native screen
 * Main forums/feed screen with community cards and post feed
 * Now with real API integration and upvote functionality!
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  FlatList,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { Text, Screen,  } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { PostCard, Post } from './PostCard';
import { AppHeader } from './AppHeader';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient, queryClient } from '../lib/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

interface ForumsScreenProps {
  onProfilePress?: () => void;
  onPostPress?: (post: Post) => void;
  onSearchPress?: () => void;
  onNotificationsPress?: () => void;
  onSettingsPress?: () => void;
  onMessagesPress?: () => void;
  onCreatePostPress?: () => void;
  onAuthorPress?: (authorId: number) => void;
  userName?: string;
  userAvatar?: string;
}

export function ForumsScreen({
  onProfilePress,
  onPostPress,
  onSearchPress,
  onNotificationsPress,
  onSettingsPress,
  onMessagesPress,
  onCreatePostPress,
  onAuthorPress,
  userName = 'User',
  userAvatar,
}: ForumsScreenProps) {
  const { colors, spacing, radii } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'popular'>('home');

  // Fetch posts from API
  const filter = activeTab === 'popular' ? 'popular' : 'recent';
  const { data: posts = [], isLoading, refetch } = useQuery<Post[]>({
    queryKey: ['/api/posts', { filter }],
    queryFn: async () => {
      const response = await apiClient.get(`/api/posts?filter=${filter}`);
      return response.data;
    },
  });

  // Upvote mutation
  const upvoteMutation = useMutation({
    mutationFn: async (postId: number) => {
      const response = await apiClient.post(`/api/posts/${postId}/upvote`);
      return response.data;
    },
    onMutate: async (postId) => {
      // Optimistic update
      queryClient.setQueryData(['/api/posts', { filter }], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((post: Post) =>
          post.id === postId
            ? { ...post, votes: (post.votes || 0) + 1 }
            : post
        );
      });
    },
    onSuccess: () => {
      // Refresh posts after upvote
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to upvote post. Please try again.');
      console.error('Upvote error:', error);
      // Revert optimistic update
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
    },
  });

  const handleUpvote = (postId: number) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to upvote posts.');
      return;
    }
    upvoteMutation.mutate(postId);
  };

  // Downvote mutation
  const downvoteMutation = useMutation({
    mutationFn: async (postId: number) => {
      const response = await apiClient.post(`/api/posts/${postId}/downvote`);
      return response.data;
    },
    onMutate: async (postId) => {
      // Optimistic update
      queryClient.setQueryData(['/api/posts', { filter }], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((post: Post) =>
          post.id === postId
            ? { ...post, votes: (post.votes || 0) - 1 }
            : post
        );
      });
    },
    onSuccess: () => {
      // Refresh posts after downvote
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to downvote post. Please try again.');
      console.error('Downvote error:', error);
      // Revert optimistic update
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
    },
  });

  const handleDownvote = (postId: number) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to downvote posts.');
      return;
    }
    downvoteMutation.mutate(postId);
  };

  const renderHeader = () => (
    <>
      {/* App Header */}
      <AppHeader
        showCenteredLogo={true}
        userName={userName}
        userAvatar={userAvatar}
        onProfilePress={onProfilePress}
        showMessages={true}
        onMessagesPress={onMessagesPress}
        showMenu={true}
        onMenuPress={onSettingsPress}
      />

      {/* Search Bar */}
      <Pressable onPress={onSearchPress} style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#64748B" />
        <Text style={styles.searchPlaceholder}>Search forums...</Text>
      </Pressable>

      {/* Tabs */}
      <View
        style={{
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Pressable
            onPress={() => setActiveTab('home')}
            style={{
              flex: 1,
              paddingVertical: spacing.md,
              alignItems: 'center',
              position: 'relative',
            }}
          >
            <Text
              variant="bodySmall"
              style={{
                color: activeTab === 'home' ? colors.accent : colors.mutedForeground,
                fontWeight: activeTab === 'home' ? '600' : '400',
              }}
            >
              Home
            </Text>
            {activeTab === 'home' && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  backgroundColor: colors.accent,
                }}
              />
            )}
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('popular')}
            style={{
              flex: 1,
              paddingVertical: spacing.md,
              alignItems: 'center',
              position: 'relative',
            }}
          >
            <Text
              variant="bodySmall"
              style={{
                color: activeTab === 'popular' ? colors.accent : colors.mutedForeground,
                fontWeight: activeTab === 'popular' ? '600' : '400',
              }}
            >
              Popular
            </Text>
            {activeTab === 'popular' && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  backgroundColor: colors.accent,
                }}
              />
            )}
          </Pressable>
        </View>
      </View>

      {/* Spacer before posts */}
      <View style={{ height: spacing.sm }} />
    </>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <StatusBar
        barStyle={colors.background === '#F9FAFB' ? 'dark-content' : 'light-content'}
      />
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <View style={{ marginBottom: spacing.sm }}>
            <PostCard
              post={item}
              onPress={() => onPostPress?.(item)}
              onUpvote={() => handleUpvote(item.id)}
              onDownvote={() => handleDownvote(item.id)}
              onAuthorPress={onAuthorPress}
            />
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View
              style={{
                alignItems: 'center',
                paddingVertical: spacing.xl * 2,
                paddingHorizontal: spacing.lg,
              }}
            >
              <Text
                variant="body"
                style={{
                  fontWeight: '600',
                  marginTop: spacing.md,
                  textAlign: 'center',
                }}
              >
                No Posts Found
              </Text>
              <Text
                variant="bodySmall"
                color="mutedForeground"
                style={{ marginTop: spacing.sm, textAlign: 'center' }}
              >
                Check back later for new discussions.
              </Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
        }
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#EFF3F4',
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 20,
  },
  searchPlaceholder: {
    fontSize: 15,
    color: '#64748B',
  },
});
