/**
 * Event Detail Screen with Map Integration
 */

import React, { useState, useEffect } from 'react';
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
  Platform,
  ActionSheetIOS,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { eventsAPI } from '../../src/lib/apiClient';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { ShareContentModal, ShareableContent } from '../../src/components/ShareContentModal';

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
  userRsvpStatus?: RSVPStatus;
  creatorId: number;
  hostUserId?: number;
  imageUrl?: string | null; // Event flyer/poster image
  communityId?: number | null; // null = Connection Hosted event
  host?: {
    id: number;
    username: string;
    displayName?: string;
  };
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
  const [geocodedCoords, setGeocodedCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [flyerHeight, setFlyerHeight] = useState<number>(200); // Dynamic height based on image aspect ratio
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  // Check if current user is the host
  const isHost = (event: Event | undefined) => {
    if (!user?.id || !event) return false;
    return event.hostUserId === user.id || event.creatorId === user.id || event.host?.id === user.id;
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => eventsAPI.delete(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      Alert.alert('Deleted', 'Event has been deleted.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/events') }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.message || 'Failed to delete event');
    },
  });

  // Announcement mutation
  const announcementMutation = useMutation({
    mutationFn: (message: string) => eventsAPI.announce(eventId, message),
    onSuccess: (data: any) => {
      setShowAnnouncementModal(false);
      setAnnouncementMessage('');
      Alert.alert(
        'Announcement Sent',
        `Your message was sent to ${data.recipientCount} attendee${data.recipientCount === 1 ? '' : 's'}.`
      );
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.error || error?.message || 'Failed to send announcement');
    },
  });

  // Send announcement
  const handleSendAnnouncement = () => {
    if (!announcementMessage.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }
    announcementMutation.mutate(announcementMessage.trim());
  };

  // Handle manage button press
  const handleManagePress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['View Attendees', 'Send Announcement', 'Edit Event', 'Delete Event', 'Cancel'],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 4,
          title: 'Manage Event',
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            router.push(`/events/${eventId}/attendees`);
          } else if (buttonIndex === 1) {
            setShowAnnouncementModal(true);
          } else if (buttonIndex === 2) {
            router.push(`/events/edit/${eventId}`);
          } else if (buttonIndex === 3) {
            confirmDelete();
          }
        }
      );
    } else {
      Alert.alert(
        'Manage Event',
        undefined,
        [
          { text: 'View Attendees', onPress: () => router.push(`/events/${eventId}/attendees`) },
          { text: 'Send Announcement', onPress: () => setShowAnnouncementModal(true) },
          { text: 'Edit Event', onPress: () => router.push(`/events/edit/${eventId}`) },
          { text: 'Delete Event', style: 'destructive', onPress: confirmDelete },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ]
    );
  };

  const { data: event, isLoading } = useQuery<Event>({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const foundEvent = await eventsAPI.getById(eventId);
      // Store the user's RSVP status from the event data (check both fields)
      const rsvpStatus = foundEvent?.userRsvpStatus || foundEvent?.rsvpStatus;
      if (rsvpStatus) {
        setCurrentRsvp(rsvpStatus);
      }
      return foundEvent;
    },
    enabled: !!eventId,
  });

  // Geocode the address if event doesn't have coordinates
  useEffect(() => {
    const geocodeAddress = async () => {
      if (!event?.location) return;
      if (event?.latitude && event?.longitude) return; // Already has coordinates
      if (geocodedCoords) return; // Already geocoded

      setIsGeocoding(true);
      try {
        const results = await Location.geocodeAsync(event.location);
        if (results && results.length > 0) {
          setGeocodedCoords({
            latitude: results[0].latitude,
            longitude: results[0].longitude,
          });
        }
      } catch (error) {
        console.log('Geocoding error:', error);
      } finally {
        setIsGeocoding(false);
      }
    };

    geocodeAddress();
  }, [event?.location, event?.latitude, event?.longitude]);

  // Calculate flyer image height based on its aspect ratio
  useEffect(() => {
    if (event?.imageUrl) {
      const screenWidth = Dimensions.get('window').width - 32; // Account for padding
      Image.getSize(
        event.imageUrl,
        (width, height) => {
          const aspectRatio = height / width;
          // Constrain height between 150 and 400
          const calculatedHeight = Math.min(400, Math.max(150, screenWidth * aspectRatio));
          setFlyerHeight(calculatedHeight);
        },
        (error) => {
          console.log('Error getting image size:', error);
          setFlyerHeight(200); // Fallback height
        }
      );
    }
  }, [event?.imageUrl]);

  const rsvpMutation = useMutation({
    mutationFn: (status: RSVPStatus) => eventsAPI.rsvp(eventId, status),
    onSuccess: (_data, status) => {
      // Update local state immediately
      setCurrentRsvp(status);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error ||
                      error?.response?.data?.message ||
                      error?.message ||
                      'Failed to update RSVP';
      const status = error?.response?.status;

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
    enabled: !!eventId && isConnectionHosted && isHost(event),
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
    const lat = event.latitude;
    const lng = event.longitude;

    // Build URLs for both map apps
    const googleMapsUrl = lat && lng
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${query}`;

    const appleMapsUrl = lat && lng
      ? `maps://maps.apple.com/?daddr=${lat},${lng}`
      : `maps://maps.apple.com/?q=${query}`;

    const openGoogleMaps = () => {
      Linking.openURL(googleMapsUrl).catch(() =>
        Alert.alert('Error', 'Could not open Google Maps')
      );
    };

    const openAppleMaps = () => {
      Linking.openURL(appleMapsUrl).catch(() =>
        Alert.alert('Error', 'Could not open Apple Maps')
      );
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Apple Maps', 'Google Maps', 'Cancel'],
          cancelButtonIndex: 2,
          title: 'Get Directions',
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            openAppleMaps();
          } else if (buttonIndex === 1) {
            openGoogleMaps();
          }
        }
      );
    } else {
      // Android - show Alert with options
      Alert.alert(
        'Get Directions',
        'Choose your maps app',
        [
          { text: 'Google Maps', onPress: openGoogleMaps },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  // Check if we have coordinates (from event or geocoding)
  const hasCoordinates = !!(event?.latitude && event?.longitude) || !!geocodedCoords;

  const getCoordinates = () => {
    // First try event's stored coordinates
    if (event?.latitude && event?.longitude) {
      return { latitude: event.latitude, longitude: event.longitude };
    }
    // Then try geocoded coordinates
    if (geocodedCoords) {
      return geocodedCoords;
    }
    // Default fallback to Detroit area
    return { latitude: 42.6585, longitude: -83.0500 };
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1a2a4a" />
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={() => setShowShareModal(true)} style={{ padding: 4 }}>
            <Ionicons name="paper-plane-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          {isHost(event) && (
            <TouchableOpacity onPress={handleManagePress} style={styles.manageButton}>
              <Text style={styles.manageButtonText}>Manage</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Event Flyer Image */}
        {event.imageUrl && (
          <View style={styles.flyerContainer}>
            <Image
              source={{ uri: event.imageUrl }}
              style={[styles.flyerImage, { height: flyerHeight }]}
              resizeMode="contain"
            />
          </View>
        )}

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
                <Ionicons name="location" size={20} color="#E53935" style={styles.locationIcon} />
                <Text style={styles.locationText}>{event.location}</Text>
                <TouchableOpacity
                  style={styles.directionsButton}
                  onPress={openInMaps}
                >
                  <Text style={styles.directionsText}>Directions</Text>
                </TouchableOpacity>
              </View>

              {showMap && (
                <View style={styles.mapContainer}>
                  {isGeocoding ? (
                    <View style={styles.mapLoading}>
                      <ActivityIndicator size="small" color="#1a2a4a" />
                      <Text style={styles.mapLoadingText}>Finding location...</Text>
                    </View>
                  ) : (
                    <MapView
                      style={styles.map}
                      region={{
                        ...getCoordinates(),
                        latitudeDelta: hasCoordinates ? 0.01 : 0.5,
                        longitudeDelta: hasCoordinates ? 0.01 : 0.5,
                      }}
                      // Use Apple Maps on iOS (works without API key), Google Maps on Android
                      provider={Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
                    >
                      {hasCoordinates && (
                        <Marker
                          coordinate={getCoordinates()}
                          title={event.title}
                          description={event.location}
                        />
                      )}
                    </MapView>
                  )}
                  {!hasCoordinates && !isGeocoding && (
                    <View style={styles.mapOverlay}>
                      <Text style={styles.mapOverlayText}>Tap Directions for exact location</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.mapToggle}
                    onPress={() => setShowMap(!showMap)}
                  >
                    <Text style={styles.mapToggleText}>Hide Map</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!showMap && (
                <TouchableOpacity
                  style={styles.showMapButton}
                  onPress={() => setShowMap(true)}
                >
                  <Text style={styles.showMapText}>Show Map</Text>
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

      {/* Invite Nearby Users Button (Connection Hosted events, host only) */}
      {event && isConnectionHosted && isHost(event) && (
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
                <ActivityIndicator size="small" color={isButtonActive('going') ? '#fff' : '#1a2a4a'} />
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

      {/* Announcement Modal */}
      <Modal
        visible={showAnnouncementModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAnnouncementModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.announcementModal}>
            <View style={styles.announcementHeader}>
              <Text style={styles.announcementTitle}>Send Announcement</Text>
              <TouchableOpacity onPress={() => setShowAnnouncementModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.announcementSubtitle}>
              Send a message to all attendees who RSVPed "Going" or "Maybe"
            </Text>

            <TextInput
              style={styles.announcementInput}
              placeholder="Type your announcement here..."
              placeholderTextColor={colors.textMuted}
              value={announcementMessage}
              onChangeText={setAnnouncementMessage}
              multiline
              maxLength={500}
              autoFocus
            />

            <View style={styles.announcementFooter}>
              <Text style={styles.charCount}>
                {announcementMessage.length}/500
              </Text>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!announcementMessage.trim() || announcementMutation.isPending) && styles.sendButtonDisabled
                ]}
                onPress={handleSendAnnouncement}
                disabled={!announcementMessage.trim() || announcementMutation.isPending}
              >
                {announcementMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="megaphone-outline" size={18} color="#fff" />
                    <Text style={styles.sendButtonText}>Send</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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

// Event detail blue color - matches the main events page card headers
const EVENT_BLUE = '#1a2a4a';

const getThemedStyles = (colors: any, colorScheme: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flyerContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surfaceNested,
  },
  flyerImage: {
    width: '100%',
    borderRadius: 12,
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
    color: EVENT_BLUE,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  manageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: EVENT_BLUE,
    borderRadius: 6,
  },
  manageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
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
    backgroundColor: EVENT_BLUE,
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
    marginRight: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  directionsButton: {
    backgroundColor: EVENT_BLUE,
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
  mapLoading: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colorScheme === 'dark' ? colors.surfaceMuted : '#f0f0f0',
  },
  mapLoadingText: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textSecondary,
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
  mapOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(26, 42, 74, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  mapOverlayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
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
    color: EVENT_BLUE,
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
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 34, // Safe area for home indicator
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  signInButton: {
    backgroundColor: EVENT_BLUE,
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
    backgroundColor: EVENT_BLUE,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Announcement Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  announcementModal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  announcementTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  announcementSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  announcementInput: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  charCount: {
    fontSize: 13,
    color: colors.textMuted,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EVENT_BLUE,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Invite Nearby Users styles
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
});
