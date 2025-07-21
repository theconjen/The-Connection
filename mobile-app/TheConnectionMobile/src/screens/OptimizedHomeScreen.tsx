import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MobileCard } from '../components/MobileCard';
import TouchFeedback from '../components/TouchFeedback';
import PullToRefresh from '../components/PullToRefresh';
import { apiService } from '../services/api';
import { Microblog, Community, Event } from '../types';

const { width: screenWidth } = Dimensions.get('window');

interface QuickStats {
  totalPosts: number;
  activeCommunities: number;
  upcomingEvents: number;
  prayerRequests: number;
}

const OptimizedHomeScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recentPosts, setRecentPosts] = useState<Microblog[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<QuickStats>({
    totalPosts: 0,
    activeCommunities: 0,
    upcomingEvents: 0,
    prayerRequests: 0,
  });

  const insets = useSafeAreaInsets();

  const fetchHomeData = async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      
      const [postsData, communitiesData, eventsData] = await Promise.allSettled([
        apiService.getMicroblogs('recent'),
        apiService.getCommunities(),
        apiService.getEvents(),
      ]);

      if (postsData.status === 'fulfilled') {
        setRecentPosts(postsData.value.slice(0, 3)); // Show latest 3 posts
        setStats(prev => ({ ...prev, totalPosts: postsData.value.length }));
      }

      if (communitiesData.status === 'fulfilled') {
        setCommunities(communitiesData.value.slice(0, 3));
        setStats(prev => ({ ...prev, activeCommunities: communitiesData.value.length }));
      }

      if (eventsData.status === 'fulfilled') {
        setUpcomingEvents(eventsData.value.slice(0, 2));
        setStats(prev => ({ ...prev, upcomingEvents: eventsData.value.length }));
      }
      
    } catch (error) {
      console.error('Failed to fetch home data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchHomeData(true);
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#E91E63" />
      
      {/* Header */}
      <LinearGradient
        colors={['#E91E63', '#FF6B9D']}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <Text style={styles.headerTitle}>The Connection</Text>
        <Text style={styles.headerSubtitle}>Your Christian Community</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <PullToRefresh
            refreshing={isRefreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalPosts}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.activeCommunities}</Text>
              <Text style={styles.statLabel}>Communities</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.upcomingEvents}</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
          </View>
        </View>

        {/* Recent Posts */}
        {recentPosts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Posts</Text>
              <TouchFeedback onPress={() => {}}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchFeedback>
            </View>
            {recentPosts.map((post) => (
              <MobileCard key={post.id} style={styles.postCard}>
                <Text style={styles.postAuthor}>{post.user.displayName}</Text>
                <Text style={styles.postContent} numberOfLines={3}>
                  {post.content}
                </Text>
                <View style={styles.postMeta}>
                  <Text style={styles.postMetaText}>
                    ❤️ {post.likesCount} • 💬 {post.commentsCount}
                  </Text>
                </View>
              </MobileCard>
            ))}
          </View>
        )}

        {/* Active Communities */}
        {communities.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Communities</Text>
              <TouchFeedback onPress={() => {}}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchFeedback>
            </View>
            {communities.map((community) => (
              <MobileCard key={community.id} style={styles.communityCard}>
                <Text style={styles.communityName}>{community.name}</Text>
                <Text style={styles.communityDescription} numberOfLines={2}>
                  {community.description}
                </Text>
                <Text style={styles.communityMeta}>
                  👥 {community.memberCount} members
                </Text>
              </MobileCard>
            ))}
          </View>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
              <TouchFeedback onPress={() => {}}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchFeedback>
            </View>
            {upcomingEvents.map((event) => (
              <MobileCard key={event.id} style={styles.eventCard}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDescription} numberOfLines={2}>
                  {event.description}
                </Text>
                <Text style={styles.eventMeta}>
                  📅 {new Date(event.startTime).toLocaleDateString()}
                </Text>
              </MobileCard>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E91E63',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1D29',
  },
  seeAllText: {
    fontSize: 14,
    color: '#E91E63',
    fontWeight: '600',
  },
  postCard: {
    marginBottom: 12,
  },
  postAuthor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1D29',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4A5568',
    marginBottom: 8,
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postMetaText: {
    fontSize: 12,
    color: '#64748B',
  },
  communityCard: {
    marginBottom: 12,
  },
  communityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1D29',
    marginBottom: 6,
  },
  communityDescription: {
    fontSize: 14,
    lineHeight: 18,
    color: '#4A5568',
    marginBottom: 8,
  },
  communityMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  eventCard: {
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1D29',
    marginBottom: 6,
  },
  eventDescription: {
    fontSize: 14,
    lineHeight: 18,
    color: '#4A5568',
    marginBottom: 8,
  },
  eventMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default OptimizedHomeScreen;