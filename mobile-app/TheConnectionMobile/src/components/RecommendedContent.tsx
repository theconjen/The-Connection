import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

interface RecommendedItem {
  id: number;
  title: string;
  content: string;
  author: {
    name: string;
    username: string;
  };
  score: number;
  reason: string;
  type: 'microblog' | 'forum' | 'apologetics';
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

interface RecommendedContentProps {
  section: 'feed' | 'forums' | 'apologetics';
  maxItems?: number;
  showHeader?: boolean;
  items?: RecommendedItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function RecommendedContent({ 
  section, 
  maxItems = 3, 
  showHeader = true,
  items = [],
  isLoading = false,
  onRefresh
}: RecommendedContentProps) {
  const router = useRouter();

  // Mock data for demonstration
  const mockItems: RecommendedItem[] = [
    {
      id: 1,
      title: 'Amazing Grace in Daily Life',
      content: 'Just read an amazing passage about grace today. It reminded me how God\'s love covers all our mistakes...',
      author: { name: 'Sarah Johnson', username: 'sarah_j' },
      score: 8.5,
      reason: 'Faith-based content',
      type: 'microblog',
      likeCount: 12,
      commentCount: 4,
      createdAt: '2h ago',
    },
    {
      id: 2,
      title: 'How to Defend the Trinity',
      content: 'Great discussion on the biblical foundation of the Trinity. Key verses include Matthew 28:19...',
      author: { name: 'Pastor David', username: 'pastor_david' },
      score: 9.2,
      reason: 'From someone you follow',
      type: 'apologetics',
      likeCount: 28,
      commentCount: 8,
      createdAt: '4h ago',
    },
    {
      id: 3,
      title: 'Prayer Request for Healing',
      content: 'Please pray for my grandmother who is in the hospital. She needs strength and healing...',
      author: { name: 'Michael Chen', username: 'mchen' },
      score: 7.8,
      reason: 'High engagement',
      type: 'forum',
      likeCount: 18,
      commentCount: 12,
      createdAt: '6h ago',
    },
  ];

  const displayItems = items.length > 0 ? items : mockItems;

  const getSectionIcon = () => {
    switch (section) {
      case 'feed': return 'chatbubbles';
      case 'forums': return 'people';
      case 'apologetics': return 'book';
      default: return 'sparkles';
    }
  };

  const getSectionColor = () => {
    switch (section) {
      case 'feed': return '#3B82F6';
      case 'forums': return '#10B981';
      case 'apologetics': return '#8B5CF6';
      default: return '#EC4899';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        {showHeader && (
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="sparkles" size={20} color="#EC4899" />
              <Text style={styles.title}>Recommended For You</Text>
            </View>
            <ActivityIndicator size="small" color="#EC4899" />
          </View>
        )}
        <View style={styles.loadingContainer}>
          {Array.from({ length: maxItems }).map((_, i) => (
            <View key={i} style={styles.loadingItem}>
              <View style={styles.loadingAvatar} />
              <View style={styles.loadingContent}>
                <View style={styles.loadingTitle} />
                <View style={styles.loadingText} />
                <View style={styles.loadingMeta} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (displayItems.length === 0) {
    return (
      <View style={styles.container}>
        {showHeader && (
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="sparkles" size={20} color="#EC4899" />
              <Text style={styles.title}>Recommended For You</Text>
            </View>
          </View>
        )}
        <View style={styles.emptyContainer}>
          <Ionicons name="sparkles-outline" size={48} color="#9CA3AF" style={styles.emptyIcon} />
          <Text style={styles.emptyText}>No recommendations available yet</Text>
          <Text style={styles.emptySubtext}>
            Interact with content to get personalized recommendations
          </Text>
          {onRefresh && (
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Text style={styles.refreshButtonText}>Refresh Recommendations</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { borderLeftColor: getSectionColor() }]}>
      {showHeader && (
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="sparkles" size={20} color="#EC4899" />
            <Text style={styles.title}>Recommended For You</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.algorithmBadge}>
              <Text style={styles.algorithmText}>Faith-based AI</Text>
            </View>
            {onRefresh && (
              <TouchableOpacity onPress={onRefresh} style={styles.refreshIcon}>
                <Ionicons name="refresh" size={16} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <Text style={styles.subtitle}>Personalized for your spiritual journey</Text>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.itemsList}>
        {displayItems.slice(0, maxItems).map((item) => (
          <TouchableOpacity key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <LinearGradient
                colors={['#EC4899', '#8B5CF6']}
                style={styles.authorAvatar}
              >
                <Text style={styles.avatarText}>
                  {item.author.name.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
              
              <View style={styles.itemMeta}>
                <View style={styles.authorRow}>
                  <Text style={styles.authorName}>{item.author.name}</Text>
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreText}>Score: {item.score}</Text>
                  </View>
                </View>
                <Text style={styles.timeText}>{item.createdAt}</Text>
              </View>
            </View>

            <Text style={styles.itemContent} numberOfLines={3}>
              {item.content}
            </Text>

            <View style={styles.itemFooter}>
              <View style={styles.reasonBadge}>
                <Ionicons name="trending-up" size={12} color="#EC4899" />
                <Text style={styles.reasonText}>{item.reason}</Text>
              </View>

              <View style={styles.engagementRow}>
                <TouchableOpacity style={styles.engagementButton}>
                  <Ionicons name="heart-outline" size={14} color="#6B7280" />
                  <Text style={styles.engagementText}>{item.likeCount}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.engagementButton}>
                  <Ionicons name="chatbubble-outline" size={14} color="#6B7280" />
                  <Text style={styles.engagementText}>{item.commentCount}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.engagementButton}>
                  <Ionicons name="share-outline" size={14} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {showHeader && displayItems.length > 0 && (
        <TouchableOpacity 
          style={styles.viewMoreButton}
          onPress={() => {
            const route = section === 'feed' ? '/microblogs' : `/${section}`;
            router.push(route);
          }}
        >
          <Text style={styles.viewMoreText}>View More Recommendations</Text>
          <Ionicons name="chevron-forward" size={16} color="#EC4899" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#EC4899',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  algorithmBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  algorithmText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  refreshIcon: {
    padding: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
  },
  itemsList: {
    maxHeight: 400,
  },
  itemCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  itemMeta: {
    flex: 1,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  scoreBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  scoreText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  itemContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reasonText: {
    fontSize: 10,
    color: '#EC4899',
    fontWeight: '500',
  },
  engagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  engagementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  engagementText: {
    fontSize: 12,
    color: '#6B7280',
  },
  loadingContainer: {
    gap: 12,
  },
  loadingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  loadingAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  loadingContent: {
    flex: 1,
  },
  loadingTitle: {
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  loadingText: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
    width: '80%',
  },
  loadingMeta: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    width: '40%',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 16,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 4,
  },
  viewMoreText: {
    fontSize: 14,
    color: '#EC4899',
    fontWeight: '500',
  },
});