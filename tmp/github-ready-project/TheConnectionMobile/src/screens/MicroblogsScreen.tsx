import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import MobileCard from '../components/MobileCard';
import TouchFeedback from '../components/TouchFeedback';
import { apiService } from '../services/api';
import { Microblog } from '../types';

export const MicroblogsScreen = () => {
  const { data: microblogs = [], isLoading } = useQuery({
    queryKey: ['microblogs'],
    queryFn: () => apiService.getMicroblogs(),
    retry: 2,
  });

  const renderMicroblogItem = ({ item }: { item: Microblog }) => (
    <MobileCard style={styles.postCard}>
      <View style={styles.postHeader}>
        <Text style={styles.username}>@{item.user.username}</Text>
        <Text style={styles.timestamp}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      <Text style={styles.content}>{item.content}</Text>
      
      <View style={styles.postFooter}>
        <TouchFeedback style={styles.actionButton} hapticType="light">
          <Text style={styles.actionText}>❤️ {item.likesCount}</Text>
        </TouchFeedback>
        <TouchFeedback style={styles.actionButton} hapticType="light">
          <Text style={styles.actionText}>💬 {item.commentsCount}</Text>
        </TouchFeedback>
      </View>
    </MobileCard>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E91E63" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
      </View>

      <FlatList
        data={microblogs}
        renderItem={renderMicroblogItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1D29',
  },
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postCard: {
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  username: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E91E63',
  },
  timestamp: {
    fontSize: 12,
    color: '#64748B',
  },
  content: {
    fontSize: 14,
    color: '#1A1D29',
    lineHeight: 20,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  actionButton: {
    marginRight: 16,
    padding: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#64748B',
  },
});