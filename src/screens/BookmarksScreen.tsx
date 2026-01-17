import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Text } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/apiClient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';

interface Microblog {
  id: number;
  content: string;
  author?: {
    id: number;
    username: string;
    displayName: string;
    profileImageUrl?: string;
  };
  createdAt: string;
  likeCount: number;
  repostCount: number;
  replyCount: number;
  isLiked: boolean;
  isReposted: boolean;
  isBookmarked: boolean;
}

interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
  communityId?: number;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  createdAt: string;
}

export default function BookmarksScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'feed' | 'forum'>('feed');

  const colors = {
    background: isDark ? '#000000' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#0F1419',
    textSecondary: isDark ? '#8B98A5' : '#536471',
    border: isDark ? '#2F3336' : '#EFF3F4',
    primary: '#1D9BF0',
    tabActive: isDark ? '#FFFFFF' : '#0F1419',
    tabInactive: isDark ? '#71767B' : '#536471',
    cardBackground: isDark ? '#16181C' : '#FFFFFF',
  };

  const styles = getStyles(colors, isDark);

  // Fetch bookmarked microblogs
  const {
    data: bookmarkedMicroblogs = [],
    isLoading: isLoadingMicroblogs,
    refetch: refetchMicroblogs,
  } = useQuery<Microblog[]>({
    queryKey: ['/api/microblogs/bookmarks'],
    queryFn: async () => {
      const response = await apiClient.get('/api/microblogs/bookmarks');
      return response.data;
    },
    enabled: !!user && activeTab === 'feed',
  });

  // Fetch bookmarked posts
  const {
    data: bookmarkedPosts = [],
    isLoading: isLoadingPosts,
    refetch: refetchPosts,
  } = useQuery<Post[]>({
    queryKey: ['/api/posts/bookmarks'],
    queryFn: async () => {
      const response = await apiClient.get('/api/posts/bookmarks');
      return response.data;
    },
    enabled: !!user && activeTab === 'forum',
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'feed') {
      await refetchMicroblogs();
    } else {
      await refetchPosts();
    }
    setRefreshing(false);
  };

  const handleUnbookmarkMicroblog = async (microblogId: number) => {
    try {
      await apiClient.delete(`/api/microblogs/${microblogId}/bookmark`);
      queryClient.invalidateQueries({ queryKey: ['/api/microblogs/bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/microblogs'] });
    } catch (error) {
      console.error('Error unbookmarking microblog:', error);
    }
  };

  const handleUnbookmarkPost = async (postId: number) => {
    try {
      await apiClient.delete(`/api/posts/${postId}/bookmark`);
      queryClient.invalidateQueries({ queryKey: ['/api/posts/bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
    } catch (error) {
      console.error('Error unbookmarking post:', error);
    }
  };

  const renderMicroblogItem = (microblog: Microblog) => (
    <View key={microblog.id} style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.authorInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={colors.textSecondary} />
          </View>
          <View style={styles.authorText}>
            <Text style={styles.authorName}>
              {microblog.author?.displayName || microblog.author?.username || 'Unknown'}
            </Text>
            <Text style={styles.timestamp}>
              {new Date(microblog.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => handleUnbookmarkMicroblog(microblog.id)}
          style={styles.unbookmarkButton}
        >
          <Ionicons name="bookmark" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <Text style={styles.postContent}>{microblog.content}</Text>

      <View style={styles.postStats}>
        <View style={styles.statItem}>
          <Ionicons name="heart-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.statText}>{microblog.likeCount || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="repeat-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.statText}>{microblog.repostCount || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.statText}>{microblog.replyCount || 0}</Text>
        </View>
      </View>
    </View>
  );

  const renderPostItem = (post: Post) => (
    <View key={post.id} style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.forumBadge}>
          <Ionicons name="chatbubbles" size={14} color={colors.primary} />
          <Text style={styles.forumBadgeText}>Forum</Text>
        </View>
        <Pressable
          onPress={() => handleUnbookmarkPost(post.id)}
          style={styles.unbookmarkButton}
        >
          <Ionicons name="bookmark" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postContent} numberOfLines={3}>
        {post.content}
      </Text>

      <View style={styles.postStats}>
        <View style={styles.statItem}>
          <Ionicons name="arrow-up" size={16} color={colors.textSecondary} />
          <Text style={styles.statText}>{post.upvotes || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.statText}>{post.commentCount || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.timestamp}>
            {new Date(post.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="bookmark-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyStateTitle}>No bookmarks yet</Text>
      <Text style={styles.emptyStateText}>
        {activeTab === 'feed'
          ? 'Bookmark posts from your feed to save them for later'
          : 'Bookmark forum posts to save them for later'}
      </Text>
    </View>
  );

  const isLoading = activeTab === 'feed' ? isLoadingMicroblogs : isLoadingPosts;
  const data = activeTab === 'feed' ? bookmarkedMicroblogs : bookmarkedPosts;
  const isEmpty = !isLoading && data.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Bookmarks</Text>
          <Text style={styles.headerSubtitle}>
            {data.length} {data.length === 1 ? 'item' : 'items'} saved
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'feed' && styles.tabActive]}
          onPress={() => setActiveTab('feed')}
        >
          <Ionicons
            name="newspaper"
            size={20}
            color={activeTab === 'feed' ? colors.tabActive : colors.tabInactive}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'feed' ? styles.tabTextActive : styles.tabTextInactive,
            ]}
          >
            Feed
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tab, activeTab === 'forum' && styles.tabActive]}
          onPress={() => setActiveTab('forum')}
        >
          <Ionicons
            name="chatbubbles"
            size={20}
            color={activeTab === 'forum' ? colors.tabActive : colors.tabInactive}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'forum' ? styles.tabTextActive : styles.tabTextInactive,
            ]}
          >
            Forums
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : isEmpty ? (
          renderEmptyState()
        ) : activeTab === 'feed' ? (
          bookmarkedMicroblogs.map(renderMicroblogItem)
        ) : (
          bookmarkedPosts.map(renderPostItem)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(colors: any, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
      gap: 12,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
    },
    headerTextContainer: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    tabs: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      gap: 8,
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: 15,
      fontWeight: '600',
    },
    tabTextActive: {
      color: colors.tabActive,
    },
    tabTextInactive: {
      color: colors.tabInactive,
    },
    content: {
      flex: 1,
    },
    postCard: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
      backgroundColor: colors.surfaceBackground,
    },
    postHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    authorInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? '#2F3336' : '#EFF3F4',
      alignItems: 'center',
      justifyContent: 'center',
    },
    authorText: {
      gap: 2,
    },
    authorName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    timestamp: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    unbookmarkButton: {
      padding: 8,
    },
    forumBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: isDark ? '#1E3A5F' : '#EFF6FF',
      borderRadius: 12,
    },
    forumBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    postTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    postContent: {
      fontSize: 15,
      lineHeight: 20,
      color: colors.textPrimary,
      marginBottom: 12,
    },
    postStats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    loadingContainer: {
      padding: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyState: {
      padding: 48,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    emptyStateText: {
      fontSize: 15,
      textAlign: 'center',
      color: colors.textSecondary,
      lineHeight: 20,
    },
  });
}
