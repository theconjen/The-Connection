/**
 * Event Attendees Management Screen
 * Allows event hosts to view RSVPs, see attendee counts, and message attendees
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../../src/lib/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useAuth } from '../../../src/contexts/AuthContext';

type RsvpStatus = 'going' | 'maybe' | 'not_going';

interface Attendee {
  id: number;
  userId: number;
  status: RsvpStatus;
  createdAt: string;
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

export default function EventAttendeesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = parseInt(id || '0');
  const insets = useSafeAreaInsets();
  const { colors, colorScheme } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isDark = colorScheme === 'dark';

  const [activeTab, setActiveTab] = useState<'going' | 'maybe' | 'notGoing'>('going');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Fetch attendees
  const { data: attendeesData, isLoading, error, refetch, isRefetching } = useQuery<AttendeesResponse>({
    queryKey: ['event-attendees', eventId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/events/${eventId}/rsvps/manage`);
      return response.data;
    },
    enabled: !!eventId,
  });

  // Fetch event details for the title
  const { data: event } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/events/${eventId}`);
      return response.data;
    },
    enabled: !!eventId,
  });

  const getAttendeesList = (): Attendee[] => {
    if (!attendeesData) return [];
    switch (activeTab) {
      case 'going': return attendeesData.going;
      case 'maybe': return attendeesData.maybe;
      case 'notGoing': return attendeesData.notGoing;
      default: return [];
    }
  };

  const handleMessageAttendees = async () => {
    if (!messageText.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    setIsSendingMessage(true);
    try {
      // Get all attendees who are going or maybe
      const attendeesToMessage = [
        ...(attendeesData?.going || []),
        ...(attendeesData?.maybe || []),
      ];

      if (attendeesToMessage.length === 0) {
        Alert.alert('No Attendees', 'There are no attendees to message.');
        setIsSendingMessage(false);
        return;
      }

      // Send DM to each attendee
      let sentCount = 0;
      for (const attendee of attendeesToMessage) {
        if (attendee.userId && attendee.userId !== user?.id) {
          try {
            await apiClient.post('/api/dm', {
              receiverId: attendee.userId,
              content: `[Event Update: ${event?.title || 'Event'}]\n\n${messageText}`,
            });
            sentCount++;
          } catch (err) {
          }
        }
      }

      setShowMessageModal(false);
      setMessageText('');
      Alert.alert('Success', `Message sent to ${sentCount} attendee${sentCount !== 1 ? 's' : ''}.`);
    } catch (err) {
      Alert.alert('Error', 'Failed to send messages. Please try again.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const navigateToProfile = (userId: number) => {
    router.push(`/profile/${userId}`);
  };

  const renderAttendee = ({ item }: { item: Attendee }) => {
    if (!item.user) return null;

    return (
      <TouchableOpacity
        style={[styles.attendeeRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
        onPress={() => navigateToProfile(item.user!.id)}
        activeOpacity={0.7}
      >
        {item.user.avatarUrl ? (
          <Image source={{ uri: item.user.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.avatarInitial, { color: colors.primary }]}>
              {(item.user.displayName || item.user.username).charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.attendeeInfo}>
          <Text style={[styles.attendeeName, { color: colors.textPrimary }]}>
            {item.user.displayName || item.user.username}
          </Text>
          <Text style={[styles.attendeeUsername, { color: colors.textMuted }]}>
            @{item.user.username}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Attendees</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Attendees</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.errorText, { color: colors.textMuted }]}>
            Only the event host can view attendee details
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const counts = attendeesData?.counts || { going: 0, maybe: 0, notGoing: 0, total: 0 };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          Attendees
        </Text>
        <TouchableOpacity
          onPress={() => setShowMessageModal(true)}
          style={styles.messageButton}
          disabled={counts.going + counts.maybe === 0}
        >
          <Ionicons
            name="chatbubble-outline"
            size={22}
            color={counts.going + counts.maybe > 0 ? colors.primary : colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: isDark ? '#1a3d2e' : '#e8f5e9' }]}>
          <Text style={[styles.summaryCount, { color: '#4caf50' }]}>{counts.going}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Going</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: isDark ? '#3d3a1a' : '#fff8e1' }]}>
          <Text style={[styles.summaryCount, { color: '#ff9800' }]}>{counts.maybe}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Maybe</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: isDark ? '#3d1a1a' : '#ffebee' }]}>
          <Text style={[styles.summaryCount, { color: '#f44336' }]}>{counts.notGoing}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Can't Go</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'going' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('going')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'going' ? colors.primary : colors.textSecondary }]}>
            Going ({counts.going})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'maybe' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('maybe')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'maybe' ? colors.primary : colors.textSecondary }]}>
            Maybe ({counts.maybe})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'notGoing' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('notGoing')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'notGoing' ? colors.primary : colors.textSecondary }]}>
            Can't Go ({counts.notGoing})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Attendees List */}
      <FlatList
        data={getAttendeesList()}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderAttendee}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No {activeTab === 'going' ? 'confirmed' : activeTab === 'maybe' ? 'tentative' : 'declined'} attendees yet
            </Text>
          </View>
        }
      />

      {/* Message Modal */}
      <Modal
        visible={showMessageModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowMessageModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Message Attendees
              </Text>
              <TouchableOpacity onPress={() => setShowMessageModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Send an update to {counts.going + counts.maybe} attendee{counts.going + counts.maybe !== 1 ? 's' : ''} (Going + Maybe)
            </Text>

            <TextInput
              style={[
                styles.messageInput,
                {
                  backgroundColor: isDark ? '#1a2a4a' : '#f5f5f5',
                  color: colors.textPrimary,
                  borderColor: colors.borderSubtle,
                },
              ]}
              placeholder="Type your event update here..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={messageText}
              onChangeText={setMessageText}
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: messageText.trim() ? colors.primary : colors.surfaceMuted },
              ]}
              onPress={handleMessageAttendees}
              disabled={!messageText.trim() || isSendingMessage}
            >
              {isSendingMessage ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={styles.sendButtonText}>Send Update</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  messageButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryCount: {
    fontSize: 28,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
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
  attendeeUsername: {
    fontSize: 13,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 120,
    marginBottom: 16,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
