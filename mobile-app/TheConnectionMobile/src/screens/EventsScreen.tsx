import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Event } from '../types';
import { apiService } from '../services/api';

const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  const eventDate = new Date(event.startTime);
  const isVirtual = event.isVirtual;
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleRSVP = () => {
    Alert.alert(
      'RSVP',
      `Would you like to RSVP for "${event.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Count Me In!', onPress: () => {
          Alert.alert('Success', 'You have successfully RSVP\'d for this event!');
        }},
      ]
    );
  };

  return (
    <View style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatDate(eventDate)}</Text>
          <Text style={styles.timeText}>{formatTime(eventDate)}</Text>
        </View>
        <View style={[styles.eventTypeTag, isVirtual ? styles.virtualTag : styles.inPersonTag]}>
          <Text style={[styles.eventTypeText, isVirtual ? styles.virtualText : styles.inPersonText]}>
            {isVirtual ? 'Virtual' : 'In-Person'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.eventTitle}>{event.title}</Text>
      <Text style={styles.eventDescription} numberOfLines={3}>
        {event.description}
      </Text>
      
      {event.location && !isVirtual && (
        <Text style={styles.locationText}>📍 {event.location}</Text>
      )}
      
      <TouchableOpacity style={styles.rsvpButton} onPress={handleRSVP}>
        <Text style={styles.rsvpButtonText}>RSVP</Text>
      </TouchableOpacity>
    </View>
  );
};

export const EventsScreen: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await apiService.getEvents();
        setEvents(data);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E73AA4" />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Events</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Events Yet</Text>
          <Text style={styles.emptyDescription}>
            Check back soon for upcoming community events, Bible studies, and fellowship gatherings.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Upcoming Events</Text>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <EventCard event={item} />}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1D29',
    textAlign: 'center',
    marginVertical: 24,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  eventCard: {
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
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1D29',
  },
  timeText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  eventTypeTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  virtualTag: {
    backgroundColor: '#EEF2FF',
  },
  inPersonTag: {
    backgroundColor: '#F0FDF4',
  },
  eventTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  virtualText: {
    color: '#6366F1',
  },
  inPersonText: {
    color: '#16A34A',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1D29',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#8B5CF6',
    marginBottom: 12,
  },
  rsvpButton: {
    backgroundColor: '#E73AA4',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  rsvpButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1D29',
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
});