/**
 * Redesigned ProfileScreen - Modern profile with tabs, follow system, communities, and posts
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import { Text } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { AppHeader } from './AppHeader';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  useUserProfile,
  useFollowUser,
  useUnfollowUser,
  useFollowStatus,
} from '../queries/follow';
import { eventsAPI } from '../lib/apiClient';
// Colors now come from useTheme() - see colors.primary usage below
import { fetchBiblePassage, looksLikeBibleReference } from '../lib/bibleApi';
import { ClergyBadge } from '../components/ClergyBadge';

// Custom church icon
const ChurchIcon = require('../../assets/church-icon.png');

interface ProfileScreenProps {
  onBackPress?: () => void;
  userId?: number; // If provided, show another user's profile; otherwise show current user's
}

export function ProfileScreenRedesigned({ onBackPress, userId }: ProfileScreenProps) {
  const { colors, spacing, radii, colorScheme } = useTheme();
  const { user: currentUser, refresh: refreshAuth } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'posts' | 'communities' | 'events'>('posts');
  const [refreshing, setRefreshing] = useState(false);
  const [showVerseModal, setShowVerseModal] = useState(false);
  const [versePassage, setVersePassage] = useState<{ reference: string; text: string; translation: string } | null>(null);
  const [verseLoading, setVerseLoading] = useState(false);

  // Determine if viewing own profile
  const viewingOwnProfile = !userId || userId === currentUser?.id;
  const targetUserId = userId || currentUser?.id || 0;


  // Fetch user profile data
  const { data: profile, isLoading, error, refetch } = useUserProfile(targetUserId);
  const { data: followStatus } = useFollowStatus(targetUserId);

  // Fetch attended events for the Events tab
  const { data: attendedEventsData, refetch: refetchAttendedEvents } = useQuery({
    queryKey: ['attended-events', targetUserId],
    queryFn: () => eventsAPI.getAttendedEvents(targetUserId),
    enabled: !!targetUserId,
  });

  // Debug logging
  React.useEffect(() => {
    if (profile) {
      console.info('[ProfileScreen] User fields:', {
        location: profile.user?.location,
        denomination: profile.user?.denomination,
        homeChurch: profile.user?.homeChurch,
        favoriteBibleVerse: profile.user?.favoriteBibleVerse,
        testimony: profile.user?.testimony,
        interests: profile.user?.interests,
      });
    }
  }, [profile]);

  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleFollow = () => {
    if (followStatus?.isFollowing) {
      unfollowMutation.mutate(targetUserId);
    } else {
      followMutation.mutate(targetUserId);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetch(),                 // Refresh local profile query
      refreshAuth(),             // Refresh global user state
      refetchAttendedEvents(),   // Refresh attended events
    ]);
    setRefreshing(false);
  };

  const handleVersePress = async () => {
    const verseText = user?.favoriteBibleVerse;
    if (!verseText) return;

    setShowVerseModal(true);
    setVerseLoading(true);

    // Check if it looks like a Bible reference (e.g., "John 3:16")
    if (looksLikeBibleReference(verseText)) {
      const result = await fetchBiblePassage(verseText);
      setVersePassage({
        reference: result.reference,
        text: result.text,
        translation: result.translation || 'WEB',
      });
    } else {
      // It's already the full passage text, not a reference
      setVersePassage({
        reference: '',
        text: verseText,
        translation: '',
      });
    }

    setVerseLoading(false);
  };

  const handleAvatarChange = async () => {
    if (!viewingOwnProfile) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera roll permissions to change your avatar');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5, // Reduce quality to keep file size manageable
    });

    if (!result.canceled && result.assets[0]) {
      try {
        const asset = result.assets[0];

        // Convert to base64
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: 'base64',
        });

        // Get the file extension to determine mime type
        const extension = asset.uri.split('.').pop()?.toLowerCase();
        const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
        const base64data = `data:${mimeType};base64,${base64}`;

        // Show loading indicator
        Alert.alert('Uploading', 'Updating profile picture...');

        // Upload to server using apiClient
        const apiClient = (await import('../lib/apiClient')).default;
        const response = await apiClient.patch('/api/user/profile', {
          avatarUrl: base64data,
        });

        // Refresh both local profile data AND global auth context
        await Promise.all([
          refetch(),        // Refresh local profile query
          refreshAuth(),    // Refresh global user state (updates avatars everywhere)
        ]);
        Alert.alert('Success', 'Profile picture updated!');
      } catch (error) {
        console.error('Error updating avatar:', error);
        Alert.alert('Error', 'Failed to update profile picture. Please try again.');
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.header }}>
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
        <AppHeader
          showCenteredLogo={true}
          showBackInCenteredMode={true}
          onBackPress={onBackPress}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.header }}>
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
        <AppHeader
          showCenteredLogo={true}
          showBackInCenteredMode={true}
          onBackPress={onBackPress}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Profile not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { user, stats, communities, recentPosts, recentMicroblogs } = profile;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.header }}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      <AppHeader
        showCenteredLogo={true}
        showBackInCenteredMode={true}
        onBackPress={onBackPress}
        rightElement={
          viewingOwnProfile ? (
            <Pressable
              onPress={() => {
                router.push('/settings');
              }}
              style={({ pressed }) => ({
                padding: spacing.sm,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="settings-outline" size={24} color={colors.headerForeground} />
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.surface }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Profile Header - Instagram Style */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle }]}>
          {/* Top Row: Avatar + Stats */}
          <View style={styles.topRow}>
            {/* Avatar */}
            <Pressable
              style={styles.avatarContainer}
              onPress={handleAvatarChange}
              disabled={!viewingOwnProfile}
            >
              {user.profileImageUrl ? (
                <Image
                  source={{ uri: user.profileImageUrl }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
                    {getInitials(user.displayName || user.username)}
                  </Text>
                </View>
              )}
              {viewingOwnProfile && (
                <View style={[styles.avatarEditBadge, { borderColor: colors.surface, backgroundColor: colors.primary }]}>
                  <Ionicons name="camera" size={14} color={colors.primaryForeground} />
                </View>
              )}
            </Pressable>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{stats.eventsCount || 0}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Events</Text>
              </View>
              <Pressable style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{stats.followersCount}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Followers</Text>
              </Pressable>
              <Pressable style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{stats.followingCount}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Following</Text>
              </Pressable>
            </View>
          </View>

          {/* Name and Username */}
          <View style={styles.infoSection}>
            {/* Name with denomination badge */}
            <View style={styles.nameRow}>
              <Text style={[styles.displayName, { color: colors.textPrimary }]}>
                {user.displayName || user.username}
              </Text>
              {/* TEMP: Inline clergy badge for preview */}
              <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center', marginLeft: 4 }}>
                <Ionicons name="shield-checkmark" size={11} color="#D97706" />
              </View>
              {user.denomination && (
                <View style={[styles.denominationBadge, { backgroundColor: `${colors.primary}15` }]}>
                  <Text style={[styles.denominationText, { color: colors.primary }]}>{user.denomination}</Text>
                </View>
              )}
            </View>

            <Text style={[styles.username, { color: colors.textSecondary }]}>@{user.username}</Text>

            {/* Compact location & church info */}
            {(user.location || user.homeChurch) && (
              <View style={styles.compactInfoRow}>
                {user.location && (
                  <>
                    <Ionicons name="location" size={12} color={colors.textSecondary} />
                    <Text style={[styles.compactInfoText, { color: colors.textSecondary }]}>{user.location}</Text>
                  </>
                )}
                {user.location && user.homeChurch && (
                  <Text style={[styles.separator, { color: colors.textSecondary }]}> | </Text>
                )}
                {user.homeChurch && (
                  <>
                    <Image
                      source={ChurchIcon}
                      style={{ width: 14, height: 14, tintColor: colors.textSecondary }}
                      resizeMode="contain"
                    />
                    <Text style={[styles.compactInfoText, { color: colors.textSecondary }]}>{user.homeChurch}</Text>
                  </>
                )}
              </View>
            )}

            {/* Bio */}
            {user.bio && <Text style={[styles.bio, { color: colors.textPrimary }]}>{user.bio}</Text>}

            {/* Bible Verse - Tappable to show full passage */}
            {user.favoriteBibleVerse && (
              <Pressable
                onPress={handleVersePress}
                style={({ pressed }) => [
                  styles.bibleVerseCompact,
                  { backgroundColor: `${colors.surfaceMuted}80`, borderLeftColor: `${colors.primary}60` },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="book-outline" size={12} color={colors.textMuted} style={{ opacity: 0.7 }} />
                <Text style={[styles.bibleVerseText, { color: colors.textSecondary }]} numberOfLines={2}>
                  {user.favoriteBibleVerse}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} style={{ opacity: 0.5 }} />
              </Pressable>
            )}

            {/* Interests as tags */}
            {user.interests && (
              <View style={styles.interestTags}>
                {user.interests.split(',').slice(0, 5).map((interest: string, index: number) => (
                  <View key={index} style={[styles.interestTag, { backgroundColor: colors.surfaceMuted }]}>
                    <Text style={[styles.interestTagText, { color: colors.textSecondary }]}>{interest.trim()}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {viewingOwnProfile ? (
              <Pressable
                style={[styles.editProfileButton, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
                onPress={() => router.push('/edit-profile')}
              >
                <Text style={[styles.editProfileButtonText, { color: colors.textPrimary }]}>Edit Profile</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleFollow}
                disabled={followMutation.isPending || unfollowMutation.isPending}
                style={[
                  styles.followButton,
                  { backgroundColor: colors.primary },
                  followStatus?.isFollowing && [styles.followingButton, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }],
                ]}
              >
                <Text
                  style={[
                    styles.followButtonText,
                    { color: colors.primaryForeground },
                    followStatus?.isFollowing && [styles.followingButtonText, { color: colors.textPrimary }],
                  ]}
                >
                  {followStatus?.isFollowing ? 'Following' : 'Follow'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle }]}>
          <Pressable
            style={[styles.tab, activeTab === 'posts' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab('posts')}
          >
            <Ionicons
              name="document-text-outline"
              size={20}
              color={activeTab === 'posts' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabText, { color: activeTab === 'posts' ? colors.primary : colors.textSecondary }]}>
              Posts
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'communities' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab('communities')}
          >
            <Ionicons
              name="people-outline"
              size={20}
              color={activeTab === 'communities' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[styles.tabText, { color: activeTab === 'communities' ? colors.primary : colors.textSecondary }]}
            >
              Communities
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'events' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab('events')}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={activeTab === 'events' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[styles.tabText, { color: activeTab === 'events' ? colors.primary : colors.textSecondary }]}
            >
              Events
            </Text>
          </Pressable>
        </View>

        {/* Tab Content */}
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {activeTab === 'posts' && (
            <View style={styles.postsContainer}>
              {/* Show microblogs (feed posts) */}
              {recentMicroblogs && recentMicroblogs.length > 0 ? (
                recentMicroblogs.map((microblog: any) => (
                  <View key={`microblog-${microblog.id}`} style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                    <Text style={[styles.postContent, { color: colors.textPrimary }]} numberOfLines={4}>
                      {microblog.content}
                    </Text>
                    <View style={styles.postFooter}>
                      <Text style={[styles.postMeta, { color: colors.textSecondary }]}>
                        {new Date(microblog.createdAt).toLocaleDateString()}
                      </Text>
                      <Text style={[styles.postMeta, { color: colors.textSecondary }]}>•</Text>
                      <Text style={[styles.postMeta, { color: colors.textSecondary }]}>
                        {microblog.likeCount || 0} likes
                      </Text>
                      <Text style={[styles.postMeta, { color: colors.textSecondary }]}>•</Text>
                      <Text style={[styles.postMeta, { color: colors.textSecondary }]}>
                        {microblog.replyCount || 0} comments
                      </Text>
                    </View>
                  </View>
                ))
              ) : recentPosts && recentPosts.length > 0 ? (
                // Show forum posts if no microblogs
                recentPosts.map((post: any) => (
                  <View key={`post-${post.id}`} style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                    <Text style={[styles.postTitle, { color: colors.textPrimary }]}>{post.title}</Text>
                    <Text style={[styles.postContent, { color: colors.textSecondary }]} numberOfLines={3}>
                      {post.content}
                    </Text>
                    <View style={styles.postFooter}>
                      <Text style={[styles.postMeta, { color: colors.textSecondary }]}>
                        {new Date(post.createdAt).toLocaleDateString()}
                      </Text>
                      <Text style={[styles.postMeta, { color: colors.textSecondary }]}>•</Text>
                      <Text style={[styles.postMeta, { color: colors.textSecondary }]}>{post.upvotes || 0} upvotes</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="document-outline" size={40} color={colors.textMuted} style={{ opacity: 0.5, marginBottom: 8 }} />

                  {viewingOwnProfile ? (
                    // Own profile empty state
                    <>
                      <Text style={[styles.emptyHeadline, { color: colors.textPrimary }]}>
                        {stats.postsCount > 0 ? "Your posts aren't showing here" : 'Nothing here yet'}
                      </Text>
                      <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                        {stats.postsCount > 0
                          ? 'Check your privacy settings if this seems wrong.'
                          : "Share something when you're ready."}
                      </Text>
                      <Pressable
                        style={[styles.emptyActionButton, { backgroundColor: colors.primary }]}
                        onPress={() => router.push('/create')}
                      >
                        <Text style={[styles.emptyActionButtonText, { color: colors.primaryForeground }]}>
                          Create a post
                        </Text>
                      </Pressable>
                    </>
                  ) : (
                    // Viewing another user's profile
                    <>
                      <Text style={[styles.emptyHeadline, { color: colors.textPrimary }]}>
                        {stats.postsCount > 0 ? "Posts aren't visible" : 'Nothing here yet'}
                      </Text>
                      <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                        {stats.postsCount > 0
                          ? 'Follow to see what they share.'
                          : "They haven't shared anything publicly."}
                      </Text>
                      {stats.postsCount > 0 && !followStatus?.isFollowing && (
                        <Pressable
                          style={[styles.emptyActionButton, { backgroundColor: colors.primary }]}
                          onPress={handleFollow}
                          disabled={followMutation.isPending}
                        >
                          <Text style={[styles.emptyActionButtonText, { color: colors.primaryForeground }]}>
                            Follow
                          </Text>
                        </Pressable>
                      )}
                    </>
                  )}
                </View>
              )}
            </View>
          )}

          {activeTab === 'communities' && (
            <View style={styles.communitiesContainer}>
              {communities && communities.length > 0 ? (
                <View style={styles.communitiesGrid}>
                  {communities.map((community: any) => (
                    <Pressable
                      key={community.id}
                      style={styles.storyCircle}
                      onPress={() => router.push(`/communities/${community.id}`)}
                    >
                      <View style={[styles.storyImageContainer, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                        <View style={[styles.storyIconCircle, { backgroundColor: colors.surfaceMuted }]}>
                          <Ionicons
                            name={community.iconName as any}
                            size={32}
                            color={colors.primary}
                          />
                        </View>
                      </View>
                      <Text style={[styles.storyLabel, { color: colors.textPrimary }]} numberOfLines={1}>
                        {community.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No communities yet</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'events' && (
            <View style={styles.eventsContainer}>
              {attendedEventsData?.events && attendedEventsData.events.length > 0 ? (
                attendedEventsData.events.map((event: any) => (
                  <Pressable
                    key={event.id}
                    style={[styles.attendedEventCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
                    onPress={() => router.push(`/events/${event.id}`)}
                  >
                    {event.imageUrl && (
                      <Image
                        source={{ uri: event.imageUrl }}
                        style={styles.attendedEventImage}
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.attendedEventInfo}>
                      <Text style={[styles.attendedEventTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                        {event.title}
                      </Text>
                      <View style={styles.attendedEventMeta}>
                        <Ionicons name="calendar" size={12} color={colors.textSecondary} />
                        <Text style={[styles.attendedEventMetaText, { color: colors.textSecondary }]}>
                          {new Date(event.eventDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                      {(event.location || event.communityName) && (
                        <View style={styles.attendedEventMeta}>
                          <Ionicons name="location" size={12} color={colors.textSecondary} />
                          <Text style={[styles.attendedEventMetaText, { color: colors.textSecondary }]} numberOfLines={1}>
                            {event.location || event.communityName}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={[styles.attendedBadge, { backgroundColor: '#10B98115' }]}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    </View>
                  </Pressable>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={48} color={colors.textMuted} style={{ opacity: 0.5 }} />
                  <Text style={[styles.emptyHeadline, { color: colors.textPrimary, marginTop: 12 }]}>
                    No events attended yet
                  </Text>
                  <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                    {viewingOwnProfile
                      ? 'RSVP to events and confirm your attendance after they end to build your event history!'
                      : "This user hasn't confirmed attendance at any events yet."}
                  </Text>
                  {viewingOwnProfile && (
                    <Pressable
                      style={[styles.emptyActionButton, { backgroundColor: colors.primary }]}
                      onPress={() => router.push('/(tabs)/events')}
                    >
                      <Text style={[styles.emptyActionButtonText, { color: colors.primaryForeground }]}>
                        Browse Events
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          )}

        </View>
      </ScrollView>

      {/* Bible Verse Modal */}
      <Modal
        visible={showVerseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVerseModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowVerseModal(false)}
        >
          <Pressable style={[styles.verseModalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.verseModalHeader}>
              <Ionicons name="book" size={20} color={colors.primary} />
              <Text style={[styles.verseModalTitle, { color: colors.textPrimary }]}>
                {versePassage?.reference || 'Favorite Verse'}
              </Text>
              <Pressable
                onPress={() => setShowVerseModal(false)}
                hitSlop={12}
              >
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            {verseLoading ? (
              <View style={styles.verseModalLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.verseModalLoadingText, { color: colors.textMuted }]}>
                  Loading passage...
                </Text>
              </View>
            ) : (
              <>
                <ScrollView style={styles.verseModalScroll} showsVerticalScrollIndicator={false}>
                  <Text style={[styles.verseModalText, { color: colors.textPrimary }]}>
                    {versePassage?.text || user?.favoriteBibleVerse}
                  </Text>
                </ScrollView>
                {versePassage?.translation && (
                  <Text style={[styles.verseModalAttribution, { color: colors.textMuted }]}>
                    {versePassage.translation}
                  </Text>
                )}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 24,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 86,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7C8F78',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  infoSection: {
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  displayName: {
    fontSize: 16,
    fontWeight: '700',
  },
  denominationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  denominationText: {
    fontSize: 11,
    fontWeight: '600',
  },
  username: {
    fontSize: 14,
    marginTop: 2,
  },
  compactInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  compactInfoText: {
    fontSize: 12,
    marginLeft: 3,
  },
  separator: {
    fontSize: 12,
    marginHorizontal: 4,
  },
  bio: {
    fontSize: 14,
    marginTop: 10,
    lineHeight: 20,
  },
  bibleVerseCompact: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    borderLeftWidth: 1.5,
  },
  bibleVerseText: {
    flex: 1,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
    opacity: 0.85,
  },
  interestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  interestTag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  interestTagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionButtons: {
    gap: 8,
  },
  editProfileButton: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  editProfileButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  followButton: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#7C8F78',
    alignItems: 'center',
  },
  followingButton: {
    borderWidth: 1,
  },
  followButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  followingButtonText: {
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#7C8F78',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#7C8F78',
    fontWeight: '600',
  },
  content: {
    minHeight: 400,
  },
  postsContainer: {
    padding: 16,
  },
  postCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postMeta: {
    fontSize: 12,
  },
  communitiesContainer: {
    padding: 16,
  },
  communitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 16,
  },
  eventsContainer: {
    padding: 16,
  },
  attendedEventCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  attendedEventImage: {
    width: 80,
    height: 80,
  },
  attendedEventInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  attendedEventTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  attendedEventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  attendedEventMetaText: {
    fontSize: 12,
    marginLeft: 4,
  },
  attendedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyCircle: {
    width: 80,
    alignItems: 'center',
    marginBottom: 8,
  },
  storyImageContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 3,
    borderWidth: 2,
    borderColor: '#7C8F78',
    marginBottom: 6,
  },
  storyIconCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyLabel: {
    fontSize: 12,
    textAlign: 'center',
    width: '100%',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyHeadline: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.8,
  },
  emptyActionButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Bible Verse Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  verseModalContent: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '70%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  verseModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  verseModalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  verseModalScroll: {
    maxHeight: 300,
  },
  verseModalText: {
    fontSize: 16,
    lineHeight: 26,
    fontStyle: 'italic',
  },
  verseModalAttribution: {
    fontSize: 12,
    marginTop: 16,
    textAlign: 'right',
    fontWeight: '500',
  },
  verseModalLoading: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  verseModalLoadingText: {
    fontSize: 14,
  },
});

export default ProfileScreenRedesigned;
