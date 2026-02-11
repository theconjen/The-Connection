/**
 * Redesigned ProfileScreen - Modern profile with tabs, follow system, and communities
 * Tabs: Communities (joined groups) and Questions (advice questions asked)
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
// Colors now come from useTheme() - see colors.primary usage below
import { fetchBiblePassage, looksLikeBibleReference } from '../lib/bibleApi';
import apiClient from '../lib/apiClient';
import { formatDistanceToNow } from 'date-fns';

// Helper to format activity dates
const formatActivityDate = (date: Date) => {
  try {
    return formatDistanceToNow(date, { addSuffix: true }).replace('about ', '');
  } catch {
    return '';
  }
};

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
  const [activeTab, setActiveTab] = useState<'communities' | 'advice'>('communities');
  const [refreshing, setRefreshing] = useState(false);
  const [showVerseModal, setShowVerseModal] = useState(false);
  const [versePassage, setVersePassage] = useState<{ reference: string; text: string; translation: string } | null>(null);
  const [verseLoading, setVerseLoading] = useState(false);
  const [showClergyModal, setShowClergyModal] = useState(false);
  const [showApologistModal, setShowApologistModal] = useState(false);

  // Determine if viewing own profile
  const viewingOwnProfile = !userId || userId === currentUser?.id;
  const targetUserId = userId || currentUser?.id || 0;


  // Fetch user profile data
  const { data: profile, isLoading, error, refetch } = useUserProfile(targetUserId);
  const { data: followStatus } = useFollowStatus(targetUserId);

  // Fetch user activity
  const { data: activityData, isLoading: isActivityLoading, refetch: refetchActivity } = useQuery({
    queryKey: ['userActivity', targetUserId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/users/${targetUserId}/activity`);
      return response.data;
    },
    enabled: !!targetUserId && activeTab === 'advice',
  });

  // Debug logging
  React.useEffect(() => {
    if (profile) {
      console.log('[ProfileScreen] User fields:', {
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
      refetch(),        // Refresh local profile query
      refreshAuth(),    // Refresh global user state
      refetchActivity(), // Refresh activity
    ]);
    setRefreshing(false);
  };

  const handleVersePress = async () => {
    const verseText = profile?.user?.favoriteBibleVerse;
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

  const { user, stats, communities, recentPosts, recentMicroblogs, isPrivate: isPrivateProfile } = profile;

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
              <Pressable
                style={styles.statItem}
                onPress={() => router.push(`/profile/followers?userId=${targetUserId}&tab=followers`)}
              >
                <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{stats.followersCount}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Connections</Text>
              </Pressable>
              <Pressable
                style={styles.statItem}
                onPress={() => router.push(`/profile/followers?userId=${targetUserId}&tab=following`)}
              >
                <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{stats.followingCount}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Connected</Text>
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
              {/* Clergy badge - shows if user.isVerifiedClergy */}
              {user.isVerifiedClergy && (
                <Pressable onPress={() => setShowClergyModal(true)} style={{ marginLeft: 2 }}>
                  <Image
                    source={require('../../assets/clergy-shield.png')}
                    style={{ width: 18, height: 18 }}
                    resizeMode="contain"
                  />
                </Pressable>
              )}
              {/* Apologist badge - shows if user.isVerifiedApologeticsAnswerer */}
              {user.isVerifiedApologeticsAnswerer && (
                <Pressable onPress={() => setShowApologistModal(true)} style={{ marginLeft: 2 }}>
                  <Image
                    source={require('../../assets/apologist-shield.png')}
                    style={{ width: 18, height: 18 }}
                    resizeMode="contain"
                  />
                </Pressable>
              )}
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
                  {followStatus?.isFollowing ? 'Connected' : 'Connect'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Tabs - Advice tab only visible on own profile, Communities hidden from others if profile is private */}
        <View style={[styles.tabsContainer, { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle }]}>
          {/* Communities tab - only visible to profile owner OR to others if profile is NOT private */}
          {(viewingOwnProfile || !isPrivateProfile) && (
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
          )}
          {/* Advice tab - only visible on own profile (private) */}
          {viewingOwnProfile && (
            <Pressable
              style={[styles.tab, activeTab === 'advice' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab('advice')}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color={activeTab === 'advice' ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.tabText, { color: activeTab === 'advice' ? colors.primary : colors.textSecondary }]}>
                My Activity
              </Text>
            </Pressable>
          )}
        </View>

        {/* Tab Content */}
        <View style={[styles.content, { backgroundColor: colors.background }]}>
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
                  {viewingOwnProfile && (
                    <Pressable
                      style={[styles.emptyActionButton, { backgroundColor: colors.primary, marginTop: 16 }]}
                      onPress={() => router.push('/(tabs)/communities' as any)}
                    >
                      <Text style={[styles.emptyActionButtonText, { color: colors.primaryForeground }]}>
                        Explore Communities
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          )}

          {activeTab === 'advice' && (
            <View style={styles.postsContainer}>
              {/* Show user activity - community joins, event RSVPs, connections */}
              {isActivityLoading ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : activityData?.activities && activityData.activities.length > 0 ? (
                activityData.activities.map((activity: any) => (
                  <Pressable
                    key={activity.id}
                    style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
                    onPress={() => {
                      if (activity.type === 'community_join' && activity.communityId) {
                        router.push(`/communities/${activity.communityId}`);
                      } else if (activity.type === 'event_rsvp' && activity.eventId) {
                        router.push(`/events/${activity.eventId}`);
                      } else if (activity.type === 'follow' && activity.userId) {
                        router.push(`/profile/${activity.userId}`);
                      }
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${activity.iconColor}15`, justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name={activity.icon as any} size={18} color={activity.iconColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.postContent, { color: colors.textPrimary, marginBottom: 2 }]}>
                          {activity.text}
                        </Text>
                        <Text style={[styles.postMeta, { color: colors.textMuted }]}>
                          {formatActivityDate(new Date(activity.date))}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ opacity: 0.5 }} />
                    </View>
                  </Pressable>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="time-outline" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyHeadline, { color: colors.textPrimary }]}>
                    No activity yet
                  </Text>
                  <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                    Your community joins, event RSVPs, and connections will appear here.
                  </Text>
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
          <View
            style={[styles.verseModalContent, { backgroundColor: colors.surface }]}
            onStartShouldSetResponder={() => true}
          >
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
                <ScrollView style={styles.verseModalScroll} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
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
          </View>
        </Pressable>
      </Modal>

      {/* Clergy Verification Modal */}
      <Modal
        visible={showClergyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClergyModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowClergyModal(false)}
        >
          <View
            style={[styles.verseModalContent, { backgroundColor: colors.surface }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.verseModalHeader}>
              <Image
                source={require('../../assets/clergy-shield.png')}
                style={{ width: 28, height: 28 }}
                resizeMode="contain"
              />
              <Text style={[styles.verseModalTitle, { color: colors.textPrimary }]}>
                Verified Clergy
              </Text>
              <Pressable
                onPress={() => setShowClergyModal(false)}
                hitSlop={8}
              >
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView style={styles.verseModalScroll} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
              <Text style={[styles.clergyModalText, { color: colors.textPrimary }]}>
                This person has been verified as ordained clergy by their church or organization on The Connection.
              </Text>
              <Text style={[styles.clergyModalText, { color: colors.textPrimary, marginTop: 12 }]}>
                Verified clergy members have had their pastoral credentials confirmed by a registered church administrator, ensuring authentic spiritual leadership within our community.
              </Text>
            </ScrollView>

            <Text style={[styles.verseModalAttribution, { color: colors.textMuted }]}>
              "Feed my sheep" - John 21:17
            </Text>
          </View>
        </Pressable>
      </Modal>

      {/* Apologist Verification Modal */}
      <Modal
        visible={showApologistModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowApologistModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowApologistModal(false)}
        >
          <View
            style={[styles.verseModalContent, { backgroundColor: colors.surface }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.verseModalHeader}>
              <Image
                source={require('../../assets/apologist-shield.png')}
                style={{ width: 28, height: 28 }}
                resizeMode="contain"
              />
              <Text style={[styles.verseModalTitle, { color: colors.textPrimary }]}>
                Verified Apologist
              </Text>
              <Pressable
                onPress={() => setShowApologistModal(false)}
                hitSlop={8}
              >
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView style={styles.verseModalScroll} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
              <Text style={[styles.clergyModalText, { color: colors.textPrimary }]}>
                This person is a verified Christian apologist on The Connection.
              </Text>
              <Text style={[styles.clergyModalText, { color: colors.textPrimary, marginTop: 12 }]}>
                Verified apologists have demonstrated theological knowledge and are approved to answer faith-related questions in our Q&A system, helping others understand and defend the Christian faith.
              </Text>
            </ScrollView>

            <Text style={[styles.verseModalAttribution, { color: colors.textMuted }]}>
              "Always be prepared to give an answer" - 1 Peter 3:15
            </Text>
          </View>
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
  clergyModalText: {
    fontSize: 15,
    lineHeight: 24,
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
