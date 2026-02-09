/**
 * Organization Profile Screen (Commons)
 * Public church/organization profile with capabilities-based UI
 * Mobile uses ONLY server-provided booleans, never computes tier
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Image,
  Linking,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Text } from '../../src/theme';
import { Ionicons } from '@expo/vector-icons';
import {
  useOrgProfile,
  useMyChurches,
  useAddChurch,
  useRemoveChurch,
  useRequestMembership,
  useRequestMeeting,
  PublicLeader,
} from '../../src/queries/churches';

// Role labels for display
const roleLabels: Record<string, string> = {
  visitor: 'Visitor',
  attendee: 'Attendee',
  member: 'Member',
  moderator: 'Moderator',
  admin: 'Admin',
  owner: 'Owner',
};

// Get initials from name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Format video duration (seconds to MM:SS or HH:MM:SS)
const formatDuration = (seconds: number): string => {
  if (!seconds || seconds < 0) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

// Format sermon date
const formatSermonDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

export default function OrganizationProfileScreen() {
  const { slug } = useLocalSearchParams() as { slug: string };
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, colorScheme } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const styles = getStyles(colors, colorScheme);

  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingReason, setMeetingReason] = useState('');
  const [selectedLeader, setSelectedLeader] = useState<PublicLeader | null>(null);

  // Fetch org profile with capabilities
  const { data, isLoading, error, refetch, isRefetching } = useOrgProfile(slug);

  // Check affiliations
  const { data: affiliations = [] } = useMyChurches();
  const hasAffiliation = affiliations.some(
    (aff) => aff.organizationId === data?.organization?.id
  );
  const affiliationId = affiliations.find(
    (aff) => aff.organizationId === data?.organization?.id
  )?.id;

  // Mutations
  const addChurchMutation = useAddChurch();
  const removeChurchMutation = useRemoveChurch();
  const requestMembershipMutation = useRequestMembership();
  const requestMeetingMutation = useRequestMeeting();

  const handleAddToMyChurches = async () => {
    if (!data?.organization?.id) return;
    try {
      await addChurchMutation.mutateAsync({ organizationId: data.organization.id });
      Alert.alert('Success', 'Added to your churches');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add church');
    }
  };

  const handleRemoveFromMyChurches = async () => {
    if (!affiliationId) return;
    try {
      await removeChurchMutation.mutateAsync(affiliationId);
      Alert.alert('Success', 'Removed from your churches');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to remove church');
    }
  };

  const handleRequestMembership = async () => {
    try {
      await requestMembershipMutation.mutateAsync(slug);
      Alert.alert('Success', 'Your membership request has been sent to the church leadership.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to request membership');
    }
  };

  const handleRequestMeeting = async () => {
    if (!meetingReason.trim()) {
      Alert.alert('Required', 'Please enter a reason for your meeting request.');
      return;
    }
    try {
      await requestMeetingMutation.mutateAsync({ slug, reason: meetingReason });
      setShowMeetingModal(false);
      setMeetingReason('');
      Alert.alert('Success', 'Your meeting request has been submitted.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to request meeting');
    }
  };

  const openWebsite = (url: string) => {
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(formattedUrl);
  };

  const callPhone = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading church...</Text>
        </View>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="business-outline" size={64} color={colors.textMuted} />
          <Text style={styles.errorTitle}>Church Not Found</Text>
          <Text style={styles.errorText}>
            This church doesn't exist or may have been removed.
          </Text>
          <Pressable style={styles.errorButton} onPress={() => router.back()}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const { organization: org, capabilities } = data;
  const isMember = ['member', 'moderator', 'admin', 'owner'].includes(capabilities.userRole);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{org.name}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Organization Info */}
        <View style={styles.orgHeader}>
          <View style={styles.avatarContainer}>
            {org.logoUrl ? (
              <Image source={{ uri: org.logoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="business" size={40} color={colors.textMuted} />
              </View>
            )}
          </View>
          <Text style={styles.orgName}>{org.name}</Text>
          {org.denomination && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{org.denomination}</Text>
            </View>
          )}
          {(org.city || org.state) && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.locationText}>
                {[org.city, org.state].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}
          {org.description && (
            <Text style={styles.description}>{org.description}</Text>
          )}
        </View>

        {/* Your Connection (only if logged in) */}
        {user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Connection</Text>
            <View style={styles.card}>
              <View style={styles.connectionRow}>
                <View style={styles.connectionInfo}>
                  <Text style={styles.connectionRole}>
                    {roleLabels[capabilities.userRole] || 'Visitor'}
                  </Text>
                  <Text style={styles.connectionSubtext}>
                    {isMember
                      ? 'You are a member of this church'
                      : hasAffiliation
                      ? 'This church is in your list'
                      : 'You are not connected to this church'}
                  </Text>
                </View>
                <View style={[styles.roleBadge, isMember ? styles.roleBadgeMember : undefined]}>
                  <Text style={isMember ? StyleSheet.flatten([styles.roleBadgeText, styles.roleBadgeTextMember]) : styles.roleBadgeText}>
                    {roleLabels[capabilities.userRole]}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                {/* Add/Remove from My Churches */}
                {!isMember && (
                  hasAffiliation ? (
                    <Pressable
                      style={styles.actionButton}
                      onPress={handleRemoveFromMyChurches}
                      disabled={removeChurchMutation.isPending}
                    >
                      <Ionicons name="heart-dislike-outline" size={18} color={colors.textPrimary} />
                      <Text style={styles.actionButtonText}>Remove from My Churches</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      style={styles.actionButton}
                      onPress={handleAddToMyChurches}
                      disabled={addChurchMutation.isPending}
                    >
                      <Ionicons name="heart-outline" size={18} color={colors.textPrimary} />
                      <Text style={styles.actionButtonText}>Add to My Churches</Text>
                    </Pressable>
                  )
                )}

                {/* Request Membership */}
                {capabilities.canRequestMembership && (
                  <Pressable
                    style={[styles.actionButton, styles.primaryButton]}
                    onPress={handleRequestMembership}
                    disabled={requestMembershipMutation.isPending}
                  >
                    <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
                    <Text style={StyleSheet.flatten([styles.actionButtonText, styles.primaryButtonText])}>
                      Request Membership
                    </Text>
                  </Pressable>
                )}

                {/* Pending Request */}
                {capabilities.hasPendingMembershipRequest && (
                  <View style={styles.pendingBadge}>
                    <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.pendingText}>Membership Pending</Text>
                  </View>
                )}

                {/* Request Meeting */}
                {capabilities.canRequestMeeting && (
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => setShowMeetingModal(true)}
                  >
                    <Ionicons name="calendar-outline" size={18} color={colors.textPrimary} />
                    <Text style={styles.actionButtonText}>Request a Meeting</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Mission */}
        {org.mission && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Our Mission</Text>
            <View style={styles.card}>
              <Text style={styles.cardText}>{org.mission}</Text>
            </View>
          </View>
        )}

        {/* Service Times */}
        {org.serviceTimes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.sectionTitle}>Service Times</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardText}>{org.serviceTimes}</Text>
            </View>
          </View>
        )}

        {/* Leadership Team */}
        {data.leaders && data.leaders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.sectionTitle}>Leadership Team</Text>
            </View>
            <View style={styles.leadersGrid}>
              {data.leaders
                .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id)
                .slice(0, 4)
                .map((leader) => (
                  <Pressable
                    key={leader.id}
                    style={styles.leaderCard}
                    onPress={() => setSelectedLeader(leader)}
                  >
                    {leader.photoUrl ? (
                      <Image source={{ uri: leader.photoUrl }} style={styles.leaderAvatar} />
                    ) : (
                      <View style={[styles.leaderAvatar, styles.leaderAvatarPlaceholder]}>
                        <Text style={styles.leaderInitials}>{getInitials(leader.name)}</Text>
                      </View>
                    )}
                    <View style={styles.leaderInfo}>
                      <Text style={styles.leaderName} numberOfLines={1}>{leader.name}</Text>
                      {leader.title && (
                        <Text style={styles.leaderTitle} numberOfLines={1}>{leader.title}</Text>
                      )}
                      {leader.bio && (
                        <Text style={styles.leaderBio} numberOfLines={2}>{leader.bio}</Text>
                      )}
                    </View>
                  </Pressable>
                ))}
            </View>
            <Pressable
              style={styles.viewAllButton}
              onPress={() => router.push(`/orgs/${slug}/about`)}
            >
              <Text style={styles.viewAllText}>Meet the Team</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </Pressable>
          </View>
        )}

        {/* Sermons */}
        {data.sermons && data.sermons.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="videocam-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.sectionTitle}>Sermons</Text>
            </View>
            <View style={styles.sermonsGrid}>
              {data.sermons.slice(0, 6).map((sermon: any) => (
                <Pressable
                  key={sermon.id}
                  style={styles.sermonCard}
                  onPress={() => router.push(`/sermons/${sermon.id}`)}
                >
                  <View style={styles.sermonThumbnailContainer}>
                    {sermon.thumbnailUrl ? (
                      <Image source={{ uri: sermon.thumbnailUrl }} style={styles.sermonThumbnail} />
                    ) : (
                      <View style={[styles.sermonThumbnail, styles.sermonThumbnailPlaceholder]}>
                        <Ionicons name="videocam" size={24} color={colors.textMuted} />
                      </View>
                    )}
                    {sermon.duration && (
                      <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>{formatDuration(sermon.duration)}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.sermonInfo}>
                    <Text style={styles.sermonTitle} numberOfLines={2}>{sermon.title}</Text>
                    {sermon.speaker && (
                      <Text style={styles.sermonSpeaker} numberOfLines={1}>{sermon.speaker}</Text>
                    )}
                    {sermon.sermonDate && (
                      <Text style={styles.sermonDate}>{formatSermonDate(sermon.sermonDate)}</Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
            {data.sermons.length > 6 && (
              <Pressable
                style={styles.viewAllButton}
                onPress={() => router.push(`/orgs/${slug}/sermons`)}
              >
                <Text style={styles.viewAllText}>View All Sermons</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </Pressable>
            )}
          </View>
        )}

        {/* Communities */}
        {data.communities && data.communities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Communities</Text>
            <View style={styles.card}>
              <Text style={styles.comingSoon}>Coming soon</Text>
            </View>
          </View>
        )}

        {/* Upcoming Events */}
        {data.upcomingEvents && data.upcomingEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <View style={styles.card}>
              <Text style={styles.comingSoon}>Coming soon</Text>
            </View>
          </View>
        )}

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <View style={styles.card}>
            {org.website && (
              <Pressable style={styles.contactRow} onPress={() => openWebsite(org.website!)}>
                <Ionicons name="globe-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.contactLink} numberOfLines={1}>
                  {org.website.replace(/^https?:\/\//, '')}
                </Text>
                <Ionicons name="open-outline" size={16} color={colors.textMuted} />
              </Pressable>
            )}
            {org.publicPhone && (
              <Pressable style={styles.contactRow} onPress={() => callPhone(org.publicPhone!)}>
                <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.contactLink}>{org.publicPhone}</Text>
              </Pressable>
            )}
            {org.publicAddress && (
              <View style={styles.contactRow}>
                <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
                <View style={styles.addressContainer}>
                  <Text style={styles.contactText}>{org.publicAddress}</Text>
                  {(org.city || org.state || org.publicZipCode) && (
                    <Text style={styles.contactText}>
                      {[org.city, org.state].filter(Boolean).join(', ')}
                      {org.publicZipCode && ` ${org.publicZipCode}`}
                    </Text>
                  )}
                </View>
              </View>
            )}
            {!org.website && !org.publicPhone && !org.publicAddress && (
              <Text style={styles.noContact}>No contact information available</Text>
            )}
          </View>
        </View>

        {/* About */}
        {org.congregationSize && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <View style={styles.card}>
              <View style={styles.statRow}>
                <Ionicons name="people-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.statText}>
                  ~{org.congregationSize.toLocaleString()} members
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>

      {/* Meeting Request Modal */}
      <Modal
        visible={showMeetingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMeetingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request a Meeting</Text>
            <Text style={styles.modalSubtitle}>
              Let the church leadership know why you'd like to meet.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Reason for meeting..."
              placeholderTextColor={colors.textMuted}
              value={meetingReason}
              onChangeText={setMeetingReason}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowMeetingModal(false);
                  setMeetingReason('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalSubmitButton, requestMeetingMutation.isPending && styles.disabledButton]}
                onPress={handleRequestMeeting}
                disabled={requestMeetingMutation.isPending}
              >
                <Text style={styles.modalSubmitText}>
                  {requestMeetingMutation.isPending ? 'Sending...' : 'Submit'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Leader Detail Modal */}
      <Modal
        visible={!!selectedLeader}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedLeader(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedLeader(null)}>
          <Pressable style={styles.leaderModalContent} onPress={(e) => e.stopPropagation()}>
            {selectedLeader && (
              <>
                <View style={styles.leaderModalHeader}>
                  {selectedLeader.photoUrl ? (
                    <Image source={{ uri: selectedLeader.photoUrl }} style={styles.leaderModalAvatar} />
                  ) : (
                    <View style={[styles.leaderModalAvatar, styles.leaderAvatarPlaceholder]}>
                      <Text style={styles.leaderModalInitials}>{getInitials(selectedLeader.name)}</Text>
                    </View>
                  )}
                  <View style={styles.leaderModalInfo}>
                    <Text style={styles.leaderModalName}>{selectedLeader.name}</Text>
                    {selectedLeader.title && (
                      <Text style={styles.leaderModalTitle}>{selectedLeader.title}</Text>
                    )}
                  </View>
                </View>
                {selectedLeader.bio && (
                  <ScrollView style={styles.leaderModalBioScroll}>
                    <Text style={styles.leaderModalBio}>{selectedLeader.bio}</Text>
                  </ScrollView>
                )}
                <Pressable style={styles.leaderModalClose} onPress={() => setSelectedLeader(null)}>
                  <Text style={styles.leaderModalCloseText}>Close</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any, colorScheme: string) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 16,
    },
    errorText: {
      fontSize: 15,
      color: colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
    errorButton: {
      marginTop: 20,
      paddingVertical: 12,
      paddingHorizontal: 24,
      backgroundColor: colors.primary,
      borderRadius: 8,
    },
    errorButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    headerRight: {
      width: 40,
    },
    scrollView: {
      flex: 1,
    },
    orgHeader: {
      alignItems: 'center',
      paddingVertical: 24,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    avatarContainer: {
      marginBottom: 16,
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
    },
    avatarPlaceholder: {
      backgroundColor: colors.surfaceMuted,
      justifyContent: 'center',
      alignItems: 'center',
    },
    orgName: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    badge: {
      marginTop: 8,
      paddingHorizontal: 12,
      paddingVertical: 4,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 12,
    },
    badgeText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 4,
    },
    locationText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    description: {
      marginTop: 16,
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    section: {
      paddingHorizontal: 16,
      paddingTop: 20,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 12,
    },
    card: {
      backgroundColor: colorScheme === 'dark' ? colors.surfaceMuted : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    cardText: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    connectionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    connectionInfo: {
      flex: 1,
    },
    connectionRole: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    connectionSubtext: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    roleBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 16,
    },
    roleBadgeMember: {
      backgroundColor: colors.primary,
    },
    roleBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    roleBadgeTextMember: {
      color: '#FFFFFF',
    },
    actionButtons: {
      marginTop: 16,
      gap: 10,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 8,
      gap: 8,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    primaryButton: {
      backgroundColor: colors.primary,
    },
    primaryButtonText: {
      color: '#FFFFFF',
    },
    pendingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      gap: 6,
    },
    pendingText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 8,
    },
    contactLink: {
      flex: 1,
      fontSize: 15,
      color: colors.primary,
    },
    contactText: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    addressContainer: {
      flex: 1,
    },
    noContact: {
      fontSize: 14,
      color: colors.textMuted,
      fontStyle: 'italic',
    },
    statRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statText: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    comingSoon: {
      fontSize: 14,
      color: colors.textMuted,
      fontStyle: 'italic',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    modalSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    modalInput: {
      backgroundColor: colors.input,
      borderRadius: 8,
      padding: 12,
      fontSize: 15,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    modalButtons: {
      flexDirection: 'row',
      marginTop: 16,
      gap: 12,
    },
    modalCancelButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 8,
      backgroundColor: colors.surfaceMuted,
    },
    modalCancelText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    modalSubmitButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 8,
      backgroundColor: colors.primary,
    },
    modalSubmitText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    disabledButton: {
      opacity: 0.6,
    },
    // Leader styles
    leadersGrid: {
      gap: 12,
    },
    leaderCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colorScheme === 'dark' ? colors.surfaceMuted : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      gap: 12,
    },
    leaderAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
    },
    leaderAvatarPlaceholder: {
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    leaderInitials: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
    },
    leaderInfo: {
      flex: 1,
    },
    leaderName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    leaderTitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    leaderBio: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 6,
      lineHeight: 18,
    },
    // Leader Modal
    leaderModalContent: {
      width: '100%',
      maxWidth: 400,
      maxHeight: '80%',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
    },
    leaderModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginBottom: 16,
    },
    leaderModalAvatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
    },
    leaderModalInitials: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.primary,
    },
    leaderModalInfo: {
      flex: 1,
    },
    leaderModalName: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    leaderModalTitle: {
      fontSize: 15,
      color: colors.textSecondary,
      marginTop: 4,
    },
    leaderModalBioScroll: {
      maxHeight: 200,
    },
    leaderModalBio: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    leaderModalClose: {
      marginTop: 20,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 8,
      backgroundColor: colors.surfaceMuted,
    },
    leaderModalCloseText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    // Sermon styles
    sermonsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    sermonCard: {
      width: '47%',
      backgroundColor: colorScheme === 'dark' ? colors.surfaceMuted : '#FFFFFF',
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    sermonThumbnailContainer: {
      position: 'relative',
      aspectRatio: 16 / 9,
    },
    sermonThumbnail: {
      width: '100%',
      height: '100%',
    },
    sermonThumbnailPlaceholder: {
      backgroundColor: colors.surfaceMuted,
      justifyContent: 'center',
      alignItems: 'center',
    },
    durationBadge: {
      position: 'absolute',
      bottom: 6,
      right: 6,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    durationText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    sermonInfo: {
      padding: 10,
    },
    sermonTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
      lineHeight: 18,
    },
    sermonSpeaker: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    sermonDate: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
      paddingVertical: 12,
      gap: 4,
    },
    viewAllText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
  });
