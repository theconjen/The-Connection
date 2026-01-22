import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../src/lib/apiClient';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';

interface Question {
  id: number;
  askerUserId: number;
  domain: string;
  areaId: number;
  tagId: number;
  questionText: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  assignmentId?: number;
  assignmentStatus?: string;
  askerDisplayName?: string;
}

interface StatusFilter {
  value: string | undefined;
  label: string;
}

const STATUS_FILTERS: StatusFilter[] = [
  { value: undefined, label: 'All' },
  { value: 'assigned', label: 'New' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'answered', label: 'Answered' },
  { value: 'declined', label: 'Declined' },
];

export default function InboxScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, colorScheme } = useTheme();
  const styles = getThemedStyles(colors, colorScheme);
  const queryClient = useQueryClient();

  const [selectedFilter, setSelectedFilter] = useState<string | undefined>(undefined);

  // Fetch inbox questions
  const { data: questions, isLoading, refetch, isRefetching } = useQuery<Question[]>({
    queryKey: ['/api/questions/inbox', selectedFilter],
    queryFn: async () => {
      const params = selectedFilter ? `?status=${selectedFilter}` : '';
      const response = await apiClient.get(`/api/questions/inbox${params}`);
      return response.data;
    },
    enabled: !!user,
  });

  // Accept assignment mutation
  const acceptMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      return await apiClient.post(`/api/assignments/${assignmentId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions/inbox'] });
      Alert.alert('Success', 'Assignment accepted successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to accept assignment');
    },
  });

  // Decline assignment mutation
  const declineMutation = useMutation({
    mutationFn: async ({ assignmentId, reason }: { assignmentId: number; reason?: string }) => {
      return await apiClient.post(`/api/assignments/${assignmentId}/decline`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions/inbox'] });
      Alert.alert('Success', 'Assignment declined. Question will be reassigned.');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to decline assignment');
    },
  });

  const handleAccept = (assignmentId: number) => {
    Alert.alert(
      'Accept Assignment',
      'Are you sure you want to accept this question?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => acceptMutation.mutate(assignmentId),
        },
      ]
    );
  };

  const handleDecline = (assignmentId: number) => {
    Alert.alert(
      'Decline Assignment',
      'Are you sure you want to decline this question? It will be reassigned to another responder.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => declineMutation.mutate({ assignmentId }),
        },
      ]
    );
  };

  const handleViewThread = (questionId: number) => {
    router.push(`/questions/${questionId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return '#FFA500';
      case 'accepted':
        return colors.accent;
      case 'answered':
        return '#2ECC71';
      case 'declined':
        return '#E74C3C';
      default:
        return colors.textTertiary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'New';
      case 'accepted':
        return 'Accepted';
      case 'answered':
        return 'Answered';
      case 'declined':
        return 'Declined';
      default:
        return status;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Inbox</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {STATUS_FILTERS.map((filter) => (
            <Pressable
              key={filter.label}
              style={[
                styles.filterTab,
                selectedFilter === filter.value && styles.filterTabActive,
              ]}
              onPress={() => setSelectedFilter(filter.value)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedFilter === filter.value && styles.filterTabTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Questions List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : questions && questions.length > 0 ? (
          questions.map((question) => (
            <View key={question.id} style={styles.questionCard}>
              {/* Question Header */}
              <View style={styles.questionHeader}>
                <View style={styles.questionHeaderLeft}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(question.assignmentStatus || 'assigned') },
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>
                      {getStatusLabel(question.assignmentStatus || 'assigned')}
                    </Text>
                  </View>
                  <Text style={styles.domainBadge}>{question.domain}</Text>
                </View>
                <Text style={styles.timestamp}>
                  {new Date(question.createdAt).toLocaleDateString()}
                </Text>
              </View>

              {/* Asker Info */}
              {question.askerDisplayName && (
                <Text style={styles.askerInfo}>
                  From: {question.askerDisplayName}
                </Text>
              )}

              {/* Question Text */}
              <Text style={styles.questionText} numberOfLines={3}>
                {question.questionText}
              </Text>

              {/* Actions */}
              <View style={styles.actions}>
                <Pressable
                  style={styles.viewButton}
                  onPress={() => handleViewThread(question.id)}
                >
                  <Ionicons name="chatbubbles-outline" size={18} color={colors.accent} />
                  <Text style={styles.viewButtonText}>View Thread</Text>
                </Pressable>

                {question.assignmentStatus === 'assigned' && question.assignmentId && (
                  <View style={styles.assignmentActions}>
                    <Pressable
                      style={styles.acceptButton}
                      onPress={() => handleAccept(question.assignmentId!)}
                      disabled={acceptMutation.isPending}
                    >
                      {acceptMutation.isPending ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={18} color="#fff" />
                          <Text style={styles.acceptButtonText}>Accept</Text>
                        </>
                      )}
                    </Pressable>

                    <Pressable
                      style={styles.declineButton}
                      onPress={() => handleDecline(question.assignmentId!)}
                      disabled={declineMutation.isPending}
                    >
                      {declineMutation.isPending ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="close-circle" size={18} color="#fff" />
                          <Text style={styles.declineButtonText}>Decline</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="mail-open-outline" size={64} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No questions in this category</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const getThemedStyles = (colors: any, colorScheme: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  filterContainer: {
    backgroundColor: colors.surface,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  filterTabActive: {
    backgroundColor: colors.accent,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  domainBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  timestamp: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  askerInfo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  questionText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  assignmentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2ECC71',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  acceptButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  declineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E74C3C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  declineButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textTertiary,
    marginTop: 16,
  },
});
