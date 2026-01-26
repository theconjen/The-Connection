/**
 * FEED SCREEN - The Connection Mobile App
 * ----------------------------------------
 * Native React Native feed with real API integration
 * Microblogs (Twitter-like posts) - always public, never anonymous
 * Features: like, comment, create, delete functionality
 *
 * API Endpoints:
 * - GET /api/microblogs (fetch all microblogs)
 * - POST /api/microblogs (create with 'content' field)
 * - POST /api/microblogs/:id/like (like microblog)
 * - DELETE /api/microblogs/:id/like (unlike microblog)
 * - DELETE /api/microblogs/:id (delete microblog)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  Share,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import apiClient, { exploreFeedAPI, MicroblogTopic, MicroblogType } from '../lib/apiClient';
import { AppHeader } from './AppHeader';
import { formatDistanceToNow } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import { PostCard } from './PostCard';
import { TopicChips } from '../components/TopicChips';
import { PollCard } from '../components/PollCard';
import { ImageCarousel } from '../components/ImageCarousel';

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

interface Poll {
  id: number;
  question: string;
  options: {
    id: number;
    text: string;
    voteCount: number;
    percentage: number;
    isVotedByUser: boolean;
  }[];
  totalVotes: number;
  hasVoted: boolean;
  isExpired: boolean;
  endsAt?: string;
  allowMultiple: boolean;
}

interface Microblog {
  id: number;
  content: string;
  authorId: number;
  createdAt: string;
  author?: User;
  likeCount?: number;
  commentCount?: number;
  repostCount?: number;
  isLiked?: boolean;
  isReposted?: boolean;
  isBookmarked?: boolean;
  topic?: MicroblogTopic;
  postType?: MicroblogType;
  poll?: Poll;
  sourceUrl?: string;
  // Media fields
  imageUrls?: string[];
  videoUrl?: string;
  gifUrl?: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
  createdAt: string;
  author?: User;
  upvoteCount?: number;
  commentCount?: number;
  isAnonymous?: boolean;
  hasUpvoted?: boolean;
  communityId?: number;
  // Media fields
  imageUrls?: string[];
  videoUrl?: string;
  gifUrl?: string;
}

interface FeedScreenProps {
  onProfilePress?: () => void;
  onSearchPress?: () => void;
  onSettingsPress?: () => void;
  onMessagesPress?: () => void;
  onNotificationsPress?: () => void;
  onAuthorPress?: (userId: number) => void;
  onPostPress?: (post: Post) => void;
  userName?: string;
  userAvatar?: string;
  unreadNotificationsCount?: number;
  unreadMessageCount?: number;
}

// ============================================================================
// API HOOKS
// ============================================================================

// Hook to fetch trending hashtags (updates every 15 minutes)
function useTrendingHashtags() {
  return useQuery<any[]>({
    queryKey: ['/api/microblogs/hashtags/trending'],
    queryFn: async () => {
      const response = await apiClient.get('/api/microblogs/hashtags/trending?limit=10');
      return response.data.map((hashtag: any) => ({
        ...hashtag,
        type: 'hashtag' as const,
      }));
    },
    refetchInterval: 15 * 60 * 1000, // Refetch every 15 minutes
  });
}

function useMicroblogs(filter: 'latest' | 'popular', trendingFilter?: { type: 'hashtag' | 'keyword', value: string } | null) {
  const { user } = useAuth();
  // Map 'latest' to 'recent' for the microblogs API
  const apiFilter = filter === 'latest' ? 'recent' : filter;

  return useQuery<Microblog[]>({
    queryKey: ['/api/microblogs', filter, trendingFilter],
    queryFn: async () => {
      try {
        let response;

        if (trendingFilter) {
          // Fetch microblogs filtered by hashtag or keyword
          if (trendingFilter.type === 'hashtag') {
            response = await apiClient.get(`/api/microblogs/hashtags/${trendingFilter.value}`);
          } else {
            response = await apiClient.get(`/api/microblogs/keywords/${trendingFilter.value}`);
          }
        } else {
          // Fetch all microblogs with sort filter
          response = await apiClient.get(`/api/microblogs?filter=${apiFilter}`);
        }

        const microblogs = response.data;

        // Microblogs already include author data from the API
        const microblogsWithAuthors = microblogs.map((microblog: any) => ({
          ...microblog,
          content: microblog.content,
          likeCount: microblog.likeCount || 0,
          commentCount: microblog.replyCount || 0,
          author: microblog.author || {
            id: microblog.authorId,
            username: 'Unknown',
            displayName: 'Unknown User',
          },
        }));

        // If trending filter is active, already sorted by engagement from API
        // Otherwise, sorted by filter (recent or popular) from API
        return microblogsWithAuthors;
      } catch (error) {
        console.error('Error fetching microblogs:', error);
        throw error;
      }
    },
    enabled: !!user, // Enable when user is authenticated
  });
}

function usePosts(filter: 'latest' | 'popular') {
  const { user } = useAuth();
  // Map 'latest' to 'recent' for the posts API (which uses different naming)
  const apiFilter = filter === 'latest' ? 'recent' : filter;

  return useQuery<Post[]>({
    queryKey: ['/api/posts', filter],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/api/posts?filter=${apiFilter}`);
        const posts = response.data;

        // Debug logging
        const bookmarkedPosts = posts.filter((p: any) => p.isBookmarked);
        if (bookmarkedPosts.length > 0) {
          console.info('[DEBUG] Posts with bookmarks:', bookmarkedPosts.map((p: any) => ({ id: p.id, isBookmarked: p.isBookmarked })));
        }

        return posts.map((post: any) => ({
          ...post,
          author: post.author || {
            id: post.authorId,
            username: post.isAnonymous ? 'Anonymous' : 'Unknown',
            displayName: post.isAnonymous ? 'Anonymous User' : 'Unknown User',
          },
        }));
      } catch (error) {
        console.error('Error fetching posts:', error);
        return []; // Return empty array on error instead of throwing
      }
    },
    enabled: !!user,
  });
}

// Combined feed hook that merges microblogs and posts
function useCombinedFeed(filter: 'latest' | 'popular', trendingFilter?: { type: 'hashtag' | 'keyword', value: string } | null) {
  const { data: microblogs = [], isLoading: microblogsLoading, refetch: refetchMicroblogs } = useMicroblogs(filter, trendingFilter);
  const { data: posts = [], isLoading: postsLoading, refetch: refetchPosts } = usePosts(filter);

  // Merge and sort by timestamp
  const combinedData = React.useMemo(() => {
    const allItems = [
      ...microblogs.map(m => ({ ...m, type: 'microblog' as const })),
      ...posts.map(p => ({ ...p, type: 'post' as const })),
    ];

    // Sort by timestamp (most recent first)
    return allItems.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  }, [microblogs, posts]);

  const refetch = React.useCallback(async () => {
    await Promise.all([refetchMicroblogs(), refetchPosts()]);
  }, [refetchMicroblogs, refetchPosts]);

  return {
    data: combinedData,
    isLoading: microblogsLoading || postsLoading,
    refetch,
  };
}

// Explore Feed hook with topic/type filtering
function useExploreFeed(
  tab: 'latest' | 'popular',
  topic: MicroblogTopic | 'ALL' | 'POLL' | null,
  trendingFilter?: { type: 'hashtag' | 'keyword', value: string } | null
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['/api/feed/explore', tab, topic, trendingFilter],
    queryFn: async () => {
      try {
        // If there's a trending filter, use the old endpoint
        if (trendingFilter) {
          let response;
          if (trendingFilter.type === 'hashtag') {
            response = await apiClient.get(`/api/microblogs/hashtags/${trendingFilter.value}`);
          } else {
            response = await apiClient.get(`/api/microblogs/keywords/${trendingFilter.value}`);
          }
          return {
            microblogs: response.data.map((m: any) => ({
              ...m,
              commentCount: m.replyCount || 0,
              author: m.author || { id: m.authorId, username: 'Unknown', displayName: 'Unknown User' },
            })),
            hasMore: false,
            nextCursor: null,
          };
        }

        // Use the explore feed API with filtering
        const options: {
          tab: 'latest' | 'popular';
          topic?: MicroblogTopic;
          type?: MicroblogType;
        } = { tab };

        // Handle topic filter
        if (topic && topic !== 'ALL' && topic !== 'POLL') {
          options.topic = topic as MicroblogTopic;
        }

        // Handle poll filter
        if (topic === 'POLL') {
          options.type = 'POLL';
        }

        const data = await exploreFeedAPI.getFeed(options);

        return {
          microblogs: (data.microblogs || []).map((m: any) => ({
            ...m,
            commentCount: m.replyCount || 0,
            author: m.author || { id: m.authorId, username: 'Unknown', displayName: 'Unknown User' },
          })),
          hasMore: data.hasMore || false,
          nextCursor: data.nextCursor || null,
        };
      } catch (error) {
        // Fallback to basic microblogs endpoint with client-side filtering
        const response = await apiClient.get(`/api/microblogs?filter=${tab}`);
        let microblogs = response.data.map((m: any) => ({
          ...m,
          commentCount: m.replyCount || 0,
          author: m.author || { id: m.authorId, username: 'Unknown', displayName: 'Unknown User' },
        }));

        // Apply client-side topic filtering (fallback until backend is deployed)
        if (topic && topic !== 'ALL') {
          if (topic === 'POLL') {
            microblogs = microblogs.filter((m: any) => m.postType === 'POLL');
          } else {
            microblogs = microblogs.filter((m: any) => m.topic === topic);
          }
        }

        return {
          microblogs,
          hasMore: false,
          nextCursor: null,
        };
      }
    },
    enabled: !!user,
  });
}

function useLikeMicroblog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, isLiked, type = 'microblog' }: { postId: number; isLiked: boolean; type?: 'microblog' | 'post' }) => {
      try {
        const endpoint = type === 'post' ? `/api/posts/${postId}/like` : `/api/microblogs/${postId}/like`;
        // Toggle like/unlike
        if (isLiked) {
          await apiClient.delete(endpoint);
        } else {
          await apiClient.post(endpoint);
        }
      } catch (error: any) {
        // If we get 404 on delete, the like didn't exist - treat as success
        if (error.response?.status === 404 && isLiked) {
          return;
        }
        // If we get 400 "already liked" on post, treat as success
        if (error.response?.status === 400 && !isLiked) {
          return;
        }
        throw error;
      }
    },
    onMutate: async ({ postId, isLiked, type }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['/api/microblogs'] });
      await queryClient.cancelQueries({ queryKey: ['/api/posts'] });

      // Snapshot previous values
      const previousMicroblogs = queryClient.getQueryData(['/api/microblogs']);
      const previousPosts = queryClient.getQueryData(['/api/posts']);

      // Optimistic update - only update the relevant type
      if (type === 'microblog') {
        queryClient.setQueriesData({ queryKey: ['/api/microblogs'] }, (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((post: Microblog) =>
            post.id === postId
              ? {
                  ...post,
                  isLiked: !isLiked,
                  likeCount: isLiked ? (post.likeCount || 0) - 1 : (post.likeCount || 0) + 1,
                }
              : post
          );
        });
      } else {
        queryClient.setQueriesData({ queryKey: ['/api/posts'] }, (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((post: any) =>
            post.id === postId
              ? {
                  ...post,
                  isLiked: !isLiked,
                  likeCount: isLiked ? (post.likeCount || 0) - 1 : (post.likeCount || 0) + 1,
                }
              : post
          );
        });
      }

      return { previousMicroblogs, previousPosts };
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousMicroblogs) {
        queryClient.setQueryData(['/api/microblogs'], context.previousMicroblogs);
      }
      if (context?.previousPosts) {
        queryClient.setQueryData(['/api/posts'], context.previousPosts);
      }
    },
    onSettled: () => {
      // Always refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['/api/microblogs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
    },
  });
}

function useCreateMicroblog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      content: string;
      topic?: MicroblogTopic;
      postType?: MicroblogType;
      sourceUrl?: string;
      poll?: {
        question: string;
        options: string[];
        allowMultiple?: boolean;
      };
    }) => {
      // Create microblog (feed post - always public, never anonymous)
      const response = await apiClient.post('/api/microblogs', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate microblogs queries to refetch
      queryClient.invalidateQueries({ queryKey: ['/api/microblogs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/feed/explore'] });
    },
  });
}

function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: number) => {
      await apiClient.delete(`/api/microblogs/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/microblogs'] });
    },
  });
}

function useReportPost() {
  return useMutation({
    mutationFn: async ({ postId, reason }: { postId: number; reason: string }) => {
      const response = await apiClient.post('/api/reports', {
        subjectType: 'microblog',
        subjectId: postId,
        reason,
      });
      return response.data;
    },
    onSuccess: () => {
      Alert.alert('Report Submitted', 'Thank you for helping keep The Connection safe.');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to submit report');
    },
  });
}

function useComments(postId: number | null) {
  return useQuery<Comment[]>({
    queryKey: ['/api/microblogs', postId, 'comments'],
    queryFn: async () => {
      if (!postId) return [];
      const response = await apiClient.get(`/api/microblogs/${postId}/comments`);
      return response.data;
    },
    enabled: !!postId,
  });
}

function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: number; content: string }) => {
      const response = await apiClient.post(`/api/microblogs/${postId}/comments`, { content });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/microblogs', variables.postId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/microblogs'] });
    },
  });
}

function useRepostMicroblog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, isReposted }: { postId: number; isReposted: boolean }) => {
      try {
        if (isReposted) {
          // Already reposted, so undo the repost
          await apiClient.delete(`/api/microblogs/${postId}/repost`);
        } else {
          // Not reposted, so repost it
          const response = await apiClient.post(`/api/microblogs/${postId}/repost`);
          return response.data;
        }
      } catch (error: any) {
        // If we get 404 on delete, the repost didn't exist - treat as success
        if (error.response?.status === 404 && isReposted) {
          return;
        }
        // If we get 400 "already reposted" on post, treat as success
        if (error.response?.status === 400 && !isReposted) {
          return;
        }
        throw error;
      }
    },
    onMutate: async ({ postId, isReposted }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['/api/microblogs'] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(['/api/microblogs']);

      // Optimistic update
      queryClient.setQueriesData({ queryKey: ['/api/microblogs'] }, (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((post: Microblog) =>
          post.id === postId
            ? {
                ...post,
                isReposted: !isReposted,
                repostCount: isReposted ? (post.repostCount || 0) - 1 : (post.repostCount || 0) + 1,
              }
            : post
        );
      });

      return { previousData };
    },
    onError: (error: any, variables, context) => {
      // Revert optimistic update on error
      if (context?.previousData) {
        queryClient.setQueryData(['/api/microblogs'], context.previousData);
      }
      Alert.alert('Error', 'Failed to update repost. Please try again.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/microblogs'] });
    },
  });
}

function useBookmarkMicroblog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, isBookmarked, type = 'microblog' }: { postId: number; isBookmarked: boolean; type?: 'microblog' | 'post' }) => {
      try {
        const endpoint = type === 'post' ? `/api/posts/${postId}/bookmark` : `/api/microblogs/${postId}/bookmark`;
        console.info(`[BOOKMARK] ${type} ${postId}: ${isBookmarked ? 'unbookmark' : 'bookmark'} via ${endpoint}`);
        if (isBookmarked) {
          // Currently bookmarked, so unbookmark
          await apiClient.delete(endpoint);
          console.info(`[BOOKMARK] Successfully unbookmarked ${type} ${postId}`);
        } else {
          // Not bookmarked, so bookmark
          const response = await apiClient.post(endpoint);
          console.info(`[BOOKMARK] Successfully bookmarked ${type} ${postId}`, response.data);
        }
      } catch (error: any) {
        console.info(`[BOOKMARK] Error for ${type} ${postId}:`, error.response?.status, error.response?.data);
        // If we get 404 on delete, the bookmark didn't exist - treat as success
        if (error.response?.status === 404 && isBookmarked) {
          return;
        }
        // If we get 400 "already bookmarked" on post, treat as success
        if (error.response?.status === 400 && !isBookmarked) {
          return;
        }
        throw error;
      }
    },
    onMutate: async ({ postId, isBookmarked, type }) => {
      // Cancel outgoing queries to avoid race conditions
      await queryClient.cancelQueries({ queryKey: ['/api/microblogs'] });
      await queryClient.cancelQueries({ queryKey: ['/api/posts'] });

      // Snapshot previous values
      const previousMicroblogs = queryClient.getQueryData(['/api/microblogs']);
      const previousPosts = queryClient.getQueryData(['/api/posts']);

      // Optimistic update - only update the relevant type
      if (type === 'microblog') {
        queryClient.setQueriesData({ queryKey: ['/api/microblogs'] }, (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((post: Microblog) =>
            post.id === postId
              ? { ...post, isBookmarked: !isBookmarked }
              : post
          );
        });
      } else {
        queryClient.setQueriesData({ queryKey: ['/api/posts'] }, (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((post: any) =>
            post.id === postId
              ? { ...post, isBookmarked: !isBookmarked }
              : post
          );
        });
      }

      return { previousMicroblogs, previousPosts };
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousMicroblogs) {
        queryClient.setQueryData(['/api/microblogs'], context.previousMicroblogs);
      }
      if (context?.previousPosts) {
        queryClient.setQueryData(['/api/posts'], context.previousPosts);
      }
      Alert.alert('Error', 'Failed to update bookmark. Please try again.');
    },
    onSettled: async (data, error, variables) => {
      console.info(`[BOOKMARK] Settled for ${variables.type} ${variables.postId}, invalidating queries...`);
      // Always refetch after error or success to sync with server
      await queryClient.invalidateQueries({ queryKey: ['/api/microblogs'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/microblogs/bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts/bookmarks'] });

      // Log the updated data after refetch
      setTimeout(() => {
        const postsData = queryClient.getQueryData(['/api/posts', 'latest']) as any[];
        if (postsData) {
          const post = postsData.find((p: any) => p.id === variables.postId);
          console.info(`[BOOKMARK] After refetch, ${variables.type} ${variables.postId} isBookmarked:`, post?.isBookmarked);
        }
      }, 500);
    },
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getAvatarUrl(user?: User): string {
  if (!user) return 'https://ui-avatars.com/api/?name=U&background=222D99&color=fff';
  const url = user.profileImageUrl || user.avatarUrl;
  if (url) return url;
  const name = user.displayName || user.username || 'User';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=222D99&color=fff`;
}

function formatTime(dateString: string): string {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return 'recently';
  }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// Helper to extract first sentence from text
function getFirstSentence(text: string): { firstSentence: string; rest: string } {
  // Find first sentence-ending punctuation
  const match = text.match(/^(.*?[.!?])(\s|$)/);
  if (match) {
    return {
      firstSentence: match[1],
      rest: text.slice(match[1].length).trim(),
    };
  }
  // Fallback: first 120 chars if no punctuation found
  if (text.length > 120) {
    const breakPoint = text.lastIndexOf(' ', 120);
    const cutoff = breakPoint > 60 ? breakPoint : 120;
    return {
      firstSentence: text.slice(0, cutoff),
      rest: text.slice(cutoff).trim(),
    };
  }
  return { firstSentence: text, rest: '' };
}

// Helper function to render content with clickable hashtags and bold first sentence
function renderContentWithHashtags(
  content: string,
  onHashtagPress: (tag: string) => void,
  styles: any,
  boldFirstSentence: boolean = true
) {
  const { firstSentence, rest } = boldFirstSentence ? getFirstSentence(content) : { firstSentence: '', rest: content };
  const fullContent = boldFirstSentence && rest ? `${firstSentence} ${rest}` : content;
  const parts = fullContent.split(/(#[a-zA-Z0-9_]+)/g);

  let charIndex = 0;
  const firstSentenceLength = firstSentence.length;

  return (
    <Text style={styles.postContent}>
      {parts.map((part, index) => {
        const partStart = charIndex;
        charIndex += part.length;

        if (part.startsWith('#')) {
          const tag = part.slice(1);
          const isBold = boldFirstSentence && partStart < firstSentenceLength;
          return (
            <Text
              key={index}
              style={[styles.hashtagLink, isBold && { fontWeight: '700' }]}
              onPress={() => onHashtagPress(tag.toLowerCase())}
            >
              {part}
            </Text>
          );
        }

        // For regular text, bold if within first sentence
        if (boldFirstSentence && partStart < firstSentenceLength) {
          const boldEnd = Math.min(part.length, firstSentenceLength - partStart);
          const boldPart = part.slice(0, boldEnd);
          const normalPart = part.slice(boldEnd);
          return (
            <Text key={index}>
              <Text style={{ fontWeight: '700' }}>{boldPart}</Text>
              {normalPart && <Text>{normalPart}</Text>}
            </Text>
          );
        }
        return <Text key={index}>{part}</Text>;
      })}
    </Text>
  );
}

// Topic display configuration for badges
const TOPIC_BADGE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  OBSERVATION: { label: 'Observation', icon: 'eye', color: '#8B5CF6' },
  QUESTION: { label: 'Question', icon: 'help-circle', color: '#EC4899' },
  NEWS: { label: 'News', icon: 'newspaper', color: '#3B82F6' },
  CULTURE: { label: 'Culture', icon: 'globe', color: '#10B981' },
  ENTERTAINMENT: { label: 'Entertainment', icon: 'film', color: '#F59E0B' },
  SCRIPTURE: { label: 'Scripture', icon: 'book', color: '#8B5CF6' },
  TESTIMONY: { label: 'Testimony', icon: 'heart', color: '#EF4444' },
  PRAYER: { label: 'Prayer', icon: 'hand-left', color: '#6366F1' },
  OTHER: { label: 'Other', icon: 'ellipsis-horizontal', color: '#6B7280' },
};

interface PostItemProps {
  post: Microblog;
  onLike: () => void;
  onMorePress: () => void;
  onCommentPress: () => void;
  onRepostPress: () => void;
  onSharePress: () => void;
  onBookmarkPress: () => void;
  onHashtagPress: (tag: string) => void;
  onAuthorPress: (userId: number) => void;
  isAuthenticated: boolean;
  onPollVoteSuccess?: () => void;
}

interface Comment {
  id: number;
  content: string;
  authorId: number;
  postId: number;
  createdAt: string;
  author?: User;
}

const PostItem: React.FC<PostItemProps> = ({ post, onLike, onMorePress, onCommentPress, onRepostPress, onSharePress, onBookmarkPress, onHashtagPress, onAuthorPress, isAuthenticated, onPollVoteSuccess }) => {
  const { colors, colorScheme } = useTheme();
  const styles = getStyles(colors, colorScheme);

  // Get topic badge config
  const topicConfig = post.topic && post.topic !== 'OTHER' ? TOPIC_BADGE_CONFIG[post.topic] : null;

  return (
    <View style={styles.postCard}>
      <View style={styles.postContainer}>
        {/* Avatar */}
        <Pressable onPress={() => post.author?.id && onAuthorPress(post.author.id)}>
          <Image source={{ uri: getAvatarUrl(post.author) }} style={styles.postAvatar} />
        </Pressable>

        {/* Post Content Area */}
        <View style={styles.postMain}>
          {/* Header: Name, Time, Mutuals - Username hidden on feed cards */}
          <View style={styles.postHeader}>
            <Pressable
              style={styles.postHeaderLeft}
              onPress={() => post.author?.id && onAuthorPress(post.author.id)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                <Text style={styles.postAuthorName}>
                  {post.author?.displayName || post.author?.username || 'Unknown User'}
                </Text>
                {/* Mutual followers badge - only show if > 0 */}
                {(post.author as any)?.mutualFollowersCount > 0 && (
                  <View style={styles.mutualBadge}>
                    <Text style={styles.mutualBadgeText}>
                      {(post.author as any).mutualFollowersCount} mutual
                    </Text>
                  </View>
                )}
                <Text style={styles.postDot}>·</Text>
                <Text style={styles.postTime}>{formatTime(post.createdAt)}</Text>
              </View>
            </Pressable>
            <Pressable style={styles.postMoreButton} onPress={onMorePress} hitSlop={8}>
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.iconDefault} />
            </Pressable>
          </View>

          {/* Topic Badge */}
          {topicConfig && (
            <View style={[styles.topicBadge, { borderColor: topicConfig.color + '40' }]}>
              <Ionicons name={topicConfig.icon as any} size={12} color={topicConfig.color} />
              <Text style={[styles.topicBadgeText, { color: topicConfig.color }]}>
                {topicConfig.label}
              </Text>
            </View>
          )}

          {/* Post Content */}
          {renderContentWithHashtags(post.content, onHashtagPress, styles)}

          {/* Media Content - Images, Videos, GIFs */}
          {post.gifUrl && (
            <Image
              source={{ uri: post.gifUrl }}
              style={styles.postMediaGif}
              resizeMode="contain"
            />
          )}

          {post.imageUrls && post.imageUrls.length > 0 && (
            <View style={styles.postMediaCarousel}>
              <ImageCarousel
                images={post.imageUrls}
                height={post.imageUrls.length === 1 ? 220 : 200}
                borderRadius={12}
              />
            </View>
          )}

          {post.videoUrl && (
            <View style={styles.postMediaVideoContainer}>
              <Image
                source={{ uri: post.videoUrl }}
                style={styles.postMediaVideo}
                resizeMode="cover"
              />
              <View style={styles.postMediaVideoOverlay}>
                <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.9)" />
              </View>
            </View>
          )}

          {/* Source URL Link */}
          {post.sourceUrl && (
            <Pressable
              style={styles.sourceUrlContainer}
              onPress={() => {
                // Open URL (will implement linking)
                console.info('Open URL:', post.sourceUrl);
              }}
            >
              <Ionicons name="link" size={14} color={colors.link} />
              <Text style={styles.sourceUrlText} numberOfLines={1}>
                {post.sourceUrl.replace(/^https?:\/\//, '').split('/')[0]}
              </Text>
            </Pressable>
          )}

          {/* Poll Card (if post is a poll) */}
          {post.postType === 'POLL' && post.poll && (
            <PollCard
              poll={post.poll}
              onVoteSuccess={onPollVoteSuccess}
            />
          )}

          {/* Engagement prompt when both counts are zero */}
          {(post.commentCount || 0) === 0 && (post.likeCount || 0) === 0 && (
            <Pressable onPress={onCommentPress} style={styles.engagementPrompt}>
              <Text style={styles.engagementPromptText}>Join the discussion</Text>
            </Pressable>
          )}

          {/* Post Actions - icons have reduced opacity when counts are zero */}
          <View style={styles.postActions}>
            <Pressable
              style={[styles.postAction, (post.commentCount || 0) === 0 && styles.postActionMuted]}
              hitSlop={8}
              onPress={onCommentPress}
            >
              <Ionicons
                name="chatbubble-outline"
                size={18}
                color={colors.iconDefault}
                style={(post.commentCount || 0) === 0 ? { opacity: 0.5 } : undefined}
              />
              {(post.commentCount || 0) > 0 && (
                <Text style={styles.postActionText}>{post.commentCount}</Text>
              )}
            </Pressable>

            <Pressable
              style={[styles.postAction, (post.repostCount || 0) === 0 && !post.isReposted && styles.postActionMuted]}
              hitSlop={8}
              onPress={onRepostPress}
            >
              <Ionicons
                name={post.isReposted ? 'repeat' : 'repeat-outline'}
                size={20}
                color={post.isReposted ? colors.repost : colors.iconDefault}
                style={(post.repostCount || 0) === 0 && !post.isReposted ? { opacity: 0.5 } : undefined}
              />
              {(post.repostCount || 0) > 0 && (
                <Text style={[styles.postActionText, post.isReposted && styles.postActionReposted]}>
                  {post.repostCount}
                </Text>
              )}
            </Pressable>

            <Pressable
              style={[styles.postAction, (post.likeCount || 0) === 0 && !post.isLiked && styles.postActionMuted]}
              onPress={isAuthenticated ? onLike : undefined}
              disabled={!isAuthenticated}
              hitSlop={8}
            >
              <Ionicons
                name={post.isLiked ? 'heart' : 'heart-outline'}
                size={18}
                color={post.isLiked ? colors.like : colors.iconDefault}
                style={(post.likeCount || 0) === 0 && !post.isLiked ? { opacity: 0.5 } : undefined}
              />
              {(post.likeCount || 0) > 0 && (
                <Text style={[styles.postActionText, post.isLiked && styles.postActionLiked]}>
                  {post.likeCount}
                </Text>
              )}
            </Pressable>

            <Pressable style={styles.postAction} onPress={onSharePress} hitSlop={8}>
              <Ionicons name="share-outline" size={18} color={colors.iconDefault} />
            </Pressable>

            <Pressable style={styles.postAction} onPress={onBookmarkPress} hitSlop={8}>
              <Ionicons
                name={post.isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={post.isBookmarked ? colors.bookmark : colors.iconDefault}
              />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FeedScreen({
  onProfilePress,
  onSearchPress,
  onSettingsPress,
  onMessagesPress,
  onNotificationsPress,
  onAuthorPress,
  onPostPress,
  userName,
  userAvatar,
  unreadNotificationsCount,
  unreadMessageCount = 0,
}: FeedScreenProps) {
  const { user } = useAuth();
  const { colors, colorScheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'latest' | 'popular'>('latest');
  const [showComposer, setShowComposer] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'images' | 'video' | 'gif' | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPostForComments, setSelectedPostForComments] = useState<Microblog | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [selectedTrending, setSelectedTrending] = useState<{ type: 'hashtag' | 'keyword', value: string, display: string } | null>(null);

  // Composer state for topic and poll
  const [composerMode, setComposerMode] = useState<'post' | 'poll'>('post');
  const [composerTopic, setComposerTopic] = useState<MicroblogTopic>('OTHER');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollAllowMultiple, setPollAllowMultiple] = useState(false);
  const [showTopicPicker, setShowTopicPicker] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<MicroblogTopic | 'ALL' | 'POLL'>('ALL');
  const [suggestionsCollapsed, setSuggestionsCollapsed] = useState(false);

  const { data: trendingHashtags, isLoading: trendingLoading } = useTrendingHashtags();
  // Use explore feed with topic filtering
  const { data: exploreFeedData, isLoading: exploreLoading, refetch: refetchExplore } = useExploreFeed(
    activeTab,
    selectedTopic,
    selectedTrending ? { type: selectedTrending.type, value: selectedTrending.value } : null
  );
  // Get posts separately (forum posts don't have topics)
  const { data: posts = [], isLoading: postsLoading, refetch: refetchPosts } = usePosts(activeTab);

  // Combine explore feed with posts (only when not filtering by topic/type)
  const feedItems = React.useMemo(() => {
    const microblogs = exploreFeedData?.microblogs || [];

    // If filtering by a specific topic or poll, only show microblogs
    if (selectedTopic !== 'ALL') {
      return microblogs.map((m: any) => ({ ...m, type: 'microblog' as const }));
    }

    // Merge microblogs and posts
    const allItems = [
      ...microblogs.map((m: any) => ({ ...m, type: 'microblog' as const })),
      ...posts.map((p: any) => ({ ...p, type: 'post' as const })),
    ];

    // Sort by timestamp (most recent first)
    return allItems.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  }, [exploreFeedData, posts, selectedTopic]);

  const isLoading = exploreLoading || (selectedTopic === 'ALL' && postsLoading);
  const refetch = React.useCallback(async () => {
    await Promise.all([refetchExplore(), refetchPosts()]);
  }, [refetchExplore, refetchPosts]);
  const likeMutation = useLikeMicroblog();
  const createMutation = useCreateMicroblog();
  const deleteMutation = useDeletePost();
  const reportMutation = useReportPost();
  const { data: comments = [], isLoading: commentsLoading } = useComments(selectedPostForComments?.id || null);
  const createCommentMutation = useCreateComment();
  const repostMutation = useRepostMicroblog();
  const bookmarkMutation = useBookmarkMicroblog();

  const handleLike = (postId: number, isLiked: boolean, type: 'microblog' | 'post' = 'microblog') => {
    if (!user) return;
    likeMutation.mutate({ postId, isLiked, type });
  };

  const handleOpenComments = (post: Microblog) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to view and add comments.');
      return;
    }
    setSelectedPostForComments(post);
    setShowCommentsModal(true);
  };

  const handleCreateComment = () => {
    if (!commentContent.trim() || !selectedPostForComments) return;

    createCommentMutation.mutate(
      { postId: selectedPostForComments.id, content: commentContent },
      {
        onSuccess: () => {
          setCommentContent('');
          Alert.alert('Success', 'Comment added successfully!');
        },
        onError: (error: any) => {
          Alert.alert('Error', error?.response?.data?.message || 'Failed to add comment');
        },
      }
    );
  };

  const handleMorePress = (post: Microblog) => {
    const isOwnPost = user && post.authorId === user.id;

    const buttons = isOwnPost
      ? [
          { text: 'Delete', onPress: () => handleDeletePost(post.id), style: 'destructive' as const },
          { text: 'Cancel', style: 'cancel' as const },
        ]
      : [
          { text: 'Report', onPress: () => handleReportPost(post.id), style: 'destructive' as const },
          { text: 'Block User', onPress: () => handleBlockUser(post.authorId) },
          { text: 'Cancel', style: 'cancel' as const },
        ];

    Alert.alert('Post Options', undefined, buttons);
  };

  const handleDeletePost = (postId: number) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(postId, {
              onSuccess: () => {
                Alert.alert('Success', 'Post deleted successfully');
              },
              onError: (error: any) => {
                Alert.alert('Error', error?.response?.data?.message || 'Failed to delete post');
              },
            });
          },
        },
      ]
    );
  };

  const handleReportPost = (postId: number) => {
    Alert.alert(
      'Report Post',
      'Why are you reporting this post?',
      [
        {
          text: 'Spam',
          onPress: () => submitReport(postId, 'spam'),
        },
        {
          text: 'Harassment',
          onPress: () => submitReport(postId, 'harassment'),
        },
        {
          text: 'Inappropriate Content',
          onPress: () => submitReport(postId, 'inappropriate'),
        },
        {
          text: 'False Information',
          onPress: () => submitReport(postId, 'misinformation'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const submitReport = (postId: number, reason: string) => {
    reportMutation.mutate(
      { postId, reason },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Thank you for your report. We will review it shortly.');
        },
        onError: (error: any) => {
          Alert.alert('Error', error?.response?.data?.message || 'Failed to submit report');
        },
      }
    );
  };

  const handleBlockUser = (userId: number) => {
    Alert.alert(
      'Block User',
      'Are you sure you want to block this user? You will no longer see their posts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement block user API call
            Alert.alert('Coming Soon', 'Block user functionality will be available soon');
          },
        },
      ]
    );
  };

  const handleRepost = (postId: number, isReposted: boolean) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to repost.');
      return;
    }

    // Toggle repost (repost or undo repost)
    repostMutation.mutate({ postId, isReposted });
  };

  const handleShare = async (post: Microblog) => {
    try {
      const shareMessage = `"${post.content}"\n\n- ${post.author?.displayName || post.author?.username || 'Unknown User'}\n\nShared from The Connection`;

      const result = await Share.share({
        message: shareMessage,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with activity type of result.activityType
        } else {
          // Shared
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to share post');
    }
  };

  const handleBookmark = (postId: number, isBookmarked: boolean, type: 'microblog' | 'post' = 'microblog') => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to bookmark posts.');
      return;
    }
    bookmarkMutation.mutate({ postId, isBookmarked, type });
  };

  const handlePickImage = async () => {
    // Check if we've reached the limit
    if (selectedImages.length >= 10) {
      Alert.alert('Limit Reached', 'You can only add up to 10 images per post');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant photo library permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 10 - selectedImages.length, // Remaining slots
      quality: 0.8,
      allowsEditing: false, // Disable editing for multiple selection
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => asset.uri);
      setSelectedImages(prev => [...prev, ...newImages].slice(0, 10)); // Ensure max 10
      setSelectedVideo(null);
      setMediaType('images');
    }
  };

  const handleTakePhoto = async () => {
    // Check if we've reached the limit
    if (selectedImages.length >= 10) {
      Alert.alert('Limit Reached', 'You can only add up to 10 images per post');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera permissions');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9] as [number, number],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImages(prev => [...prev, result.assets[0].uri].slice(0, 10));
      setSelectedVideo(null);
      setMediaType('images');
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    if (selectedImages.length === 1) {
      setMediaType(null);
    }
  };

  const handleMoveImageUp = (index: number) => {
    if (index === 0) return;
    setSelectedImages(prev => {
      const newImages = [...prev];
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
      return newImages;
    });
  };

  const handleMoveImageDown = (index: number) => {
    if (index === selectedImages.length - 1) return;
    setSelectedImages(prev => {
      const newImages = [...prev];
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      return newImages;
    });
  };

  const handlePickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant photo library permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 0.8,
      videoMaxDuration: 120, // 2 minutes max
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      // Check file size (max 50MB for video)
      if (asset.fileSize && asset.fileSize > 50 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Video must be under 50MB');
        return;
      }
      setSelectedVideo(asset.uri);
      setSelectedImages([]);
      setMediaType('video');
    }
  };

  const handleTakeVideo = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera permissions');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 0.8,
      videoMaxDuration: 120, // 2 minutes max
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 50 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Video must be under 50MB');
        return;
      }
      setSelectedVideo(asset.uri);
      setSelectedImages([]);
      setSelectedGif(null);
      setMediaType('video');
    }
  };

  // GIF Picker Functions
  const GIPHY_API_KEY = 'sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh'; // Free Giphy API key (public beta)

  const searchGifs = async (query: string) => {
    if (!query.trim()) {
      // Load trending GIFs when no search query
      try {
        const response = await fetch(
          `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=50&rating=g`
        );
        const data = await response.json();
        setGifs(data.data || []);
      } catch (error) {
        console.error('Error loading trending GIFs:', error);
      }
      return;
    }

    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=50&rating=g`
      );
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      console.error('Error searching GIFs:', error);
      Alert.alert('Error', 'Failed to load GIFs. Please try again.');
    }
  };

  const handleOpenGifPicker = () => {
    setShowGifPicker(true);
    searchGifs(''); // Load trending
  };

  const handleSelectGif = (gif: any) => {
    const gifUrl = gif.images.downsized_medium.url;
    setSelectedGif(gifUrl);
    setSelectedImages([]);
    setSelectedVideo(null);
    setMediaType('gif');
    setShowGifPicker(false);
    setGifSearchQuery('');
  };

  const handleCreatePost = async () => {
    // Validate based on mode
    if (composerMode === 'post' && !postContent.trim()) return;
    if (composerMode === 'poll') {
      if (!pollQuestion.trim()) {
        Alert.alert('Error', 'Please enter a poll question');
        return;
      }
      const validOptions = pollOptions.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        Alert.alert('Error', 'Please add at least 2 poll options');
        return;
      }
    }

    try {
      const FileSystem = await import('expo-file-system');
      let mediaUrls: string[] = [];
      let videoUrl: string | null = null;

      // Convert multiple images to base64 (only for regular posts)
      if (composerMode === 'post' && selectedImages.length > 0) {
        for (const imageUri of selectedImages) {
          const base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: 'base64',
          });
          const extension = imageUri.split('.').pop()?.toLowerCase();
          const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
          mediaUrls.push(`data:${mimeType};base64,${base64}`);
        }
      }

      // Convert video to base64 if selected
      if (composerMode === 'post' && selectedVideo) {
        const base64 = await FileSystem.readAsStringAsync(selectedVideo, {
          encoding: 'base64',
        });
        const extension = selectedVideo.split('.').pop()?.toLowerCase();
        const mimeType = `video/${extension || 'mp4'}`;
        videoUrl = `data:${mimeType};base64,${base64}`;
      }

      // Build the mutation data based on mode
      const mutationData: any = {
        content: composerMode === 'poll' ? pollQuestion : postContent,
        topic: composerTopic,
        postType: composerMode === 'poll' ? 'POLL' : 'STANDARD',
      };

      // Add media for standard posts
      if (composerMode === 'post') {
        if (mediaUrls.length > 0) mutationData.imageUrls = mediaUrls;
        if (videoUrl) mutationData.videoUrl = videoUrl;
        if (selectedGif) mutationData.gifUrl = selectedGif;
      }

      // Add poll data for poll posts
      if (composerMode === 'poll') {
        mutationData.poll = {
          question: pollQuestion.trim(),
          options: pollOptions.filter(opt => opt.trim()),
          allowMultiple: pollAllowMultiple,
        };
      }

      createMutation.mutate(mutationData, {
        onSuccess: (data) => {
          // Reset all composer state
          setPostContent('');
          setSelectedImages([]);
          setSelectedVideo(null);
          setSelectedGif(null);
          setMediaType(null);
          setComposerMode('post');
          setComposerTopic('OTHER');
          setPollQuestion('');
          setPollOptions(['', '']);
          setPollAllowMultiple(false);
          setShowComposer(false);
          Alert.alert('Success', composerMode === 'poll' ? 'Poll created successfully!' : 'Post created successfully!');
        },
        onError: (error: any) => {
          console.error('Failed to create post - Full error:', JSON.stringify(error, null, 2));
          console.error('Error response:', error?.response);
          console.error('Error status:', error?.response?.status);
          console.error('Error data:', error?.response?.data);

          const errorMessage = error?.response?.data?.message
            || error?.response?.data?.error
            || error?.message
            || 'Failed to create post. Please try again.';

          Alert.alert('Error', `Failed to create: ${errorMessage}\n\nStatus: ${error?.response?.status || 'Unknown'}`);
        },
      });
    } catch (error) {
      console.error('Error preparing post:', error);
      Alert.alert('Error', 'Failed to prepare media. Please try again.');
    }
  };

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchSuggestions()]);
    setRefreshing(false);
  };

  // Suggested friends carousel state
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set());

  // Fetch friend suggestions for discovery carousel
  const { data: friendSuggestions = [], refetch: refetchSuggestions } = useQuery<any[]>({
    queryKey: ['/api/user/suggestions/friends'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api/user/suggestions/friends?limit=8');
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleFollowSuggestion = async (userId: number) => {
    // Optimistic update - show "Following" immediately
    setFollowingIds(prev => new Set(prev).add(userId));
    try {
      await apiClient.post(`/api/users/${userId}/follow`);
      // On success, refetch suggestions after a short delay to remove the followed user
      // The delay allows the user to see the "Following" state briefly
      setTimeout(() => {
        refetchSuggestions();
      }, 1000);
    } catch (error) {
      // Rollback on error
      setFollowingIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      console.error('Failed to follow user:', error);
    }
  };

  const handleHideSuggestion = async (userId: number) => {
    try {
      await apiClient.post('/api/user/suggestions/hide', { hiddenUserId: userId });
      refetchSuggestions();
    } catch (error) {
      console.error('Failed to hide suggestion:', error);
    }
  };

  // Dynamic styles based on theme
  const styles = getStyles(colors, colorScheme);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.header }} edges={['top']}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      {/* Header */}
      <AppHeader
        showCenteredLogo={true}
        userName={userName}
        userAvatar={userAvatar}
        onProfilePress={onProfilePress}
        showMessages={true}
        onMessagesPress={onMessagesPress}
        showMenu={true}
        onMenuPress={onSettingsPress}
        unreadNotificationCount={unreadNotificationsCount}
        unreadMessageCount={unreadMessageCount}
      />

      {/* Content area with white background */}
      <View style={styles.container}>
      {/* Trending Section (Hashtags + Keywords) - Only show if there are hashtags */}
      {!trendingLoading && trendingHashtags && trendingHashtags.length > 0 && (
        <View style={styles.trendingSection}>
          <View style={styles.trendingHeader}>
            <Ionicons name="trending-up" size={18} color={colors.iconActive} />
            <Text style={styles.trendingTitle}>Trending</Text>
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
            {trendingHashtags.map((hashtag) => {
              const isActive = selectedTrending?.value === hashtag.tag && selectedTrending?.type === 'hashtag';

              return (
                <Pressable
                  key={hashtag.id}
                  style={[
                    styles.hashtagBadge,
                    isActive && styles.hashtagBadgeActive
                  ]}
                  onPress={() => setSelectedTrending({ type: 'hashtag', value: hashtag.tag, display: hashtag.displayTag })}
                >
                  <Text style={[
                    styles.hashtagText,
                    isActive && styles.hashtagTextActive
                  ]}>
                    #{hashtag.displayTag}
                  </Text>
                  <Text style={styles.hashtagCount}>{hashtag.trendingScore}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Filter Indicator */}
      {selectedTrending && (
        <View style={styles.filterIndicator}>
          <Ionicons name="filter" size={16} color={colors.textPrimary} />
          <Text style={styles.filterText}>
            Showing {selectedTrending.type === 'hashtag' ? '#' : ''}{selectedTrending.display}
          </Text>
        </View>
      )}

      {/* Topic Filter Chips - Simplified: All, Discussions, Questions, Polls, Testimony */}
      <TopicChips
        selectedTopic={selectedTopic}
        onSelectTopic={(topic) => {
          setSelectedTopic(topic);
          // Clear trending filter when changing topic
          if (selectedTrending) {
            setSelectedTrending(null);
          }
        }}
        showPollFilter={true}
      />

      {/* Suggested Friends Carousel - Collapsible */}
      {user && friendSuggestions.length > 0 && (
        <View style={styles.suggestionsCarousel}>
          <Pressable
            style={styles.suggestionsHeaderTouchable}
            onPress={() => setSuggestionsCollapsed(!suggestionsCollapsed)}
          >
            <View style={styles.suggestionsHeaderLeft}>
              <Ionicons name="people" size={18} color={colors.primary} />
              <Text style={styles.suggestionsTitle}>People to Follow</Text>
            </View>
            <Ionicons
              name={suggestionsCollapsed ? 'chevron-down' : 'chevron-up'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
          {!suggestionsCollapsed && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsScroll}
            >
              {friendSuggestions.map((suggestion: any) => {
                const isFollowing = followingIds.has(suggestion.id);
                return (
                  <View key={suggestion.id} style={styles.suggestionCard}>
                    <Pressable
                      style={styles.hideButtonSmall}
                      onPress={() => handleHideSuggestion(suggestion.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close" size={14} color={colors.textMuted} />
                    </Pressable>
                    <Pressable
                      style={styles.suggestionCardInner}
                      onPress={() => onAuthorPress?.(suggestion.id)}
                    >
                      <Image
                        source={{
                          uri: suggestion.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(suggestion.displayName || suggestion.username)}&background=random`
                        }}
                        style={styles.suggestionAvatar}
                      />
                      <Text style={styles.suggestionName} numberOfLines={1}>
                        {suggestion.displayName || suggestion.username}
                      </Text>
                      <Text style={styles.suggestionUsername} numberOfLines={1}>
                        @{suggestion.username}
                      </Text>
                      {suggestion.suggestionScore?.mutualCommunities > 0 && (
                        <Text style={styles.suggestionReason} numberOfLines={1}>
                          {suggestion.suggestionScore.mutualCommunities} shared {suggestion.suggestionScore.mutualCommunities === 1 ? 'community' : 'communities'}
                        </Text>
                      )}
                    </Pressable>
                    <Pressable
                      style={[
                        styles.followButtonSmall,
                        isFollowing && styles.followButtonFollowing
                      ]}
                      onPress={() => !isFollowing && handleFollowSuggestion(suggestion.id)}
                      disabled={isFollowing}
                    >
                      <Text style={[
                        styles.followButtonText,
                        isFollowing && styles.followButtonTextFollowing
                      ]}>
                        {isFollowing ? 'Following' : 'Follow'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'latest' && styles.tabActive]}
          onPress={() => setActiveTab('latest')}
        >
          <Text style={[styles.tabText, activeTab === 'latest' && styles.tabTextActive]}>Following</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'popular' && styles.tabActive]}
          onPress={() => setActiveTab('popular')}
        >
          <Text style={[styles.tabText, activeTab === 'popular' && styles.tabTextActive]}>For You</Text>
        </Pressable>
      </View>

      {/* Feed */}
      <ScrollView
        style={styles.feed}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading feed...</Text>
          </View>
        ) : feedItems && feedItems.length > 0 ? (
          feedItems.map((item: any) => {
            if (item.type === 'microblog') {
              // Render microblog post (Twitter-style)
              return (
                <PostItem
                  key={`microblog-${item.id}`}
                  post={item}
                  onLike={() => handleLike(item.id, item.isLiked || false)}
                  onMorePress={() => handleMorePress(item)}
                  onCommentPress={() => handleOpenComments(item)}
                  onRepostPress={() => handleRepost(item.id, item.isReposted || false)}
                  onSharePress={() => handleShare(item)}
                  onBookmarkPress={() => handleBookmark(item.id, item.isBookmarked || false)}
                  onHashtagPress={(tag) => setSelectedTrending({ type: 'hashtag', value: tag, display: tag })}
                  onAuthorPress={(userId) => onAuthorPress?.(userId)}
                  isAuthenticated={!!user}
                  onPollVoteSuccess={() => refetch()}
                />
              );
            } else if (item.type === 'post') {
              // Render forum post (Reddit-style)
              // Map API data to PostCard expected format
              const mappedPost = {
                id: item.id,
                channel: item.communityId ? `Community ${item.communityId}` : 'General',
                channelIcon: '🏛️',
                author: item.isAnonymous ? 'Anonymous' : (item.author?.displayName || item.author?.username || 'Unknown'),
                authorId: item.authorId,
                isAnonymous: item.isAnonymous,
                timeAgo: formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }),
                title: item.title || 'Untitled Post',
                content: item.content || '',
                likes: item.likeCount || 0,
                comments: item.commentCount || 0,
                flair: item.isAnonymous ? 'Anonymous' : '',
                isLiked: item.isLiked || false,
              };

              return (
                <PostCard
                  key={`post-${item.id}`}
                  post={mappedPost}
                  onPress={() => onPostPress?.(item)}
                  onLikePress={() => handleLike(item.id, item.isLiked || false)}
                  onAuthorPress={(userId) => onAuthorPress?.(userId)}
                  onBookmarkPress={() => handleBookmark(item.id, item.isBookmarked || false, 'post')}
                  onMorePress={() => handleMorePress(item)}
                  isBookmarked={item.isBookmarked || false}
                />
              );
            }
            return null;
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.surfaceMutedForeground} />
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Be the first to share something!</Text>
          </View>
        )}
      </ScrollView>

      {/* Create Post Modal - Twitter Style */}
      <Modal visible={showComposer} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafeArea} edges={['top']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboard}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <Pressable onPress={() => {
                setShowComposer(false);
                setSelectedImages([]);
                setSelectedVideo(null);
                setSelectedGif(null);
                setMediaType(null);
                setPostContent('');
                setComposerMode('post');
                setComposerTopic('OTHER');
                setPollQuestion('');
                setPollOptions(['', '']);
                setPollAllowMultiple(false);
              }} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
              <Pressable
                onPress={handleCreatePost}
                disabled={
                  (composerMode === 'post' && !postContent.trim()) ||
                  (composerMode === 'poll' && (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2)) ||
                  createMutation.isPending
                }
                style={[
                  styles.postButton,
                  ((composerMode === 'post' && !postContent.trim()) ||
                   (composerMode === 'poll' && (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2)) ||
                   createMutation.isPending) && styles.postButtonDisabled,
                ]}
              >
                <Text style={styles.postButtonText}>
                  {createMutation.isPending ? 'Posting...' : (composerMode === 'poll' ? 'Create Poll' : 'Post')}
                </Text>
              </Pressable>
            </View>

            {/* Post/Poll Mode Switcher */}
            <View style={styles.composerModeSwitch}>
              <Pressable
                style={[styles.composerModeButton, composerMode === 'post' && styles.composerModeButtonActive]}
                onPress={() => setComposerMode('post')}
              >
                <Ionicons name="create-outline" size={18} color={composerMode === 'post' ? colors.accent : colors.textSecondary} />
                <Text style={[styles.composerModeText, composerMode === 'post' && styles.composerModeTextActive]}>Post</Text>
              </Pressable>
              <Pressable
                style={[styles.composerModeButton, composerMode === 'poll' && styles.composerModeButtonActive]}
                onPress={() => setComposerMode('poll')}
              >
                <Ionicons name="bar-chart-outline" size={18} color={composerMode === 'poll' ? colors.accent : colors.textSecondary} />
                <Text style={[styles.composerModeText, composerMode === 'poll' && styles.composerModeTextActive]}>Poll</Text>
              </Pressable>
            </View>

            {/* Topic Selector */}
            <Pressable
              style={styles.topicSelector}
              onPress={() => setShowTopicPicker(!showTopicPicker)}
            >
              <View style={styles.topicSelectorContent}>
                <Ionicons name={TOPIC_BADGE_CONFIG[composerTopic]?.icon as any || 'ellipsis-horizontal'} size={16} color={TOPIC_BADGE_CONFIG[composerTopic]?.color || colors.textSecondary} />
                <Text style={[styles.topicSelectorText, { color: TOPIC_BADGE_CONFIG[composerTopic]?.color || colors.textSecondary }]}>
                  {TOPIC_BADGE_CONFIG[composerTopic]?.label || 'Other'}
                </Text>
              </View>
              <Ionicons name={showTopicPicker ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
            </Pressable>

            {/* Topic Picker Dropdown */}
            {showTopicPicker && (
              <ScrollView horizontal style={styles.topicPickerContainer} showsHorizontalScrollIndicator={false}>
                {Object.entries(TOPIC_BADGE_CONFIG).map(([key, config]) => (
                  <Pressable
                    key={key}
                    style={[
                      styles.topicPickerItem,
                      composerTopic === key && styles.topicPickerItemActive,
                      { borderColor: composerTopic === key ? config.color : colors.borderSubtle }
                    ]}
                    onPress={() => {
                      setComposerTopic(key as MicroblogTopic);
                      setShowTopicPicker(false);
                    }}
                  >
                    <Ionicons name={config.icon as any} size={14} color={config.color} />
                    <Text style={[styles.topicPickerText, { color: config.color }]}>{config.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            {/* Composer Body */}
            <ScrollView style={styles.composerScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.composerBody}>
                <Image source={{ uri: getAvatarUrl(user) }} style={styles.composerAvatar} />
                <View style={styles.composerContent}>
                  {/* Standard Post Input */}
                  {composerMode === 'post' && (
                    <TextInput
                      style={styles.composerInput}
                      placeholder="What's happening?"
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      value={postContent}
                      onChangeText={setPostContent}
                      autoFocus
                    />
                  )}

                  {/* Poll Creation UI */}
                  {composerMode === 'poll' && (
                    <View style={styles.pollCreator}>
                      <TextInput
                        style={styles.pollQuestionInput}
                        placeholder="Ask a question..."
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        value={pollQuestion}
                        onChangeText={setPollQuestion}
                        autoFocus
                      />

                      <View style={styles.pollOptionsContainer}>
                        {pollOptions.map((option, index) => (
                          <View key={index} style={styles.pollOptionRow}>
                            <TextInput
                              style={styles.pollOptionInput}
                              placeholder={`Option ${index + 1}`}
                              placeholderTextColor={colors.textSecondary}
                              value={option}
                              onChangeText={(text) => {
                                const newOptions = [...pollOptions];
                                newOptions[index] = text;
                                setPollOptions(newOptions);
                              }}
                            />
                            {pollOptions.length > 2 && (
                              <Pressable
                                style={styles.pollOptionRemove}
                                onPress={() => {
                                  const newOptions = pollOptions.filter((_, i) => i !== index);
                                  setPollOptions(newOptions);
                                }}
                              >
                                <Ionicons name="close-circle" size={20} color={colors.error || '#EF4444'} />
                              </Pressable>
                            )}
                          </View>
                        ))}

                        {pollOptions.length < 4 && (
                          <Pressable
                            style={styles.addOptionButton}
                            onPress={() => setPollOptions([...pollOptions, ''])}
                          >
                            <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
                            <Text style={styles.addOptionText}>Add option</Text>
                          </Pressable>
                        )}
                      </View>

                      {/* Allow multiple selection toggle */}
                      <Pressable
                        style={styles.pollToggle}
                        onPress={() => setPollAllowMultiple(!pollAllowMultiple)}
                      >
                        <Ionicons
                          name={pollAllowMultiple ? 'checkbox' : 'square-outline'}
                          size={22}
                          color={pollAllowMultiple ? colors.accent : colors.textSecondary}
                        />
                        <Text style={styles.pollToggleText}>Allow multiple selections</Text>
                      </Pressable>
                    </View>
                  )}

                  {/* Multiple Images Preview - Simple Grid with Reorder Buttons */}
                  {selectedImages.length > 0 && (
                    <View style={styles.imagesGrid}>
                      {selectedImages.map((uri, index) => (
                        <View
                          key={index}
                          style={[
                            styles.gridImageContainer,
                            selectedImages.length === 1 && styles.singleImage,
                            selectedImages.length === 2 && styles.doubleImage,
                            selectedImages.length >= 3 && styles.gridImage,
                          ]}
                        >
                          <Image source={{ uri }} style={styles.gridImageContent} />

                          {/* Remove button */}
                          <Pressable
                            style={styles.gridImageRemove}
                            onPress={() => handleRemoveImage(index)}
                          >
                            <Ionicons name="close-circle" size={24} color="#FFFFFF" />
                          </Pressable>

                          {/* Image counter */}
                          {selectedImages.length > 1 && (
                            <View style={styles.imageCounter}>
                              <Text style={styles.imageCounterText}>{index + 1}/{selectedImages.length}</Text>
                            </View>
                          )}

                          {/* Reorder buttons */}
                          {selectedImages.length > 1 && (
                            <View style={styles.reorderButtons}>
                              {index > 0 && (
                                <Pressable
                                  style={styles.reorderButton}
                                  onPress={() => handleMoveImageUp(index)}
                                >
                                  <Ionicons name="arrow-up" size={16} color="#FFFFFF" />
                                </Pressable>
                              )}
                              {index < selectedImages.length - 1 && (
                                <Pressable
                                  style={styles.reorderButton}
                                  onPress={() => handleMoveImageDown(index)}
                                >
                                  <Ionicons name="arrow-down" size={16} color="#FFFFFF" />
                                </Pressable>
                              )}
                            </View>
                          )}
                        </View>
                      ))}

                      {/* Add more button */}
                      {selectedImages.length < 10 && (
                        <Pressable
                          style={[
                            styles.gridImageContainer,
                            styles.addMoreButton,
                            selectedImages.length >= 3 && styles.gridImage,
                          ]}
                          onPress={handlePickImage}
                        >
                          <Ionicons name="add" size={32} color={colors.textSecondary} />
                          <Text style={styles.addMoreText}>Add more</Text>
                        </Pressable>
                      )}
                    </View>
                  )}

                  {/* Video Preview */}
                  {selectedVideo && (
                    <View style={styles.mediaPreview}>
                      <View style={styles.videoPlaceholder}>
                        <Ionicons name="videocam" size={48} color={colors.iconDefault} />
                        <Text style={styles.videoText}>Video selected</Text>
                      </View>
                      <Pressable
                        style={styles.mediaRemove}
                        onPress={() => {
                          setSelectedVideo(null);
                          setMediaType(null);
                        }}
                      >
                        <Ionicons name="close-circle" size={28} color={colors.textPrimary} />
                      </Pressable>
                    </View>
                  )}

                  {/* GIF Preview */}
                  {selectedGif && (
                    <View style={styles.mediaPreview}>
                      <Image source={{ uri: selectedGif }} style={styles.gifImage} resizeMode="contain" />
                      <Pressable
                        style={styles.mediaRemove}
                        onPress={() => {
                          setSelectedGif(null);
                          setMediaType(null);
                        }}
                      >
                        <Ionicons name="close-circle" size={28} color={colors.textPrimary} />
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Media Toolbar - Only for standard posts */}
            {composerMode === 'post' && (
              <View style={styles.mediaToolbar}>
                <View style={styles.mediaButtons}>
                  <Pressable style={styles.mediaButton} onPress={handlePickImage} hitSlop={8}>
                    <Ionicons name="image-outline" size={22} color={colors.accent} />
                    <Text style={[styles.mediaButtonLabel, { color: colors.textSecondary }]}>Gallery</Text>
                  </Pressable>
                  <Pressable style={styles.mediaButton} onPress={handleTakePhoto} hitSlop={8}>
                    <Ionicons name="camera-outline" size={22} color={colors.accent} />
                    <Text style={[styles.mediaButtonLabel, { color: colors.textSecondary }]}>Camera</Text>
                  </Pressable>
                  <Pressable style={styles.mediaButton} onPress={handleOpenGifPicker} hitSlop={8}>
                    <Text style={styles.gifButtonText}>GIF</Text>
                  </Pressable>
                </View>

                {/* Media Counter & Character Count */}
                <View style={styles.charCount}>
                  {selectedImages.length > 0 && (
                    <Text style={styles.mediaCountText}>{selectedImages.length}/10 📷</Text>
                  )}
                  {selectedVideo && (
                    <Text style={styles.mediaCountText}>🎥</Text>
                  )}
                  {selectedGif && (
                    <Text style={styles.mediaCountText}>GIF</Text>
                  )}
                  <Text style={styles.charCountText}>{postContent.length}/280</Text>
                </View>
              </View>
            )}

            {/* Poll Mode Footer */}
            {composerMode === 'poll' && (
              <View style={styles.pollFooter}>
                <Text style={styles.pollFooterText}>
                  {pollOptions.filter(o => o.trim()).length} of 4 options
                </Text>
                <Text style={styles.charCountText}>{pollQuestion.length}/280</Text>
              </View>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* GIF Picker Modal */}
      <Modal
        visible={showGifPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGifPicker(false)}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top']}>
          <View style={styles.gifPickerContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowGifPicker(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
              <Text style={[styles.commentsTitle, { color: colors.textPrimary }]}>Choose a GIF</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Search Bar */}
            <View style={[styles.gifSearchContainer, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.gifSearchInput, { color: colors.textPrimary }]}
                placeholder="Search GIFs..."
                placeholderTextColor={colors.textSecondary}
                value={gifSearchQuery}
                onChangeText={(text) => {
                  setGifSearchQuery(text);
                  searchGifs(text);
                }}
                autoCapitalize="none"
              />
              {gifSearchQuery.length > 0 && (
                <Pressable onPress={() => {
                  setGifSearchQuery('');
                  searchGifs('');
                }}>
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>

            {/* GIF Grid */}
            <FlatList
              data={gifs}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.gifGrid}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.gifItem}
                  onPress={() => handleSelectGif(item)}
                >
                  <Image
                    source={{ uri: item.images.fixed_height.url }}
                    style={styles.gifThumbnail}
                    resizeMode="cover"
                  />
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={styles.emptyGifContainer}>
                  <Ionicons name="images-outline" size={64} color={colors.surfaceMutedForeground} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {gifSearchQuery ? 'No GIFs found' : 'Search for GIFs'}
                  </Text>
                </View>
              }
            />

            {/* Powered by Giphy */}
            <View style={styles.giphyBranding}>
              <Text style={[styles.giphyText, { color: colors.textSecondary }]}>
                Powered by GIPHY
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Comments Modal */}
      <Modal
        visible={showCommentsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowCommentsModal(false);
          setSelectedPostForComments(null);
          setCommentContent('');
        }}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboard}
          >
            {/* Comments Header */}
            <View style={styles.modalHeader}>
              <Pressable
                onPress={() => {
                  setShowCommentsModal(false);
                  setSelectedPostForComments(null);
                  setCommentContent('');
                }}
                hitSlop={8}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
              <Text style={styles.commentsTitle}>Comments</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Original Post */}
            {selectedPostForComments && (
              <View style={styles.originalPost}>
                <View style={styles.postContainer}>
                  <Image
                    source={{ uri: getAvatarUrl(selectedPostForComments.author) }}
                    style={styles.postAvatar}
                  />
                  <View style={styles.postMain}>
                    <View style={styles.postHeaderLeft}>
                      <Text style={styles.postAuthorName}>
                        {selectedPostForComments.author?.displayName ||
                          selectedPostForComments.author?.username ||
                          'Unknown User'}
                      </Text>
                      <Text style={styles.postUsername}>
                        @{selectedPostForComments.author?.username || 'unknown'}
                      </Text>
                      <Text style={styles.postDot}>·</Text>
                      <Text style={styles.postTime}>
                        {formatTime(selectedPostForComments.createdAt)}
                      </Text>
                    </View>
                    <Text style={styles.postContent}>{selectedPostForComments.content}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Comments List */}
            <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
              {commentsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading comments...</Text>
                </View>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <Image
                      source={{ uri: getAvatarUrl(comment.author) }}
                      style={styles.commentAvatar}
                    />
                    <View style={styles.commentMain}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentAuthorName}>
                          {comment.author?.displayName || comment.author?.username || 'Unknown User'}
                        </Text>
                        <Text style={styles.postUsername}>
                          @{comment.author?.username || 'unknown'}
                        </Text>
                        <Text style={styles.postDot}>·</Text>
                        <Text style={styles.postTime}>{formatTime(comment.createdAt)}</Text>
                      </View>
                      <Text style={styles.commentContent}>{comment.content}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyComments}>
                  <Ionicons name="chatbubbles-outline" size={48} color={colors.surfaceMutedForeground} />
                  <Text style={styles.emptyCommentsText}>No comments yet</Text>
                  <Text style={styles.emptyCommentsSubtext}>Be the first to comment!</Text>
                </View>
              )}
            </ScrollView>

            {/* Comment Input */}
            <View style={styles.commentInputContainer}>
              <Image source={{ uri: getAvatarUrl(user) }} style={styles.commentInputAvatar} />
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                placeholderTextColor={colors.textSecondary}
                multiline
                value={commentContent}
                onChangeText={setCommentContent}
                maxLength={280}
              />
              <Pressable
                onPress={handleCreateComment}
                disabled={!commentContent.trim() || createCommentMutation.isPending}
                style={[
                  styles.commentSendButton,
                  (!commentContent.trim() || createCommentMutation.isPending) &&
                    styles.commentSendButtonDisabled,
                ]}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={
                    !commentContent.trim() || createCommentMutation.isPending
                      ? colors.surfaceMutedForeground
                      : colors.accent
                  }
                />
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
      </View>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const getStyles = (colors: any, theme: 'light' | 'dark') => {
  const isDark = theme === 'dark';

  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  trendingSection: {
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  trendingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  trendingTags: {
    gap: 8,
  },
  hashtagBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  hashtagText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  hashtagBadgeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  hashtagTextActive: {
    color: colors.primaryForeground,
    fontWeight: '700',
  },
  hashtagCount: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.iconActive,
    marginLeft: 4,
  },
  clearFilterButton: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearFilterText: {
    fontSize: 13,
    color: colors.link,
    fontWeight: '600',
  },
  emptyTrending: {
    fontSize: 14,
    color: colors.textMuted,
    paddingHorizontal: 8,
  },
  filterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.backgroundSoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  filterText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  // Suggestions Carousel Styles
  suggestionsCarousel: {
    backgroundColor: colors.surface,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    overflow: 'hidden', // Apply overflow here, not in animated style
  },
  suggestionsHeaderTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 4,
  },
  suggestionsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  suggestionsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  suggestionsScroll: {
    paddingHorizontal: 12,
    gap: 12,
  },
  suggestionCard: {
    width: 150,
    minHeight: 180,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: 12,
    paddingBottom: 14,
    alignItems: 'center',
    position: 'relative',
  },
  suggestionCardInner: {
    alignItems: 'center',
    width: '100%',
    flex: 1,
  },
  hideButtonSmall: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  suggestionAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 8,
    backgroundColor: colors.surfaceMuted,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  suggestionUsername: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  suggestionReason: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 8,
  },
  followButtonSmall: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 18,
    marginTop: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButtonFollowing: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryForeground,
  },
  followButtonTextFollowing: {
    color: colors.primary,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.iconActive,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textPrimary,
  },
  feed: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
  postCard: {
    backgroundColor: colors.backgroundSoft,
    marginBottom: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  postContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceMuted,
  },
  postMain: {
    flex: 1,
    marginLeft: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  postHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  postAuthorName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: 4,
  },
  postUsername: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 4,
  },
  postUsernameSecondary: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 1,
  },
  mutualBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 4,
  },
  mutualBadgeText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  engagementPrompt: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginTop: 8,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  engagementPromptText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  postDot: {
    fontSize: 12,
    color: colors.textMuted,
    marginHorizontal: 4,
    opacity: 0.6,
  },
  postTime: {
    fontSize: 12,
    color: colors.textMuted,
    opacity: 0.7,
  },
  postActionMuted: {
    opacity: 0.7,
  },
  postMoreButton: {
    padding: 4,
    marginLeft: 8,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
    marginTop: 6,
    marginBottom: 12,
  },
  hashtagLink: {
    color: colors.accent,
    fontWeight: '600',
  },
  // Post Media Styles
  postMediaGif: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: colors.surfaceMuted,
  },
  postMediaCarousel: {
    marginTop: 8,
    marginBottom: 8,
  },
  postMediaSingle: {
    marginTop: 8,
    marginBottom: 8,
  },
  postMediaImageSingle: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
  },
  postMediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  postMediaImageGrid: {
    width: '48.5%',
    height: 140,
    backgroundColor: colors.surfaceMuted,
  },
  postMediaOverlay: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '48.5%',
    height: 140,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postMediaOverlayText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  postMediaVideoContainer: {
    position: 'relative',
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  postMediaVideo: {
    width: '100%',
    height: 200,
    backgroundColor: colors.surfaceMuted,
  },
  postMediaVideoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 425,
    marginTop: 4,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    marginLeft: -8,
  },
  postActionText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  postActionLiked: {
    color: colors.like,
  },
  postActionReposted: {
    color: colors.repost,
  },
  // Topic Badge styles
  topicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: colors.surfaceMuted,
    marginBottom: 6,
    gap: 4,
  },
  topicBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Source URL styles
  sourceUrlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 4,
    gap: 6,
  },
  sourceUrlText: {
    fontSize: 13,
    color: colors.link,
    flex: 1,
  },
  // Twitter-style Modal
  modalSafeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalKeyboard: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  postButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: colors.surfaceMutedForeground,
    opacity: 0.5,
  },
  postButtonText: {
    color: colors.primaryForeground,
    fontSize: 15,
    fontWeight: '700',
  },
  composerScroll: {
    flex: 1,
  },
  composerBody: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  composerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceMuted,
  },
  composerContent: {
    flex: 1,
    marginLeft: 12,
  },
  composerInput: {
    fontSize: 18,
    color: colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  mediaPreview: {
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  videoPlaceholder: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  videoText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
  mediaRemove: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(11, 19, 43, 0.75)',
    borderRadius: 14,
  },
  // Multiple Images Grid - Instagram Style
  imagesGrid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  gridImageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    position: 'relative',
  },
  singleImage: {
    width: '100%',
    height: 300,
  },
  doubleImage: {
    width: 'calc(50% - 2px)',
    height: 200,
  },
  gridImage: {
    width: 'calc(33.33% - 3px)',
    height: 120,
  },
  gridImageContent: {
    width: '100%',
    height: '100%',
  },
  gridImageRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(11, 19, 43, 0.75)',
    borderRadius: 12,
  },
  imageCounter: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(11, 19, 43, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  imageCounterText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '600',
  },
  reorderButtons: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'column',
    gap: 4,
  },
  reorderButton: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(11, 19, 43, 0.75)',
    borderRadius: 10,
    padding: 4,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMoreButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  addMoreText: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  gifImage: {
    width: '100%',
    height: 250,
    borderRadius: 16,
  },
  gifButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
  },
  mediaToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 34, // Safe area for iPhone home indicator
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  mediaButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  mediaButton: {
    padding: 8,
    alignItems: 'center',
    gap: 4,
  },
  mediaButtonLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  charCount: {
    paddingLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mediaCountText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
  },
  charCountText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  // Comments Modal Styles
  commentsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  originalPost: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingBottom: 12,
  },
  commentsList: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  commentItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
  },
  commentMain: {
    flex: 1,
    marginLeft: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  commentAuthorName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: 4,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textPrimary,
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyCommentsText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  emptyCommentsSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  commentInputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    marginBottom: 8,
  },
  commentInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 36,
    maxHeight: 100,
    marginLeft: 12,
    marginRight: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
  },
  commentSendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentSendButtonDisabled: {
    opacity: 0.5,
  },
  // GIF Picker Styles
  gifPickerContainer: {
    flex: 1,
  },
  gifSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  gifSearchInput: {
    flex: 1,
    fontSize: 16,
  },
  gifGrid: {
    padding: 8,
  },
  gifItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  gifThumbnail: {
    width: '100%',
    height: '100%',
  },
  emptyGifContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  giphyBranding: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  giphyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Composer Mode Switch
  composerModeSwitch: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  composerModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  composerModeButtonActive: {
    borderBottomColor: colors.accent,
  },
  composerModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  composerModeTextActive: {
    color: colors.accent,
  },
  // Topic Selector
  topicSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  topicSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topicSelectorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Topic Picker
  topicPickerContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  topicPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: colors.surfaceMuted,
    gap: 4,
  },
  topicPickerItemActive: {
    backgroundColor: colors.surface,
  },
  topicPickerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Poll Creator
  pollCreator: {
    flex: 1,
  },
  pollQuestionInput: {
    fontSize: 18,
    color: colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  pollOptionsContainer: {
    gap: 8,
  },
  pollOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pollOptionInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  pollOptionRemove: {
    padding: 4,
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  addOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  pollToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
    marginTop: 8,
  },
  pollToggleText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  pollFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  pollFooterText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
};
