import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';

interface MVPFeatureCard {
  title: string;
  description: string;
  color: string;
  screenName?: string;
  comingSoon?: boolean;
}

const FeatureCard: React.FC<{ feature: MVPFeatureCard }> = ({ feature }) => {
  const navigation = useNavigation();
  
  const handlePress = () => {
    if (feature.comingSoon) {
      Alert.alert(
        'Coming Soon!', 
        `${feature.title} will be available in the next update. Thanks for your patience!`
      );
    } else if (feature.screenName) {
      navigation.navigate(feature.screenName as never);
    }
  };

  return (
    <TouchableOpacity style={styles.featureCard} onPress={handlePress}>
      <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
        <Text style={styles.featureIconText}>
          {feature.title.charAt(0)}
        </Text>
      </View>
      <View style={styles.featureContent}>
        <View style={styles.featureHeader}>
          <Text style={styles.featureTitle}>{feature.title}</Text>
          {feature.comingSoon && (
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Soon</Text>
            </View>
          )}
        </View>
        <Text style={styles.featureDescription}>{feature.description}</Text>
      </View>
      <Text style={styles.featureArrow}>›</Text>
    </TouchableOpacity>
  );
};

export const MVPHomeScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();

  const mvpFeatures: MVPFeatureCard[] = [
    {
      title: "Communities",
      description: "Join faith-based communities and connect with believers worldwide",
      color: "#10B981",
      screenName: "Communities"
    },
    {
      title: "Feed",
      description: "Share thoughts, encouragement, and engage with community posts",
      color: "#6366F1",
      screenName: "Feed"
    },
    {
      title: "Prayer Requests",
      description: "Share prayer needs and pray for others in the community",
      color: "#EF4444",
      comingSoon: true
    },
    {
      title: "Events",
      description: "Discover and join virtual and in-person faith events",
      color: "#8B5CF6",
      comingSoon: true
    },
    {
      title: "Bible Study",
      description: "Join reading plans and grow in your faith journey",
      color: "#F59E0B",
      comingSoon: true
    },
    {
      title: "Q&A Hub",
      description: "Ask questions and get answers from verified Christian scholars",
      color: "#06B6D4",
      comingSoon: true
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            Welcome{user ? `, ${user.displayName || user.username}` : ' to The Connection'}
          </Text>
          <Text style={styles.subtitle}>
            Building faith communities, one connection at a time
          </Text>
        </View>

        {/* MVP Banner */}
        <View style={styles.mvpBanner}>
          <Text style={styles.mvpTitle}>🚀 MVP Version</Text>
          <Text style={styles.mvpDescription}>
            You're using the first version of The Connection! More features will be added based on your feedback.
          </Text>
        </View>

        {/* Available Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Now</Text>
          {mvpFeatures.filter(f => !f.comingSoon).map((feature, index) => (
            <FeatureCard key={index} feature={feature} />
          ))}
        </View>

        {/* Coming Soon Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coming Soon</Text>
          {mvpFeatures.filter(f => f.comingSoon).map((feature, index) => (
            <FeatureCard key={index} feature={feature} />
          ))}
        </View>

        {/* Authentication CTA */}
        {!user && (
          <View style={styles.authSection}>
            <Text style={styles.authTitle}>Join The Connection</Text>
            <Text style={styles.authDescription}>
              Sign up to access all features and connect with the faith community
            </Text>
            <TouchableOpacity 
              style={styles.authButton}
              onPress={() => navigation.navigate('Auth' as never)}
            >
              <Text style={styles.authButtonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Feedback Section */}
        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackTitle}>Help Us Improve</Text>
          <Text style={styles.feedbackDescription}>
            Your feedback shapes the future of The Connection. Let us know what features you'd like to see next!
          </Text>
          <TouchableOpacity 
            style={styles.feedbackButton}
            onPress={() => Alert.alert(
              'Feedback', 
              'Thank you for your interest! Please email us at feedback@theconnection.app with your suggestions.'
            )}
          >
            <Text style={styles.feedbackButtonText}>Send Feedback</Text>
          </TouchableOpacity>
        </View>
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
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1D29',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  mvpBanner: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },
  mvpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1D29',
    marginBottom: 8,
  },
  mvpDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1D29',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureIconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  featureContent: {
    flex: 1,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1D29',
    flex: 1,
  },
  comingSoonBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
  },
  featureDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  featureArrow: {
    fontSize: 20,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  authSection: {
    marginHorizontal: 16,
    marginBottom: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1D29',
    marginBottom: 8,
  },
  authDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  authButton: {
    backgroundColor: '#E73AA4',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  feedbackSection: {
    marginHorizontal: 16,
    marginBottom: 32,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1D29',
    marginBottom: 8,
  },
  feedbackDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  feedbackButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  feedbackButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});