/**
 * EVENT DETAIL SCREEN - The Connection Mobile App
 * -----------------------------------------------
 * Detailed view of a single event with RSVP, messaging, and map
 *
 * API Endpoints:
 * - GET /api/events/:id
 * - GET /api/events/:id/my-rsvp
 * - POST /api/events/:id/rsvp
 * - DELETE /api/events/:id/rsvp
 * - GET /api/events/:id/rsvps
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import apiClient from '../lib/apiClient';

// ============================================================================
// TYPES
// ============================================================================

interface Event {
  id: number;
  title: string;
  description: string;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  isVirtual?: boolean;
  isPublic?: boolean;
  virtualMeetingUrl?: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  imageUrl?: string;
  latitude?: string;
  longitude?: string;
  communityId?: number;
  creatorId: number;
  createdAt?: string;
  community?: {
    id: number;
    name: string;
  };
  creator?: {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

interface RSVP {
  id: number;
  eventId: number;
  userId: number;
  status: 'attending' | 'maybe' | 'declined';
  createdAt: string;
}

interface EventDetailScreenProps {
  eventId: number;
  onBack?: () => void;
  onMessageHost?: (userId: number) => void;
}

// ============================================================================
// API HOOKS
// ============================================================================

function useEvent(eventId: number) {
  return useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
    queryFn: async () => {
      const response = await apiClient.get(`/api/events/${eventId}`);
      return response.data;
    },
  });
}

function useMyRSVP(eventId: number) {
  const { user } = useAuth();
  return useQuery<RSVP | null>({
    queryKey: [`/api/events/${eventId}/my-rsvp`],
    enabled: !!user,
    queryFn: async () => {
      const response = await apiClient.get(`/api/events/${eventId}/my-rsvp`);
      return response.data;
    },
  });
}

function useRSVPs(eventId: number) {
  return useQuery<RSVP[]>({
    queryKey: [`/api/events/${eventId}/rsvps`],
    queryFn: async () => {
      const response = await apiClient.get(`/api/events/${eventId}/rsvps`);
      return response.data;
    },
  });
}

function useUpdateRSVP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, status }: { eventId: number; status: string }) => {
      const response = await apiClient.post(`/api/events/${eventId}/rsvp`, { status });
      return response.data;
    },
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/my-rsvp`] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/rsvps`] });
    },
  });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EventDetailScreen({ eventId, onBack, onMessageHost }: EventDetailScreenProps) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [showRSVPOptions, setShowRSVPOptions] = useState(false);

  const { data: event, isLoading } = useEvent(eventId);
  const { data: myRSVP } = useMyRSVP(eventId);
  const { data: rsvps = [] } = useRSVPs(eventId);
  const updateRSVPMutation = useUpdateRSVP();

  const handleRSVP = (status: 'attending' | 'maybe' | 'declined') => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to RSVP to events');
      return;
    }

    updateRSVPMutation.mutate(
      { eventId, status },
      {
        onSuccess: () => {
          setShowRSVPOptions(false);
          Alert.alert('RSVP Updated', `You are now marked as "${status}"`);
        },
        onError: (error: any) => {
          Alert.alert('Error', error.message || 'Failed to update RSVP');
        },
      }
    );
  };

  const handleMessageHost = () => {
    if (!event?.creator) return;
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to message the host');
      return;
    }
    onMessageHost?.(event.creator.id);
  };

  const handleOpenInMaps = () => {
    if (!event) return;

    let url = '';
    if (event.latitude && event.longitude) {
      // Use coordinates if available
      url = `https://maps.apple.com/?q=${event.latitude},${event.longitude}`;
    } else if (event.address || event.location) {
      // Use address/location if available
      const query = encodeURIComponent(
        [event.address, event.city, event.state, event.zipCode]
          .filter(Boolean)
          .join(', ') || event.location || ''
      );
      url = `https://maps.apple.com/?q=${query}`;
    }

    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open maps');
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const attendingCount = rsvps.filter(r => r.status === 'attending').length;

  const styles = getStyles(colors);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#222D99" />
          <Text style={styles.loadingText}>Loading event...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} />
          <Text style={styles.errorText}>Event not found</Text>
          <Pressable style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Event Details</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Image */}
        {event.imageUrl && (
          <Image source={{ uri: event.imageUrl }} style={styles.eventImage} resizeMode="cover" />
        )}

        {/* Event Info */}
        <View style={styles.infoSection}>
          <Text style={styles.eventTitle}>{event.title}</Text>

          {/* Community */}
          {event.community && (
            <View style={styles.communityBadge}>
              <Ionicons name="people" size={16} color="#222D99" />
              <Text style={styles.communityName}>{event.community.name}</Text>
            </View>
          )}

          {/* Date & Time */}
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
            <Text style={styles.metaText}>{formatDate(event.eventDate)}</Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={20} color={colors.textMuted} />
            <Text style={styles.metaText}>
              {formatTime(event.startTime)} - {formatTime(event.endTime)}
            </Text>
          </View>

          {/* Location */}
          {event.isVirtual ? (
            <View style={styles.metaRow}>
              <Ionicons name="videocam-outline" size={20} color={colors.textMuted} />
              <Text style={styles.metaText}>Virtual Event</Text>
            </View>
          ) : event.location ? (
            <Pressable style={styles.metaRow} onPress={handleOpenInMaps}>
              <Ionicons name="location-outline" size={20} color="#222D99" />
              <Text style={[styles.metaText, styles.linkText]}>
                {event.location}
                {event.city && `, ${event.city}`}
              </Text>
            </Pressable>
          ) : null}

          {/* Attendees */}
          <View style={styles.metaRow}>
            <Ionicons name="people-outline" size={20} color={colors.textMuted} />
            <Text style={styles.metaText}>
              {attendingCount} {attendingCount === 1 ? 'person' : 'people'} attending
            </Text>
          </View>

          {/* Description */}
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{event.description}</Text>

          {/* Virtual Meeting Link */}
          {event.isVirtual && event.virtualMeetingUrl && myRSVP?.status === 'attending' && (
            <View style={styles.virtualLinkContainer}>
              <Ionicons name="link" size={20} color="#222D99" />
              <Pressable
                onPress={() => {
                  if (event.virtualMeetingUrl) {
                    Linking.openURL(event.virtualMeetingUrl);
                  }
                }}
              >
                <Text style={styles.virtualLinkText}>Join Virtual Meeting</Text>
              </Pressable>
            </View>
          )}

          {/* Host */}
          {event.creator && (
            <>
              <Text style={styles.sectionTitle}>Host</Text>
              <View style={styles.hostContainer}>
                <Image
                  source={{ uri: event.creator.avatarUrl || 'https://via.placeholder.com/50' }}
                  style={styles.hostAvatar}
                />
                <View style={styles.hostInfo}>
                  <Text style={styles.hostName}>
                    {event.creator.displayName || event.creator.username}
                  </Text>
                  <Text style={styles.hostUsername}>@{event.creator.username}</Text>
                </View>
                <Pressable style={styles.messageButton} onPress={handleMessageHost}>
                  <Ionicons name="chatbubble-outline" size={20} color="#fff" />
                </Pressable>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* RSVP Button */}
      {user && (
        <View style={styles.footer}>
          {!showRSVPOptions ? (
            <Pressable
              style={[
                styles.rsvpButton,
                myRSVP?.status === 'attending' && styles.rsvpButtonAttending,
              ]}
              onPress={() => setShowRSVPOptions(true)}
            >
              <Text style={styles.rsvpButtonText}>
                {myRSVP?.status === 'attending'
                  ? '✓ Attending'
                  : myRSVP?.status === 'maybe'
                  ? 'Maybe'
                  : 'RSVP'}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.rsvpOptions}>
              <Pressable
                style={[styles.rsvpOption, styles.rsvpOptionAttending]}
                onPress={() => handleRSVP('attending')}
              >
                <Text style={styles.rsvpOptionText}>Attending</Text>
              </Pressable>
              <Pressable
                style={[styles.rsvpOption, styles.rsvpOptionMaybe]}
                onPress={() => handleRSVP('maybe')}
              >
                <Text style={styles.rsvpOptionText}>Maybe</Text>
              </Pressable>
              <Pressable
                style={[styles.rsvpOption, styles.rsvpOptionDecline]}
                onPress={() => handleRSVP('declined')}
              >
                <Text style={styles.rsvpOptionText}>Can't Go</Text>
              </Pressable>
              <Pressable
                style={styles.rsvpOptionCancel}
                onPress={() => setShowRSVPOptions(false)}
              >
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </Pressable>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    headerButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    content: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.textMuted,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    errorText: {
      marginTop: 16,
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    backButton: {
      marginTop: 24,
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: '#222D99',
      borderRadius: 20,
    },
    backButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
    eventImage: {
      width: '100%',
      height: 240,
      backgroundColor: colors.muted,
    },
    infoSection: {
      padding: 16,
    },
    eventTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 12,
    },
    communityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: '#EEF2FF',
      borderRadius: 16,
      marginBottom: 16,
    },
    communityName: {
      fontSize: 14,
      fontWeight: '600',
      color: '#222D99',
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    metaText: {
      fontSize: 15,
      color: colors.textMuted,
    },
    linkText: {
      color: '#222D99',
      textDecorationLine: 'underline',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 24,
      marginBottom: 12,
    },
    description: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textPrimary,
    },
    virtualLinkContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 16,
      padding: 16,
      backgroundColor: '#EEF2FF',
      borderRadius: 12,
    },
    virtualLinkText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#222D99',
      textDecorationLine: 'underline',
    },
    hostContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    hostAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    hostInfo: {
      flex: 1,
    },
    hostName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    hostUsername: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 2,
    },
    messageButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#222D99',
      justifyContent: 'center',
      alignItems: 'center',
    },
    footer: {
      padding: 16,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
    },
    rsvpButton: {
      backgroundColor: '#222D99',
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    rsvpButtonAttending: {
      backgroundColor: '#16A34A',
    },
    rsvpButtonText: {
      fontSize: 17,
      fontWeight: '700',
      color: '#fff',
    },
    rsvpOptions: {
      flexDirection: 'row',
      gap: 8,
    },
    rsvpOption: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    rsvpOptionAttending: {
      backgroundColor: '#16A34A',
    },
    rsvpOptionMaybe: {
      backgroundColor: '#D97706',
    },
    rsvpOptionDecline: {
      backgroundColor: '#DC2626',
    },
    rsvpOptionText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#fff',
    },
    rsvpOptionCancel: {
      width: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
