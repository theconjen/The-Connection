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

export const ApologeticsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Apologetics Q&A</Text>
        <Text style={styles.headerSubtitle}>Ask questions, find answers</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <MobileCard style={styles.questionCard}>
          <Text style={styles.cardTitle}>Popular Questions</Text>
          <Text style={styles.cardDescription}>
            Browse frequently asked questions about faith and Christianity
          </Text>
          <TouchFeedback style={styles.actionButton} hapticType="medium">
            <Text style={styles.buttonText}>Browse Q&A</Text>
          </TouchFeedback>
        </MobileCard>

        <MobileCard style={styles.askCard}>
          <Text style={styles.cardTitle}>Ask a Question</Text>
          <Text style={styles.cardDescription}>
            Submit your faith questions to verified Christian scholars
          </Text>
          <TouchFeedback style={styles.actionButton} hapticType="medium">
            <Text style={styles.buttonText}>Submit Question</Text>
          </TouchFeedback>
        </MobileCard>

        <MobileCard style={styles.answersCard}>
          <Text style={styles.cardTitle}>Expert Answers</Text>
          <Text style={styles.cardDescription}>
            Read detailed responses from verified apologetics answerers
          </Text>
          <TouchFeedback style={styles.actionButton} hapticType="medium">
            <Text style={styles.buttonText}>View Answers</Text>
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
  questionCard: {
    marginBottom: 16,
  },
  askCard: {
    marginBottom: 16,
  },
  answersCard: {
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
    backgroundColor: '#F59E0B',
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