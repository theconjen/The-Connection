import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Microblog } from '../types';
import { apiService } from '../services/api';
import TouchFeedback from '../components/TouchFeedback';
import { MobileCard } from '../components/MobileCard';
import PullToRefresh from '../components/PullToRefresh';
import OptimizedImage from '../components/OptimizedImage';

// Enhanced timestamp formatting for mobile
const formatMobileDate = (date: string | Date) => {
  const now = new Date();
  const postDate = new Date(date);
  const diffInHours = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);
  
  // If less than 24 hours ago, show relative time
  if (diffInHours < 24) {
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60));
      return diffInMinutes < 1 ? 'now' : `${diffInMinutes}m`;
    }
    return `${Math.floor(diffInHours)}h`;
  }
  
  // If this year, show month and day
  if (postDate.getFullYear() === now.getFullYear()) {
    return postDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
  
  // If older, show full date
  return postDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: '2-digit'
  });
};

const MicroblogCard: React.FC<{ microblog: Microblog; onLike: (id: number) => void }> = ({ microblog, onLike }) => (
  <MobileCard style={styles.microblogCard}>
    <View style={styles.cardHeader}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{microblog.user.displayName}</Text>
        <Text style={styles.username}>@{microblog.user.username}</Text>
      </View>
      <Text style={styles.timestamp}>{formatMobileDate(microblog.createdAt)}</Text>
    </View>
    <Text style={styles.content}>{microblog.content}</Text>
    <View style={styles.actions}>
      <TouchFeedback onPress={() => onLike(microblog.id)} hapticFeedback="light">
        <View style={styles.actionButton}>
          <Text style={[styles.actionText, microblog.isLiked && styles.likedText]}>
            {microblog.isLiked ? '❤️' : '🤍'} {microblog.likesCount || 0}
          </Text>
        </View>
      </TouchFeedback>
      <TouchFeedback onPress={() => {}} hapticFeedback="light">
        <View style={styles.actionButton}>
          <Text style={styles.actionText}>💬 {microblog.commentsCount || 0}</Text>
        </View>
      </TouchFeedback>
      <TouchFeedback onPress={() => {}} hapticFeedback="light">
        <View style={styles.actionButton}>
          <Text style={styles.actionText}>🔄 Share</Text>
        </View>
      </TouchFeedback>
    </View>
  </MobileCard>
);

export const MicroblogsScreen: React.FC = () => {
  const [microblogs, setMicroblogs] = useState<Microblog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMicroblogs = async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      const data = await apiService.getMicroblogs();
      setMicroblogs(data);
    } catch (error) {
      console.error('Failed to fetch microblogs:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleLike = async (microblogId: number) => {
    try {
      // Optimistic update
      setMicroblogs(prev => prev.map(mb => 
        mb.id === microblogId 
          ? { 
              ...mb, 
              isLiked: !mb.isLiked,
              likesCount: mb.isLiked ? (mb.likesCount || 1) - 1 : (mb.likesCount || 0) + 1
            }
          : mb
      ));
      
      await apiService.toggleMicroblogLike(microblogId);
    } catch (error) {
      console.error('Failed to toggle like:', error);
      // Revert optimistic update on error
      setMicroblogs(prev => prev.map(mb => 
        mb.id === microblogId 
          ? { 
              ...mb, 
              isLiked: !mb.isLiked,
              likesCount: mb.isLiked ? (mb.likesCount || 0) + 1 : (mb.likesCount || 1) - 1
            }
          : mb
      ));
    }
  };

  const onRefresh = () => {
    fetchMicroblogs(true);
  };

  useEffect(() => {
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
      <View style={styles.header}>
        <Text style={styles.title}>Feed</Text>
      </View>
      <FlatList
        data={microblogs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <MicroblogCard microblog={item} onLike={handleLike} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <PullToRefresh
            refreshing={isRefreshing}
            onRefresh={onRefresh}
          />
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={8}
        windowSize={10}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1D29',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  microblogCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1D29',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    color: '#64748B',
  },
  timestamp: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 8,
  },
  content: {
    fontSize: 16,
    lineHeight: 22,
    color: '#1A1D29',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F8F9FB',
    minHeight: 44,
    minWidth: 80,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  likedText: {
    color: '#E91E63',
  },
});
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