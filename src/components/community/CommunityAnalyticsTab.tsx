/**
 * Community Analytics Tab
 * Displays community analytics including member stats, top contributors, and recent events
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../../contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { Ionicons } from '@expo/vector-icons';

interface CommunityAnalyticsTabProps {
  communityId: number;
}

interface TopContributor {
  userId: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  postCount: number;
}

interface RecentEvent {
  id: number;
  title: string;
  attendeeCount: number;
}

interface AnalyticsData {
  memberCount: number;
  activeMembersCount: number;
  newMembersThisWeek: number;
  topContributors: TopContributor[];
  recentEvents: RecentEvent[];
}

export default function CommunityAnalyticsTab({ communityId }: CommunityAnalyticsTabProps) {
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  const { data: analytics, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['community-analytics', communityId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/communities/${communityId}/analytics`);
      return response.data;
    },
    enabled: !!communityId,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Loading analytics...
        </Text>
      </View>
    );
  }

  if (error || !analytics) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="analytics-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
          Unable to load analytics
        </Text>
        <Text style={[styles.errorSubtext, { color: colors.mutedForeground }]}>
          Analytics data is not available at this time.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stat Cards Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, {
          backgroundColor: isDark ? colors.surfaceMuted : colors.surface,
          borderColor: colors.borderSubtle,
        }]}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="people" size={22} color={colors.primary} />
          </View>
          <Text style={[styles.statNumber, { color: colors.foreground }]}>
            {analytics.memberCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Members</Text>
          {analytics.newMembersThisWeek > 0 && (
            <View style={styles.statBadge}>
              <Ionicons name="trending-up" size={12} color="#10B981" />
              <Text style={styles.statBadgeText}>+{analytics.newMembersThisWeek} this week</Text>
            </View>
          )}
        </View>

        <View style={[styles.statCard, {
          backgroundColor: isDark ? colors.surfaceMuted : colors.surface,
          borderColor: colors.borderSubtle,
        }]}>
          <View style={[styles.statIconContainer, { backgroundColor: '#10B98120' }]}>
            <Ionicons name="pulse" size={22} color="#10B981" />
          </View>
          <Text style={[styles.statNumber, { color: colors.foreground }]}>
            {analytics.activeMembersCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Active This Week</Text>
        </View>
      </View>

      {/* Top Contributors Section */}
      <View style={[styles.section, {
        backgroundColor: isDark ? colors.surfaceMuted : colors.surface,
        borderColor: colors.borderSubtle,
      }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="trophy" size={20} color="#F59E0B" />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Top Contributors</Text>
        </View>

        {analytics.topContributors.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={[styles.emptySectionText, { color: colors.mutedForeground }]}>
              No contributors yet
            </Text>
          </View>
        ) : (
          analytics.topContributors.slice(0, 5).map((contributor, index) => (
            <View
              key={contributor.userId}
              style={[
                styles.contributorRow,
                index < analytics.topContributors.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.borderSubtle,
                },
              ]}
            >
              <Text style={[styles.rankNumber, { color: colors.mutedForeground }]}>
                {index + 1}
              </Text>
              <View style={[styles.contributorAvatar, { backgroundColor: colors.primary }]}>
                {contributor.avatarUrl ? (
                  <Image
                    source={{ uri: contributor.avatarUrl }}
                    style={styles.contributorAvatarImage}
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <Text style={styles.contributorAvatarText}>
                    {(contributor.displayName || contributor.username || 'U').charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={styles.contributorInfo}>
                <Text style={[styles.contributorName, { color: colors.foreground }]} numberOfLines={1}>
                  {contributor.displayName || contributor.username}
                </Text>
                <Text style={[styles.contributorPosts, { color: colors.mutedForeground }]}>
                  {contributor.postCount} {contributor.postCount === 1 ? 'post' : 'posts'}
                </Text>
              </View>
              {index === 0 && (
                <Ionicons name="medal" size={20} color="#F59E0B" />
              )}
            </View>
          ))
        )}
      </View>

      {/* Recent Events Section */}
      <View style={[styles.section, {
        backgroundColor: isDark ? colors.surfaceMuted : colors.surface,
        borderColor: colors.borderSubtle,
      }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="calendar" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Events</Text>
        </View>

        {analytics.recentEvents.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={[styles.emptySectionText, { color: colors.mutedForeground }]}>
              No recent events
            </Text>
          </View>
        ) : (
          analytics.recentEvents.map((event, index) => (
            <View
              key={event.id}
              style={[
                styles.eventRow,
                index < analytics.recentEvents.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.borderSubtle,
                },
              ]}
            >
              <View style={[styles.eventIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.eventInfo}>
                <Text style={[styles.eventTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {event.title}
                </Text>
                <View style={styles.attendeeInfo}>
                  <Ionicons name="people-outline" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.attendeeCount, { color: colors.mutedForeground }]}>
                    {event.attendeeCount} {event.attendeeCount === 1 ? 'attendee' : 'attendees'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptySectionText: {
    fontSize: 14,
  },
  contributorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '700',
    width: 20,
    textAlign: 'center',
  },
  contributorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contributorAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  contributorAvatarText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  contributorInfo: {
    flex: 1,
  },
  contributorName: {
    fontSize: 15,
    fontWeight: '600',
  },
  contributorPosts: {
    fontSize: 13,
    marginTop: 1,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  eventIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  attendeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  attendeeCount: {
    fontSize: 13,
  },
});
