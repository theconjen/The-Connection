import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Microblog } from '../types';
import { apiService } from '../services/api';

const MicroblogCard: React.FC<{ microblog: Microblog }> = ({ microblog }) => (
  <View style={styles.microblogCard}>
    <View style={styles.userInfo}>
      <Text style={styles.userName}>{microblog.user.displayName}</Text>
      <Text style={styles.username}>@{microblog.user.username}</Text>
    </View>
    <Text style={styles.content}>{microblog.content}</Text>
    <View style={styles.actions}>
      <TouchableOpacity style={styles.actionButton}>
        <Text style={styles.actionText}>♥ {microblog.likesCount}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton}>
        <Text style={styles.actionText}>💬 {microblog.commentsCount}</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export const MicroblogsScreen: React.FC = () => {
  const [microblogs, setMicroblogs] = useState<Microblog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMicroblogs = async () => {
      try {
        const data = await apiService.getMicroblogs();
        setMicroblogs(data);
      } catch (error) {
        console.error('Failed to fetch microblogs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMicroblogs();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E73AA4" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Feed</Text>
      <FlatList
        data={microblogs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <MicroblogCard microblog={item} />}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1D29',
    textAlign: 'center',
    marginVertical: 24,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  microblogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1D29',
    marginRight: 8,
  },
  username: {
    fontSize: 14,
    color: '#64748B',
  },
  content: {
    fontSize: 16,
    color: '#1A1D29',
    lineHeight: 24,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    color: '#64748B',
  },
});