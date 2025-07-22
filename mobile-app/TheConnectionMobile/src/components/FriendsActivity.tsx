import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

interface FriendActivity {
  id: number;
  name: string;
  username: string;
  avatar?: string;
  activities: {
    prayerRequests: number;
    recentPosts: number;
    apologeticsContributions: number;
  };
  lastActivity: string;
}

interface FriendsActivityProps {
  friends?: FriendActivity[];
  isLoading?: boolean;
}

export function FriendsActivity({ friends = [], isLoading = false }: FriendsActivityProps) {
  const router = useRouter();

  // Mock data for demonstration
  const mockFriends: FriendActivity[] = [
    {
      id: 1,
      name: 'Sarah Johnson',
      username: 'sarah_j',
      activities: {
        prayerRequests: 2,
        recentPosts: 5,
        apologeticsContributions: 1,
      },
      lastActivity: '2 hours ago',
    },
    {
      id: 2,
      name: 'Michael Chen',
      username: 'mchen',
      activities: {
        prayerRequests: 0,
        recentPosts: 3,
        apologeticsContributions: 2,
      },
      lastActivity: '6 hours ago',
    },
    {
      id: 3,
      name: 'Pastor David',
      username: 'pastor_david',
      activities: {
        prayerRequests: 1,
        recentPosts: 8,
        apologeticsContributions: 4,
      },
      lastActivity: '1 day ago',
    },
  ];

  const displayFriends = friends.length > 0 ? friends : mockFriends;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Friends Activity</Text>
        <View style={styles.loadingContainer}>
          {[1, 2, 3].map(i => (
            <View key={i} style={styles.loadingItem}>
              <View style={styles.loadingAvatar} />
              <View style={styles.loadingContent}>
                <View style={styles.loadingName} />
                <View style={styles.loadingActivity} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (displayFriends.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Friends Activity</Text>
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color="#9CA3AF" style={styles.emptyIcon} />
          <Text style={styles.emptyText}>Connect with friends to see their activity</Text>
          <TouchableOpacity 
            style={styles.findFriendsButton}
            onPress={() => router.push('/friends')}
          >
            <Ionicons name="person-add" size={16} color="#FFFFFF" />
            <Text style={styles.findFriendsText}>Find Friends</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Friends Activity</Text>
        <TouchableOpacity onPress={() => router.push('/friends')}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.friendsList}>
        {displayFriends.slice(0, 3).map((friend) => (
          <TouchableOpacity key={friend.id} style={styles.friendCard}>
            <LinearGradient
              colors={['#3B82F6', '#8B5CF6']}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{friend.name.charAt(0)}</Text>
            </LinearGradient>
            
            <View style={styles.friendInfo}>
              <Text style={styles.friendName} numberOfLines={1}>{friend.name}</Text>
              <Text style={styles.lastActivity}>{friend.lastActivity}</Text>
              
              <View style={styles.activitiesList}>
                {friend.activities.prayerRequests > 0 && (
                  <TouchableOpacity 
                    style={[styles.activityBadge, styles.prayerBadge]}
                    onPress={() => router.push('/prayer-requests')}
                  >
                    <Ionicons name="heart" size={12} color="#EF4444" />
                    <Text style={styles.prayerBadgeText}>
                      {friend.activities.prayerRequests} prayer{friend.activities.prayerRequests !== 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {friend.activities.recentPosts > 0 && (
                  <TouchableOpacity 
                    style={[styles.activityBadge, styles.postBadge]}
                    onPress={() => router.push('/microblogs')}
                  >
                    <Ionicons name="chatbubble" size={12} color="#3B82F6" />
                    <Text style={styles.postBadgeText}>
                      {friend.activities.recentPosts} post{friend.activities.recentPosts !== 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {friend.activities.apologeticsContributions > 0 && (
                  <TouchableOpacity 
                    style={[styles.activityBadge, styles.apologeticsBadge]}
                    onPress={() => router.push('/apologetics')}
                  >
                    <Ionicons name="book" size={12} color="#10B981" />
                    <Text style={styles.apologeticsBadgeText}>
                      {friend.activities.apologeticsContributions} answer{friend.activities.apologeticsContributions !== 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {displayFriends.length > 3 && (
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => router.push('/friends')}
        >
          <Text style={styles.viewAllButtonText}>See all {displayFriends.length} friends</Text>
          <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  friendsList: {
    marginBottom: 8,
  },
  friendCard: {
    width: 200,
    marginRight: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  lastActivity: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  activitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 4,
  },
  prayerBadge: {
    backgroundColor: '#FEF2F2',
  },
  postBadge: {
    backgroundColor: '#EFF6FF',
  },
  apologeticsBadge: {
    backgroundColor: '#ECFDF5',
  },
  prayerBadgeText: {
    fontSize: 10,
    color: '#EF4444',
    marginLeft: 2,
    fontWeight: '500',
  },
  postBadgeText: {
    fontSize: 10,
    color: '#3B82F6',
    marginLeft: 2,
    fontWeight: '500',
  },
  apologeticsBadgeText: {
    fontSize: 10,
    color: '#10B981',
    marginLeft: 2,
    fontWeight: '500',
  },
  loadingContainer: {
    gap: 12,
  },
  loadingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  loadingContent: {
    flex: 1,
  },
  loadingName: {
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 4,
  },
  loadingActivity: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    width: '60%',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  findFriendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  findFriendsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 4,
  },
  viewAllButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
});