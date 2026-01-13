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

function useMicroblogs(filter: 'recent' | 'popular') {
  const { user } = useAuth();

  return useQuery<Microblog[]>({
    queryKey: ['/api/microblogs', filter],
    queryFn: async () => {
      try {
        // Fetch microblogs (feed posts - Twitter-like, always public, never anonymous)
        const response = await apiClient.get('/api/microblogs');
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

        // Sort by creation date (most recent first)
        return microblogsWithAuthors.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } catch (error) {
        console.error('Error fetching microblogs:', error);
        throw error;
      }
    },
    enabled: false, // Disabled until microblogs endpoint is implemented on server
  });
}

function useLikeMicroblog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: number; isLiked: boolean }) => {
      // Toggle like/unlike on microblog
      if (isLiked) {
        await apiClient.delete(`/api/microblogs/${postId}/like`);
      } else {
        await apiClient.post(`/api/microblogs/${postId}/like`);
      }
    },
    onMutate: async ({ postId, isLiked }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['/api/microblogs'] });

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
    },
    onError: () => {
      // Revert on error
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
        contentType: 'microblog',
        contentId: postId,
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
    queryKey: ['/api/posts', postId, 'comments'],
    queryFn: async () => {
      if (!postId) return [];
      const response = await apiClient.get(`/api/posts/${postId}/comments`);
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
      queryClient.invalidateQueries({ queryKey: ['/api/posts', variables.postId, 'comments'] });
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
      if (isBookmarked) {
        await apiClient.delete(`/api/microblogs/${postId}/bookmark`);
      } else {
        await apiClient.post(`/api/microblogs/${postId}/bookmark`);
      }
    },
    onMutate: async ({ postId, isBookmarked }) => {
      // Optimistic update
      queryClient.setQueriesData({ queryKey: ['/api/microblogs'] }, (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((post: Microblog) =>
          post.id === postId
            ? { ...post, isBookmarked: !isBookmarked }
            : post
        );
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/microblogs'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', 'Failed to update bookmark. Please try again.');
      queryClient.invalidateQueries({ queryKey: ['/api/microblogs'] });
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
              <Ionicons name="ellipsis-horizontal" size={18} color="#536471" />
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
              <Ionicons name="chatbubble-outline" size={18} color="#536471" />
              {post.commentCount > 0 && (
                <Text style={styles.postActionText}>{post.commentCount}</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.postAction}
              hitSlop={8}
              onPress={onRepostPress}
            >
              <Ionicons name="repeat-outline" size={20} color="#536471" />
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
                color={post.isLiked ? '#F91880' : '#536471'}
              />
              {post.likeCount > 0 && (
                <Text style={[styles.postActionText, post.isLiked && styles.postActionLiked]}>
                  {post.likeCount}
                </Text>
              )}
            </Pressable>

            <Pressable style={styles.postAction} onPress={onSharePress} hitSlop={8}>
              <Ionicons name="share-outline" size={18} color="#536471" />
            </Pressable>

            <Pressable style={styles.postAction} onPress={onBookmarkPress} hitSlop={8}>
              <Ionicons
                name={post.isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={post.isBookmarked ? '#1D9BF0' : '#536471'}
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPostForComments, setSelectedPostForComments] = useState<Microblog | null>(null);
  const [commentContent, setCommentContent] = useState('');

  const { data: microblogs, isLoading, refetch } = useMicroblogs(activeTab);
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

    Alert.alert(
      'Repost',
      'Repost this to your followers?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Repost',
          onPress: () => {
            repostMutation.mutate(postId);
          },
        },
      ]
    );
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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant photo library permissions');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [ImagePicker.MediaType.Images],
      allowsEditing: true,
      aspect: [16, 9] as [number, number],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setSelectedVideo(null);
    }
  };

  const handlePickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant photo library permissions');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [ImagePicker.MediaType.Videos],
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedVideo(result.assets[0].uri);
      setSelectedImage(null);
    }
  };

  const handleCreatePost = () => {
    if (!postContent.trim()) return;


    createMutation.mutate(
      { content: postContent },
      {
        onSuccess: (data) => {
          setPostContent('');
          setSelectedImage(null);
          setSelectedVideo(null);
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

      {/* Search Bar */}
      <Pressable onPress={onSearchPress} style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#64748B" />
        <Text style={styles.searchPlaceholder}>Search feed...</Text>
      </Pressable>

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
            <ActivityIndicator size="large" color="#222D99" />
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
            <Ionicons name="chatbubbles-outline" size={64} color="#D1D8DE" />
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
                setSelectedImage(null);
                setSelectedVideo(null);
                setPostContent('');
              }} hitSlop={8}>
                <Ionicons name="close" size={24} color="#0F1419" />
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
                    placeholderTextColor="#536471"
                    multiline
                    value={postContent}
                    onChangeText={setPostContent}
                    autoFocus
                  />

                  {/* Media Preview */}
                  {selectedImage && (
                    <View style={styles.mediaPreview}>
                      <Image source={{ uri: selectedImage }} style={styles.mediaImage} />
                      <Pressable
                        style={styles.mediaRemove}
                        onPress={() => setSelectedImage(null)}
                      >
                        <Ionicons name="close-circle" size={28} color="#0F1419" />
                      </Pressable>
                    </View>
                  )}

                  {selectedVideo && (
                    <View style={styles.mediaPreview}>
                      <View style={styles.videoPlaceholder}>
                        <Ionicons name="videocam" size={48} color="#536471" />
                        <Text style={styles.videoText}>Video selected</Text>
                      </View>
                      <Pressable
                        style={styles.mediaRemove}
                        onPress={() => setSelectedVideo(null)}
                      >
                        <Ionicons name="close-circle" size={28} color="#0F1419" />
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Media Toolbar - Twitter Style */}
            <View style={styles.mediaToolbar}>
              <View style={styles.mediaButtons}>
                <Pressable style={styles.mediaButton} onPress={handlePickImage} hitSlop={8}>
                  <Ionicons name="image-outline" size={22} color="#1D9BF0" />
                </Pressable>
                <Pressable style={styles.mediaButton} onPress={handlePickVideo} hitSlop={8}>
                  <Ionicons name="videocam-outline" size={22} color="#1D9BF0" />
                </Pressable>
                <Pressable style={styles.mediaButton} hitSlop={8}>
                  <Ionicons name="bar-chart-outline" size={22} color="#1D9BF0" />
                </Pressable>
                <Pressable style={styles.mediaButton} hitSlop={8}>
                  <Ionicons name="happy-outline" size={22} color="#1D9BF0" />
                </Pressable>
                <Pressable style={styles.mediaButton} hitSlop={8}>
                  <Ionicons name="calendar-outline" size={22} color="#1D9BF0" />
                </Pressable>
                <Pressable style={styles.mediaButton} hitSlop={8}>
                  <Ionicons name="location-outline" size={22} color="#1D9BF0" />
                </Pressable>
              </View>

              {/* Character Count */}
              <View style={styles.charCount}>
                <Text style={styles.charCountText}>{postContent.length}/280</Text>
              </View>
            </View>
          </KeyboardAvoidingView>
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
                <Ionicons name="close" size={24} color="#0F1419" />
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
                  <ActivityIndicator size="small" color="#222D99" />
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
                  <Ionicons name="chatbubbles-outline" size={48} color="#D1D8DE" />
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
                placeholderTextColor="#536471"
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
                      ? '#8ED0F9'
                      : '#1D9BF0'
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: isDark ? '#2F3336' : '#EFF3F4',
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 20,
  },
  searchPlaceholder: {
    fontSize: 15,
    color: '#64748B',
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
    color: '#0D1829',
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
    color: '#F91880',
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
    backgroundColor: '#1D9BF0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: '#8ED0F9',
    opacity: 0.5,
  },
  postButtonText: {
    color: '#FFFFFF',
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
    backgroundColor: '#F7F9F9',
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
    backgroundColor: 'rgba(15, 20, 25, 0.75)',
    borderRadius: 14,
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
    backgroundColor: isDark ? '#2F3336' : '#F7F9F9',
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
});
};
