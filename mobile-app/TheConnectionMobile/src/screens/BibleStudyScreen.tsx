import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';

interface ReadingPlan {
  id: number;
  title: string;
  description: string;
  duration: string;
  currentDay: number;
  totalDays: number;
  todayReading: string;
}

interface DevotionalItem {
  id: number;
  title: string;
  verse: string;
  excerpt: string;
  readTime: string;
}

const ReadingPlanCard: React.FC<{ plan: ReadingPlan }> = ({ plan }) => {
  const progress = (plan.currentDay / plan.totalDays) * 100;
  
  const handleReadToday = () => {
    Alert.alert(
      plan.todayReading,
      'This would open your Bible app or display the reading passage. Feature coming soon!',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.planCard}>
      <View style={styles.planHeader}>
        <Text style={styles.planTitle}>{plan.title}</Text>
        <Text style={styles.planDuration}>{plan.duration}</Text>
      </View>
      
      <Text style={styles.planDescription}>{plan.description}</Text>
      
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Day {plan.currentDay} of {plan.totalDays}
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>
      
      <View style={styles.todaySection}>
        <Text style={styles.todayLabel}>Today's Reading:</Text>
        <Text style={styles.todayReading}>{plan.todayReading}</Text>
      </View>
      
      <TouchableOpacity style={styles.readButton} onPress={handleReadToday}>
        <Text style={styles.readButtonText}>Read Today's Passage</Text>
      </TouchableOpacity>
    </View>
  );
};

const DevotionalCard: React.FC<{ devotional: DevotionalItem }> = ({ devotional }) => {
  const handleRead = () => {
    Alert.alert(
      devotional.title,
      `"${devotional.verse}"\n\n${devotional.excerpt}\n\nFull devotional feature coming soon!`,
      [{ text: 'Close' }]
    );
  };

  return (
    <TouchableOpacity style={styles.devotionalCard} onPress={handleRead}>
      <View style={styles.devotionalHeader}>
        <Text style={styles.devotionalTitle}>{devotional.title}</Text>
        <Text style={styles.readTime}>{devotional.readTime}</Text>
      </View>
      
      <Text style={styles.verse}>"{devotional.verse}"</Text>
      <Text style={styles.excerpt} numberOfLines={3}>
        {devotional.excerpt}
      </Text>
    </TouchableOpacity>
  );
};

export const BibleStudyScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'plans' | 'devotionals' | 'study'>('plans');

  const readingPlans: ReadingPlan[] = [
    {
      id: 1,
      title: 'One Year Bible',
      description: 'Read through the entire Bible in one year with daily readings from Old Testament, New Testament, Psalms, and Proverbs.',
      duration: '365 days',
      currentDay: 15,
      totalDays: 365,
      todayReading: 'Genesis 29-30, Matthew 9:18-38, Psalm 12, Proverbs 3:11-12'
    },
    {
      id: 2,
      title: 'New Testament in 90 Days',
      description: 'An intensive study through the New Testament with daily readings and reflection questions.',
      duration: '90 days',
      currentDay: 7,
      totalDays: 90,
      todayReading: 'Matthew 15-17'
    },
    {
      id: 3,
      title: 'Psalms & Proverbs',
      description: 'Focus on wisdom literature with one Psalm and one Proverbs chapter each day.',
      duration: '31 days',
      currentDay: 21,
      totalDays: 31,
      todayReading: 'Psalm 21, Proverbs 21'
    }
  ];

  const devotionals: DevotionalItem[] = [
    {
      id: 1,
      title: 'Walking in Faith',
      verse: 'Now faith is confidence in what we hope for and assurance about what we do not see. - Hebrews 11:1',
      excerpt: 'Faith is not just believing in God\'s existence, but trusting in His character and promises even when circumstances seem impossible...',
      readTime: '3 min'
    },
    {
      id: 2,
      title: 'The Power of Prayer',
      verse: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. - Philippians 4:6',
      excerpt: 'Prayer is our direct line to the Creator of the universe. It\'s not just asking for things, but building a relationship with our heavenly Father...',
      readTime: '4 min'
    },
    {
      id: 3,
      title: 'Love in Action',
      verse: 'Dear children, let us not love with words or speech but with actions and in truth. - 1 John 3:18',
      excerpt: 'True love is demonstrated through our actions, not just our words. Today, look for opportunities to show God\'s love practically...',
      readTime: '2 min'
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'plans':
        return (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Your Reading Plans</Text>
            {readingPlans.map(plan => (
              <ReadingPlanCard key={plan.id} plan={plan} />
            ))}
            
            <TouchableOpacity style={styles.addPlanButton}>
              <Text style={styles.addPlanButtonText}>+ Browse More Plans</Text>
            </TouchableOpacity>
          </ScrollView>
        );
        
      case 'devotionals':
        return (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Daily Devotionals</Text>
            {devotionals.map(devotional => (
              <DevotionalCard key={devotional.id} devotional={devotional} />
            ))}
          </ScrollView>
        );
        
      case 'study':
        return (
          <View style={styles.comingSoonContainer}>
            <Text style={styles.comingSoonTitle}>Study Tools Coming Soon</Text>
            <Text style={styles.comingSoonDescription}>
              We're working on comprehensive Bible study tools including:
              {'\n\n'}• Verse search and cross-references
              {'\n'}• Commentary and study notes
              {'\n'}• Study groups and discussions
              {'\n'}• Note-taking and highlighting
              {'\n'}• Audio Bible readings
            </Text>
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Bible Study</Text>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'plans' && styles.activeTab]}
          onPress={() => setActiveTab('plans')}
        >
          <Text style={[styles.tabText, activeTab === 'plans' && styles.activeTabText]}>
            Reading Plans
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'devotionals' && styles.activeTab]}
          onPress={() => setActiveTab('devotionals')}
        >
          <Text style={[styles.tabText, activeTab === 'devotionals' && styles.activeTabText]}>
            Devotionals
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'study' && styles.activeTab]}
          onPress={() => setActiveTab('study')}
        >
          <Text style={[styles.tabText, activeTab === 'study' && styles.activeTabText]}>
            Study Tools
          </Text>
        </TouchableOpacity>
      </View>

      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1D29',
    textAlign: 'center',
    marginVertical: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#E73AA4',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1D29',
    marginBottom: 16,
  },
  planCard: {
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
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1D29',
    flex: 1,
  },
  planDuration: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  planDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    color: '#1A1D29',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  todaySection: {
    marginBottom: 16,
  },
  todayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1D29',
    marginBottom: 4,
  },
  todayReading: {
    fontSize: 14,
    color: '#6B46C1',
    lineHeight: 20,
  },
  readButton: {
    backgroundColor: '#E73AA4',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  readButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  addPlanButton: {
    backgroundColor: '#F8F9FB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E73AA4',
    borderStyle: 'dashed',
  },
  addPlanButtonText: {
    color: '#E73AA4',
    fontSize: 16,
    fontWeight: '600',
  },
  devotionalCard: {
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
  devotionalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  devotionalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1D29',
    flex: 1,
  },
  readTime: {
    fontSize: 12,
    color: '#64748B',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verse: {
    fontSize: 16,
    color: '#6B46C1',
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: 12,
  },
  excerpt: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1D29',
    marginBottom: 16,
    textAlign: 'center',
  },
  comingSoonDescription: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
    textAlign: 'center',
  },
});