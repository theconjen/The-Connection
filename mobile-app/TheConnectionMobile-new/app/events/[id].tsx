/**
 * Event Detail Screen with Map Integration
 */

import React, { useState, useEffect, useRef } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import { Platform } from 'react-native';
import apiClient, { eventsAPI } from '../../src/lib/apiClient';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { isHost } from '../../src/lib/eventHelpers';
import { ShareContentModal, ShareableContent } from '../../src/components/ShareContentModal';

// API expects these exact values
type RSVPStatus = 'going' | 'maybe' | 'not_going';

// Host user info type
interface HostUser {
  id: number;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

interface Event {
  id: number;
  title: string;
  description: string;
  category?: string; // Event type: Sunday Service, Worship, Bible Study, etc.
  location?: string;
  latitude?: number;
  longitude?: number;
  eventDate: string;      // "2026-01-12 00:00:00" or "2026-01-12"
  startTime: string;      // "10:30:00" (time only)
  endTime?: string;       // "12:00:00" (time only)
  attendeeCount?: number;
  rsvpStatus?: RSVPStatus; // User's current RSVP status (legacy)
  userRsvpStatus?: RSVPStatus; // User's RSVP status from API
  isBookmarked?: boolean;
  creatorId: number;
  hostUserId?: number; // Reliable host identifier
  host?: HostUser | null; // Host user info from API
  communityId?: number | null; // null = Connection Hosted event
}

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams() as { id: string };
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { colors, colorScheme } = useTheme();
  const styles = getThemedStyles(colors, colorScheme);
  const eventId = parseInt(id || '0');

  // ALWAYS log on mount to debug routing issues
  console.info('[EventDetail] MOUNTED - id param:', id, '-> eventId:', eventId);
  const [showMap, setShowMap] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentRsvp, setCurrentRsvp] = useState<RSVPStatus | null>(null);
  const [rsvpFeedback, setRsvpFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auth must be fully initialized before fetching event (ensures JWT is attached)
  const authReady = !authLoading;

  // DEV-ONLY: Log auth readiness state
  useEffect(() => {
    if (__DEV__) {
      console.info('[EventDetail] Auth state:', {
        authReady,
        authLoading,
        hasUser: !!user,
        userId: user?.id,
        eventId,
      });
    }
  }, [authReady, authLoading, user, eventId]);

  const { data: event, isLoading, error: queryError } = useQuery<Event>({
    queryKey: ['event', eventId],
    queryFn: async () => {
      if (__DEV__) {
        console.info('[EventDetail] Fetching event:', eventId);
      }
      try {
        // Use the specific event endpoint to get all fields including coordinates
        const foundEvent = await eventsAPI.getById(eventId);
        if (__DEV__) {
          console.info('[EventDetail] Event fetch success:', {
            eventId: foundEvent?.id,
            userRsvpStatus: foundEvent?.userRsvpStatus,
            hasHost: !!foundEvent?.host,
          });
        }
        // Store the user's RSVP status from the event data (API returns userRsvpStatus)
        if (foundEvent?.userRsvpStatus) {
          setCurrentRsvp(foundEvent.userRsvpStatus);
        } else if (foundEvent?.rsvpStatus) {
          setCurrentRsvp(foundEvent.rsvpStatus);
        }
        return foundEvent;
      } catch (error: any) {
        if (__DEV__) {
          console.error('[EventDetail] Event fetch error:', {
            status: error.response?.status,
            message: error.message,
          });
        }
        throw error;
      }
    },
    // Wait for auth to be ready before fetching (ensures JWT is attached for userRsvpStatus)
    enabled: !!eventId && authReady,
  });

  // DEV-ONLY: Fetch viewer from /api/user/me for debug panel
  const { data: viewer } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await apiClient.get('/api/user/me');
      return res.data;
    },
    enabled: __DEV__,
  });

  // DEV-ONLY: Track if we've logged once
  const hasLoggedRef = useRef(false);

  // DEV-ONLY: Console.log debug payload once on mount when data is ready
  useEffect(() => {
    if (__DEV__ && event && viewer && !hasLoggedRef.current) {
      hasLoggedRef.current = true;
      const debugPayload = {
        viewerId: viewer?.id,
        viewerUsername: viewer?.username,
        eventId: event.id,
        'event.hostUserId': event.hostUserId,
        'event.host?.id': event.host?.id,
        'event.creatorId': event.creatorId,
        derivedIsHost: isHost(event, viewer?.id),
      };
      console.info('[EventDetail DEBUG]', debugPayload);
    }
  }, [event, viewer]);

  const rsvpMutation = useMutation({
    mutationFn: (status: RSVPStatus) => {
      if (__DEV__) {
        console.info('[EventDetail RSVP] Setting status:', { eventId, status });
      }
      return eventsAPI.rsvp(eventId, status);
    },
    onSuccess: (_data, status) => {
      if (__DEV__) {
        console.info('[EventDetail RSVP] Success - invalidating queries for event:', eventId);
      }
      // Update local state immediately
      setCurrentRsvp(status);
      // Invalidate queries to ensure server state is fetched (persists across app restarts)
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['events', 'my'] });

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

  // Check if this is a Connection Hosted event (no communityId)
  const isConnectionHosted = event?.communityId === null || event?.communityId === undefined;

  // Get nearby users count for Connection Hosted events (only for host)
  const { data: nearbyUsersData, refetch: refetchNearbyCount } = useQuery({
    queryKey: ['nearby-users-count', eventId],
    queryFn: () => eventsAPI.getNearbyUsersCount(eventId, 30),
    enabled: !!eventId && isConnectionHosted && isHost(event, user?.id),
  });

  // Mutation to invite nearby users
  const inviteNearbyMutation = useMutation({
    mutationFn: () => eventsAPI.inviteNearbyUsers(eventId, 30, true),
    onSuccess: (data) => {
      Alert.alert(
        'Invitations Sent!',
        `Successfully invited ${data.invitedCount} users within 30 miles of the event.${data.skippedCount > 0 ? `\n\n${data.skippedCount} users were skipped (already invited or RSVP'd).` : ''}`,
        [{ text: 'OK' }]
      );
      // Refresh the nearby count
      refetchNearbyCount();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to invite nearby users';
      Alert.alert('Error', message);
    },
  });

  const handleInviteNearbyUsers = () => {
    const eligibleCount = nearbyUsersData?.eligibleToInvite || 0;
    if (eligibleCount === 0) {
      Alert.alert(
        'No Users to Invite',
        'There are no users within 30 miles who haven\'t already been invited or RSVP\'d.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Invite Nearby Users',
      `This will send invitations to ${eligibleCount} users within 30 miles of this event.\n\nThey will receive a notification about the event.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Invite ${eligibleCount} Users`,
          onPress: () => inviteNearbyMutation.mutate(),
        },
      ]
    );
  };

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

  // Check if eventId is valid (not 0, not NaN)
  const isValidEventId = eventId > 0 && !isNaN(eventId);

  // Show error immediately if eventId is invalid
  if (!isValidEventId) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Invalid event</Text>
        {__DEV__ && (
          <Text style={{ color: colors.textMuted, marginTop: 5, fontSize: 12 }}>
            id param: "{id}", parsed eventId: {eventId}
          </Text>
        )}
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)/events')}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show loading state while auth is loading OR query is fetching
  if (isLoading || authLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        {__DEV__ && (
          <Text style={{ color: colors.textMuted, marginTop: 10, fontSize: 12 }}>
            {authLoading ? 'Loading auth...' : 'Loading event...'}
          </Text>
        )}
      </View>
    );
  }

  if (queryError || !event) {
    // Determine error message
    const errorStatus = (queryError as any)?.response?.status;
    const errorMessage = errorStatus === 404
      ? 'Event not found'
      : queryError
        ? 'Failed to load event'
        : 'Event not found';

    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{errorMessage}</Text>
        {__DEV__ && (
          <Text style={{ color: colors.textMuted, marginTop: 5, fontSize: 12, textAlign: 'center' }}>
            eventId: {eventId}, authReady: {String(authReady)}{'\n'}
            error: {queryError?.message || 'no data'}
          </Text>
        )}
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
        <TouchableOpacity onPress={() => setShowShareModal(true)} style={{ padding: 8 }}>
          <Ionicons name="paper-plane-outline" size={22} color={colors.accent} />
        </TouchableOpacity>
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

          {/* Host info */}
          {event.host && (
            <View style={styles.hostSection}>
              <View style={styles.hostAvatar}>
                <Text style={styles.hostAvatarText}>
                  {(event.host.displayName || event.host.username).charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.hostName}>
                Hosted by {event.host.displayName || event.host.username}
              </Text>
            </View>
          )}

          {/* Event category/type badge */}
          {event.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{event.category}</Text>
            </View>
          )}

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
                    // Use Apple Maps on iOS (works without API key), Google Maps on Android
                    provider={Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
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

          {/* DEV-ONLY Debug Panel */}
          {__DEV__ && (
            <View style={styles.debugPanel}>
              <Text style={styles.debugTitle}>🛠️ DEV DEBUG PANEL</Text>
              <View style={styles.debugRow}>
                <Text style={styles.debugLabel}>viewerId:</Text>
                <Text style={styles.debugValue}>{viewer?.id ?? 'null'}</Text>
              </View>
              <View style={styles.debugRow}>
                <Text style={styles.debugLabel}>viewerUsername:</Text>
                <Text style={styles.debugValue}>{viewer?.username ?? 'null'}</Text>
              </View>
              <View style={styles.debugRow}>
                <Text style={styles.debugLabel}>eventId:</Text>
                <Text style={styles.debugValue}>{event.id}</Text>
              </View>
              <View style={styles.debugRow}>
                <Text style={styles.debugLabel}>event.hostUserId:</Text>
                <Text style={styles.debugValue}>{event.hostUserId ?? 'undefined'}</Text>
              </View>
              <View style={styles.debugRow}>
                <Text style={styles.debugLabel}>event.host?.id:</Text>
                <Text style={styles.debugValue}>{event.host?.id ?? 'undefined'}</Text>
              </View>
              <View style={styles.debugRow}>
                <Text style={styles.debugLabel}>event.creatorId:</Text>
                <Text style={styles.debugValue}>{event.creatorId ?? 'undefined'}</Text>
              </View>
              <View style={[styles.debugRow, styles.debugHighlight]}>
                <Text style={styles.debugLabel}>derived isHost:</Text>
                <Text style={[styles.debugValue, { color: isHost(event, viewer?.id) ? '#22c55e' : '#ef4444', fontWeight: 'bold' }]}>
                  {isHost(event, viewer?.id) ? 'TRUE' : 'FALSE'}
                </Text>
              </View>
            </View>
          )}
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

      {/* Manage Event Button (host only) */}
      {event && isHost(event, user?.id) && (
        <View style={styles.manageEventContainer}>
          <TouchableOpacity
            style={[styles.manageEventButton, { backgroundColor: colors.accent }]}
            onPress={() => router.push({ pathname: '/events/manage/[id]', params: { id: String(eventId) } })}
          >
            <Text style={styles.manageEventText}>Manage Event</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Invite Friends Button (for hosts and attendees) */}
      {event && isAuthenticated && (isHost(event, user?.id) || currentRsvp === 'going' || currentRsvp === 'maybe') && (
        <View style={styles.inviteContainer}>
          <TouchableOpacity
            style={[styles.inviteButton, { borderColor: colors.primary }]}
            onPress={() => router.push({ pathname: '/events/[id]/invite', params: { id: String(eventId) } })}
          >
            <Text style={[styles.inviteButtonText, { color: colors.primary }]}>Invite Friends</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Invite Nearby Users Button (Connection Hosted events, host only) */}
      {event && isConnectionHosted && isHost(event, user?.id) && (
        <View style={styles.inviteNearbyContainer}>
          <TouchableOpacity
            style={[
              styles.inviteNearbyButton,
              { backgroundColor: colors.accent },
              inviteNearbyMutation.isPending && styles.inviteNearbyButtonDisabled
            ]}
            onPress={handleInviteNearbyUsers}
            disabled={inviteNearbyMutation.isPending}
          >
            {inviteNearbyMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.inviteNearbyIcon}>📍</Text>
                <View style={styles.inviteNearbyTextContainer}>
                  <Text style={styles.inviteNearbyButtonText}>Invite Nearby Users (30 mi)</Text>
                  {nearbyUsersData && (
                    <Text style={styles.inviteNearbySubtext}>
                      {nearbyUsersData.eligibleToInvite} users available
                    </Text>
                  )}
                </View>
              </>
            )}
          </TouchableOpacity>
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

      {/* In-App Share Modal */}
      <ShareContentModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        content={event ? {
          type: 'event',
          id: eventId,
          title: event.title,
          preview: event.description ? (event.description.length > 150 ? event.description.substring(0, 150) + '...' : event.description) : undefined,
        } : null}
      />
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
    marginBottom: 12,
  },
  hostSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  hostAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  hostName: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '20', // 20% opacity
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  categoryBadgeText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
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
  manageEventContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  manageEventButton: {
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  manageEventText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  inviteContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  inviteButton: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  inviteButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  inviteNearbyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  inviteNearbyButton: {
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteNearbyButtonDisabled: {
    opacity: 0.7,
  },
  inviteNearbyIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  inviteNearbyTextContainer: {
    alignItems: 'center',
  },
  inviteNearbyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  inviteNearbySubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },

  // DEV-ONLY Debug Panel styles
  debugPanel: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 12,
    textAlign: 'center',
  },
  debugRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  debugLabel: {
    fontSize: 12,
    color: '#a1a1aa',
    fontFamily: 'monospace',
  },
  debugValue: {
    fontSize: 12,
    color: '#e4e4e7',
    fontFamily: 'monospace',
  },
  debugHighlight: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#f59e0b',
    borderBottomWidth: 0,
  },
});
