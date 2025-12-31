/**
 * FEED SCREEN - The Connection Mobile App
 * ----------------------------------------
 * Native React Native feed with real API integration
 * Instagram-style interface with stories and posts
 * 
 * DESIGN SYSTEM:
 * - Primary: #0B132B (Deep Navy Blue)
 * - Secondary: #222D99 (Rich Royal Blue)
 * - Background: #F5F8FA (Soft White)
 * - Text: #0D1829
 * - Muted: #637083
 * - Border: #D1D8DE
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/apiClient';
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share2,
  MoreHorizontal,
  BadgeCheck,
  Image as ImageIcon,
  Smile,
  MapPin,
  Plus,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

interface User {
  id: number;
  username: string;
  full_name?: string;
  displayName?: string;
  profile_image_url?: string;
  avatarUrl?: string;
  isVerified?: boolean;
}

interface Post {
  id: number;
  content: string;
  image_url?: string;
  imageUrl?: string;
  created_at: string;
  createdAt?: string;
  author: User;
  likes_count?: number;
  likesCount?: number;
  comments_count?: number;
  commentsCount?: number;
  shares_count?: number;
  sharesCount?: number;
  is_liked?: boolean;
  isLiked?: boolean;
  is_reposted?: boolean;
  isReposted?: boolean;
}

interface Story {
  id: number;
  user: User;
  has_unviewed?: boolean;
  hasUnviewed?: boolean;
  preview_url?: string;
  previewUrl?: string;
}

// ============================================================================
// API HOOKS
// ============================================================================

function useFeed(tab: 'foryou' | 'following') {
  return useQuery({
    queryKey: ['feed', tab],
    queryFn: async (): Promise<Post[]> => {
      const endpoint = tab === 'following' ? '/microblogs/following' : '/microblogs';
      const response = await apiClient.get(endpoint);
      return response.data;
    },
  });
}

function useStories() {
  return useQuery({
    queryKey: ['stories'],
    queryFn: async (): Promise<Story[]> => {
      const response = await apiClient.get('/stories');
      return response.data;
    },
    retry: false,
  });
}

function useLikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: number) => {
      const response = await apiClient.post(`/microblogs/${postId}/like`);
      return response.data;
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });

      queryClient.setQueriesData({ queryKey: ['feed'] }, (old: Post[] | undefined) => {
        if (!old) return old;
        return old.map((post) =>
          post.id === postId
            ? {
                ...post,
                is_liked: !post.is_liked,
                isLiked: !post.isLiked,
                likes_count: post.is_liked ? (post.likes_count || 0) - 1 : (post.likes_count || 0) + 1,
                likesCount: post.isLiked ? (post.likesCount || 0) - 1 : (post.likesCount || 0) + 1,
              }
            : post
        );
      });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, imageUrl }: { content: string; imageUrl?: string }) => {
      const response = await apiClient.post('/microblogs', { content, image_url: imageUrl });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

// ============================================================================
// HELPERS
// ============================================================================

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarUrl(user: User): string {
  const url = user.profile_image_url || user.avatarUrl;
  if (url) return url;
  const name = user.full_name || user.displayName || user.username;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=222D99&color=fff`;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StoryItemProps {
  story?: Story;
  isYourStory?: boolean;
  currentUser?: any;
  onPress?: () => void;
}

const StoryItem: React.FC<StoryItemProps> = ({ story, isYourStory, currentUser, onPress }) => {
  const user = story?.user || currentUser;
  const displayName = user?.full_name || user?.displayName || user?.username || 'You';
  const hasUnviewed = story?.has_unviewed ?? story?.hasUnviewed ?? false;

  return (
    <TouchableOpacity style={styles.storyItem} onPress={onPress} activeOpacity={0.7}>
      <View
        style={[
          styles.storyRing,
          hasUnviewed ? styles.storyRingActive : styles.storyRingInactive,
        ]}
      >
        <View style={styles.storyInnerRing}>
          <Image source={{ uri: getAvatarUrl(user) }} style={styles.storyAvatar} />
        </View>
        {isYourStory && (
          <View style={styles.storyAddButton}>
            <Plus size={12} color="#fff" />
          </View>
        )}
      </View>
      <Text style={styles.storyName} numberOfLines={1}>
        {isYourStory ? 'Your Story' : displayName.split(' ')[0]}
      </Text>
    </TouchableOpacity>
  );
};

interface PostItemProps {
  post: Post;
  onLike: (postId: number) => void;
  onComment?: (postId: number) => void;
  onShare?: (postId: number) => void;
}

const PostItem: React.FC<PostItemProps> = ({ post, onLike, onComment, onShare }) => {
  const displayName = post.author.full_name || post.author.displayName || post.author.username;
  const imageUrl = post.image_url || post.imageUrl;
  const createdAt = post.created_at || post.createdAt || '';
  const likesCount = post.likes_count ?? post.likesCount ?? 0;
  const commentsCount = post.comments_count ?? post.commentsCount ?? 0;
  const sharesCount = post.shares_count ?? post.sharesCount ?? 0;
  const isLiked = post.is_liked ?? post.isLiked ?? false;
  const isReposted = post.is_reposted ?? post.isReposted ?? false;

  return (
    <View style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.postHeaderLeft}>
          <Image source={{ uri: getAvatarUrl(post.author) }} style={styles.postAvatar} />
          <View>
            <View style={styles.postAuthorRow}>
              <Text style={styles.postAuthorName}>{displayName}</Text>
              {post.author.isVerified && <BadgeCheck size={16} color="#222D99" fill="#E3F2FD" />}
            </View>
            <View style={styles.postMetaRow}>
              <Text style={styles.postMetaText}>@{post.author.username}</Text>
              <Text style={styles.postMetaText}>•</Text>
              <Text style={styles.postMetaText}>{formatTime(createdAt)}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.postMenuButton}>
          <MoreHorizontal size={20} color="#637083" />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <Text style={styles.postContent}>{post.content}</Text>

      {/* Post Image */}
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}

      {/* Post Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.postAction}
          onPress={() => onLike(post.id)}
          activeOpacity={0.7}
        >
          <Heart
            size={20}
            color={isLiked ? '#D4183D' : '#637083'}
            fill={isLiked ? '#D4183D' : 'transparent'}
          />
          <Text style={[styles.postActionText, isLiked && styles.postActionTextLiked]}>
            {likesCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.postAction}
          onPress={() => onComment?.(post.id)}
          activeOpacity={0.7}
        >
          <MessageCircle size={20} color="#637083" />
          <Text style={styles.postActionText}>{commentsCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.postAction} activeOpacity={0.7}>
          <Repeat2
            size={20}
            color={isReposted ? '#10B981' : '#637083'}
          />
          <Text style={[styles.postActionText, isReposted && styles.postActionTextReposted]}>
            {sharesCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.postAction}
          onPress={() => onShare?.(post.id)}
          activeOpacity={0.7}
        >
          <Share2 size={20} color="#637083" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FeedScreen() {
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');
  const [postContent, setPostContent] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { user: currentUser } = useAuth();
  const { data: posts, isLoading, error, refetch } = useFeed(activeTab);
  const { data: stories } = useStories();
  const likePost = useLikePost();
  const createPost = useCreatePost();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleSubmitPost = async () => {
    if (!postContent.trim()) return;

    try {
      await createPost.mutateAsync({ content: postContent });
      setPostContent('');
      setIsComposing(false);
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  const handleLike = (postId: number) => {
    likePost.mutate(postId);
  };

  const renderHeader = () => (
    <>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('foryou')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'foryou' && styles.tabTextActive]}>
            For You
          </Text>
          {activeTab === 'foryou' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('following')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.tabTextActive]}>
            Following
          </Text>
          {activeTab === 'following' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Stories Rail */}
      <View style={styles.storiesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
          <StoryItem isYourStory currentUser={currentUser} />
          {stories?.map((story) => (
            <StoryItem key={story.id} story={story} />
          ))}
          {(!stories || stories.length === 0) && (
            <View style={styles.storiesEmpty}>
              <Text style={styles.storiesEmptyText}>Follow people to see their stories</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Create Post */}
      <View style={styles.createPost}>
        <Image
          source={{ uri: getAvatarUrl({ 
            id: 0, 
            username: '', 
            displayName: currentUser?.displayName || currentUser?.full_name || 'You', 
            avatarUrl: currentUser?.profile_image_url 
          } as User) }}
          style={styles.createPostAvatar}
        />
        <View style={styles.createPostContent}>
          {isComposing ? (
            <TextInput
              style={styles.createPostInput}
              value={postContent}
              onChangeText={setPostContent}
              placeholder="Share what's on your heart..."
              placeholderTextColor="#637083"
              multiline
              autoFocus
            />
          ) : (
            <TouchableOpacity
              style={styles.createPostPlaceholder}
              onPress={() => setIsComposing(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.createPostPlaceholderText}>Share what's on your heart...</Text>
            </TouchableOpacity>
          )}
          <View style={styles.createPostActions}>
            <View style={styles.createPostIcons}>
              <TouchableOpacity style={styles.createPostIcon}>
                <ImageIcon size={20} color="#222D99" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.createPostIcon}>
                <Smile size={20} color="#222D99" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.createPostIcon}>
                <MapPin size={20} color="#222D99" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[
                styles.createPostButton,
                (!postContent.trim() || createPost.isPending) && styles.createPostButtonDisabled,
              ]}
              disabled={!postContent.trim() || createPost.isPending}
              onPress={handleSubmitPost}
            >
              {createPost.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.createPostButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <MessageCircle size={28} color="#637083" />
      </View>
      <Text style={styles.emptyTitle}>
        {activeTab === 'following' ? 'No posts from people you follow' : 'No posts yet'}
      </Text>
      <Text style={styles.emptyText}>
        {activeTab === 'following'
          ? 'Follow more people to see their posts here'
          : 'Be the first to share something!'}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!posts || posts.length === 0) return null;
    
    return (
      <View style={styles.footer}>
        <View style={styles.footerIcon}>
          <BadgeCheck size={20} color="#637083" />
        </View>
        <Text style={styles.footerText}>You're all caught up!</Text>
      </View>
    );
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load posts</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => refetch()}>
          <Text style={styles.errorButtonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <FlatList
        data={posts || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <PostItem post={item} onLike={handleLike} />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={isLoading ? null : renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#222D99"
            colors={['#222D99']}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#222D99" />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  listContent: {
    paddingBottom: 20,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F5F8FA',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D8DE',
  },
  tab: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#637083',
  },
  tabTextActive: {
    color: '#0B132B',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 56,
    height: 4,
    backgroundColor: '#222D99',
    borderRadius: 2,
  },
  storiesContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D8DE',
    paddingVertical: 16,
  },
  storiesScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  storyItem: {
    alignItems: 'center',
    width: 72,
  },
  storyRing: {
    width: 68,
    height: 68,
    borderRadius: 16,
    padding: 3,
    marginBottom: 6,
  },
  storyRingActive: {
    backgroundColor: '#222D99',
  },
  storyRingInactive: {
    backgroundColor: '#D1D8DE',
  },
  storyInnerRing: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 13,
    padding: 2,
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 11,
  },
  storyAddButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#222D99',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  storyName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0B132B',
    textAlign: 'center',
  },
  storiesEmpty: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  storiesEmptyText: {
    fontSize: 14,
    color: '#637083',
  },
  createPost: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D1D8DE',
    flexDirection: 'row',
    gap: 12,
  },
  createPostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  createPostContent: {
    flex: 1,
  },
  createPostPlaceholder: {
    backgroundColor: '#F5F8FA',
    borderRadius: 16,
    height: 40,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D8DE',
  },
  createPostPlaceholderText: {
    fontSize: 14,
    color: '#637083',
  },
  createPostInput: {
    backgroundColor: '#F5F8FA',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0B132B',
    minHeight: 72,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#D1D8DE',
  },
  createPostActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  createPostIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  createPostIcon: {
    padding: 4,
  },
  createPostButton: {
    backgroundColor: '#222D99',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  createPostButtonDisabled: {
    opacity: 0.5,
  },
  createPostButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  postCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D1D8DE',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postHeaderLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postAuthorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0B132B',
  },
  postMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  postMetaText: {
    fontSize: 12,
    color: '#637083',
  },
  postMenuButton: {
    padding: 4,
    marginRight: -8,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#0B132B',
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D1D8DE',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  postActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#637083',
  },
  postActionTextLiked: {
    color: '#D4183D',
  },
  postActionTextReposted: {
    color: '#10B981',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F5F8FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D1D8DE',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0B132B',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#637083',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F8FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#D1D8DE',
  },
  footerText: {
    fontSize: 14,
    color: '#637083',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 248, 250, 0.8)',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F8FA',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: '#222D99',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
