/**
 * Event Detail Screen with Map Integration
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { eventsAPI } from '../../src/lib/apiClient';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';

// API expects these exact values
type RSVPStatus = 'going' | 'maybe' | 'not_going';

interface Event {
  id: number;
  title: string;
  description: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  eventDate: string;      // "2026-01-12 00:00:00" or "2026-01-12"
  startTime: string;      // "10:30:00" (time only)
  endTime?: string;       // "12:00:00" (time only)
  attendeeCount?: number;
  rsvpStatus?: RSVPStatus; // User's current RSVP status from API
  creatorId: number;
}

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams() as { id: string };
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const { colors, colorScheme } = useTheme();
  const styles = getThemedStyles(colors, colorScheme);
  const eventId = parseInt(id || '0');
  const [showMap, setShowMap] = useState(true);
  const [currentRsvp, setCurrentRsvp] = useState<RSVPStatus | null>(null);
  const [rsvpFeedback, setRsvpFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data: event, isLoading } = useQuery<Event>({
    queryKey: ['event', eventId],
    queryFn: async () => {
      // Use the specific event endpoint to get all fields including coordinates
      const foundEvent = await eventsAPI.getById(eventId);
      // Store the user's RSVP status from the event data
      if (foundEvent?.rsvpStatus) {
        setCurrentRsvp(foundEvent.rsvpStatus);
      }
      return foundEvent;
    },
    enabled: !!eventId,
  });

  const rsvpMutation = useMutation({
    mutationFn: (status: RSVPStatus) => eventsAPI.rsvp(eventId, status),
    onSuccess: (_data, status) => {
      // Update local state immediately
      setCurrentRsvp(status);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });

      // Show success feedback
      const messages: Record<RSVPStatus, string> = {
        going: "You're going! 🎉",
        maybe: "Marked as maybe",
        not_going: "You're not going",
      };
      setRsvpFeedback({ message: messages[status], type: 'success' });

      // Auto-hide feedback after 3 seconds
      setTimeout(() => setRsvpFeedback(null), 3000);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error ||
                      error?.response?.data?.message ||
                      error?.message ||
                      'Failed to update RSVP';
      const status = error?.response?.status;

      // Show error feedback
      setRsvpFeedback({ message: 'Failed to update RSVP', type: 'error' });
      setTimeout(() => setRsvpFeedback(null), 3000);

      if (status === 401) {
        Alert.alert('Sign In Required', 'Please sign in to RSVP to events.');
      } else if (status === 404) {
        Alert.alert('Event Not Found', 'This event may have been removed.');
      } else {
        Alert.alert('Error', message);
      }
      console.error('[RSVP Error]', status, message);
    },
  });

  // Parse eventDate (handles "2026-01-12 00:00:00" or "2026-01-12" formats)
  const parseEventDate = (eventDate: string): Date => {
    if (!eventDate) return new Date();
    const datePart = eventDate.split(' ')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Format time string "10:30:00" to "10:30 AM"
  const formatTime = (timeStr: string): string => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const hour = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${hour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const formatDate = (eventDate: string) => {
    const date = parseEventDate(eventDate);
    if (isNaN(date.getTime())) return 'Date TBD';
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const handleRSVP = (status: RSVPStatus) => {
    // Check if user is authenticated first
    if (!isAuthenticated || !user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to RSVP to events.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(auth)/login') }
        ]
      );
      return;
    }

    rsvpMutation.mutate(status);
  };

  const openInMaps = () => {
    if (!event?.location) return;

    const query = encodeURIComponent(event.location);
    const url = event.latitude && event.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${query}`;

    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Could not open maps')
    );
  };

  const getCoordinates = () => {
    if (event?.latitude && event?.longitude) {
      // Parse coordinates - database stores as text, MapView needs numbers
      const lat = typeof event.latitude === 'string' ? parseFloat(event.latitude) : event.latitude;
      const lng = typeof event.longitude === 'string' ? parseFloat(event.longitude) : event.longitude;
      if (!isNaN(lat) && !isNaN(lng)) {
        return { latitude: lat, longitude: lng };
      }
    }
    return { latitude: 37.7749, longitude: -122.4194 };
  };

  // Check if event has valid coordinates for map display
  const hasValidCoordinates = () => {
    if (!event?.latitude || !event?.longitude) return false;
    const lat = typeof event.latitude === 'string' ? parseFloat(event.latitude) : event.latitude;
    const lng = typeof event.longitude === 'string' ? parseFloat(event.longitude) : event.longitude;
    return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Event not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)/events')}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isButtonActive = (status: RSVPStatus) => currentRsvp === status;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/events')}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.dateSection}>
          <View style={styles.dateBox}>
            <Text style={styles.dateMonth}>
              {parseEventDate(event.eventDate).toLocaleString('en-US', { month: 'short' }).toUpperCase()}
            </Text>
            <Text style={styles.dateDay}>
              {parseEventDate(event.eventDate).getDate()}
            </Text>
          </View>
          <View style={styles.dateInfo}>
            <Text style={styles.dateText}>{formatDate(event.eventDate)}</Text>
            <Text style={styles.endTimeText}>
              {formatTime(event.startTime)}{event.endTime ? ` - ${formatTime(event.endTime)}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.title}>{event.title}</Text>

          {event.location && (
            <View>
              <View style={styles.locationSection}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.locationText}>{event.location}</Text>
                <TouchableOpacity
                  style={styles.directionsButton}
                  onPress={openInMaps}
                >
                  <Text style={styles.directionsText}>Directions</Text>
                </TouchableOpacity>
              </View>

              {showMap && hasValidCoordinates() && (
                <View style={styles.mapContainer}>
                  <MapView
                    style={styles.map}
                    initialRegion={{
                      ...getCoordinates(),
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                    provider={PROVIDER_GOOGLE}
                  >
                    <Marker
                      coordinate={getCoordinates()}
                      title={event.title}
                      description={event.location}
                    />
                  </MapView>
                  <TouchableOpacity
                    style={styles.mapToggle}
                    onPress={() => setShowMap(!showMap)}
                  >
                    <Text style={styles.mapToggleText}>Hide Map</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!showMap && hasValidCoordinates() && (
                <TouchableOpacity
                  style={styles.showMapButton}
                  onPress={() => setShowMap(true)}
                >
                  <Text style={styles.showMapText}>🗺️ Show Map</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.attendeeSection}>
            <Image source={require('../../assets/people.png')} style={styles.attendeeIconImage} />
            <Text style={styles.attendeeText}>
              {event.attendeeCount || 0} {event.attendeeCount === 1 ? 'person' : 'people'} attending
            </Text>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>About this event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        </View>
      </ScrollView>

      {/* RSVP Feedback Toast */}
      {rsvpFeedback && (
        <View style={[
          styles.feedbackToast,
          rsvpFeedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError
        ]}>
          <Text style={styles.feedbackText}>{rsvpFeedback.message}</Text>
        </View>
      )}

      {/* RSVP Footer with 3 buttons */}
      <View style={styles.footer}>
        {!isAuthenticated ? (
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.signInButtonText}>Sign In to RSVP</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.rsvpButtonRow}>
            <TouchableOpacity
              style={[
                styles.rsvpOptionButton,
                isButtonActive('going') && styles.rsvpOptionActive,
                isButtonActive('going') && styles.rsvpGoingActive,
              ]}
              onPress={() => handleRSVP('going')}
              disabled={rsvpMutation.isPending}
            >
              {rsvpMutation.isPending && rsvpMutation.variables === 'going' ? (
                <ActivityIndicator size="small" color={isButtonActive('going') ? '#fff' : colors.accent} />
              ) : (
                <>
                  <Text style={[
                    styles.rsvpOptionIcon,
                    isButtonActive('going') && styles.rsvpOptionTextActive
                  ]}>✓</Text>
                  <Text style={[
                    styles.rsvpOptionText,
                    isButtonActive('going') && styles.rsvpOptionTextActive
                  ]}>Going</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.rsvpOptionButton,
                isButtonActive('maybe') && styles.rsvpOptionActive,
                isButtonActive('maybe') && styles.rsvpMaybeActive,
              ]}
              onPress={() => handleRSVP('maybe')}
              disabled={rsvpMutation.isPending}
            >
              {rsvpMutation.isPending && rsvpMutation.variables === 'maybe' ? (
                <ActivityIndicator size="small" color={isButtonActive('maybe') ? '#fff' : '#f59e0b'} />
              ) : (
                <>
                  <Text style={[
                    styles.rsvpOptionIcon,
                    isButtonActive('maybe') && styles.rsvpOptionTextActive
                  ]}>?</Text>
                  <Text style={[
                    styles.rsvpOptionText,
                    isButtonActive('maybe') && styles.rsvpOptionTextActive
                  ]}>Maybe</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.rsvpOptionButton,
                isButtonActive('not_going') && styles.rsvpOptionActive,
                isButtonActive('not_going') && styles.rsvpNotGoingActive,
              ]}
              onPress={() => handleRSVP('not_going')}
              disabled={rsvpMutation.isPending}
            >
              {rsvpMutation.isPending && rsvpMutation.variables === 'not_going' ? (
                <ActivityIndicator size="small" color={isButtonActive('not_going') ? '#fff' : '#ef4444'} />
              ) : (
                <>
                  <Text style={[
                    styles.rsvpOptionIcon,
                    isButtonActive('not_going') && styles.rsvpOptionTextActive
                  ]}>✗</Text>
                  <Text style={[
                    styles.rsvpOptionText,
                    isButtonActive('not_going') && styles.rsvpOptionTextActive
                  ]}>Can't Go</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const getThemedStyles = (colors: any, colorScheme: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backIcon: {
    fontSize: 24,
    color: colors.accent,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  dateSection: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  dateBox: {
    width: 70,
    height: 70,
    backgroundColor: colors.accent,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dateMonth: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateDay: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  dateInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  endTimeText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailSection: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: colorScheme === 'dark' ? colors.surfaceRaised : colors.background,
    borderRadius: 8,
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  directionsButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  directionsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  mapContainer: {
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  map: {
    width: '100%',
    height: 200,
  },
  mapToggle: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  mapToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  showMapButton: {
    backgroundColor: colorScheme === 'dark' ? colors.surfaceRaised : colors.background,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  showMapText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  attendeeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: colorScheme === 'dark' ? colors.surfaceRaised : colors.background,
    borderRadius: 8,
  },
  attendeeIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  attendeeIconImage: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  attendeeText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  descriptionSection: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
  },

  // Footer styles
  footer: {
    backgroundColor: colors.surface,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  signInButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // RSVP button row
  rsvpButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rsvpOptionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    gap: 6,
  },
  rsvpOptionActive: {
    borderColor: 'transparent',
  },
  rsvpGoingActive: {
    backgroundColor: '#10b981',
  },
  rsvpMaybeActive: {
    backgroundColor: '#f59e0b',
  },
  rsvpNotGoingActive: {
    backgroundColor: '#ef4444',
  },
  rsvpOptionIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  rsvpOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rsvpOptionTextActive: {
    color: '#fff',
  },

  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  feedbackToast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  feedbackSuccess: {
    backgroundColor: '#10b981',
  },
  feedbackError: {
    backgroundColor: '#ef4444',
  },
  feedbackText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
