/**
 * HOME SCREEN - The Connection Mobile App
 * ----------------------------------------
 * Read-only home feed showing:
 * - Community Advice questions (topic=QUESTION microblogs)
 * - Recent posts from communities the user has joined
 * - Featured/recent Apologetics articles
 *
 * NO posting UI, NO filters, NO global content.
 * Users must join a community to see posts.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  isVerifiedClergy?: boolean;
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

interface AdvicePost {
  id: number;
  content: string;
  author?: User;
  createdAt: string;
  likeCount?: number;
  commentCount?: number;
  replyCount?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  anonymousNickname?: string;
}

interface HomeFeedItem {
  type: 'community_post' | 'apologetics_article' | 'advice_post' | 'section_header';
  data: CommunityPost | ApologeticsArticle | AdvicePost | { title: string };
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

const ADVICE_PAGE_SIZE = 15;
const COMMUNITY_PAGE_SIZE = 15;

// Fetch advice posts with cursor-based pagination
function useAdviceFeed() {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['advice-feed', user?.id],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        topic: 'QUESTION',
        limit: String(ADVICE_PAGE_SIZE),
      });
      if (pageParam) {
        params.append('cursor', pageParam);
      }

      // Call the microblogs endpoint with topic=QUESTION for advice posts
      const res = await apiClient.get(`/api/microblogs?${params.toString()}`);
      return {
        posts: res.data?.microblogs || [],
        nextCursor: res.data?.nextCursor || null,
        hasMore: res.data?.hasMore || false,
      };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!user,
    staleTime: 30000,
  });
}

// Fetch community posts with cursor-based pagination
function useCommunityFeed() {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['community-home-feed', user?.id],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        limit: String(COMMUNITY_PAGE_SIZE),
      });
      if (pageParam) {
        params.append('cursor', pageParam);
      }

      const res = await apiClient.get(`/api/feed/home?${params.toString()}`);
      return {
        posts: res.data?.posts || [],
        nextCursor: res.data?.nextCursor || null,
        hasMore: res.data?.hasMore || false,
      };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!user,
    staleTime: 30000,
  });
}

// Fetch trending articles (non-paginated, just top 5)
function useTrendingArticles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['trending-articles'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/api/library/posts/trending?limit=5');
        return res.data?.posts?.items || [];
      } catch {
        try {
          const res = await apiClient.get('/api/library/posts?status=published&limit=5');
          return res.data?.posts?.items || [];
        } catch {
          return [];
        }
      }
    },
    enabled: !!user,
    staleTime: 60000,
  });
}

// Hybrid "hot" sorting for advice posts (combines recency + upvotes)
function calculateHotScore(post: AdvicePost): number {
  const upvotes = post.likeCount || 0;
  const replies = post.replyCount || post.commentCount || 0;
  const createdAt = new Date(post.createdAt).getTime();
  const now = Date.now();
  const ageInHours = (now - createdAt) / (1000 * 60 * 60);

  const engagementScore = (upvotes * 2) + (replies * 3);
  const recencyBoost = Math.max(0, 48 - ageInHours) / 48;
  const timeDecay = 1 / Math.pow(ageInHours + 2, 0.5);

  return (engagementScore + 1) * (0.5 + recencyBoost) * timeDecay;
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

// Build combined feed items from paginated data
// Layout: Global Community (advice) → Your Communities → Grow Your Faith (articles)
function useCombinedFeed() {
  const adviceQuery = useAdviceFeed();
  const communityQuery = useCommunityFeed();
  const articlesQuery = useTrendingArticles();

  const feedItems = useMemo(() => {
    const items: HomeFeedItem[] = [];

    // Get all advice posts from all pages
    const allAdvicePosts = adviceQuery.data?.pages.flatMap(p => p.posts) || [];
    const sortedAdvicePosts = [...allAdvicePosts].sort((a, b) =>
      calculateHotScore(b) - calculateHotScore(a)
    );

    // Get all community posts from all pages
    const allCommunityPosts = communityQuery.data?.pages.flatMap(p => p.posts) || [];

    // Get trending articles (limited to 3)
    const articles = (articlesQuery.data || []).slice(0, 3);

    // SECTION 1: Global Community (Advice posts)
    if (sortedAdvicePosts.length > 0) {
      items.push({
        type: 'section_header',
        data: { title: 'Global Community' },
        id: 'header-advice',
      });

      sortedAdvicePosts.forEach((post) => {
        items.push({
          type: 'advice_post',
          data: post,
          id: `advice-${post.id}`,
        });
      });
    }

    // SECTION 2: Your Communities (posts from joined communities)
    if (allCommunityPosts.length > 0) {
      items.push({
        type: 'section_header',
        data: { title: 'Your Communities' },
        id: 'header-communities',
      });

      allCommunityPosts.forEach((post) => {
        items.push({
          type: 'community_post',
          data: post,
          id: `post-${post.id}`,
        });
      });
    }

    // SECTION 3: Grow Your Faith (featured articles - compact, at bottom)
    if (articles.length > 0) {
      items.push({
        type: 'section_header',
        data: { title: 'Grow Your Faith' },
        id: 'header-articles',
      });

      articles.forEach((article: ApologeticsArticle) => {
        items.push({
          type: 'apologetics_article',
          data: article,
          id: `article-${article.id}`,
        });
      });
    }

    return items;
  }, [adviceQuery.data, communityQuery.data, articlesQuery.data]);

  const isLoading = adviceQuery.isLoading || communityQuery.isLoading;
  const isRefetching = adviceQuery.isRefetching || communityQuery.isRefetching;
  const isFetchingNextPage = adviceQuery.isFetchingNextPage || communityQuery.isFetchingNextPage;

  const hasMore = adviceQuery.hasNextPage || communityQuery.hasNextPage;

  const fetchNextPage = useCallback(() => {
    // Load more from whichever has more data
    if (adviceQuery.hasNextPage && !adviceQuery.isFetchingNextPage) {
      adviceQuery.fetchNextPage();
    }
    if (communityQuery.hasNextPage && !communityQuery.isFetchingNextPage) {
      communityQuery.fetchNextPage();
    }
  }, [adviceQuery, communityQuery]);

  const refetch = useCallback(() => {
    adviceQuery.refetch();
    communityQuery.refetch();
    articlesQuery.refetch();
  }, [adviceQuery, communityQuery, articlesQuery]);

  return {
    feedItems,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    hasMore,
    fetchNextPage,
    refetch,
  };
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

function AdvicePostCard({
  post,
  colors,
  onPress,
  onUpvote,
  onComment,
  onBookmark,
  isUpvoted = false,
  isBookmarked = false,
}: {
  post: AdvicePost;
  colors: any;
  onPress: () => void;
  onUpvote: () => void;
  onComment: () => void;
  onBookmark: () => void;
  isUpvoted?: boolean;
  isBookmarked?: boolean;
}) {
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <Pressable
      style={[styles.adviceCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
      onPress={onPress}
    >
      <View style={styles.adviceHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[styles.adviceBadge, { backgroundColor: '#EC489915' }]}>
            <Ionicons name="help-circle" size={14} color="#EC4899" />
            <Text style={[styles.adviceBadgeText, { color: '#EC4899' }]}>
              Seeking Advice
            </Text>
          </View>
          {post.anonymousNickname && (
            <Text style={[styles.adviceNickname, { color: colors.textSecondary }]}>
              from {post.anonymousNickname}
            </Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={[styles.adviceTime, { color: colors.textMuted }]}>
            {timeAgo}
          </Text>
          <Pressable onPress={onBookmark} hitSlop={8}>
            <Ionicons
              name={isBookmarked ? "bookmark" : "bookmark-outline"}
              size={18}
              color={isBookmarked ? colors.primary : colors.textMuted}
            />
          </Pressable>
        </View>
      </View>

      <Text style={[styles.adviceContent, { color: colors.textPrimary }]} numberOfLines={4}>
        {post.content}
      </Text>

      <View style={styles.adviceFooter}>
        <View style={styles.adviceStats}>
          <Pressable style={styles.adviceStat} onPress={onUpvote} hitSlop={8}>
            <Ionicons
              name={isUpvoted ? "arrow-up" : "arrow-up-outline"}
              size={18}
              color={isUpvoted ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.adviceStatText, { color: isUpvoted ? colors.primary : colors.textMuted }]}>
              {post.likeCount || 0}
            </Text>
          </Pressable>
          <Pressable style={styles.adviceStat} onPress={onComment} hitSlop={8}>
            <Ionicons name="chatbubble-outline" size={18} color={colors.textMuted} />
            <Text style={[styles.adviceStatText, { color: colors.textMuted }]}>
              {post.commentCount || post.replyCount || 0}
            </Text>
          </Pressable>
        </View>
        <Pressable onPress={onComment}>
          <Text style={[styles.adviceCta, { color: colors.primary }]}>
            Share your thoughts
          </Text>
        </Pressable>
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

  const {
    feedItems,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    hasMore,
    fetchNextPage,
    refetch,
  } = useCombinedFeed();
  const { data: joinedCommunities = [] } = useJoinedCommunities();
  const queryClient = useQueryClient();

  // Track local upvote/bookmark state for optimistic UI
  const [upvotedPosts, setUpvotedPosts] = useState<Set<number>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<number>>(new Set());

  // Upvote mutation
  const upvoteMutation = useMutation({
    mutationFn: async ({ postId, isCurrentlyLiked }: { postId: number; isCurrentlyLiked: boolean }) => {
      if (isCurrentlyLiked) {
        return apiClient.delete(`/api/microblogs/${postId}/like`);
      } else {
        return apiClient.post(`/api/microblogs/${postId}/like`);
      }
    },
    onMutate: async ({ postId, isCurrentlyLiked }) => {
      // Optimistic update
      setUpvotedPosts(prev => {
        const next = new Set(prev);
        if (isCurrentlyLiked) {
          next.delete(postId);
        } else {
          next.add(postId);
        }
        return next;
      });
    },
    onError: (error, { postId, isCurrentlyLiked }) => {
      // Revert on error
      setUpvotedPosts(prev => {
        const next = new Set(prev);
        if (isCurrentlyLiked) {
          next.add(postId);
        } else {
          next.delete(postId);
        }
        return next;
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['home-feed'] });
    },
  });

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async ({ postId, isCurrentlyBookmarked }: { postId: number; isCurrentlyBookmarked: boolean }) => {
      if (isCurrentlyBookmarked) {
        return apiClient.delete(`/api/microblogs/${postId}/bookmark`);
      } else {
        return apiClient.post(`/api/microblogs/${postId}/bookmark`);
      }
    },
    onMutate: async ({ postId, isCurrentlyBookmarked }) => {
      setBookmarkedPosts(prev => {
        const next = new Set(prev);
        if (isCurrentlyBookmarked) {
          next.delete(postId);
        } else {
          next.add(postId);
        }
        return next;
      });
    },
    onError: (error, { postId, isCurrentlyBookmarked }) => {
      setBookmarkedPosts(prev => {
        const next = new Set(prev);
        if (isCurrentlyBookmarked) {
          next.add(postId);
        } else {
          next.delete(postId);
        }
        return next;
      });
    },
  });

  const handleUpvote = useCallback((postId: number, isCurrentlyLiked: boolean) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to upvote posts.');
      return;
    }
    upvoteMutation.mutate({ postId, isCurrentlyLiked });
  }, [user, upvoteMutation]);

  const handleBookmark = useCallback((postId: number, isCurrentlyBookmarked: boolean) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to bookmark posts.');
      return;
    }
    bookmarkMutation.mutate({ postId, isCurrentlyBookmarked });
  }, [user, bookmarkMutation]);

  const handleComment = useCallback((postId: number) => {
    router.push({ pathname: '/advice/[id]' as any, params: { id: postId.toString() } });
  }, [router]);

  const hasJoinedCommunities = joinedCommunities.length > 0;
  const hasFeedItems = feedItems.length > 0;

  // Handle loading more when scrolling to bottom
  const handleEndReached = useCallback(() => {
    if (hasMore && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasMore, isFetchingNextPage, fetchNextPage]);

  // Footer component for loading indicator
  const ListFooter = useCallback(() => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Loading more...
          </Text>
        </View>
      );
    }
    if (!hasMore && feedItems.length > 0) {
      return (
        <View style={styles.footerEnd}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            You're all caught up!
          </Text>
        </View>
      );
    }
    return null;
  }, [isFetchingNextPage, hasMore, feedItems.length, colors]);

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

      case 'advice_post':
        const advice = item.data as AdvicePost;
        const isUpvoted = advice.isLiked || upvotedPosts.has(advice.id);
        const isBookmarked = advice.isBookmarked || bookmarkedPosts.has(advice.id);
        return (
          <AdvicePostCard
            post={advice}
            colors={colors}
            onPress={() => handleComment(advice.id)}
            onUpvote={() => handleUpvote(advice.id, isUpvoted)}
            onComment={() => handleComment(advice.id)}
            onBookmark={() => handleBookmark(advice.id, isBookmarked)}
            isUpvoted={isUpvoted}
            isBookmarked={isBookmarked}
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
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={ListFooter}
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

  // Advice Card
  adviceCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  adviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  adviceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  adviceNickname: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  adviceTime: {
    fontSize: 12,
  },
  adviceContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  adviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  adviceStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  adviceStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adviceStatText: {
    fontSize: 13,
  },
  adviceCta: {
    fontSize: 13,
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

  // Footer styles for infinite scroll
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  footerEnd: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
  },
});
