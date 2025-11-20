/**
 * Events Screen with List and Calendar Views
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
import { Calendar, DateData } from 'react-native-calendars';
import { eventsAPI } from '../../src/lib/apiClient';
import { Colors } from '../../src/shared/colors';

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

type ViewMode = 'list' | 'calendar';

export default function EventsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

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

  // Get events for calendar (marked dates)
  const getMarkedDates = () => {
    const marked: any = {};
    events.forEach((event) => {
      const dateKey = new Date(event.startTime).toISOString().split('T')[0];
      marked[dateKey] = {
        marked: true,
        dotColor: 'Colors.primary',
        selectedColor: 'Colors.primary',
      };
    });
    // Also mark selected date
    marked[selectedDate] = {
      ...marked[selectedDate],
      selected: true,
      selectedColor: 'Colors.primary',
    };
    return marked;
  };

  // Get events for selected date
  const getEventsForDate = (date: string) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime).toISOString().split('T')[0];
      return eventDate === date;
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="Colors.primary" />
      </View>
    );
  }

  const filteredEvents = viewMode === 'calendar' ? getEventsForDate(selectedDate) : events;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Events</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/events/create')}
          >
            <Text style={styles.createButtonText}>+ Create</Text>
          </TouchableOpacity>
        </View>

        {/* View Mode Toggle */}
        <View style={styles.viewModeToggle}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <Text
              style={[styles.viewModeText, viewMode === 'list' && styles.viewModeTextActive]}
            >
              📋 List
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'calendar' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('calendar')}
          >
            <Text
              style={[styles.viewModeText, viewMode === 'calendar' && styles.viewModeTextActive]}
            >
              📅 Calendar
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <Calendar
          markedDates={getMarkedDates()}
          onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
          theme={{
            selectedDayBackgroundColor: 'Colors.primary',
            todayTextColor: 'Colors.primary',
            dotColor: 'Colors.primary',
            arrowColor: 'Colors.primary',
          }}
        />
      )}

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {viewMode === 'calendar' ? 'No events on this date' : 'No upcoming events'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {viewMode === 'calendar'
                ? 'Select another date or create a new event'
                : 'Create one to get started!'}
            </Text>
          </View>
        ) : (
          filteredEvents.map((event) => (
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingTop: 60,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  createButton: {
    backgroundColor: 'Colors.primary',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  viewModeToggle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  viewModeTextActive: {
    color: 'Colors.primary',
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
    backgroundColor: 'Colors.primary',
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
    color: 'Colors.primary',
    fontWeight: '600',
  },
  rsvpButton: {
    backgroundColor: 'Colors.primary',
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
