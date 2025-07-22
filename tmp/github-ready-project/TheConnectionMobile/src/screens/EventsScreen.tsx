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
import { Event } from '../types';

export const EventsScreen = () => {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => apiService.getEvents(),
    retry: 2,
  });

  const renderEventItem = ({ item }: { item: Event }) => (
    <MobileCard style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <View style={[styles.typeBadge, { backgroundColor: item.isVirtual ? '#6366F1' : '#10B981' }]}>
          <Text style={styles.typeText}>
            {item.isVirtual ? 'Virtual' : 'In-Person'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.eventDescription} numberOfLines={3}>
        {item.description}
      </Text>
      
      <View style={styles.eventDetails}>
        <Text style={styles.eventDate}>
          📅 {new Date(item.startTime).toLocaleDateString()}
        </Text>
        <Text style={styles.eventTime}>
          🕐 {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        {!item.isVirtual && item.location && (
          <Text style={styles.eventLocation}>📍 {item.location}</Text>
        )}
      </View>
      
      <TouchFeedback 
        style={styles.joinButton}
        hapticType="medium"
      >
        <Text style={styles.joinButtonText}>Join Event</Text>
      </TouchFeedback>
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
        <Text style={styles.headerTitle}>Events</Text>
        <Text style={styles.headerSubtitle}>Join community gatherings</Text>
      </View>

      <FlatList
        data={events}
        renderItem={renderEventItem}
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
  eventCard: {
    marginBottom: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1D29',
    flex: 1,
    marginRight: 12,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  eventDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 12,
  },
  eventDetails: {
    marginBottom: 16,
  },
  eventDate: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 12,
    color: '#64748B',
  },
  joinButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});