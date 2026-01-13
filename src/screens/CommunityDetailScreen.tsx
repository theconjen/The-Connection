/**
 * COMMUNITY DETAIL SCREEN - The Connection Mobile App
 * ---------------------------------------------------
 * Detailed view of a community with wall posts, members, and events
 *
 * API Endpoints:
 * - GET /api/communities/:id
 * - GET /api/communities/:id/members
 * - GET /api/communities/:id/wall
 * - POST /api/communities/:id/wall
 * - POST /api/communities/:id/leave
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import apiClient from '../lib/apiClient';

// ============================================================================
// TYPES
// ============================================================================

interface Community {
  id: number;
  name: string;
  description: string;
  slug: string;
  memberCount?: number;
  iconName?: string;
  iconColor?: string;
  isPrivate?: boolean;
  createdBy: number;
}

interface Member {
  id: number;
  userId: number;
  communityId: number;
  role: 'owner' | 'moderator' | 'member';
  joinedAt: string;
  user: {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

interface WallPost {
  id: number;
  communityId: number;
  authorId: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

interface PrayerRequest {
  id: number;
  communityId?: number;
  authorId: number;
  title: string;
  content: string;
  isAnonymous: boolean;
  prayerCount: number;
  createdAt: string;
  author?: {
    id: number;
    username: string;
    displayName?: string;
  };
}

interface CommunityDetailScreenProps {
  communityId: number;
  onBack?: () => void;
  onCreateEvent?: () => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const iconOptions = [
  { value: 'users', ionicon: 'people-outline' },
  { value: 'book', ionicon: 'book-outline' },
  { value: 'heart', ionicon: 'heart-outline' },
  { value: 'music', ionicon: 'musical-notes-outline' },
  { value: 'camera', ionicon: 'camera-outline' },
  { value: 'coffee', ionicon: 'cafe-outline' },
  { value: 'globe', ionicon: 'globe-outline' },
  { value: 'star', ionicon: 'star-outline' },
  { value: 'home', ionicon: 'home-outline' },
  { value: 'messages', ionicon: 'chatbubble-outline' },
  { value: 'calendar', ionicon: 'calendar-outline' },
  { value: 'map', ionicon: 'map-outline' },
  { value: 'shield', ionicon: 'shield-outline' },
  { value: 'lightning', ionicon: 'flash-outline' },
  { value: 'target', ionicon: 'radio-button-on-outline' },
  { value: 'activity', ionicon: 'pulse-outline' },
  { value: 'briefcase', ionicon: 'briefcase-outline' },
  { value: 'palette', ionicon: 'color-palette-outline' },
  { value: 'graduation', ionicon: 'school-outline' },
];

function getCommunityIconName(iconName?: string): string {
  const icon = iconOptions.find(opt => opt.value === iconName);
  return icon?.ionicon || 'people-outline';
}

function getCommunityColor(iconColor?: string): string {
  const colorMap: { [key: string]: string } = {
    primary: '#222D99',
    purple: '#9B59B6',
    blue: '#4A90E2',
    green: '#27AE60',
    orange: '#E67E22',
    red: '#E74C3C',
  };
  return colorMap[iconColor || 'primary'] || '#222D99';
}

// ============================================================================
// API HOOKS
// ============================================================================

function useCommunity(communityId: number) {
  return useQuery<Community>({
    queryKey: [`/api/communities/${communityId}`],
    queryFn: async () => {
      const response = await apiClient.get(`/api/communities/${communityId}`);
      return response.data;
    },
  });
}

function useMembers(communityId: number) {
  return useQuery<Member[]>({
    queryKey: [`/api/communities/${communityId}/members`],
    queryFn: async () => {
      const response = await apiClient.get(`/api/communities/${communityId}/members`);
      return response.data;
    },
  });
}

function useWallPosts(communityId: number) {
  return useQuery<WallPost[]>({
    queryKey: [`/api/communities/${communityId}/wall`],
    queryFn: async () => {
      const response = await apiClient.get(`/api/communities/${communityId}/wall`);
      return response.data;
    },
  });
}

function useCreateWallPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ communityId, content }: { communityId: number; content: string }) => {
      const response = await apiClient.post(`/api/communities/${communityId}/wall`, { content });
      return response.data;
    },
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${communityId}/wall`] });
    },
  });
}

function usePrayerRequests(communityId: number) {
  return useQuery<PrayerRequest[]>({
    queryKey: [`/api/communities/${communityId}/prayer-requests`],
    queryFn: async () => {
      const response = await apiClient.get(`/api/communities/${communityId}/prayer-requests`);
      return response.data;
    },
  });
}

function useCreatePrayerRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ communityId, title, content, isAnonymous }: { communityId: number; title: string; content: string; isAnonymous?: boolean }) => {
      const response = await apiClient.post(`/api/communities/${communityId}/prayer-requests`, { title, content, isAnonymous });
      return response.data;
    },
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${communityId}/prayer-requests`] });
    },
  });
}

function useLeaveCommunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (communityId: number) => {
      const response = await apiClient.post(`/api/communities/${communityId}/leave`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communities'] });
    },
  });
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface WallPostCardProps {
  post: WallPost;
  colors: any;
}

const WallPostCard: React.FC<WallPostCardProps> = ({ post, colors }) => {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.muted,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 18 }}>
            {(post.author.displayName || post.author.username).charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>
              {post.author.displayName || post.author.username}
            </Text>
            <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
              @{post.author.username}
            </Text>
            <Text style={{ fontSize: 13, color: colors.mutedForeground }}>•</Text>
            <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
              {formatTime(post.createdAt)}
            </Text>
          </View>

          <Text style={{ fontSize: 15, lineHeight: 20, color: colors.foreground }}>
            {post.content}
          </Text>
        </View>
      </View>
    </View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CommunityDetailScreen({
  communityId,
  onBack,
  onCreateEvent,
}: CommunityDetailScreenProps) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'wall' | 'members' | 'prayers'>('wall');
  const [postContent, setPostContent] = useState('');
  const [prayerTitle, setPrayerTitle] = useState('');
  const [prayerContent, setPrayerContent] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data: community, isLoading: loadingCommunity } = useCommunity(communityId);
  const { data: members = [], isLoading: loadingMembers } = useMembers(communityId);
  const { data: wallPosts = [], isLoading: loadingPosts, refetch: refetchPosts } = useWallPosts(communityId);
  const { data: prayerRequests = [], isLoading: loadingPrayers, refetch: refetchPrayers } = usePrayerRequests(communityId);

  const createPostMutation = useCreateWallPost();
  const createPrayerMutation = useCreatePrayerRequest();
  const leaveMutation = useLeaveCommunity();

  const currentMember = members.find(m => m.userId === user?.id);
  const isMember = !!currentMember;
  const isAdmin = currentMember?.role === 'owner' || currentMember?.role === 'moderator';

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${communityId}`] }),
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${communityId}/members`] }),
      refetchPosts(),
      refetchPrayers(),
    ]);
    setRefreshing(false);
  };

  const handleCreatePost = () => {
    if (!postContent.trim()) {
      Alert.alert('Error', 'Please enter some content');
      return;
    }

    createPostMutation.mutate(
      { communityId, content: postContent.trim() },
      {
        onSuccess: () => {
          setPostContent('');
          Alert.alert('Success', 'Post created successfully!');
        },
        onError: (error: any) => {
          Alert.alert('Error', error.message || 'Failed to create post');
        },
      }
    );
  };

  const handleCreatePrayer = () => {
    if (!prayerTitle.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!prayerContent.trim()) {
      Alert.alert('Error', 'Please enter prayer request content');
      return;
    }

    createPrayerMutation.mutate(
      { communityId, title: prayerTitle.trim(), content: prayerContent.trim() },
      {
        onSuccess: () => {
          setPrayerTitle('');
          setPrayerContent('');
          Alert.alert('Success', 'Prayer request created successfully!');
        },
        onError: (error: any) => {
          Alert.alert('Error', error.message || 'Failed to create prayer request');
        },
      }
    );
  };

  const handleLeave = () => {
    Alert.alert(
      'Leave Community',
      `Are you sure you want to leave ${community?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            leaveMutation.mutate(communityId, {
              onSuccess: () => {
                Alert.alert('Success', 'You have left the community');
                onBack?.();
              },
              onError: (error: any) => {
                Alert.alert('Error', error.message || 'Failed to leave community');
              },
            });
          },
        },
      ]
    );
  };

  const styles = getStyles(colors);

  if (loadingCommunity) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#222D99" />
          <Text style={styles.loadingText}>Loading community...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!community) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.mutedForeground} />
          <Text style={styles.errorText}>Community not found</Text>
          <Pressable style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const iconName = getCommunityIconName(community.iconName);
  const iconColor = getCommunityColor(community.iconColor);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>{community.name}</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Community Header */}
        <View style={styles.communityHeader}>
          <View style={[styles.communityIcon, { backgroundColor: iconColor + '20' }]}>
            <Ionicons name={iconName as any} size={40} color={iconColor} />
          </View>
          <Text style={styles.communityName}>{community.name}</Text>
          <Text style={styles.communityDescription}>{community.description}</Text>

          <View style={styles.communityMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={16} color={colors.mutedForeground} />
              <Text style={styles.metaText}>{members.length} members</Text>
            </View>
            {community.isPrivate && (
              <View style={styles.metaItem}>
                <Ionicons name="lock-closed-outline" size={16} color={colors.mutedForeground} />
                <Text style={styles.metaText}>Private</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {isMember && (
              <Pressable style={styles.leaveButton} onPress={handleLeave}>
                <Text style={styles.leaveButtonText}>Leave Community</Text>
              </Pressable>
            )}
            {isAdmin && (
              <Pressable style={styles.createEventButton} onPress={onCreateEvent}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.createEventButtonText}>Create Event</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, activeTab === 'wall' && styles.tabActive]}
            onPress={() => setActiveTab('wall')}
          >
            <Text style={[styles.tabText, activeTab === 'wall' && styles.tabTextActive]}>
              Wall
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'prayers' && styles.tabActive]}
            onPress={() => setActiveTab('prayers')}
          >
            <Text style={[styles.tabText, activeTab === 'prayers' && styles.tabTextActive]}>
              Prayers
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'members' && styles.tabActive]}
            onPress={() => setActiveTab('members')}
          >
            <Text style={[styles.tabText, activeTab === 'members' && styles.tabTextActive]}>
              Members
            </Text>
          </Pressable>
        </View>

        {/* Wall Tab */}
        {activeTab === 'wall' && (
          <View>
            {/* Create Post (Members Only) */}
            {isMember && (
              <View style={styles.createPostContainer}>
                <TextInput
                  style={styles.postInput}
                  placeholder="Share something with the community..."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={3}
                  value={postContent}
                  onChangeText={setPostContent}
                />
                <Pressable
                  style={[
                    styles.postButton,
                    !postContent.trim() && styles.postButtonDisabled,
                  ]}
                  onPress={handleCreatePost}
                  disabled={!postContent.trim() || createPostMutation.isPending}
                >
                  <Text style={styles.postButtonText}>
                    {createPostMutation.isPending ? 'Posting...' : 'Post'}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Wall Posts */}
            {loadingPosts ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#222D99" />
              </View>
            ) : wallPosts.length > 0 ? (
              wallPosts.map(post => <WallPostCard key={post.id} post={post} colors={colors} />)
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color={colors.mutedForeground} />
                <Text style={styles.emptyText}>No posts yet</Text>
                <Text style={styles.emptySubtext}>
                  {isMember ? 'Be the first to post!' : 'Join to see posts'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Prayer Requests Tab */}
        {activeTab === 'prayers' && (
          <View>
            {/* Create Prayer Request (Members Only) */}
            {isMember && (
              <View style={styles.createPostContainer}>
                <TextInput
                  style={styles.postInput}
                  placeholder="Prayer request title..."
                  placeholderTextColor={colors.mutedForeground}
                  value={prayerTitle}
                  onChangeText={setPrayerTitle}
                />
                <TextInput
                  style={styles.postInput}
                  placeholder="Share your prayer request with the community..."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={3}
                  value={prayerContent}
                  onChangeText={setPrayerContent}
                />
                <Pressable
                  style={[
                    styles.postButton,
                    (!prayerTitle.trim() || !prayerContent.trim()) && styles.postButtonDisabled,
                  ]}
                  onPress={handleCreatePrayer}
                  disabled={!prayerTitle.trim() || !prayerContent.trim() || createPrayerMutation.isPending}
                >
                  <Text style={styles.postButtonText}>
                    {createPrayerMutation.isPending ? 'Posting...' : 'Post Prayer Request'}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Prayer Requests List */}
            {loadingPrayers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#222D99" />
              </View>
            ) : prayerRequests.length > 0 ? (
              prayerRequests.map(prayer => (
                <View key={prayer.id} style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.muted,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="heart-outline" size={20} color="#222D99" />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 4 }}>
                        {prayer.title}
                      </Text>
                      <Text style={{ fontSize: 15, lineHeight: 20, color: colors.foreground, marginBottom: 8 }}>
                        {prayer.content}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="heart" size={16} color="#E74C3C" />
                          <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
                            {prayer.prayerCount || 0} prayers
                          </Text>
                        </View>
                        {prayer.author && !prayer.isAnonymous && (
                          <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
                            by {prayer.author.displayName || prayer.author.username}
                          </Text>
                        )}
                        {prayer.isAnonymous && (
                          <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
                            Anonymous
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="heart-outline" size={48} color={colors.mutedForeground} />
                <Text style={styles.emptyText}>No prayer requests yet</Text>
                <Text style={styles.emptySubtext}>
                  {isMember ? 'Be the first to request prayer!' : 'Join to see prayer requests'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <View>
            {loadingMembers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#222D99" />
              </View>
            ) : (
              members.map(member => (
                <View key={member.id} style={styles.memberCard}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.muted,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>
                      {(member.user.displayName || member.user.username).charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>
                        {member.user.displayName || member.user.username}
                      </Text>
                      {member.role === 'owner' && (
                        <View style={styles.roleBadge}>
                          <Text style={styles.roleBadgeText}>Creator</Text>
                        </View>
                      )}
                      {member.role === 'moderator' && (
                        <View style={[styles.roleBadge, styles.roleBadgeModerator]}>
                          <Text style={styles.roleBadgeText}>Moderator</Text>
                        </View>
                      )}
                      {member.userId === user?.id && (
                        <Text style={{ fontSize: 13, color: colors.mutedForeground }}>(You)</Text>
                      )}
                    </View>
                    <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 2 }}>
                      @{member.user.username}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.foreground,
    },
    content: {
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
      color: colors.mutedForeground,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    errorText: {
      marginTop: 16,
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
    },
    backButton: {
      marginTop: 24,
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: '#222D99',
      borderRadius: 20,
    },
    backButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
    communityHeader: {
      alignItems: 'center',
      padding: 24,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    communityIcon: {
      width: 80,
      height: 80,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    communityName: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.foreground,
      marginBottom: 8,
      textAlign: 'center',
    },
    communityDescription: {
      fontSize: 15,
      lineHeight: 20,
      color: colors.mutedForeground,
      textAlign: 'center',
      marginBottom: 16,
    },
    communityMeta: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 16,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontSize: 14,
      color: colors.mutedForeground,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    leaveButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    leaveButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.mutedForeground,
    },
    createEventButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 20,
      backgroundColor: '#222D99',
    },
    createEventButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#fff',
    },
    tabs: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 14,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: {
      borderBottomColor: '#222D99',
    },
    tabText: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.mutedForeground,
    },
    tabTextActive: {
      color: '#222D99',
      fontWeight: '600',
    },
    createPostContainer: {
      padding: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    postInput: {
      backgroundColor: colors.muted,
      borderRadius: 12,
      padding: 12,
      fontSize: 15,
      color: colors.foreground,
      minHeight: 80,
      textAlignVertical: 'top',
      marginBottom: 12,
    },
    postButton: {
      backgroundColor: '#222D99',
      paddingVertical: 12,
      borderRadius: 20,
      alignItems: 'center',
    },
    postButtonDisabled: {
      backgroundColor: colors.muted,
    },
    postButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#fff',
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      marginTop: 16,
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
    },
    emptySubtext: {
      marginTop: 4,
      fontSize: 14,
      color: colors.mutedForeground,
    },
    memberCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    roleBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      backgroundColor: '#FEF3C7',
      borderRadius: 4,
    },
    roleBadgeModerator: {
      backgroundColor: '#DBEAFE',
    },
    roleBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#92400E',
    },
  });
