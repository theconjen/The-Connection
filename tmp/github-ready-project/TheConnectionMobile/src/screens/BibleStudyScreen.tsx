import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MobileCard from '../components/MobileCard';
import TouchFeedback from '../components/TouchFeedback';

export const BibleStudyScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bible Study</Text>
        <Text style={styles.headerSubtitle}>Grow in faith and knowledge</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <MobileCard style={styles.planCard}>
          <Text style={styles.cardTitle}>Reading Plans</Text>
          <Text style={styles.cardDescription}>
            Join structured Bible reading plans to deepen your understanding
          </Text>
          <TouchFeedback style={styles.actionButton} hapticType="medium">
            <Text style={styles.buttonText}>View Plans</Text>
          </TouchFeedback>
        </MobileCard>

        <MobileCard style={styles.devotionalCard}>
          <Text style={styles.cardTitle}>Daily Devotionals</Text>
          <Text style={styles.cardDescription}>
            Start your day with inspiring devotional content
          </Text>
          <TouchFeedback style={styles.actionButton} hapticType="medium">
            <Text style={styles.buttonText}>Today's Devotional</Text>
          </TouchFeedback>
        </MobileCard>

        <MobileCard style={styles.studyCard}>
          <Text style={styles.cardTitle}>Study Tools</Text>
          <Text style={styles.cardDescription}>
            Access commentaries, concordances, and study guides
          </Text>
          <TouchFeedback style={styles.actionButton} hapticType="medium">
            <Text style={styles.buttonText}>Explore Tools</Text>
          </TouchFeedback>
        </MobileCard>
      </ScrollView>
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
  },
  planCard: {
    marginBottom: 16,
  },
  devotionalCard: {
    marginBottom: 16,
  },
  studyCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1D29',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});