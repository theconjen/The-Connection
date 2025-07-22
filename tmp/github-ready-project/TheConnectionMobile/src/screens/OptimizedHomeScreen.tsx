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
import MobileCard from '../components/MobileCard';
import TouchFeedback from '../components/TouchFeedback';
import { FeatureCard } from '../components/FeatureCard';
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
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshing={isRefreshing}
        onRefresh={onRefresh}
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#E91E63', '#9C27B0']}
          style={[styles.header, { paddingTop: insets.top + 20 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.headerTitle}>Welcome to The Connection</Text>
          <Text style={styles.headerSubtitle}>Building faith together</Text>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalPosts}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.activeCommunities}</Text>
              <Text style={styles.statLabel}>Communities</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.upcomingEvents}</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
          </View>
        </View>

        {/* Feature Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore</Text>
          
          <FeatureCard
            title="Communities"
            description="Join faith-based groups and connect with like-minded believers"
            icon={<Text style={styles.featureIcon}>👥</Text>}
            screenName="Communities"
            color="#6366F1"
          />
          
          <FeatureCard
            title="Prayer Feed"
            description="Share prayer requests and pray for others in the community"
            icon={<Text style={styles.featureIcon}>🙏</Text>}
            screenName="PrayerRequests"
            color="#10B981"
          />
          
          <FeatureCard
            title="Social Feed"
            description="Share thoughts, scripture, and encouragement with your community"
            icon={<Text style={styles.featureIcon}>💬</Text>}
            screenName="Microblogs"
            color="#F59E0B"
          />
        </View>

        {/* Recent Activity */}
        {recentPosts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Posts</Text>
            {recentPosts.map((post) => (
              <MobileCard key={post.id} style={styles.postCard}>
                <Text style={styles.postContent} numberOfLines={3}>
                  {post.content}
                </Text>
                <View style={styles.postFooter}>
                  <Text style={styles.postAuthor}>@{post.user.username}</Text>
                  <Text style={styles.postStats}>❤️ {post.likesCount}</Text>
                </View>
              </MobileCard>
            ))}
          </View>
        )}

        {/* Communities Preview */}
        {communities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Communities</Text>
            {communities.map((community) => (
              <MobileCard key={community.id} style={styles.communityCard}>
                <Text style={styles.communityName}>{community.name}</Text>
                <Text style={styles.communityDescription} numberOfLines={2}>
                  {community.description}
                </Text>
                <Text style={styles.communityMembers}>
                  {community.memberCount} members
                </Text>
              </MobileCard>
            ))}
          </View>
        )}

        <View style={styles.bottomPadding} />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginTop: -15,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    alignItems: 'center',
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
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1D29',
    marginBottom: 16,
  },
  featureIcon: {
    fontSize: 24,
  },
  postCard: {
    marginBottom: 12,
  },
  postContent: {
    fontSize: 14,
    color: '#1A1D29',
    lineHeight: 20,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postAuthor: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  postStats: {
    fontSize: 12,
    color: '#E91E63',
  },
  communityCard: {
    marginBottom: 12,
  },
  communityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1D29',
    marginBottom: 4,
  },
  communityDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 8,
  },
  communityMembers: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  bottomPadding: {
    height: 20,
  },
});

export default OptimizedHomeScreen;