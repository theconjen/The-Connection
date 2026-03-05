/**
 * Event Check-ins Screen
 * Allows event hosts to manually check in attendees at the event.
 * Shows checked-in vs not-yet-checked-in attendees with search filtering.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../src/lib/apiClient';

interface CheckinRecord {
  id: number;
  userId: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  checkedInAt: string;
  method?: string;
}

interface Attendee {
  id: number;
  userId: number;
  status: string;
  user: {
    id: number;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
}

interface AttendeesResponse {
  going: Attendee[];
  maybe: Attendee[];
  notGoing: Attendee[];
  counts: {
    going: number;
    maybe: number;
    notGoing: number;
    total: number;
  };
}

const EVENT_BLUE = '#1a2a4a';

export default function EventCheckinsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = parseInt(id || '0', 10);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, colorScheme } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isDark = colorScheme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');

  // Fetch check-ins
  const {
    data: checkinsData,
    isLoading: checkinsLoading,
    refetch: refetchCheckins,
    isRefetching: isRefetchingCheckins,
  } = useQuery<CheckinRecord[]>({
    queryKey: ['event-checkins', eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/events/${eventId}/checkins`);
      return res.data;
    },
    enabled: !!eventId,
  });

  // Fetch all attendees (RSVP'd going + maybe)
  const {
    data: attendeesData,
    isLoading: attendeesLoading,
    refetch: refetchAttendees,
    isRefetching: isRefetchingAttendees,
  } = useQuery<AttendeesResponse>({
    queryKey: ['event-attendees', eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/events/${eventId}/rsvps/manage`);
      return res.data;
    },
    enabled: !!eventId,
  });

  // Check-in mutation
  const checkinMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiClient.post(`/api/events/${eventId}/checkin`, { userId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-checkins', eventId] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.error || error?.response?.data?.message || 'Failed to check in attendee');
    },
  });

  const handleRefresh = useCallback(() => {
    refetchCheckins();
    refetchAttendees();
  }, [refetchCheckins, refetchAttendees]);

  const checkins = checkinsData || [];

  // Build list of all attendees (going + maybe) as potential check-in candidates
  const allAttendees: Attendee[] = [
    ...(attendeesData?.going || []),
    ...(attendeesData?.maybe || []),
  ];

  const checkedInIds = new Set(checkins.map((c) => c.userId));
  const totalAttendees = allAttendees.length;
  const checkedInCount = checkins.length;

  // Filter not-yet-checked-in attendees
  const notCheckedIn = allAttendees.filter(
    (a) => !checkedInIds.has(a.userId || a.user?.id || 0)
  );

  // Apply search filter
  const filterBySearch = <T extends { displayName?: string; username?: string; user?: { displayName?: string; username?: string } | null }>(
    list: T[]
  ): T[] => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((item) => {
      const name = item.displayName || item.user?.displayName || item.username || item.user?.username || '';
      return name.toLowerCase().includes(q);
    });
  };

  const filteredCheckins = filterBySearch(checkins);
  const filteredNotCheckedIn = filterBySearch(notCheckedIn);

  const formatCheckinTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleCheckin = (attendee: Attendee) => {
    const userId = attendee.userId || attendee.user?.id;
    if (!userId) return;
    const name = attendee.user?.displayName || attendee.user?.username || 'this attendee';

    Alert.alert(
      'Check In',
      `Check in ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check In',
          onPress: () => checkinMutation.mutate(userId),
        },
      ]
    );
  };

  const getInitial = (name: string) => {
    return (name || '?').charAt(0).toUpperCase();
  };

  const isLoading = checkinsLoading || attendeesLoading;
  const isRefreshing = isRefetchingCheckins || isRefetchingAttendees;

  // --- Render checked-in item ---
  const renderCheckedInItem = ({ item }: { item: CheckinRecord }) => (
    <View style={[styles.attendeeRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
      {item.avatarUrl ? (
        <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? '#1a3d2e' : '#e8f5e9' }]}>
          <Text style={[styles.avatarInitial, { color: '#4caf50' }]}>
            {getInitial(item.displayName || item.username)}
          </Text>
        </View>
      )}
      <View style={styles.attendeeInfo}>
        <Text style={[styles.attendeeName, { color: colors.textPrimary }]}>
          {item.displayName || item.username}
        </Text>
        <Text style={[styles.attendeeDetail, { color: colors.textMuted }]}>
          Checked in at {formatCheckinTime(item.checkedInAt)}
        </Text>
      </View>
      <Ionicons name="checkmark-circle" size={22} color="#4caf50" />
    </View>
  );

  // --- Render not-checked-in item ---
  const renderNotCheckedInItem = ({ item }: { item: Attendee }) => {
    if (!item.user) return null;
    const isPending = checkinMutation.isPending && checkinMutation.variables === (item.userId || item.user.id);

    return (
      <View style={[styles.attendeeRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
        {item.user.avatarUrl ? (
          <Image source={{ uri: item.user.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.avatarInitial, { color: colors.primary }]}>
              {getInitial(item.user.displayName || item.user.username)}
            </Text>
          </View>
        )}
        <View style={styles.attendeeInfo}>
          <Text style={[styles.attendeeName, { color: colors.textPrimary }]}>
            {item.user.displayName || item.user.username}
          </Text>
          <Text style={[styles.attendeeDetail, { color: colors.textMuted }]}>
            RSVP: {item.status === 'going' ? 'Going' : 'Maybe'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.checkinButton, isPending && styles.checkinButtonDisabled]}
          onPress={() => handleCheckin(item)}
          disabled={isPending || checkinMutation.isPending}
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.checkinButtonText}>Check In</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // --- Combined data for single FlatList ---
  type SectionItem =
    | { type: 'section-header'; title: string; count: number; key: string }
    | { type: 'checked-in'; data: CheckinRecord; key: string }
    | { type: 'not-checked-in'; data: Attendee; key: string }
    | { type: 'empty'; message: string; key: string };

  const buildSectionData = (): SectionItem[] => {
    const items: SectionItem[] = [];

    // Checked In section
    items.push({ type: 'section-header', title: 'Checked In', count: filteredCheckins.length, key: 'header-checked-in' });
    if (filteredCheckins.length > 0) {
      filteredCheckins.forEach((c) => {
        items.push({ type: 'checked-in', data: c, key: `checkin-${c.id || c.userId}` });
      });
    } else {
      items.push({
        type: 'empty',
        message: searchQuery ? 'No matching checked-in attendees' : 'No one checked in yet',
        key: 'empty-checked-in',
      });
    }

    // Not Yet Checked In section
    items.push({ type: 'section-header', title: 'Not Yet Checked In', count: filteredNotCheckedIn.length, key: 'header-not-checked-in' });
    if (filteredNotCheckedIn.length > 0) {
      filteredNotCheckedIn.forEach((a) => {
        items.push({ type: 'not-checked-in', data: a, key: `attendee-${a.id || a.userId}` });
      });
    } else {
      items.push({
        type: 'empty',
        message: searchQuery ? 'No matching attendees' : 'All attendees have been checked in',
        key: 'empty-not-checked-in',
      });
    }

    return items;
  };

  const renderItem = ({ item }: { item: SectionItem }) => {
    switch (item.type) {
      case 'section-header':
        return (
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{item.title}</Text>
            <View style={[styles.sectionBadge, { backgroundColor: isDark ? colors.surfaceRaised : '#f0f4f8' }]}>
              <Text style={[styles.sectionBadgeText, { color: colors.textSecondary }]}>{item.count}</Text>
            </View>
          </View>
        );
      case 'checked-in':
        return renderCheckedInItem({ item: item.data });
      case 'not-checked-in':
        return renderNotCheckedInItem({ item: item.data });
      case 'empty':
        return (
          <View style={styles.emptySection}>
            <Text style={[styles.emptySectionText, { color: colors.textMuted }]}>{item.message}</Text>
          </View>
        );
      default:
        return null;
    }
  };

  // --- Loading state ---
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Check-ins</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading attendees...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Check-ins</Text>
        <View style={[styles.statsBadge, { backgroundColor: EVENT_BLUE }]}>
          <Text style={styles.statsBadgeText}>
            {checkedInCount}/{totalAttendees}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressContainer, { backgroundColor: isDark ? colors.surfaceRaised : '#f0f4f8' }]}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: totalAttendees > 0 ? `${(checkedInCount / totalAttendees) * 100}%` : '0%',
                backgroundColor: '#4caf50',
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          {checkedInCount} of {totalAttendees} attendee{totalAttendees !== 1 ? 's' : ''} checked in
        </Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle }]}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? colors.surfaceRaised : '#f0f4f8' }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search attendees..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <FlatList
        data={buildSectionData()}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  statsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    minWidth: 52,
    alignItems: 'center',
  },
  statsBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressBarBackground: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 2,
  },
  listContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '600',
  },
  attendeeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  attendeeName: {
    fontSize: 15,
    fontWeight: '600',
  },
  attendeeDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  checkinButton: {
    backgroundColor: EVENT_BLUE,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  checkinButtonDisabled: {
    opacity: 0.6,
  },
  checkinButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptySectionText: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
});
