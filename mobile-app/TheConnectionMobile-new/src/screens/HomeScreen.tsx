/**
 * HOME SCREEN - The Connection Mobile App
 * ----------------------------------------
 * Read-only home feed showing:
 * - Recent posts from communities the user has joined
 * - Featured/recent Apologetics articles
 *
 * NO posting UI, NO filters, NO global content.
 * Users must join a community to see posts.
 */

import React from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import apiClient from '../lib/apiClient';
import { AppHeader } from './AppHeader';
import { PostCard } from './PostCard';
import { formatDistanceToNow } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

interface User {
  id: number;
  username: string;
  displayName?: string;
  profileImageUrl?: string;
  avatarUrl?: string;
}

interface CommunityPost {
  id: number;
  content: string;
  title?: string;
  authorId: number;
  communityId: number;
  createdAt: string;
  author?: User;
  community?: {
    id: number;
    name: string;
    slug: string;
  };
  likeCount?: number;
  commentCount?: number;
  isLiked?: boolean;
  imageUrls?: string[];
}

interface ApologeticsArticle {
  id: number;
  title: string;
  tldr?: string;
  domain: 'apologetics' | 'polemics';
  authorDisplayName: string;
  publishedAt: string;
  area?: { name: string };
}

interface HomeFeedItem {
  type: 'community_post' | 'apologetics_article' | 'section_header';
  data: CommunityPost | ApologeticsArticle | { title: string };
  id: string;
}

interface HomeScreenProps {
  onProfilePress?: () => void;
  onMessagesPress?: () => void;
  onMenuPress?: () => void;
  userName?: string;
  userAvatar?: string;
  unreadNotificationCount?: number;
  unreadMessageCount?: number;
}

// ============================================================================
// API HOOKS
// ============================================================================

function useHomeFeed() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['home-feed', user?.id],
    queryFn: async () => {
      // Fetch posts from joined communities
      const [communityPostsRes, apologeticsRes] = await Promise.all([
        apiClient.get('/api/feed/home').catch(() => ({ data: { posts: [] } })),
        apiClient.get('/api/library/posts?status=published&limit=5').catch(() => ({ data: { posts: { items: [] } } })),
      ]);

      const communityPosts: CommunityPost[] = communityPostsRes.data?.posts || [];
      const apologeticsArticles: ApologeticsArticle[] = apologeticsRes.data?.posts?.items || [];

      // Build combined feed
      const feedItems: HomeFeedItem[] = [];

      // Add community posts section
      if (communityPosts.length > 0) {
        feedItems.push({
          type: 'section_header',
          data: { title: 'From Your Communities' },
          id: 'header-communities',
        });

        communityPosts.forEach((post) => {
          feedItems.push({
            type: 'community_post',
            data: post,
            id: `post-${post.id}`,
          });
        });
      }

      // Add apologetics section
      if (apologeticsArticles.length > 0) {
        feedItems.push({
          type: 'section_header',
          data: { title: 'Featured Articles' },
          id: 'header-apologetics',
        });

        apologeticsArticles.forEach((article) => {
          feedItems.push({
            type: 'apologetics_article',
            data: article,
            id: `article-${article.id}`,
          });
        });
      }

      return feedItems;
    },
    enabled: !!user,
    staleTime: 30000,
  });
}

function useJoinedCommunities() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['joined-communities', user?.id],
    queryFn: async () => {
      const response = await apiClient.get('/api/communities?joined=true');
      return response.data.filter((c: any) => c.isMember);
    },
    enabled: !!user,
  });
}

// ============================================================================
// COMPONENTS
// ============================================================================

function SectionHeader({ title, colors }: { title: string; colors: any }) {
  return (
    <View style={[styles.sectionHeader, { borderBottomColor: colors.borderSubtle }]}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
    </View>
  );
}

function CommunityPostCard({
  post,
  colors,
  onPress,
  onCommunityPress,
}: {
  post: CommunityPost;
  colors: any;
  onPress: () => void;
  onCommunityPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
      onPress={onPress}
    >
      {/* Community badge */}
      {post.community && (
        <Pressable onPress={onCommunityPress} style={styles.communityBadge}>
          <Ionicons name="people" size={12} color={colors.primary} />
          <Text style={[styles.communityName, { color: colors.primary }]}>
            {post.community.name}
          </Text>
        </Pressable>
      )}

      {/* Author info */}
      <View style={styles.postHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.surfaceMuted }]}>
          <Text style={[styles.avatarText, { color: colors.textSecondary }]}>
            {(post.author?.displayName || post.author?.username || 'U')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.postMeta}>
          <Text style={[styles.authorName, { color: colors.textPrimary }]}>
            {post.author?.displayName || post.author?.username || 'Unknown'}
          </Text>
          <Text style={[styles.timestamp, { color: colors.textMuted }]}>
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </Text>
        </View>
      </View>

      {/* Title (if present) */}
      {post.title && (
        <Text style={[styles.postTitle, { color: colors.textPrimary }]} numberOfLines={2}>
          {post.title}
        </Text>
      )}

      {/* Content */}
      <Text style={[styles.postContent, { color: colors.textSecondary }]} numberOfLines={4}>
        {post.content}
      </Text>

      {/* Engagement */}
      <View style={styles.engagement}>
        <View style={styles.engagementItem}>
          <Ionicons name="heart-outline" size={16} color={colors.textMuted} />
          <Text style={[styles.engagementText, { color: colors.textMuted }]}>
            {post.likeCount || 0}
          </Text>
        </View>
        <View style={styles.engagementItem}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.textMuted} />
          <Text style={[styles.engagementText, { color: colors.textMuted }]}>
            {post.commentCount || 0}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function ApologeticsCard({
  article,
  colors,
  onPress,
}: {
  article: ApologeticsArticle;
  colors: any;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.articleCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
      onPress={onPress}
    >
      <View style={styles.articleHeader}>
        <View style={[styles.articleBadge, { backgroundColor: colors.primaryMuted || colors.surfaceMuted }]}>
          <Ionicons name="book" size={14} color={colors.primary} />
          <Text style={[styles.articleBadgeText, { color: colors.primary }]}>
            {article.domain === 'apologetics' ? 'Apologetics' : 'Polemics'}
          </Text>
        </View>
        {article.area && (
          <Text style={[styles.articleArea, { color: colors.textMuted }]}>
            {article.area.name}
          </Text>
        )}
      </View>

      <Text style={[styles.articleTitle, { color: colors.textPrimary }]} numberOfLines={2}>
        {article.title}
      </Text>

      {article.tldr && (
        <Text style={[styles.articleTldr, { color: colors.textSecondary }]} numberOfLines={2}>
          {article.tldr}
        </Text>
      )}

      <View style={styles.articleFooter}>
        <Text style={[styles.articleAuthor, { color: colors.textMuted }]}>
          {article.authorDisplayName}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

function EmptyState({ colors, onExplore }: { colors: any; onExplore: () => void }) {
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceMuted }]}>
        <Ionicons name="people-outline" size={48} color={colors.textMuted} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        Join a Community
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Your home feed shows posts from communities you've joined. Explore and join communities to see content here.
      </Text>
      <Pressable
        style={[styles.emptyButton, { backgroundColor: colors.primary }]}
        onPress={onExplore}
      >
        <Text style={styles.emptyButtonText}>Explore Communities</Text>
      </Pressable>
    </View>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function HomeScreen({
  onProfilePress,
  onMessagesPress,
  onMenuPress,
  userName,
  userAvatar,
  unreadNotificationCount = 0,
  unreadMessageCount = 0,
}: HomeScreenProps) {
  const router = useRouter();
  const { colors, colorScheme } = useTheme();
  const { user } = useAuth();

  const { data: feedItems = [], isLoading, refetch, isRefetching } = useHomeFeed();
  const { data: joinedCommunities = [] } = useJoinedCommunities();

  const hasJoinedCommunities = joinedCommunities.length > 0;
  const hasFeedItems = feedItems.length > 0;

  const renderItem = ({ item }: { item: HomeFeedItem }) => {
    switch (item.type) {
      case 'section_header':
        return <SectionHeader title={(item.data as { title: string }).title} colors={colors} />;

      case 'community_post':
        const post = item.data as CommunityPost;
        return (
          <CommunityPostCard
            post={post}
            colors={colors}
            onPress={() => router.push(`/communities/${post.community?.slug || post.communityId}` as any)}
            onCommunityPress={() => router.push(`/communities/${post.community?.slug || post.communityId}` as any)}
          />
        );

      case 'apologetics_article':
        const article = item.data as ApologeticsArticle;
        return (
          <ApologeticsCard
            article={article}
            colors={colors}
            onPress={() => router.push({ pathname: '/apologetics/[id]' as any, params: { id: article.id.toString() } })}
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      <AppHeader
        showCenteredLogo={true}
        userName={userName || user?.displayName || user?.username}
        userAvatar={userAvatar || user?.profileImageUrl || user?.avatarUrl}
        onProfilePress={onProfilePress}
        showMessages={true}
        onMessagesPress={onMessagesPress}
        showMenu={true}
        onMenuPress={onMenuPress}
        unreadNotificationCount={unreadNotificationCount}
        unreadMessageCount={unreadMessageCount}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !hasFeedItems ? (
        <EmptyState
          colors={colors}
          onExplore={() => router.push('/(tabs)/communities' as any)}
        />
      ) : (
        <FlatList
          data={feedItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },

  // Section Header
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Post Card
  postCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  communityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  communityName: {
    fontSize: 12,
    fontWeight: '600',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  postMeta: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 2,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    lineHeight: 22,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  engagement: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  engagementText: {
    fontSize: 13,
  },

  // Article Card
  articleCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  articleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  articleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  articleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  articleArea: {
    fontSize: 12,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  articleTldr: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  articleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  articleAuthor: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
