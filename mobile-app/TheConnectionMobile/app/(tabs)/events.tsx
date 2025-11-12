/**
 * Events Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsAPI } from '../../src/lib/apiClient';

interface Event {
  id: number;
  title: string;
  description: string;
  location?: string;
  startTime: string;
  endTime?: string;
  attendeeCount?: number;
  rsvpStatus?: string;
  createdBy: number;
}

export default function EventsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading, refetch } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: eventsAPI.getAll,
  });

  const rsvpMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      eventsAPI.rsvp(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      Alert.alert('Success', 'RSVP updated!');
    },
    onError: () => Alert.alert('Error', 'Failed to update RSVP'),
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const handleRSVP = (eventId: number, currentStatus?: string) => {
    const newStatus = currentStatus === 'going' ? 'not_going' : 'going';
    rsvpMutation.mutate({ id: eventId, status: newStatus });
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/events/create')}
        >
          <Text style={styles.createButtonText}>+ Create</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No upcoming events</Text>
            <Text style={styles.emptyStateSubtext}>Create one to get started!</Text>
          </View>
        ) : (
          events.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              onPress={() => router.push(`/events/${event.id}`)}
            >
              <View style={styles.dateBox}>
                <Text style={styles.dateMonth}>
                  {new Date(event.startTime).toLocaleString('en-US', { month: 'short' })}
                </Text>
                <Text style={styles.dateDay}>
                  {new Date(event.startTime).getDate()}
                </Text>
              </View>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDescription} numberOfLines={2}>
                  {event.description}
                </Text>
                {event.location && (
                  <Text style={styles.eventLocation}>📍 {event.location}</Text>
                )}
                <Text style={styles.eventTime}>{formatDate(event.startTime)}</Text>
                {event.attendeeCount !== undefined && (
                  <Text style={styles.attendeeCount}>
                    {event.attendeeCount} {event.attendeeCount === 1 ? 'attendee' : 'attendees'}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={[
                  styles.rsvpButton,
                  event.rsvpStatus === 'going' && styles.rsvpButtonGoing,
                ]}
                onPress={() => handleRSVP(event.id, event.rsvpStatus)}
                disabled={rsvpMutation.isPending}
              >
                {rsvpMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.rsvpButtonText}>
                    {event.rsvpStatus === 'going' ? 'Going' : 'RSVP'}
                  </Text>
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  createButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dateBox: {
    width: 60,
    height: 60,
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateMonth: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateDay: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  eventInfo: {
    flex: 1,
    marginRight: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  attendeeCount: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  rsvpButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    height: 36,
    justifyContent: 'center',
  },
  rsvpButtonGoing: {
    backgroundColor: '#10b981',
  },
  rsvpButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
