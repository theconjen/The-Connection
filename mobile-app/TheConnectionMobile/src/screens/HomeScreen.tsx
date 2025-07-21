import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { FeatureCard } from '../components/FeatureCard';
import { useAuth } from '../hooks/useAuth';

// Simple icon components for now - you can replace with react-native-vector-icons later
const SimpleIcon: React.FC<{ name: string; color: string }> = ({ name, color }) => (
  <View style={[styles.simpleIcon, { backgroundColor: color }]}>
    <Text style={styles.iconText}>{name.charAt(0).toUpperCase()}</Text>
  </View>
);

export const HomeScreen: React.FC = () => {
  const { user } = useAuth();

  const featuredApps = [
    {
      title: "Feed",
      description: "Explore posts and discussions from the community on topics of faith and spiritual growth.",
      icon: <SimpleIcon name="feed" color="#3B82F6" />,
      screenName: "Microblogs",
      color: "#3B82F6"
    },
    {
      title: "Communities",
      description: "Connect with other believers in specialized communities for encouragement and discussion.",
      icon: <SimpleIcon name="communities" color="#8B5CF6" />,
      screenName: "Communities",
      color: "#8B5CF6"
    },
    {
      title: "Bible Study",
      description: "Dive into God's Word with Bible study plans, devotionals, and reading tools.",
      icon: <SimpleIcon name="bible" color="#10B981" />,
      screenName: "BibleStudy",
      color: "#10B981"
    },
    {
      title: "Prayer Requests",
      description: "Share your prayer needs or pray for others in our supportive prayer community.",
      icon: <SimpleIcon name="prayer" color="#EF4444" />,
      screenName: "PrayerRequests",
      color: "#EF4444"
    },
    {
      title: "Events",
      description: "Discover upcoming in-person and virtual events to connect with the Christian community.",
      icon: <SimpleIcon name="events" color="#6366F1" />,
      screenName: "Events",
      color: "#6366F1"
    },
    {
      title: "Apologetics",
      description: "Explore answers to challenging questions about faith from verified Christian scholars.",
      icon: <SimpleIcon name="apologetics" color="#F59E0B" />,
      screenName: "Apologetics",
      color: "#F59E0B"
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.titleText}>The Connection</Text>
          <Text style={styles.subtitleText}>
            A community where faith grows through meaningful connections.
          </Text>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Explore What We Offer</Text>
          
          {featuredApps.map((app, index) => (
            <FeatureCard
              key={index}
              title={app.title}
              description={app.description}
              icon={app.icon}
              screenName={app.screenName}
              color={app.color}
            />
          ))}
        </View>

        {/* Call to Action for guests */}
        {!user && (
          <View style={styles.ctaContainer}>
            <Text style={styles.ctaTitle}>Join Our Community</Text>
            <Text style={styles.ctaDescription}>
              Connect with fellow believers, access all features, and start your journey with us today.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 8,
  },
  titleText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1D29',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 18,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1D29',
    textAlign: 'center',
    marginBottom: 24,
  },
  ctaContainer: {
    backgroundColor: '#F8F9FB',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E73AA4',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1D29',
    marginBottom: 12,
  },
  ctaDescription: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  simpleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});