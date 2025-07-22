import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import MobileCard from '../components/MobileCard';
import TouchFeedback from '../components/TouchFeedback';
import { apiService } from '../services/api';
import { PrayerRequest } from '../types';

export const PrayerRequestsScreen = () => {
  const { data: prayerRequests = [], isLoading } = useQuery({
    queryKey: ['prayer-requests'],
    queryFn: () => apiService.getPrayerRequests(),
    retry: 2,
  });

  const renderPrayerItem = ({ item }: { item: PrayerRequest }) => (
    <MobileCard style={styles.prayerCard}>
      <View style={styles.prayerHeader}>
        <Text style={styles.prayerTitle}>{item.title}</Text>
        <Text style={styles.prayerCount}>🙏 {item.prayersCount}</Text>
      </View>
      
      <Text style={styles.prayerContent}>{item.content}</Text>
      
      <View style={styles.prayerFooter}>
        <Text style={styles.prayerAuthor}>
          {item.isAnonymous ? 'Anonymous' : `@${item.user.username}`}
        </Text>
        <TouchFeedback 
          style={styles.prayButton}
          hapticType="success"
        >
          <Text style={styles.prayButtonText}>Pray</Text>
        </TouchFeedback>
      </View>
    </MobileCard>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E91E63" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Prayer Requests</Text>
        <Text style={styles.headerSubtitle}>Pray for one another</Text>
      </View>

      <FlatList
        data={prayerRequests}
        renderItem={renderPrayerItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
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
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prayerCard: {
    marginBottom: 16,
  },
  prayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  prayerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1D29',
    flex: 1,
  },
  prayerCount: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  prayerContent: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 12,
  },
  prayerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prayerAuthor: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  prayButton: {
    backgroundColor: '#10B981',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  prayButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});