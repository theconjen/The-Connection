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
import apiClient from '../lib/apiClient';
import { AppHeader } from './AppHeader';
import { formatDistanceToNow } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';

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
}

interface FeedScreenProps {
  onProfilePress?: () => void;
  onSearchPress?: () => void;
  onSettingsPress?: () => void;
  onMessagesPress?: () => void;
  onNotificationsPress?: () => void;
  userName?: string;
  userAvatar?: string;
  unreadNotificationsCount?: number;
}

// ============================================================================
// API HOOKS
// ============================================================================

// Hook to fetch trending items (hashtags + keywords, updates every 15 minutes)
function useTrendingItems() {
  return useQuery<any[]>({
    queryKey: ['/api/microblogs/trending/combined'],
    queryFn: async () => {
      const response = await apiClient.get('/api/microblogs/trending/combined?limit=10');
      return response.data;
    },
    refetchInterval: 15 * 60 * 1000, // Refetch every 15 minutes
  });
}

function useMicroblogs(filter: 'recent' | 'popular', trendingFilter?: { type: 'hashtag' | 'keyword', value: string } | null) {
  const { user } = useAuth();

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
          response = await apiClient.get(`/api/microblogs?filter=${filter}`);
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

function useLikeMicroblog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: number; isLiked: boolean }) => {
      try {
        // Toggle like/unlike on microblog
        if (isLiked) {
          await apiClient.delete(`/api/microblogs/${postId}/like`);
        } else {
          await apiClient.post(`/api/microblogs/${postId}/like`);
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
    onMutate: async ({ postId, isLiked }) => {
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
                isLiked: !isLiked,
                likeCount: isLiked ? (post.likeCount || 0) - 1 : (post.likeCount || 0) + 1,
              }
            : post
        );
      });

      return { previousData };
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['/api/microblogs'], context.previousData);
      }
    },
    onSettled: () => {
      // Always refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['/api/microblogs'] });
    },
  });
}

function useCreateMicroblog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      // Create microblog (feed post - always public, never anonymous)
      const response = await apiClient.post('/api/microblogs', { content });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate microblogs queries to refetch
      queryClient.invalidateQueries({ queryKey: ['/api/microblogs'] });
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
    mutationFn: async (postId: number) => {
      const response = await apiClient.post(`/api/microblogs/${postId}/repost`);
      return response.data;
    },
    onMutate: async (postId) => {
      // Optimistic update
      queryClient.setQueriesData({ queryKey: ['/api/microblogs'] }, (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((post: Microblog) =>
          post.id === postId
            ? { ...post, repostCount: (post.repostCount || 0) + 1, isReposted: true }
            : post
        );
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/microblogs'] });
    },
    onError: (error: any) => {
      if (error?.response?.data?.message === 'Already reposted') {
        Alert.alert('Already Reposted', 'You have already reposted this post.');
      } else {
        Alert.alert('Error', 'Failed to repost. Please try again.');
      }
      queryClient.invalidateQueries({ queryKey: ['/api/microblogs'] });
    },
  });
}

function useBookmarkMicroblog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, isBookmarked }: { postId: number; isBookmarked: boolean }) => {
      try {
        if (isBookmarked) {
          // Currently bookmarked, so unbookmark
          await apiClient.delete(`/api/microblogs/${postId}/bookmark`);
        } else {
          // Not bookmarked, so bookmark
          await apiClient.post(`/api/microblogs/${postId}/bookmark`);
        }
      } catch (error: any) {
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
    onMutate: async ({ postId, isBookmarked }) => {
      // Cancel outgoing queries to avoid race conditions
      await queryClient.cancelQueries({ queryKey: ['/api/microblogs'] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(['/api/microblogs']);

      // Optimistic update
      queryClient.setQueriesData({ queryKey: ['/api/microblogs'] }, (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((post: Microblog) =>
          post.id === postId
            ? { ...post, isBookmarked: !isBookmarked }
            : post
        );
      });

      return { previousData };
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['/api/microblogs'], context.previousData);
      }
      Alert.alert('Error', 'Failed to update bookmark. Please try again.');
    },
    onSettled: () => {
      // Always refetch after error or success to sync with server
      queryClient.invalidateQueries({ queryKey: ['/api/microblogs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/microblogs/bookmarks'] });
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

interface PostItemProps {
  post: Microblog;
  onLike: () => void;
  onMorePress: () => void;
  onCommentPress: () => void;
  onRepostPress: () => void;
  onSharePress: () => void;
  onBookmarkPress: () => void;
  isAuthenticated: boolean;
}

interface Comment {
  id: number;
  content: string;
  authorId: number;
  postId: number;
  createdAt: string;
  author?: User;
}

const PostItem: React.FC<PostItemProps> = ({ post, onLike, onMorePress, onCommentPress, onRepostPress, onSharePress, onBookmarkPress, isAuthenticated }) => {
  const { colors, colorScheme } = useTheme();
  const styles = getStyles(colors, colorScheme);

  return (
    <View style={styles.postCard}>
      <View style={styles.postContainer}>
        {/* Avatar */}
        <Image source={{ uri: getAvatarUrl(post.author) }} style={styles.postAvatar} />

        {/* Post Content Area */}
        <View style={styles.postMain}>
          {/* Header: Name, Username, Time, Menu */}
          <View style={styles.postHeader}>
            <View style={styles.postHeaderLeft}>
              <Text style={styles.postAuthorName}>
                {post.author?.displayName || post.author?.username || 'Unknown User'}
              </Text>
              <Text style={styles.postUsername}>
                @{post.author?.username || 'unknown'}
              </Text>
              <Text style={styles.postDot}>·</Text>
              <Text style={styles.postTime}>{formatTime(post.createdAt)}</Text>
            </View>
            <Pressable style={styles.postMoreButton} onPress={onMorePress} hitSlop={8}>
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.icon} />
            </Pressable>
          </View>

          {/* Post Content */}
          <Text style={styles.postContent}>{post.content}</Text>

          {/* Post Actions */}
          <View style={styles.postActions}>
            <Pressable
              style={styles.postAction}
              hitSlop={8}
              onPress={onCommentPress}
            >
              <Ionicons name="chatbubble-outline" size={18} color={colors.icon} />
              <Text style={styles.postActionText}>{post.commentCount || 0}</Text>
            </Pressable>

            <Pressable
              style={styles.postAction}
              hitSlop={8}
              onPress={onRepostPress}
            >
              <Ionicons
                name={post.isReposted ? 'repeat' : 'repeat-outline'}
                size={20}
                color={post.isReposted ? colors.repost : colors.icon}
              />
              <Text style={[styles.postActionText, post.isReposted && styles.postActionReposted]}>
                {post.repostCount || 0}
              </Text>
            </Pressable>

            <Pressable
              style={styles.postAction}
              onPress={isAuthenticated ? onLike : undefined}
              disabled={!isAuthenticated}
              hitSlop={8}
            >
              <Ionicons
                name={post.isLiked ? 'heart' : 'heart-outline'}
                size={18}
                color={post.isLiked ? colors.like : colors.icon}
              />
              <Text style={[styles.postActionText, post.isLiked && styles.postActionLiked]}>
                {post.likeCount || 0}
              </Text>
            </Pressable>

            <Pressable style={styles.postAction} onPress={onSharePress} hitSlop={8}>
              <Ionicons name="share-outline" size={18} color={colors.icon} />
            </Pressable>

            <Pressable style={styles.postAction} onPress={onBookmarkPress} hitSlop={8}>
              <Ionicons
                name={post.isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={post.isBookmarked ? colors.bookmark : colors.icon}
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
  userName,
  userAvatar,
  unreadNotificationsCount,
}: FeedScreenProps) {
  const { user } = useAuth();
  const { colors, colorScheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'recent' | 'popular'>('recent');
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

  const { data: trendingItems, isLoading: trendingLoading } = useTrendingItems();
  const { data: microblogs, isLoading, refetch } = useMicroblogs(activeTab, selectedTrending ? { type: selectedTrending.type, value: selectedTrending.value } : null);
  const likeMutation = useLikeMicroblog();
  const createMutation = useCreateMicroblog();
  const deleteMutation = useDeletePost();
  const reportMutation = useReportPost();
  const { data: comments = [], isLoading: commentsLoading } = useComments(selectedPostForComments?.id || null);
  const createCommentMutation = useCreateComment();
  const repostMutation = useRepostMicroblog();
  const bookmarkMutation = useBookmarkMicroblog();

  const handleLike = (postId: number, isLiked: boolean) => {
    if (!user) return;
    likeMutation.mutate({ postId, isLiked });
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

  const handleRepost = (postId: number) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to repost.');
      return;
    }

    // Directly repost to followers without confirmation
    repostMutation.mutate(postId);
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

  const handleBookmark = (postId: number, isBookmarked: boolean) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to bookmark posts.');
      return;
    }
    bookmarkMutation.mutate({ postId, isBookmarked });
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
    if (!postContent.trim()) return;

    try {
      const FileSystem = await import('expo-file-system');
      let mediaUrls: string[] = [];
      let videoUrl: string | null = null;

      // Convert multiple images to base64
      if (selectedImages.length > 0) {
        for (const imageUri of selectedImages) {
          const base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const extension = imageUri.split('.').pop()?.toLowerCase();
          const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
          mediaUrls.push(`data:${mimeType};base64,${base64}`);
        }
      }

      // Convert video to base64 if selected
      if (selectedVideo) {
        const base64 = await FileSystem.readAsStringAsync(selectedVideo, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const extension = selectedVideo.split('.').pop()?.toLowerCase();
        const mimeType = `video/${extension || 'mp4'}`;
        videoUrl = `data:${mimeType};base64,${base64}`;
      }

      createMutation.mutate(
        {
          content: postContent,
          imageUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
          videoUrl: videoUrl || undefined,
          gifUrl: selectedGif || undefined,
        },
        {
          onSuccess: (data) => {
            setPostContent('');
            setSelectedImages([]);
            setSelectedVideo(null);
            setSelectedGif(null);
            setMediaType(null);
            setShowComposer(false);
            Alert.alert('Success', 'Post created successfully!');
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

            Alert.alert('Error', `Failed to create post: ${errorMessage}\n\nStatus: ${error?.response?.status || 'Unknown'}`);
          },
        }
      );
    } catch (error) {
      console.error('Error preparing post:', error);
      Alert.alert('Error', 'Failed to prepare media. Please try again.');
    }
  };

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Dynamic styles based on theme
  const styles = getStyles(colors, colorScheme);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
      />

      {/* Trending Section (Hashtags + Keywords) */}
      <View style={styles.trendingSection}>
        <View style={styles.trendingHeader}>
          <Ionicons name="trending-up" size={18} color={colors.primary} />
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
          {trendingLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
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
                    styles.hashtagBadge,
                    isActive && styles.hashtagBadgeActive
                  ]}
                  onPress={() => setSelectedTrending({ type: item.type, value: tag, display: displayText })}
                >
                  <Text style={[
                    styles.hashtagText,
                    isActive && styles.hashtagTextActive
                  ]}>
                    {isHashtag ? '#' : ''}{displayText}
                  </Text>
                  <Text style={styles.hashtagCount}>{item.trendingScore}</Text>
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
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'recent' && styles.tabActive]}
          onPress={() => setActiveTab('recent')}
        >
          <Text style={[styles.tabText, activeTab === 'recent' && styles.tabTextActive]}>Latest</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'popular' && styles.tabActive]}
          onPress={() => setActiveTab('popular')}
        >
          <Text style={[styles.tabText, activeTab === 'popular' && styles.tabTextActive]}>Popular</Text>
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
        ) : microblogs && microblogs.length > 0 ? (
          microblogs.map((post) => (
            <PostItem
              key={post.id}
              post={post}
              onLike={() => handleLike(post.id, post.isLiked || false)}
              onMorePress={() => handleMorePress(post)}
              onCommentPress={() => handleOpenComments(post)}
              onRepostPress={() => handleRepost(post.id)}
              onSharePress={() => handleShare(post)}
              onBookmarkPress={() => handleBookmark(post.id, post.isBookmarked || false)}
              isAuthenticated={!!user}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.mutedForeground} />
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
              }} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
              <Pressable
                onPress={handleCreatePost}
                disabled={!postContent.trim() || createMutation.isPending}
                style={[
                  styles.postButton,
                  (!postContent.trim() || createMutation.isPending) && styles.postButtonDisabled,
                ]}
              >
                <Text style={styles.postButtonText}>
                  {createMutation.isPending ? 'Posting...' : 'Post'}
                </Text>
              </Pressable>
            </View>

            {/* Composer Body */}
            <ScrollView style={styles.composerScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.composerBody}>
                <Image source={{ uri: getAvatarUrl(user) }} style={styles.composerAvatar} />
                <View style={styles.composerContent}>
                  <TextInput
                    style={styles.composerInput}
                    placeholder="What's happening?"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    value={postContent}
                    onChangeText={setPostContent}
                    autoFocus
                  />

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
                        <Ionicons name="videocam" size={48} color={colors.icon} />
                        <Text style={styles.videoText}>Video selected</Text>
                      </View>
                      <Pressable
                        style={styles.mediaRemove}
                        onPress={() => {
                          setSelectedVideo(null);
                          setMediaType(null);
                        }}
                      >
                        <Ionicons name="close-circle" size={28} color={colors.text} />
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
                        <Ionicons name="close-circle" size={28} color={colors.text} />
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Media Toolbar - Instagram/Twitter Style with Camera */}
            <View style={styles.mediaToolbar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.mediaButtons}>
                  <Pressable style={styles.mediaButton} onPress={handlePickImage} hitSlop={8}>
                    <Ionicons name="image-outline" size={22} color={colors.accent} />
                  </Pressable>
                  <Pressable style={styles.mediaButton} onPress={handleTakePhoto} hitSlop={8}>
                    <Ionicons name="camera-outline" size={22} color={colors.accent} />
                  </Pressable>
                  <Pressable style={styles.mediaButton} onPress={handlePickVideo} hitSlop={8}>
                    <Ionicons name="videocam-outline" size={22} color={colors.accent} />
                  </Pressable>
                  <Pressable style={styles.mediaButton} onPress={handleTakeVideo} hitSlop={8}>
                    <Ionicons name="film-outline" size={22} color={colors.accent} />
                  </Pressable>
                  <Pressable style={styles.mediaButton} onPress={handleOpenGifPicker} hitSlop={8}>
                    <Text style={styles.gifButtonText}>GIF</Text>
                  </Pressable>
                  <Pressable style={styles.mediaButton} hitSlop={8}>
                    <Ionicons name="location-outline" size={22} color={colors.accent} />
                  </Pressable>
                </View>
              </ScrollView>

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
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
              <Text style={[styles.commentsTitle, { color: colors.text }]}>Choose a GIF</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Search Bar */}
            <View style={[styles.gifSearchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.gifSearchInput, { color: colors.text }]}
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
                  <Ionicons name="images-outline" size={64} color={colors.mutedForeground} />
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
                <Ionicons name="close" size={24} color={colors.text} />
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
                  <Ionicons name="chatbubbles-outline" size={48} color={colors.mutedForeground} />
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
                      ? colors.mutedForeground
                      : colors.accent
                  }
                />
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
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
    backgroundColor: colors.surface,
  },
  trendingSection: {
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.text,
  },
  trendingTags: {
    gap: 8,
  },
  hashtagBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: isDark ? '#1E3A5F' : '#EFF6FF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: isDark ? '#2563EB' : '#BFDBFE',
  },
  hashtagText: {
    fontSize: 13,
    fontWeight: '600',
    color: isDark ? '#60A5FA' : '#1E40AF',
  },
  hashtagBadgeActive: {
    backgroundColor: isDark ? '#2563EB' : '#3B82F6',
    borderColor: isDark ? '#3B82F6' : '#2563EB',
  },
  hashtagTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  hashtagCount: {
    fontSize: 11,
    fontWeight: '600',
    color: isDark ? '#60A5FA' : '#1E40AF',
    marginLeft: 4,
  },
  clearFilterButton: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearFilterText: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '600',
  },
  filterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: isDark ? '#1E3A5F' : '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#1D9BF0',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.text,
  },
  feed: {
    flex: 1,
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
    color: colors.text,
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
  postCard: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  postContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.borderLight,
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
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginRight: 4,
  },
  postUsername: {
    fontSize: 15,
    color: colors.textSecondary,
    marginRight: 4,
  },
  postDot: {
    fontSize: 15,
    color: colors.textSecondary,
    marginRight: 4,
  },
  postTime: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  postMoreButton: {
    padding: 4,
    marginLeft: 8,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
    marginTop: 4,
    marginBottom: 12,
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
    color: colors.textSecondary,
    fontWeight: '400',
  },
  postActionLiked: {
    color: colors.like,
  },
  postActionReposted: {
    color: colors.repost,
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
    borderBottomColor: colors.border,
  },
  postButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: colors.mutedForeground,
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
    backgroundColor: colors.borderLight,
  },
  composerContent: {
    flex: 1,
    marginLeft: 12,
  },
  composerInput: {
    fontSize: 18,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  mediaPreview: {
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.borderLight,
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
    backgroundColor: colors.muted,
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
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 20, 25, 0.75)',
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
    backgroundColor: colors.borderLight,
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
  },
  imageCounter: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  imageCounterText: {
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    backgroundColor: colors.muted,
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
    borderTopColor: colors.border,
  },
  mediaButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  mediaButton: {
    padding: 4,
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
    color: colors.text,
  },
  originalPost: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    borderBottomColor: colors.border,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.borderLight,
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
    color: colors.text,
    marginRight: 4,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyCommentsText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
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
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  commentInputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.borderLight,
    marginBottom: 8,
  },
  commentInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    minHeight: 36,
    maxHeight: 100,
    marginLeft: 12,
    marginRight: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.muted,
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
    backgroundColor: colors.borderLight,
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
    borderTopColor: colors.border,
  },
  giphyText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
};
