/**
 * Leader Inbox Screen
 * For church leaders to manage membership and meeting requests
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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Text } from '../../src/theme';
import { Ionicons } from '@expo/vector-icons';
import {
  useLeaderEntitlements,
  useMembershipRequests,
  useMeetingRequests,
  useApproveMembership,
  useDeclineMembership,
  useUpdateMeetingStatus,
  MembershipRequest,
  MeetingRequest,
} from '../../src/queries/churches';

type TabType = 'memberships' | 'meetings';

export default function LeaderInboxScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, colorScheme } = useTheme();
  const styles = getStyles(colors, colorScheme);

  const [activeTab, setActiveTab] = useState<TabType>('memberships');

  // Fetch entitlements to determine what tabs to show
  const { data: entitlements, isLoading: isLoadingEntitlements } = useLeaderEntitlements();

  // Fetch requests
  const {
    data: membershipRequests = [],
    isLoading: isLoadingMemberships,
    refetch: refetchMemberships,
    isRefetching: isRefetchingMemberships,
  } = useMembershipRequests();

  const {
    data: meetingRequests = [],
    isLoading: isLoadingMeetings,
    refetch: refetchMeetings,
    isRefetching: isRefetchingMeetings,
  } = useMeetingRequests();

  // Mutations
  const approveMutation = useApproveMembership();
  const declineMutation = useDeclineMembership();
  const updateMeetingMutation = useUpdateMeetingStatus();

  const handleApproveMembership = async (request: MembershipRequest) => {
    Alert.alert(
      'Approve Membership',
      `Approve ${request.user.displayName || request.user.username}'s membership request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await approveMutation.mutateAsync(request.id);
              Alert.alert('Success', 'Membership approved');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to approve');
            }
          },
        },
      ]
    );
  };

  const handleDeclineMembership = async (request: MembershipRequest) => {
    Alert.alert(
      'Decline Membership',
      `Decline ${request.user.displayName || request.user.username}'s membership request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await declineMutation.mutateAsync(request.id);
              Alert.alert('Success', 'Membership declined');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to decline');
            }
          },
        },
      ]
    );
  };

  const handleUpdateMeetingStatus = async (
    request: MeetingRequest,
    status: 'in_progress' | 'closed'
  ) => {
    try {
      await updateMeetingMutation.mutateAsync({ requestId: request.id, status });
      Alert.alert('Success', status === 'closed' ? 'Request closed' : 'Marked in progress');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoadingEntitlements) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!entitlements?.showLeaderInbox) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Leader Inbox</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="lock-closed-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Access Required</Text>
          <Text style={styles.emptyText}>
            You need leadership access to view this inbox.
          </Text>
        </View>
      </View>
    );
  }

  const showMeetingsTab = entitlements.leaderInboxHasMeetingsTab;
  const isLoading = activeTab === 'memberships' ? isLoadingMemberships : isLoadingMeetings;
  const isRefetching = activeTab === 'memberships' ? isRefetchingMemberships : isRefetchingMeetings;
  const handleRefresh = activeTab === 'memberships' ? refetchMemberships : refetchMeetings;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Leader Inbox</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'memberships' ? styles.tabActive : undefined]}
          onPress={() => setActiveTab('memberships')}
        >
          <Text style={activeTab === 'memberships' ? StyleSheet.flatten([styles.tabText, styles.tabTextActive]) : styles.tabText}>
            Memberships
          </Text>
          {membershipRequests.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{membershipRequests.length}</Text>
            </View>
          )}
        </Pressable>
        {showMeetingsTab && (
          <Pressable
            style={[styles.tab, activeTab === 'meetings' ? styles.tabActive : undefined]}
            onPress={() => setActiveTab('meetings')}
          >
            <Text style={activeTab === 'meetings' ? StyleSheet.flatten([styles.tabText, styles.tabTextActive]) : styles.tabText}>
              Meetings
            </Text>
            {meetingRequests.filter((r) => r.status === 'new').length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>
                  {meetingRequests.filter((r) => r.status === 'new').length}
                </Text>
              </View>
            )}
          </Pressable>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
          }
        >
          {activeTab === 'memberships' ? (
            membershipRequests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="person-add-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Requests</Text>
                <Text style={styles.emptyText}>
                  New membership requests will appear here.
                </Text>
              </View>
            ) : (
              <View style={styles.listContainer}>
                {membershipRequests.map((request) => (
                  <View key={request.id} style={styles.requestCard}>
                    <View style={styles.requestHeader}>
                      <Image
                        source={{
                          uri:
                            request.user.avatarUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              request.user.displayName || request.user.username
                            )}&background=random`,
                        }}
                        style={styles.avatar}
                      />
                      <View style={styles.requestInfo}>
                        <Text style={styles.requestName}>
                          {request.user.displayName || request.user.username}
                        </Text>
                        <Text style={styles.requestUsername}>@{request.user.username}</Text>
                        {request.organization && (
                          <Text style={styles.requestOrg}>{request.organization.name}</Text>
                        )}
                      </View>
                    </View>
                    <Text style={styles.requestDate}>
                      Requested {formatDate(request.requestedAt)}
                    </Text>
                    <View style={styles.requestActions}>
                      <Pressable
                        style={[styles.actionButton, styles.declineButton]}
                        onPress={() => handleDeclineMembership(request)}
                        disabled={declineMutation.isPending}
                      >
                        <Text style={styles.declineButtonText}>Decline</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handleApproveMembership(request)}
                        disabled={approveMutation.isPending}
                      >
                        <Text style={styles.approveButtonText}>Approve</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )
          ) : (
            meetingRequests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Meeting Requests</Text>
                <Text style={styles.emptyText}>
                  Pastoral meeting requests will appear here.
                </Text>
              </View>
            ) : (
              <View style={styles.listContainer}>
                {meetingRequests.map((request) => (
                  <View key={request.id} style={styles.requestCard}>
                    <View style={styles.requestHeader}>
                      <Image
                        source={{
                          uri:
                            request.requester.avatarUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              request.requester.displayName || request.requester.username
                            )}&background=random`,
                        }}
                        style={styles.avatar}
                      />
                      <View style={styles.requestInfo}>
                        <Text style={styles.requestName}>
                          {request.requester.displayName || request.requester.username}
                        </Text>
                        <Text style={styles.requestUsername}>@{request.requester.username}</Text>
                        {request.organization && (
                          <Text style={styles.requestOrg}>{request.organization.name}</Text>
                        )}
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          request.status === 'new' && styles.statusNew,
                          request.status === 'in_progress' && styles.statusInProgress,
                          request.status === 'closed' && styles.statusClosed,
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {request.status === 'new'
                            ? 'New'
                            : request.status === 'in_progress'
                            ? 'In Progress'
                            : 'Closed'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.reasonContainer}>
                      <Text style={styles.reasonLabel}>Reason:</Text>
                      <Text style={styles.reasonText}>{request.reason}</Text>
                    </View>
                    <Text style={styles.requestDate}>
                      Requested {formatDate(request.createdAt)}
                    </Text>
                    {request.status !== 'closed' && (
                      <View style={styles.requestActions}>
                        {request.status === 'new' && (
                          <Pressable
                            style={[styles.actionButton, styles.progressButton]}
                            onPress={() => handleUpdateMeetingStatus(request, 'in_progress')}
                            disabled={updateMeetingMutation.isPending}
                          >
                            <Text style={styles.progressButtonText}>Mark In Progress</Text>
                          </Pressable>
                        )}
                        <Pressable
                          style={[styles.actionButton, styles.closeButton]}
                          onPress={() => handleUpdateMeetingStatus(request, 'closed')}
                          disabled={updateMeetingMutation.isPending}
                        >
                          <Text style={styles.closeButtonText}>Close</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )
          )}
          <View style={{ height: insets.bottom + 20 }} />
        </ScrollView>
      )}
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
    tabContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      gap: 6,
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    tabBadge: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    tabBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    scrollView: {
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 80,
      paddingHorizontal: 40,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      marginTop: 16,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
    listContainer: {
      padding: 16,
      gap: 12,
    },
    requestCard: {
      backgroundColor: colorScheme === 'dark' ? colors.surfaceMuted : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    requestHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.surfaceMuted,
    },
    requestInfo: {
      flex: 1,
    },
    requestName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    requestUsername: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 1,
    },
    requestOrg: {
      fontSize: 13,
      color: colors.accent,
      marginTop: 2,
    },
    requestDate: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 12,
    },
    requestActions: {
      flexDirection: 'row',
      marginTop: 12,
      gap: 10,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 8,
    },
    declineButton: {
      backgroundColor: colors.surfaceMuted,
    },
    declineButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    approveButton: {
      backgroundColor: colors.primary,
    },
    approveButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    progressButton: {
      backgroundColor: colors.surfaceMuted,
    },
    progressButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    closeButton: {
      backgroundColor: colors.primary,
    },
    closeButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusNew: {
      backgroundColor: '#DBEAFE',
    },
    statusInProgress: {
      backgroundColor: '#FEF3C7',
    },
    statusClosed: {
      backgroundColor: '#D1FAE5',
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#1F2937',
    },
    reasonContainer: {
      marginTop: 12,
      padding: 12,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 8,
    },
    reasonLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    reasonText: {
      fontSize: 14,
      color: colors.textPrimary,
      lineHeight: 20,
    },
  });
