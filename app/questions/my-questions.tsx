import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../src/lib/apiClient';
import { useAuth } from '../../src/contexts/AuthContext';

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
  areaName?: string;
  tagName?: string;
  hasUnreadMessages?: boolean;
}

export default function MyQuestionsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // Fetch user's questions
  const { data: questions, isLoading, refetch, isRefetching } = useQuery<Question[]>({
    queryKey: ['/api/questions/mine'],
    queryFn: async () => {
      const response = await apiClient.get('/api/questions/mine');
      return response.data;
    },
    enabled: !!user,
  });

  const handleViewThread = (questionId: number) => {
    router.push(`/questions/${questionId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return '#FFA500';
      case 'routed':
        return '#4A90E2';
      case 'answered':
        return '#2ECC71';
      case 'closed':
        return '#999';
      default:
        return '#999';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new':
        return 'Pending';
      case 'routed':
        return 'In Progress';
      case 'answered':
        return 'Answered';
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return 'time-outline';
      case 'routed':
        return 'chatbubble-ellipses-outline';
      case 'answered':
        return 'checkmark-circle-outline';
      case 'closed':
        return 'archive-outline';
      default:
        return 'help-circle-outline';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>My Questions</Text>
        <Pressable
          onPress={() => router.push('/questions/ask')}
          style={styles.addButton}
        >
          <Ionicons name="add-circle" size={28} color="#fff" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
          </View>
        ) : questions && questions.length > 0 ? (
          questions.map((question) => (
            <Pressable
              key={question.id}
              style={styles.questionCard}
              onPress={() => handleViewThread(question.id)}
            >
              {/* Header */}
              <View style={styles.questionHeader}>
                <View style={styles.questionHeaderLeft}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(question.status) },
                    ]}
                  >
                    <Ionicons
                      name={getStatusIcon(question.status) as any}
                      size={14}
                      color="#fff"
                    />
                    <Text style={styles.statusBadgeText}>
                      {getStatusLabel(question.status)}
                    </Text>
                  </View>
                  {question.hasUnreadMessages && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>New</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.timestamp}>
                  {new Date(question.createdAt).toLocaleDateString()}
                </Text>
              </View>

              {/* Domain and Category */}
              <View style={styles.categoryRow}>
                <Text style={styles.domainBadge}>{question.domain}</Text>
                {question.areaName && (
                  <>
                    <Ionicons name="chevron-forward" size={14} color="#999" />
                    <Text style={styles.categoryText}>{question.areaName}</Text>
                  </>
                )}
                {question.tagName && (
                  <>
                    <Ionicons name="chevron-forward" size={14} color="#999" />
                    <Text style={styles.categoryText}>{question.tagName}</Text>
                  </>
                )}
              </View>

              {/* Question Text */}
              <Text style={styles.questionText} numberOfLines={3}>
                {question.questionText}
              </Text>

              {/* View Thread Button */}
              <View style={styles.footer}>
                <View style={styles.viewThreadButton}>
                  <Ionicons name="arrow-forward" size={16} color="#4A90E2" />
                  <Text style={styles.viewThreadText}>View Conversation</Text>
                </View>
              </View>
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No questions yet</Text>
            <Text style={styles.emptySubtext}>
              Ask your first question to get started
            </Text>
            <Pressable
              style={styles.askButton}
              onPress={() => router.push('/questions/ask')}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.askButtonText}>Ask a Question</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    padding: 4,
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
    backgroundColor: '#fff',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  unreadBadge: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  domainBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A90E2',
    textTransform: 'capitalize',
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
  },
  questionText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  viewThreadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewThreadText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    marginBottom: 24,
  },
  askButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  askButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
