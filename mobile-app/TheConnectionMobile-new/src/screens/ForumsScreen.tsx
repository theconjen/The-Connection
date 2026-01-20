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

// Hook to fetch trending items (hashtags + keywords, updates every 15 minutes)
function useTrendingItems() {
  return useQuery<any[]>({
    queryKey: ['/api/posts/trending/combined'],
    queryFn: async () => {
      const response = await apiClient.get('/api/posts/trending/combined?limit=10');
      return response.data;
    },
    refetchInterval: 15 * 60 * 1000, // Refetch every 15 minutes
  });
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
  const [selectedTrending, setSelectedTrending] = useState<{ type: 'hashtag' | 'keyword', value: string, display: string } | null>(null);

  // Fetch trending items
  const { data: trendingItems, isLoading: trendingLoading } = useTrendingItems();

  // Fetch posts from API
  const filter = activeTab === 'popular' ? 'popular' : 'recent';
  const { data: posts = [], isLoading, refetch } = useQuery<Post[]>({
    queryKey: ['/api/posts', { filter, selectedTrending }],
    queryFn: async () => {
      if (selectedTrending) {
        // Fetch posts filtered by hashtag or keyword
        const endpoint = selectedTrending.type === 'hashtag'
          ? `/api/posts/hashtags/${selectedTrending.value}`
          : `/api/posts/keywords/${selectedTrending.value}`;
        const response = await apiClient.get(endpoint);
        return response.data;
      } else {
        const response = await apiClient.get(`/api/posts?filter=${filter}`);
        return response.data;
      }
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
      if (__DEV__) {
        console.error('Upvote error:', error);
      }
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
      if (__DEV__) {
        console.error('Downvote error:', error);
      }
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

      {/* Trending Section (Hashtags + Keywords) */}
      <View style={styles.trendingSection}>
        <View style={styles.trendingHeader}>
          <Ionicons name="trending-up" size={18} color={colors.accent} />
          <Text style={styles.trendingTitle}>Trending in Forums</Text>
          {selectedTrending && (
            <Pressable
              onPress={() => setSelectedTrending(null)}
              style={styles.clearFilterButton}
            >
              <Text style={styles.clearFilterText}>Clear</Text>
            </Pressable>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trendingTags}
        >
          {trendingLoading ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            trendingItems?.map((item) => {
              const isHashtag = item.type === 'hashtag';
              const displayText = isHashtag ? item.displayTag : item.displayKeyword;
              const tag = isHashtag ? item.tag : item.keyword;
              const isActive = selectedTrending?.value === tag && selectedTrending?.type === item.type;

              return (
                <Pressable
                  key={`${item.type}-${item.id}`}
                  style={[
                    styles.trendingBadge,
                    isActive && styles.trendingBadgeActive
                  ]}
                  onPress={() => setSelectedTrending({ type: item.type, value: tag, display: displayText })}
                >
                  <Text style={[
                    styles.trendingText,
                    isActive && styles.trendingTextActive
                  ]}>
                    {isHashtag ? '#' : ''}{displayText}
                  </Text>
                  <Text style={styles.trendingScore}>{item.trendingScore}</Text>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* Filter Indicator */}
      {selectedTrending && (
        <View style={styles.filterIndicator}>
          <Ionicons name="filter" size={16} color={colors.text} />
          <Text style={styles.filterText}>
            Showing {selectedTrending.type === 'hashtag' ? '#' : ''}{selectedTrending.display}
          </Text>
        </View>
      )}

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
  trendingSection: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  trendingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  clearFilterButton: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearFilterText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
  },
  trendingTags: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  trendingBadgeActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  trendingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  trendingTextActive: {
    color: '#FFFFFF',
  },
  trendingScore: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    marginLeft: 4,
  },
  filterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  filterText: {
    fontSize: 13,
    color: '#1E40AF',
    fontWeight: '600',
  },
});
