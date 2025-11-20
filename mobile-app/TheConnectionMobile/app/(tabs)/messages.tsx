/**
 * Messages Screen
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../src/lib/apiClient';
import { Colors } from '../../src/shared/colors';

interface Conversation {
  id: number;
  otherUserId: number;
  otherUserName: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

export default function MessagesScreen() {
  const router = useRouter();

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await apiClient.get('/messages/conversations');
      return response.data;
    },
  });

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <ScrollView style={styles.content}>
        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No conversations yet</Text>
            <Text style={styles.emptyStateSubtext}>Start chatting with community members!</Text>
          </View>
        ) : (
          conversations.map((conv) => (
            <TouchableOpacity
              key={conv.id}
              style={styles.conversationItem}
              onPress={() => router.push(`/messages/${conv.otherUserId}`)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {conv.otherUserName?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.conversationInfo}>
                <View style={styles.conversationHeader}>
                  <Text style={styles.userName}>{conv.otherUserName}</Text>
                  <Text style={styles.time}>{formatTime(conv.lastMessageTime)}</Text>
                </View>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {conv.lastMessage || 'No messages yet'}
                </Text>
              </View>
              {conv.unreadCount ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>{conv.unreadCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1f2937' },
  content: { flex: 1 },
  conversationItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  conversationInfo: { flex: 1 },
  conversationHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  userName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  time: { fontSize: 12, color: '#9ca3af' },
  lastMessage: { fontSize: 14, color: '#6b7280' },
  unreadBadge: { backgroundColor: Colors.primary, borderRadius: 12, minWidth: 24, height: 24, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
  unreadCount: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyStateText: { fontSize: 16, fontWeight: '600', color: '#6b7280', marginBottom: 4 },
  emptyStateSubtext: { fontSize: 14, color: '#9ca3af' },
});
