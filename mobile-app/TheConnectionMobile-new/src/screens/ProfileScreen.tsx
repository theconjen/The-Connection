/*
  PROFILE SCREEN - The Connection Mobile App (Production)
  --------------------------------------------------------
  Native React Native implementation for iOS/Android.
  Fetches real user data from the backend API.
  Handles both current user profile and viewing other profiles.
  
  DESIGN SYSTEM:
  - Primary: #0B132B (Deep Navy Blue)
  - Secondary: #222D99 (Rich Royal Blue)
  - Background: #F5F8FA (Soft White)
  - Text: #0D1829
  - Muted: #637083
  - Border: #D1D8DE
*/

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import {
  MapPin,
  Link as LinkIcon,
  Calendar,
  MoreHorizontal,
  MessageCircle,
  Repeat2,
  Heart,
  Share2,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/apiClient';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

interface User {
  id: number;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  location: string | null;
  website: string | null;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isVerified?: boolean;
  isFollowing?: boolean;
}

interface Community {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  memberCount: number;
  role: string;
  hasUpdates: boolean;
}

interface Post {
  id: number;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  type: 'text' | 'image' | 'event' | 'poll';
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  eventDetails?: {
    title: string;
    date: string;
    location: string;
  };
  pollOptions?: {
    id: number;
    label: string;
    votesPercent: number;
  }[];
  totalVotes?: number;
}

interface ProfileScreenProps {
  userId?: number;
  onBack?: () => void;
}

// ============================================================================
// API HOOKS
// ============================================================================

function useUserProfile(userId?: number) {
  const { user: currentUser } = useAuth();
  const targetId = userId || currentUser?.id;

  return useQuery({
    queryKey: ['user', targetId],
    queryFn: async (): Promise<User> => {
      const response = await apiClient.get(`/users/${targetId}`);
      return response.data;
    },
    enabled: !!targetId,
  });
}

function useUserCommunities(userId?: number) {
  const { user: currentUser } = useAuth();
  const targetId = userId || currentUser?.id;

  return useQuery({
    queryKey: ['user-communities', targetId],
    queryFn: async (): Promise<Community[]> => {
      const response = await apiClient.get(`/users/${targetId}/communities`);
      return response.data;
    },
    enabled: !!targetId,
  });
}

function useUserPosts(userId?: number) {
  const { user: currentUser } = useAuth();
  const targetId = userId || currentUser?.id;

  return useQuery({
    queryKey: ['user-posts', targetId],
    queryFn: async (): Promise<Post[]> => {
      const response = await apiClient.get(`/users/${targetId}/microblogs`);
      return response.data;
    },
    enabled: !!targetId,
  });
}

function useUserLikedPosts(userId?: number) {
  const { user: currentUser } = useAuth();
  const targetId = userId || currentUser?.id;

  return useQuery({
    queryKey: ['user-liked-posts', targetId],
    queryFn: async (): Promise<Post[]> => {
      const response = await apiClient.get(`/users/${targetId}/liked-microblogs`);
      return response.data;
    },
    enabled: !!targetId,
  });
}

function useFollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiClient.post(`/users/${userId}/follow`);
      return response.data;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
  });
}

function useUnfollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiClient.post(`/users/${userId}/unfollow`);
      return response.data;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
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

function getAvatarUrl(user: { displayName: string; avatarUrl: string | null }): string {
  if (user.avatarUrl) return user.avatarUrl;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user.displayName
  )}&background=222D99&color=fff`;
}

function getCoverUrl(user: User): string {
  if (user.coverUrl) return user.coverUrl;
  return 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=400&fit=crop';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffWeeks < 4) return `${diffWeeks}w`;
  return date.toLocaleDateString();
}

function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function CommunityItem({ community, onPress }: { community: Community; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.communityItem} onPress={onPress}>
      <View
        style={[
          styles.communityRing,
          community.hasUpdates ? styles.communityRingActive : styles.communityRingInactive,
        ]}
      >
        <View style={styles.communityInnerRing}>
          <Image
            source={{
              uri:
                community.imageUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  community.name
                )}&background=0B132B&color=fff`,
            }}
            style={styles.communityImage}
          />
        </View>
      </View>
      <Text style={styles.communityName} numberOfLines={2}>
        {community.name}
      </Text>
    </TouchableOpacity>
  );
}

function PostItem({
  post,
  user,
  onProfilePress,
}: {
  post: Post;
  user: User;
  onProfilePress: () => void;
}) {
  return (
    <View style={styles.postContainer}>
      <TouchableOpacity onPress={onProfilePress}>
        <Image source={{ uri: getAvatarUrl(user) }} style={styles.postAvatar} />
      </TouchableOpacity>

      <View style={styles.postContent}>
        <View style={styles.postHeader}>
          <View style={styles.postHeaderLeft}>
            <Text style={styles.postAuthorName}>{user.displayName}</Text>
            <Text style={styles.postAuthorUsername}>@{user.username}</Text>
            <Text style={styles.postTime}>• {formatTime(post.createdAt)}</Text>
          </View>
          <TouchableOpacity style={styles.postMoreButton}>
            <MoreHorizontal size={16} color="#637083" />
          </TouchableOpacity>
        </View>

        <Text style={styles.postText}>{post.content}</Text>

        {post.imageUrl && (
          <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
        )}

        {post.type === 'event' && post.eventDetails && (
          <View style={styles.eventCard}>
            <View style={styles.eventStripe} />
            <View style={styles.eventContent}>
              <View style={styles.eventDate}>
                <Text style={styles.eventMonth}>
                  {new Date(post.eventDetails.date).toLocaleDateString('en-US', { month: 'short' })}
                </Text>
                <Text style={styles.eventDay}>{new Date(post.eventDetails.date).getDate()}</Text>
              </View>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{post.eventDetails.title}</Text>
                <Text style={styles.eventDetails}>{post.eventDetails.date}</Text>
                <Text style={styles.eventDetails}>{post.eventDetails.location}</Text>
              </View>
            </View>
          </View>
        )}

        {post.type === 'poll' && post.pollOptions && (
          <View style={styles.pollContainer}>
            {post.pollOptions.map((option) => (
              <View key={option.id} style={styles.pollOption}>
                <View style={[styles.pollBar, { width: `${option.votesPercent}%` }]} />
                <View style={styles.pollTextContainer}>
                  <Text style={styles.pollLabel}>{option.label}</Text>
                  <Text style={styles.pollPercent}>{option.votesPercent}%</Text>
                </View>
              </View>
            ))}
            <Text style={styles.pollVotes}>
              {post.totalVotes} votes • Final results
            </Text>
          </View>
        )}

        <View style={styles.postActions}>
          <TouchableOpacity style={styles.postAction}>
            <MessageCircle size={16} color="#637083" />
            <Text style={styles.postActionText}>{post.commentsCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.postAction}>
            <Repeat2 size={16} color="#637083" />
            <Text style={styles.postActionText}>{post.sharesCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.postAction}>
            <Heart
              size={16}
              color={post.isLiked ? '#D4183D' : '#637083'}
              fill={post.isLiked ? '#D4183D' : 'transparent'}
            />
            <Text style={styles.postActionText}>{post.likesCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.postAction}>
            <Share2 size={16} color="#637083" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ProfileScreen({ userId, onBack }: ProfileScreenProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'communities' | 'likes'>('posts');
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const isOwnProfile = !userId || userId === currentUser?.id;

  const { data: user, isLoading: userLoading, error: userError, refetch: refetchUser } = useUserProfile(userId);
  const { data: communities, isLoading: communitiesLoading, refetch: refetchCommunities } = useUserCommunities(userId);
  const { data: posts, isLoading: postsLoading, refetch: refetchPosts } = useUserPosts(userId);
  const { data: likedPosts, isLoading: likedLoading, refetch: refetchLiked } = useUserLikedPosts(userId);

  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchUser(), refetchCommunities(), refetchPosts(), refetchLiked()]);
    setRefreshing(false);
  };

  const handleFollowToggle = () => {
    if (!user) return;
    if (user.isFollowing) {
      unfollowUser.mutate(user.id);
    } else {
      followUser.mutate(user.id);
    }
  };

  const handleMessage = () => {
    if (!user) return;
    router.push(`/(tabs)/messages?userId=${user.id}`);
  };

  const handleEditProfile = () => {
    router.push('/settings/profile');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  // Loading state
  if (userLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#222D99" />
      </View>
    );
  }

  // Error state
  if (userError || !user) {
    return (
      <View style={styles.centerContainer}>
        <AlertCircle size={48} color="#637083" />
        <Text style={styles.errorTitle}>User not found</Text>
        <Text style={styles.errorText}>This profile doesn't exist or has been removed.</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={onBack || (() => router.back())}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayPosts = activeTab === 'likes' ? likedPosts : posts;
  const isLoadingPosts = activeTab === 'likes' ? likedLoading : postsLoading;

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        stickyHeaderIndices={[2]}
      >
        {/* Cover Image */}
        <View style={styles.coverContainer}>
          <Image source={{ uri: getCoverUrl(user) }} style={styles.coverImage} />
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <ArrowLeft size={20} color="#fff" />
            </TouchableOpacity>
          )}
          {isOwnProfile && (
            <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
              <Settings size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Info Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileHeaderTop}>
            <Image source={{ uri: getAvatarUrl(user) }} style={styles.avatar} />

            <View style={styles.actionButtons}>
              {isOwnProfile ? (
                <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                  <Text style={styles.editButtonText}>Edit Profile</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity style={styles.messageIconButton} onPress={handleMessage}>
                    <MessageCircle size={16} color="#0B132B" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.followButton,
                      user.isFollowing && styles.followingButton,
                    ]}
                    onPress={handleFollowToggle}
                    disabled={followUser.isPending || unfollowUser.isPending}
                  >
                    {followUser.isPending || unfollowUser.isPending ? (
                      <ActivityIndicator size="small" color={user.isFollowing ? '#0B132B' : '#fff'} />
                    ) : (
                      <>
                        {user.isFollowing ? (
                          <UserCheck size={16} color="#0B132B" />
                        ) : (
                          <UserPlus size={16} color="#fff" />
                        )}
                        <Text
                          style={[
                            styles.followButtonText,
                            user.isFollowing && styles.followingButtonText,
                          ]}
                        >
                          {user.isFollowing ? 'Following' : 'Follow'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.displayName}>{user.displayName}</Text>
            <Text style={styles.username}>@{user.username}</Text>

            {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

            <View style={styles.metadata}>
              {user.location && (
                <View style={styles.metadataItem}>
                  <MapPin size={14} color="#637083" />
                  <Text style={styles.metadataText}>{user.location}</Text>
                </View>
              )}
              {user.website && (
                <View style={styles.metadataItem}>
                  <LinkIcon size={14} color="#637083" />
                  <Text style={styles.metadataLink}>
                    {user.website.replace(/^https?:\/\//, '')}
                  </Text>
                </View>
              )}
              <View style={styles.metadataItem}>
                <Calendar size={14} color="#637083" />
                <Text style={styles.metadataText}>Joined {formatDate(user.createdAt)}</Text>
              </View>
            </View>

            <View style={styles.stats}>
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statCount}>{formatCount(user.followingCount)}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statCount}>{formatCount(user.followersCount)}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Communities Rail */}
        {communities && communities.length > 0 && (
          <View style={styles.communitiesSection}>
            <Text style={styles.communitiesTitle}>
              {isOwnProfile ? 'MY COMMUNITIES' : 'COMMUNITIES'}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.communitiesRail}
            >
              {communities.map((community) => (
                <CommunityItem
                  key={community.id}
                  community={community}
                  onPress={() => router.push(`/communities/${community.slug}`)}
                />
              ))}
              {isOwnProfile && (
                <TouchableOpacity
                  style={styles.joinNewCommunity}
                  onPress={() => router.push('/communities')}
                >
                  <View style={styles.joinNewCircle}>
                    <Plus size={24} color="#637083" />
                  </View>
                  <Text style={styles.joinNewText}>Join New</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabs}>
            {['posts', 'communities', 'likes'].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={styles.tab}
                  onPress={() => setActiveTab(tab as any)}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                  {isActive && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Tab Content */}
        {activeTab === 'communities' ? (
          <View style={styles.tabContent}>
            {communitiesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#222D99" />
              </View>
            ) : communities && communities.length > 0 ? (
              <View style={styles.communitiesGrid}>
                {communities.map((community) => (
                  <TouchableOpacity
                    key={community.id}
                    style={styles.communityCard}
                    onPress={() => router.push(`/communities/${community.slug}`)}
                  >
                    <Image
                      source={{
                        uri:
                          community.imageUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            community.name
                          )}&background=0B132B&color=fff&size=400`,
                      }}
                      style={styles.communityCardImage}
                    />
                    <View style={styles.communityCardBadge}>
                      <Text style={styles.communityCardBadgeText}>
                        {formatCount(community.memberCount)}
                      </Text>
                    </View>
                    <View style={styles.communityCardContent}>
                      <Text style={styles.communityCardName} numberOfLines={1}>
                        {community.name}
                      </Text>
                      <View style={styles.communityCardFooter}>
                        <View style={styles.communityCardRole}>
                          <Text style={styles.communityCardRoleText}>{community.role}</Text>
                        </View>
                        {community.hasUpdates && <View style={styles.communityCardDot} />}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {isOwnProfile
                    ? "You haven't joined any communities yet"
                    : 'No communities to show'}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.tabContent}>
            {isLoadingPosts ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#222D99" />
              </View>
            ) : displayPosts && displayPosts.length > 0 ? (
              displayPosts.map((post) => (
                <PostItem key={post.id} post={post} user={user} onProfilePress={() => {}} />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {activeTab === 'likes'
                    ? isOwnProfile
                      ? "You haven't liked any posts yet"
                      : 'No liked posts to show'
                    : isOwnProfile
                    ? "You haven't posted anything yet"
                    : 'No posts to show'}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  coverContainer: {
    height: 160,
    backgroundColor: '#F5F8FA',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeader: {
    paddingHorizontal: 16,
  },
  profileHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: -40,
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D1D8DE',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0B132B',
  },
  messageIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D1D8DE',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButton: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#222D99',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  followingButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D8DE',
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  followingButtonText: {
    color: '#0B132B',
  },
  userInfo: {
    marginBottom: 16,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0B132B',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    color: '#637083',
    marginBottom: 12,
  },
  bio: {
    fontSize: 15,
    lineHeight: 21,
    color: '#0B132B',
    marginBottom: 12,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
    color: '#637083',
  },
  metadataLink: {
    fontSize: 12,
    color: '#222D99',
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    gap: 4,
  },
  statCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B132B',
  },
  statLabel: {
    fontSize: 14,
    color: '#637083',
  },
  communitiesSection: {
    marginBottom: 8,
  },
  communitiesTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0B132B',
    letterSpacing: 1,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  communitiesRail: {
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 16,
  },
  communityItem: {
    width: 72,
    alignItems: 'center',
    gap: 6,
  },
  communityRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2,
  },
  communityRingActive: {
    backgroundColor: '#222D99',
  },
  communityRingInactive: {
    backgroundColor: '#D1D8DE',
  },
  communityInnerRing: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    backgroundColor: '#fff',
    padding: 2,
  },
  communityImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  communityName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#0B132B',
    textAlign: 'center',
    lineHeight: 14,
  },
  joinNewCommunity: {
    width: 72,
    alignItems: 'center',
    gap: 6,
  },
  joinNewCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F5F8FA',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D8DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinNewText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#637083',
    textAlign: 'center',
  },
  tabsContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D8DE',
  },
  tabs: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#637083',
  },
  tabTextActive: {
    color: '#0B132B',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 48,
    height: 4,
    backgroundColor: '#222D99',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  tabContent: {
    minHeight: 300,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#637083',
    textAlign: 'center',
  },
  communitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  communityCard: {
    width: (width - 44) / 2,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D8DE',
    borderRadius: 12,
    overflow: 'hidden',
  },
  communityCardImage: {
    width: '100%',
    height: 96,
    backgroundColor: '#F5F8FA',
  },
  communityCardBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  communityCardBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  communityCardContent: {
    padding: 12,
  },
  communityCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B132B',
    marginBottom: 4,
  },
  communityCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  communityCardRole: {
    backgroundColor: '#F5F8FA',
    borderWidth: 1,
    borderColor: '#D1D8DE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  communityCardRoleText: {
    fontSize: 12,
    color: '#637083',
    textTransform: 'capitalize',
  },
  communityCardDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D4183D',
  },
  postContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D8DE',
    gap: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  postContent: {
    flex: 1,
    minWidth: 0,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  postHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
    flexWrap: 'wrap',
  },
  postAuthorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0B132B',
  },
  postAuthorUsername: {
    fontSize: 14,
    color: '#637083',
  },
  postTime: {
    fontSize: 12,
    color: '#637083',
  },
  postMoreButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postText: {
    fontSize: 15,
    lineHeight: 21,
    color: '#0B132B',
    marginTop: 4,
    marginBottom: 8,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D8DE',
    marginBottom: 12,
  },
  eventCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D8DE',
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  eventStripe: {
    height: 8,
    backgroundColor: '#D4183D',
  },
  eventContent: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    alignItems: 'center',
  },
  eventDate: {
    width: 48,
    height: 48,
    backgroundColor: '#F5F8FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D8DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventMonth: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D4183D',
    textTransform: 'uppercase',
  },
  eventDay: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0B132B',
    lineHeight: 18,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B132B',
    marginBottom: 2,
  },
  eventDetails: {
    fontSize: 12,
    color: '#637083',
  },
  pollContainer: {
    gap: 8,
    marginBottom: 12,
  },
  pollOption: {
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D8DE',
    backgroundColor: '#F5F8FA',
    overflow: 'hidden',
    position: 'relative',
  },
  pollBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: 'rgba(34, 45, 153, 0.1)',
  },
  pollTextContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  pollLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0B132B',
  },
  pollPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#222D99',
  },
  pollVotes: {
    fontSize: 12,
    color: '#637083',
    paddingLeft: 4,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    maxWidth: '90%',
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postActionText: {
    fontSize: 12,
    color: '#637083',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0B132B',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#637083',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D1D8DE',
    backgroundColor: '#fff',
  },
  errorButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B132B',
  },
});
