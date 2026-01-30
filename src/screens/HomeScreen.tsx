/**
 * HOME SCREEN - The Connection Mobile App
 * ----------------------------------------
 * Read-only home feed showing:
 * - Global Community: HORIZONTAL carousel of advice questions - infinite scroll
 * - Your Communities: VERTICAL posts from joined communities - infinite scroll
 * - Grow Your Faith: VERTICAL featured apologetics articles (limited to 3)
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
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import apiClient from '../lib/apiClient';
import { AppHeader } from './AppHeader';
import { PostCard } from './PostCard';
import { formatDistanceToNow } from 'date-fns';
import { shareAdvice, shareApologetics } from '../lib/shareUrls';

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

// Infinite scroll for Global Community (advice posts)
function useAdviceFeed() {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['advice-feed', user?.id],
    queryFn: async ({ pageParam }) => {
      const url = pageParam
        ? `/api/microblogs?topic=QUESTION&limit=10&cursor=${pageParam}`
        : '/api/microblogs?topic=QUESTION&limit=10';
      const response = await apiClient.get(url);

      // Handle different response formats
      const data = response.data;
      const items = data.microblogs || data.items || (Array.isArray(data) ? data : []);
      const nextCursor = data.nextCursor || null;

      return { items, nextCursor };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!user,
    staleTime: 30000,
  });
}

// Infinite scroll for Your Communities (community posts)
function useCommunityFeed() {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['community-feed', user?.id],
    queryFn: async ({ pageParam }) => {
      // Get joined communities first
      const communitiesRes = await apiClient.get('/api/communities?joined=true').catch(() => ({ data: [] }));
      const joinedCommunities = (communitiesRes.data || []).filter((c: any) => c.isMember);
      const joinedCommunityIds = joinedCommunities.map((c: any) => c.id);

      if (joinedCommunityIds.length === 0) {
        return { items: [], nextCursor: null, communities: [] };
      }

      // Fetch feed with cursor
      const url = pageParam
        ? `/api/feed?limit=20&cursor=${pageParam}`
        : '/api/feed?limit=20';
      const feedRes = await apiClient.get(url);
      const allPosts = feedRes.data?.items || [];
      const nextCursor = feedRes.data?.nextCursor || null;

      // Filter to only posts from joined communities
      const communityPosts = allPosts.filter((post: any) =>
        post.communityId && joinedCommunityIds.includes(post.communityId)
      );

      return { items: communityPosts, nextCursor, communities: joinedCommunities };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!user,
    staleTime: 30000,
  });
}

// Static fetch for Grow Your Faith articles (limited to 3)
function useArticles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['grow-faith-articles', user?.id],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/api/library/posts/trending?limit=3');
        return res.data?.posts?.items || [];
      } catch {
        try {
          const res = await apiClient.get('/api/library/posts?status=published&limit=3');
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

// Calculate hot score for advice posts
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

// Combined hook to build the feed items with infinite scroll support
function useHomeFeed() {
  const adviceQuery = useAdviceFeed();
  const communityQuery = useCommunityFeed();
  const articlesQuery = useArticles();

  const isLoading = adviceQuery.isLoading || communityQuery.isLoading || articlesQuery.isLoading;
  const isRefetching = adviceQuery.isRefetching || communityQuery.isRefetching || articlesQuery.isRefetching;
  const isFetchingNextPage = adviceQuery.isFetchingNextPage || communityQuery.isFetchingNextPage;
  const hasNextPage = adviceQuery.hasNextPage || communityQuery.hasNextPage;

  const refetch = useCallback(async () => {
    await Promise.all([
      adviceQuery.refetch(),
      communityQuery.refetch(),
      articlesQuery.refetch(),
    ]);
  }, [adviceQuery, communityQuery, articlesQuery]);

  const fetchNextPage = useCallback(() => {
    // First load more advice, then community posts
    if (adviceQuery.hasNextPage) {
      adviceQuery.fetchNextPage();
    } else if (communityQuery.hasNextPage) {
      communityQuery.fetchNextPage();
    }
  }, [adviceQuery, communityQuery]);

  // Flatten and sort advice posts
  const advicePosts = useMemo(() => {
    const allAdvice = adviceQuery.data?.pages.flatMap(page => page.items) || [];
    return [...allAdvice].sort((a, b) => calculateHotScore(b) - calculateHotScore(a));
  }, [adviceQuery.data]);

  // Flatten community posts
  const communityPosts = useMemo(() => {
    return communityQuery.data?.pages.flatMap(page => page.items) || [];
  }, [communityQuery.data]);

  // Articles (max 3)
  const articles = articlesQuery.data || [];

  // Build vertical feed items (Your Communities + Grow Your Faith)
  const verticalFeedItems = useMemo(() => {
    const items: HomeFeedItem[] = [];

    // Your Communities section (community posts with infinite scroll)
    if (communityPosts.length > 0) {
      items.push({
        type: 'section_header',
        data: { title: 'Your Communities' },
        id: 'header-communities',
      });

      communityPosts.forEach((post) => {
        items.push({
          type: 'community_post',
          data: post,
          id: `post-${post.id}`,
        });
      });
    }

    // Grow Your Faith section (limited to 3 articles, no infinite scroll)
    if (articles.length > 0) {
      items.push({
        type: 'section_header',
        data: { title: 'Grow Your Faith' },
        id: 'header-apologetics',
      });

      articles.slice(0, 3).forEach((article: ApologeticsArticle) => {
        items.push({
          type: 'apologetics_article',
          data: article,
          id: `article-${article.id}`,
        });
      });
    }

    return items;
  }, [communityPosts, articles]);

  return {
    advicePosts,       // For horizontal carousel
    verticalFeedItems, // For vertical list
    isLoading,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    refetch,
    fetchNextPage,
    fetchNextAdvicePage: adviceQuery.fetchNextPage,
    hasNextAdvicePage: adviceQuery.hasNextPage,
    isFetchingNextAdvicePage: adviceQuery.isFetchingNextPage,
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
  onMenuPress,
  isReported,
  onUndoReport,
}: {
  article: ApologeticsArticle;
  colors: any;
  onPress: () => void;
  onMenuPress?: (event: any) => void;
  isReported?: boolean;
  onUndoReport?: () => void;
}) {
  // Show reported placeholder
  if (isReported) {
    return (
      <View style={[styles.articleCard, styles.reportedCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.borderSubtle }]}>
        <View style={styles.reportedContent}>
          <Ionicons name="flag" size={24} color={colors.textMuted} />
          <Text style={[styles.reportedTitle, { color: colors.textSecondary }]}>
            Content Reported
          </Text>
          <Text style={[styles.reportedText, { color: colors.textMuted }]}>
            This will be reviewed by The Connection Team
          </Text>
          {onUndoReport && (
            <Pressable
              style={[styles.undoButton, { borderColor: colors.textMuted }]}
              onPress={onUndoReport}
            >
              <Text style={[styles.undoButtonText, { color: colors.textMuted }]}>Undo</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {article.area && (
            <Text style={[styles.articleArea, { color: colors.textMuted }]}>
              {article.area.name}
            </Text>
          )}
          {onMenuPress && (
            <Pressable onPress={onMenuPress} hitSlop={8}>
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
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
    advicePosts,
    verticalFeedItems,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    refetch,
    fetchNextPage,
    fetchNextAdvicePage,
    hasNextAdvicePage,
    isFetchingNextAdvicePage,
  } = useHomeFeed();
  const { data: joinedCommunities = [] } = useJoinedCommunities();
  const queryClient = useQueryClient();

  // Track local upvote/bookmark state for optimistic UI
  // bookmarkedPosts: posts bookmarked in this session
  // unbookmarkedPosts: posts unbookmarked in this session (to override API cache)
  const [upvotedPosts, setUpvotedPosts] = useState<Set<number>>(new Set());
  const [unupvotedPosts, setUnupvotedPosts] = useState<Set<number>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<number>>(new Set());
  const [unbookmarkedPosts, setUnbookmarkedPosts] = useState<Set<number>>(new Set());

  // Menu state for advice and apologetics
  const [adviceMenuPost, setAdviceMenuPost] = useState<AdvicePost | null>(null);
  const [adviceMenuPosition, setAdviceMenuPosition] = useState({ top: 0, right: 0 });
  const [articleMenuPost, setArticleMenuPost] = useState<ApologeticsArticle | null>(null);
  const [articleMenuPosition, setArticleMenuPosition] = useState({ top: 0, right: 0 });

  // Track reported content
  const [reportedAdvicePosts, setReportedAdvicePosts] = useState<Set<number>>(new Set());
  const [reportedArticles, setReportedArticles] = useState<Set<number>>(new Set());

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
      // Optimistic update - track both additions and removals
      if (isCurrentlyLiked) {
        setUpvotedPosts(prev => { const next = new Set(prev); next.delete(postId); return next; });
        setUnupvotedPosts(prev => { const next = new Set(prev); next.add(postId); return next; });
      } else {
        setUpvotedPosts(prev => { const next = new Set(prev); next.add(postId); return next; });
        setUnupvotedPosts(prev => { const next = new Set(prev); next.delete(postId); return next; });
      }
    },
    onError: (error, { postId, isCurrentlyLiked }) => {
      // Revert on error
      if (isCurrentlyLiked) {
        setUpvotedPosts(prev => { const next = new Set(prev); next.add(postId); return next; });
        setUnupvotedPosts(prev => { const next = new Set(prev); next.delete(postId); return next; });
      } else {
        setUpvotedPosts(prev => { const next = new Set(prev); next.delete(postId); return next; });
        setUnupvotedPosts(prev => { const next = new Set(prev); next.add(postId); return next; });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['advice-feed'] });
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
      // Optimistic update - track both additions and removals
      if (isCurrentlyBookmarked) {
        setBookmarkedPosts(prev => { const next = new Set(prev); next.delete(postId); return next; });
        setUnbookmarkedPosts(prev => { const next = new Set(prev); next.add(postId); return next; });
      } else {
        setBookmarkedPosts(prev => { const next = new Set(prev); next.add(postId); return next; });
        setUnbookmarkedPosts(prev => { const next = new Set(prev); next.delete(postId); return next; });
      }
    },
    onError: (error, { postId, isCurrentlyBookmarked }) => {
      // Revert on error
      if (isCurrentlyBookmarked) {
        setBookmarkedPosts(prev => { const next = new Set(prev); next.add(postId); return next; });
        setUnbookmarkedPosts(prev => { const next = new Set(prev); next.delete(postId); return next; });
      } else {
        setBookmarkedPosts(prev => { const next = new Set(prev); next.delete(postId); return next; });
        setUnbookmarkedPosts(prev => { const next = new Set(prev); next.add(postId); return next; });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['advice-feed'] });
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

  // Menu handlers for advice posts
  const showAdviceMenu = useCallback((post: AdvicePost, event: any) => {
    event.stopPropagation();
    const { pageY } = event.nativeEvent;
    setAdviceMenuPosition({ top: pageY + 5, right: 16 });
    setAdviceMenuPost(post);
  }, []);

  const handleShareAdvice = useCallback(async () => {
    if (!adviceMenuPost) return;
    setAdviceMenuPost(null);
    const preview = adviceMenuPost.content?.slice(0, 100) || '';
    await shareAdvice(adviceMenuPost.id, preview);
  }, [adviceMenuPost]);

  const handleReportAdvice = useCallback(() => {
    if (!adviceMenuPost) return;
    const postId = adviceMenuPost.id;
    setAdviceMenuPost(null);
    Alert.alert(
      'Report Content',
      'Are you sure you want to report this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', style: 'destructive', onPress: async () => {
          setReportedAdvicePosts(prev => new Set(prev).add(postId));
          try {
            await apiClient.post('/api/reports', {
              subjectType: 'microblog',
              subjectId: postId,
              reason: 'inappropriate_content',
            });
          } catch (error) {
            console.error('Error reporting content:', error);
          }
        }},
      ]
    );
  }, [adviceMenuPost]);

  const handleUndoReportAdvice = useCallback((postId: number) => {
    setReportedAdvicePosts(prev => {
      const next = new Set(prev);
      next.delete(postId);
      return next;
    });
  }, []);

  // Menu handlers for apologetics articles
  const showArticleMenu = useCallback((article: ApologeticsArticle, event: any) => {
    event.stopPropagation();
    const { pageY } = event.nativeEvent;
    setArticleMenuPosition({ top: pageY + 5, right: 16 });
    setArticleMenuPost(article);
  }, []);

  const handleShareArticle = useCallback(async () => {
    if (!articleMenuPost) return;
    setArticleMenuPost(null);
    await shareApologetics(articleMenuPost.id, articleMenuPost.title);
  }, [articleMenuPost]);

  const handleReportArticle = useCallback(() => {
    if (!articleMenuPost) return;
    const articleId = articleMenuPost.id;
    setArticleMenuPost(null);
    Alert.alert(
      'Report Content',
      'Are you sure you want to report this article?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', style: 'destructive', onPress: async () => {
          setReportedArticles(prev => new Set(prev).add(articleId));
          try {
            await apiClient.post('/api/reports', {
              subjectType: 'post',
              subjectId: articleId,
              reason: 'inappropriate_content',
            });
          } catch (error) {
            console.error('Error reporting content:', error);
          }
        }},
      ]
    );
  }, [articleMenuPost]);

  const handleUndoReportArticle = useCallback((articleId: number) => {
    setReportedArticles(prev => {
      const next = new Set(prev);
      next.delete(articleId);
      return next;
    });
  }, []);

  const hasJoinedCommunities = joinedCommunities.length > 0;
  const hasFeedItems = verticalFeedItems.length > 0 || advicePosts.length > 0;

  // Handle infinite scroll for vertical content
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle horizontal scroll end for advice posts
  const handleAdviceEndReached = useCallback(() => {
    if (hasNextAdvicePage && !isFetchingNextAdvicePage) {
      fetchNextAdvicePage();
    }
  }, [hasNextAdvicePage, isFetchingNextAdvicePage, fetchNextAdvicePage]);

  // Footer component for loading indicator
  const ListFooterComponent = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [isFetchingNextPage, colors.primary]);

  // Horizontal advice card for carousel
  const renderAdviceCard = useCallback(({ item }: { item: AdvicePost }) => {
    const isUpvoted = unupvotedPosts.has(item.id) ? false : (upvotedPosts.has(item.id) || item.isLiked);
    const isBookmarked = unbookmarkedPosts.has(item.id) ? false : (bookmarkedPosts.has(item.id) || item.isBookmarked);
    const isReported = reportedAdvicePosts.has(item.id);

    // Show reported placeholder
    if (isReported) {
      return (
        <View style={[styles.horizontalAdviceCard, styles.reportedCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.borderSubtle }]}>
          <View style={styles.reportedContent}>
            <Ionicons name="flag" size={20} color={colors.textMuted} />
            <Text style={[styles.reportedTitle, { color: colors.textSecondary }]}>
              Content Reported
            </Text>
            <Text style={[styles.reportedText, { color: colors.textMuted }]}>
              This will be reviewed by The Connection Team
            </Text>
            <Pressable
              style={[styles.undoButton, { borderColor: colors.textMuted }]}
              onPress={() => handleUndoReportAdvice(item.id)}
            >
              <Text style={[styles.undoButtonText, { color: colors.textMuted }]}>Undo</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return (
      <Pressable
        style={[styles.horizontalAdviceCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
        onPress={() => handleComment(item.id)}
      >
        <View style={styles.adviceHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[styles.adviceBadge, { backgroundColor: '#EC489915' }]}>
              <Ionicons name="help-circle" size={12} color="#EC4899" />
              <Text style={[styles.adviceBadgeText, { color: '#EC4899' }]}>
                Seeking Advice
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable onPress={() => handleBookmark(item.id, isBookmarked)} hitSlop={8}>
              <Ionicons
                name={isBookmarked ? "bookmark" : "bookmark-outline"}
                size={16}
                color={isBookmarked ? colors.primary : colors.textMuted}
              />
            </Pressable>
            <Pressable onPress={(e) => showAdviceMenu(item, e)} hitSlop={8}>
              <Ionicons
                name="ellipsis-horizontal"
                size={16}
                color={colors.textMuted}
              />
            </Pressable>
          </View>
        </View>

        {item.anonymousNickname && (
          <Text style={[styles.horizontalAdviceNickname, { color: colors.textSecondary }]}>
            from {item.anonymousNickname}
          </Text>
        )}

        <Text style={[styles.horizontalAdviceContent, { color: colors.textPrimary }]} numberOfLines={3}>
          {item.content}
        </Text>

        <View style={styles.horizontalAdviceFooter}>
          <View style={styles.adviceStats}>
            <Pressable style={styles.adviceStat} onPress={() => handleUpvote(item.id, isUpvoted)} hitSlop={8}>
              <Ionicons
                name={isUpvoted ? "arrow-up" : "arrow-up-outline"}
                size={16}
                color={isUpvoted ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.adviceStatText, { color: isUpvoted ? colors.primary : colors.textMuted }]}>
                {item.likeCount || 0}
              </Text>
            </Pressable>
            <View style={styles.adviceStat}>
              <Ionicons name="chatbubble-outline" size={16} color={colors.textMuted} />
              <Text style={[styles.adviceStatText, { color: colors.textMuted }]}>
                {item.commentCount || item.replyCount || 0}
              </Text>
            </View>
          </View>
          <Text style={[styles.horizontalAdviceTime, { color: colors.textMuted }]}>
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </Text>
        </View>
      </Pressable>
    );
  }, [colors, upvotedPosts, unupvotedPosts, bookmarkedPosts, unbookmarkedPosts, reportedAdvicePosts, handleUpvote, handleBookmark, handleComment, showAdviceMenu, handleUndoReportAdvice]);

  // Header component with horizontal Global Community carousel
  const ListHeaderComponent = useCallback(() => {
    if (advicePosts.length === 0) return null;

    return (
      <View style={styles.horizontalSection}>
        <View style={[styles.sectionHeaderRow, { borderBottomColor: colors.borderSubtle }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Global Community</Text>
          <Pressable
            onPress={() => router.push('/(tabs)/advice')}
            style={styles.seeAllButton}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </Pressable>
        </View>
        <FlatList
          data={advicePosts}
          keyExtractor={(item) => `advice-${item.id}`}
          renderItem={renderAdviceCard}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalListContent}
          onEndReached={handleAdviceEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextAdvicePage ? (
              <View style={styles.horizontalLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
        />
      </View>
    );
  }, [advicePosts, colors, renderAdviceCard, handleAdviceEndReached, isFetchingNextAdvicePage]);

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
            onMenuPress={(e) => showArticleMenu(article, e)}
            isReported={reportedArticles.has(article.id)}
            onUndoReport={() => handleUndoReportArticle(article.id)}
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
          data={verticalFeedItems}
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
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={ListFooterComponent}
        />
      )}

      {/* Advice Dropdown Menu */}
      <Modal
        visible={!!adviceMenuPost}
        transparent
        animationType="fade"
        onRequestClose={() => setAdviceMenuPost(null)}
      >
        <TouchableWithoutFeedback onPress={() => setAdviceMenuPost(null)}>
          <View style={styles.menuOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, top: adviceMenuPosition.top, right: adviceMenuPosition.right }]}>
                <Pressable style={styles.dropdownItem} onPress={handleShareAdvice}>
                  <Ionicons name="share-outline" size={18} color={colors.textPrimary} />
                  <Text style={[styles.dropdownItemText, { color: colors.textPrimary }]}>Share</Text>
                </Pressable>
                <View style={[styles.dropdownDivider, { backgroundColor: colors.borderSubtle }]} />
                <Pressable style={styles.dropdownItem} onPress={handleReportAdvice}>
                  <Ionicons name="flag-outline" size={18} color="#EF4444" />
                  <Text style={[styles.dropdownItemText, { color: '#EF4444' }]}>Report</Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Article Dropdown Menu */}
      <Modal
        visible={!!articleMenuPost}
        transparent
        animationType="fade"
        onRequestClose={() => setArticleMenuPost(null)}
      >
        <TouchableWithoutFeedback onPress={() => setArticleMenuPost(null)}>
          <View style={styles.menuOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, top: articleMenuPosition.top, right: articleMenuPosition.right }]}>
                <Pressable style={styles.dropdownItem} onPress={handleShareArticle}>
                  <Ionicons name="share-outline" size={18} color={colors.textPrimary} />
                  <Text style={[styles.dropdownItemText, { color: colors.textPrimary }]}>Share</Text>
                </Pressable>
                <View style={[styles.dropdownDivider, { backgroundColor: colors.borderSubtle }]} />
                <Pressable style={styles.dropdownItem} onPress={handleReportArticle}>
                  <Ionicons name="flag-outline" size={18} color="#EF4444" />
                  <Text style={[styles.dropdownItemText, { color: '#EF4444' }]}>Report</Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  // Horizontal Section (Global Community)
  horizontalSection: {
    marginBottom: 8,
  },
  horizontalListContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  horizontalAdviceCard: {
    width: 280,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  horizontalAdviceNickname: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  horizontalAdviceContent: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  horizontalAdviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  horizontalAdviceTime: {
    fontSize: 11,
  },
  horizontalLoader: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Dropdown Menu
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dropdownMenu: {
    position: 'absolute',
    minWidth: 150,
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
  dropdownDivider: {
    height: 1,
    marginHorizontal: 12,
  },

  // Reported Card
  reportedCard: {
    justifyContent: 'center',
  },
  reportedContent: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  reportedTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  reportedText: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  undoButton: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  undoButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
