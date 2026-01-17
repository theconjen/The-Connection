/**
 * EventsScreen - Native React Native screen
 * Discover events with filters, categories, and featured events
 * Now with real API integration and RSVP functionality!
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Switch,
  StyleSheet,
} from 'react-native';
import { Text, Badge, useTheme } from '../theme';
import { AppHeader } from './AppHeader';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentLocationWithAddress, type UserLocation } from '../services/locationService';
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient, { communitiesAPI } from '../lib/apiClient';
import { queryClient } from '../../lib/queryClient';
import { useAuth } from '../contexts/AuthContext';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

// No custom icon components needed - using Ionicons directly

// Event Category type
interface EventCategory {
  id: string;
  title: string;
  count: string;
  iconName: string; // Ionicon name
  bgColor: string;
  accentColor: string;
  borderColor: string;
}

// Event type from API
export interface Event {
  id: number;
  title: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: string;
  longitude?: string;
  isVirtual: boolean;
  isPublic: boolean;
  virtualMeetingUrl?: string;
  creatorId: number;
  communityId?: number;
  groupId?: number;
  showOnMap?: boolean;
  createdAt?: string;
  updatedAt?: string;
  rsvpCount?: number;
  userRsvpStatus?: string | null;
}

// Filter pill component
function FilterPill({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  const { colors, spacing, radii } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        height: 28,
        paddingHorizontal: spacing.md,
        borderRadius: radii.full,
        backgroundColor: isActive ? colors.primary : colors.card,
        borderWidth: isActive ? 0 : 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {isActive && <Ionicons name="checkmark" size={12} color={colors.primaryForeground} />}
      <Text
        variant="caption"
        style={{
          color: isActive ? colors.primaryForeground : colors.mutedForeground,
          fontWeight: '500',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Category card component
function EventCategoryCard({ category, onPress }: { category: EventCategory; onPress?: () => void }) {
  const { spacing, radii } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: category.bgColor,
        borderWidth: 1,
        borderColor: category.borderColor,
        borderRadius: radii.xl,
        padding: spacing.sm + 2,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        }}
      >
        <Ionicons name={category.iconName as any} size={18} color={category.accentColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          variant="caption"
          style={{ fontWeight: '700', color: '#0B132B', lineHeight: 16 }}
        >
          {category.title}
        </Text>
        <Text style={{ fontSize: 10, color: category.accentColor, fontWeight: '500' }}>
          {category.count} events
        </Text>
      </View>
    </Pressable>
  );
}

// Event card component
function EventCard({
  event,
  onPress,
  onRsvp,
}: {
  event: Event;
  onPress?: () => void;
  onRsvp?: (eventId: number, status: string) => void;
}) {
  const { colors, spacing, radii } = useTheme();

  // Format date from ISO string
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get RSVP button color based on status
  const getRsvpColor = () => {
    if (event.userRsvpStatus === 'going') return colors.primary;
    if (event.userRsvpStatus === 'maybe') return '#F59E0B'; // Amber
    return colors.border;
  };

  // Get RSVP icon
  const getRsvpIcon = () => {
    if (event.userRsvpStatus === 'going') return 'checkmark-circle';
    if (event.userRsvpStatus === 'maybe') return 'help-circle';
    return 'checkmark-circle-outline';
  };

  // Determine icon color based on event type
  const iconColor = event.isVirtual ? '#3B82F6' : '#10B981';
  const bgColor = event.isVirtual ? '#E0E7FF' : '#D1FAE5';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.card,
        padding: spacing.md,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.sm,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
        opacity: pressed ? 0.95 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        {/* Date Box */}
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: radii.lg,
            backgroundColor: bgColor,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name={event.isVirtual ? 'videocam' : 'location'}
            size={24}
            color={iconColor}
          />
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              marginBottom: 2,
            }}
          >
            <Text
              variant="bodySmall"
              style={{ fontWeight: '700', color: colors.foreground, flex: 1 }}
              numberOfLines={1}
            >
              {event.title}
            </Text>
            {!event.isPublic && (
              <View
                style={{
                  backgroundColor: '#FEE2E2',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: radii.sm,
                }}
              >
                <Text
                  style={{
                    fontSize: 8,
                    fontWeight: '700',
                    color: '#DC2626',
                  }}
                >
                  PRIVATE
                </Text>
              </View>
            )}
          </View>

          <Text
            variant="caption"
            color="mutedForeground"
            numberOfLines={2}
            style={{ marginBottom: spacing.xs }}
          >
            {event.description}
          </Text>

          {/* Event Details */}
          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="calendar-outline" size={12} color={colors.mutedForeground} />
              <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                {formatDate(event.eventDate)}
              </Text>
              <Ionicons name="time-outline" size={12} color={colors.mutedForeground} />
              <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                {event.startTime}
              </Text>
            </View>
            {event.location && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="location-outline" size={12} color={colors.mutedForeground} />
                <Text style={{ fontSize: 11, color: colors.mutedForeground }} numberOfLines={1}>
                  {event.location}
                </Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="people-outline" size={12} color={colors.mutedForeground} />
              <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                {event.rsvpCount || 0} attending
              </Text>
            </View>
          </View>

          {/* RSVP Button */}
          {onRsvp && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                const nextStatus = event.userRsvpStatus === 'going' ? 'not_going' : 'going';
                onRsvp(event.id, nextStatus);
              }}
              style={{
                marginTop: spacing.sm,
                paddingVertical: 6,
                paddingHorizontal: 12,
                backgroundColor: getRsvpColor(),
                borderRadius: radii.md,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                alignSelf: 'flex-start',
              }}
            >
              <Ionicons
                name={getRsvpIcon()}
                size={14}
                color={event.userRsvpStatus ? colors.primaryForeground : colors.mutedForeground}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: event.userRsvpStatus ? colors.primaryForeground : colors.mutedForeground,
                }}
              >
                {event.userRsvpStatus === 'going' ? 'Going' : event.userRsvpStatus === 'maybe' ? 'Maybe' : 'RSVP'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

// Main screen props
interface EventsScreenProps {
  showCenteredLogo?: boolean;
  onProfilePress?: () => void;
  onMenuPress?: () => void;
  onSearchPress?: () => void;
  onCreatePress?: () => void;
  onEventPress?: (event: Event) => void;
  onCategoryPress?: (category: EventCategory) => void;
  onSettingsPress?: () => void;
  onMessagesPress?: () => void;
  userName?: string;
  userAvatar?: string;
}

export function EventsScreen({
  showCenteredLogo = false,
  onProfilePress,
  onMenuPress,
  onSearchPress,
  onCreatePress,
  onEventPress,
  onCategoryPress,
  onSettingsPress,
  onMessagesPress,
  userName = 'User',
  userAvatar,
}: EventsScreenProps) {
  const { colors, spacing, radii, colorScheme } = useTheme();
  const { user } = useAuth();
  const [activeFilters, setActiveFilters] = useState<string[]>(['This Week']);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [showCommunities, setShowCommunities] = useState(true);

  // Create Event Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventStartTime, setNewEventStartTime] = useState('12:00');
  const [newEventEndTime, setNewEventEndTime] = useState('13:00');
  const [isInPerson, setIsInPerson] = useState(true);
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventAddress, setNewEventAddress] = useState('');
  const [newEventCity, setNewEventCity] = useState('');
  const [newEventState, setNewEventState] = useState('');
  const [newEventZipCode, setNewEventZipCode] = useState('');
  const [newEventVirtualUrl, setNewEventVirtualUrl] = useState('');
  const [isPublicEvent, setIsPublicEvent] = useState(true);
  const [selectedCommunityId, setSelectedCommunityId] = useState<number | null>(null);
  const [showCommunityPicker, setShowCommunityPicker] = useState(false);

  // Fetch admin communities (where user is owner or moderator)
  const { data: adminCommunities = [] } = useQuery<Array<any>>({
    queryKey: ['/api/communities/admin'],
    queryFn: async () => {
      if (!user) return [];
      const response = await apiClient.get('/api/communities/admin');
      return response.data;
    },
    enabled: !!user,
  });

  // Check if user can create events (app admin OR community admin)
  const canCreateEvents = user?.isAdmin || (adminCommunities && adminCommunities.length > 0);

  // Request location permissions when map view is selected
  useEffect(() => {
    if (viewMode === 'map') {
      requestLocationPermission();
    }
  }, [viewMode]);

  const requestLocationPermission = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');

      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: '',
          city: '',
          state: '',
          zipCode: ''
        });
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLocationPermission(false);
    } finally {
      setLoadingLocation(false);
    }
  };

  // Fetch events from API
  const { data: events = [], isLoading, refetch } = useQuery<Event[]>({
    queryKey: ['/api/events', searchQuery, locationFilter],
    queryFn: async () => {
      let endpoint = '/api/events';
      const params = new URLSearchParams();

      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (locationFilter) {
        params.append('city', locationFilter);
      }

      const queryString = params.toString();
      if (queryString) {
        endpoint += `?${queryString}`;
      }

      const response = await apiClient.get(endpoint);
      let eventsData = response.data;

      // Filter out virtual events (only show in-person events)
      eventsData = eventsData.filter((event: Event) => !event.isVirtual);

      // Fetch RSVP status for each event if user is logged in
      if (user) {
        const eventsWithRsvp = await Promise.all(
          eventsData.map(async (event: Event) => {
            try {
              const rsvpResponse = await apiClient.get(`/api/events/${event.id}/rsvp`);
              const userRsvp = rsvpResponse.data;
              return {
                ...event,
                userRsvpStatus: userRsvp ? userRsvp.status : null,
              };
            } catch (error) {
              // User hasn't RSVP'd to this event
              return { ...event, userRsvpStatus: null };
            }
          })
        );
        return eventsWithRsvp;
      }

      return eventsData;
    },
  });

  // Fetch public communities with locations for the map
  const { data: communities = [] } = useQuery<any[]>({
    queryKey: ['/api/communities/map'],
    queryFn: async () => {
      try {
        const allCommunities = await communitiesAPI.getAll();
        // Only return public communities with latitude/longitude
        if (!Array.isArray(allCommunities)) {
          console.error('Communities response is not an array:', allCommunities);
          return [];
        }
        return allCommunities.filter((c: any) =>
          !c.isPrivate && c.latitude && c.longitude
        );
      } catch (error) {
        console.error('Error fetching communities for map:', error);
        return [];
      }
    },
    enabled: viewMode === 'map' && showCommunities,
  });

  // RSVP mutation
  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: number; status: string }) => {
      // Check if user already has RSVP for this event
      const event = events.find((e) => e.id === eventId);

      if (event?.userRsvpStatus) {
        // Update existing RSVP
        const response = await apiClient.patch(`/api/events/${eventId}/rsvp`, { status });
        return response.data;
      } else {
        // Create new RSVP
        const response = await apiClient.post(`/api/events/${eventId}/rsvp`, { status });
        return response.data;
      }
    },
    onMutate: async ({ eventId, status }) => {
      // Optimistic update
      queryClient.setQueryData(['/api/events', searchQuery, locationFilter], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((event: Event) =>
          event.id === eventId
            ? {
                ...event,
                userRsvpStatus: status === 'not_going' ? null : status,
                rsvpCount:
                  status === 'going' && !event.userRsvpStatus
                    ? (event.rsvpCount || 0) + 1
                    : status === 'not_going' && event.userRsvpStatus === 'going'
                    ? Math.max((event.rsvpCount || 0) - 1, 0)
                    : event.rsvpCount,
              }
            : event
        );
      });
    },
    onSuccess: () => {
      // Refresh events after RSVP
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to update RSVP. Please try again.');
      console.error('RSVP error:', error);
      // Revert optimistic update
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    },
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: {
      title: string;
      description: string;
      eventDate: string;
      startTime: string;
      endTime: string;
      isVirtual: boolean;
      location?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      virtualMeetingUrl?: string;
      isPublic: boolean;
      communityId: number;
    }) => {
      const response = await apiClient.post('/api/events', eventData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      Alert.alert('Success', 'Event created successfully!');
      setShowCreateModal(false);
      // Reset form
      setNewEventTitle('');
      setNewEventDescription('');
      setNewEventDate(new Date().toISOString().split('T')[0]);
      setNewEventStartTime('12:00');
      setNewEventEndTime('13:00');
      setIsInPerson(true);
      setNewEventLocation('');
      setNewEventAddress('');
      setNewEventCity('');
      setNewEventState('');
      setNewEventZipCode('');
      setNewEventVirtualUrl('');
      setIsPublicEvent(true);
      setSelectedCommunityId(null);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create event');
      console.error('Create event error:', error);
    },
  });

  const handleCreateEvent = () => {
    if (!selectedCommunityId) {
      Alert.alert('Validation Error', 'Please select a community for this event');
      return;
    }
    if (!newEventTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter an event title');
      return;
    }
    if (!newEventDescription.trim()) {
      Alert.alert('Validation Error', 'Please enter an event description');
      return;
    }
    if (isInPerson && !newEventLocation.trim()) {
      Alert.alert('Validation Error', 'Please enter a location name for in-person events');
      return;
    }
    if (!isInPerson && !newEventVirtualUrl.trim()) {
      Alert.alert('Validation Error', 'Please enter a virtual meeting URL for online events');
      return;
    }

    createEventMutation.mutate({
      title: newEventTitle,
      description: newEventDescription,
      eventDate: newEventDate,
      startTime: newEventStartTime,
      endTime: newEventEndTime,
      isVirtual: !isInPerson,
      location: isInPerson ? newEventLocation : undefined,
      address: isInPerson ? newEventAddress : undefined,
      city: isInPerson ? newEventCity : undefined,
      state: isInPerson ? newEventState : undefined,
      zipCode: isInPerson ? newEventZipCode : undefined,
      virtualMeetingUrl: !isInPerson ? newEventVirtualUrl : undefined,
      isPublic: isPublicEvent,
      communityId: selectedCommunityId,
    });
  };

  const getUserLocation = async () => {
    setLoadingLocation(true);
    try {
      const location = await getCurrentLocationWithAddress();
      if (location) {
        setUserLocation(location);
        // Auto-fill location filter with user's city
        if (location.city) {
          setLocationFilter(location.city);
        }
      } else {
        console.warn('Location service not available or permission denied');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      // Silently fail - location is optional
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleRsvp = (eventId: number, status: string) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to RSVP to events.');
      return;
    }
    rsvpMutation.mutate({ eventId, status });
  };

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  const filterOptions = [
    'This Week',
    'This Month',
    'All Events',
    'In-Person',
    'Online',
    'Free',
    'Paid',
  ];

  const isDark = colorScheme === 'dark';

  const categories: EventCategory[] = [
    {
      id: 'worship',
      title: 'Worship',
      count: '18',
      iconName: 'musical-notes-outline',
      bgColor: isDark ? '#1E3A5F' : '#F0F9FF',
      accentColor: isDark ? '#60A5FA' : '#0284C7',
      borderColor: isDark ? '#2563EB' : '#E0F2FE',
    },
    {
      id: 'bible-study',
      title: 'Bible Study',
      count: '24',
      iconName: 'book-outline',
      bgColor: isDark ? '#422006' : '#FEF3C7',
      accentColor: isDark ? '#FCD34D' : '#D97706',
      borderColor: isDark ? '#92400E' : '#FDE68A',
    },
    {
      id: 'social',
      title: 'Social',
      count: '32',
      iconName: 'cafe-outline',
      bgColor: isDark ? '#022C22' : '#ECFDF5',
      accentColor: isDark ? '#34D399' : '#059669',
      borderColor: isDark ? '#065F46' : '#D1FAE5',
    },
    {
      id: 'outreach',
      title: 'Outreach',
      count: '12',
      iconName: 'heart-outline',
      bgColor: isDark ? '#500724' : '#FDF2F8',
      accentColor: isDark ? '#F472B6' : '#DB2777',
      borderColor: isDark ? '#9F1239' : '#FCE7F3',
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.header }} edges={['top']}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.surface }}
        contentContainerStyle={{ paddingBottom: 80 }}
        stickyHeaderIndices={[1]}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {/* App Header */}
        <AppHeader
          showCenteredLogo={true}
          userName={userName}
          userAvatar={userAvatar}
          onProfilePress={onProfilePress}
          showMessages={true}
          onMessagesPress={onMessagesPress}
          showMenu={true}
          onMenuPress={onMenuPress}
        />

        {/* Search and Filters Section */}
        <View
          style={{
            backgroundColor: colors.card,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            gap: spacing.md,
          }}
        >
          {/* Search and Location Inputs */}
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {/* Search Input */}
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.muted,
                  borderRadius: radii.lg,
                  paddingHorizontal: spacing.md,
                  height: 40,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="search" size={18} color={colors.mutedForeground} />
                <TextInput
                  style={{
                    flex: 1,
                    marginLeft: spacing.sm,
                    fontSize: 14,
                    color: colors.foreground,
                  }}
                  placeholder="Search events..."
                  placeholderTextColor={colors.mutedForeground}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            {/* Location Filter */}
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.muted,
                  borderRadius: radii.lg,
                  paddingHorizontal: spacing.md,
                  height: 40,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                {loadingLocation ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Pressable onPress={getUserLocation}>
                    <Ionicons name="location-outline" size={18} color={colors.primary} />
                  </Pressable>
                )}
                <TextInput
                  style={{
                    flex: 1,
                    marginLeft: spacing.sm,
                    fontSize: 14,
                    color: colors.foreground,
                  }}
                  placeholder="Filter by city..."
                  placeholderTextColor={colors.mutedForeground}
                  value={locationFilter}
                  onChangeText={setLocationFilter}
                />
                {locationFilter.length > 0 && (
                  <Pressable onPress={() => setLocationFilter('')}>
                    <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
                  </Pressable>
                )}
              </View>
            </View>
          </View>

          {/* List/Map Toggle */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              gap: spacing.xs,
            }}
          >
            <Pressable
              onPress={() => setViewMode('list')}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                borderRadius: radii.md,
                backgroundColor: viewMode === 'list' ? colors.primary : colors.card,
                borderWidth: 1,
                borderColor: viewMode === 'list' ? colors.primary : colors.border,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Ionicons
                name="list"
                size={16}
                color={viewMode === 'list' ? colors.primaryForeground : colors.foreground}
              />
              <Text
                variant="caption"
                style={{
                  fontWeight: '600',
                  color: viewMode === 'list' ? colors.primaryForeground : colors.foreground,
                }}
              >
                List
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setViewMode('map')}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                borderRadius: radii.md,
                backgroundColor: viewMode === 'map' ? colors.primary : colors.card,
                borderWidth: 1,
                borderColor: viewMode === 'map' ? colors.primary : colors.border,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Ionicons
                name="map"
                size={16}
                color={viewMode === 'map' ? colors.primaryForeground : colors.foreground}
              />
              <Text
                variant="caption"
                style={{
                  fontWeight: '600',
                  color: viewMode === 'map' ? colors.primaryForeground : colors.foreground,
                }}
              >
                Map
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Filter Bar - Sticky */}
        <View
          style={{
            backgroundColor: colors.background,
            paddingVertical: spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: spacing.lg,
              gap: spacing.sm,
              alignItems: 'center',
            }}
          >
            {/* Filters Button */}
            <Pressable
              style={({ pressed }) => ({
                height: 28,
                paddingHorizontal: spacing.md,
                borderRadius: radii.full,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Ionicons name="options-outline" size={14} color={colors.foreground} />
              <Text variant="caption" style={{ fontWeight: '500' }}>
                Filters
              </Text>
            </Pressable>

            {/* Divider */}
            <View
              style={{
                width: 1,
                height: 16,
                backgroundColor: colors.border,
              }}
            />

            {/* Filter Pills */}
            {filterOptions.map((filter) => (
              <FilterPill
                key={filter}
                label={filter}
                isActive={activeFilters.includes(filter)}
                onPress={() => toggleFilter(filter)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Conditional Content: List or Map */}
        {viewMode === 'map' ? (
          /* Map View */
          <View
            style={{
              flex: 1,
              marginHorizontal: spacing.lg,
              marginTop: spacing.lg,
              borderRadius: radii.xl,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: colors.border,
              minHeight: 400,
            }}
          >
            {loadingLocation ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.muted }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text variant="body" style={{ marginTop: spacing.md, color: colors.mutedForeground }}>
                  Requesting location permissions...
                </Text>
              </View>
            ) : locationPermission === false ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.muted, padding: spacing.xl }}>
                <Ionicons name="location-outline" size={48} color={colors.mutedForeground} />
                <Text variant="body" style={{ fontWeight: '600', color: colors.foreground, marginTop: spacing.md, textAlign: 'center' }}>
                  Location Permission Denied
                </Text>
                <Text variant="bodySmall" style={{ color: colors.mutedForeground, marginTop: spacing.sm, textAlign: 'center' }}>
                  Please enable location permissions in your device settings to view events on the map.
                </Text>
                <Pressable
                  onPress={requestLocationPermission}
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.md,
                    borderRadius: radii.md,
                    marginTop: spacing.lg,
                  }}
                >
                  <Text variant="body" style={{ color: colors.primaryForeground, fontWeight: '600' }}>
                    Request Permission
                  </Text>
                </Pressable>
              </View>
            ) : userLocation ? (
              <>
                {/* Map Toggle for Communities */}
                <View style={{
                  position: 'absolute',
                  top: spacing.md,
                  right: spacing.md,
                  zIndex: 10,
                  backgroundColor: colors.card,
                  borderRadius: radii.md,
                  padding: spacing.md,
                  shadowColor: '#000',
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 3,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}>
                  <Ionicons name="people" size={18} color={colors.foreground} />
                  <Text variant="bodySmall" style={{ fontWeight: '600' }}>
                    Communities
                  </Text>
                  <Switch
                    value={showCommunities}
                    onValueChange={setShowCommunities}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={showCommunities ? colors.primaryForeground : colors.mutedForeground}
                  />
                </View>

                <MapView
                  style={{ flex: 1 }}
                  provider={PROVIDER_GOOGLE}
                  initialRegion={{
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    latitudeDelta: 0.2,
                    longitudeDelta: 0.2,
                  }}
                  showsUserLocation
                  showsMyLocationButton
                >
                  {/* Event Markers */}
                  {events
                    .filter(event => event.latitude && event.longitude)
                    .map(event => (
                      <Marker
                        key={`event-${event.id}`}
                        coordinate={{
                          latitude: parseFloat(event.latitude!),
                          longitude: parseFloat(event.longitude!),
                        }}
                        title={event.title}
                        description={`${new Date(event.eventDate).toLocaleDateString()} at ${event.startTime}`}
                        pinColor="#4A90E2"
                      />
                    ))}

                  {/* Community Markers */}
                  {showCommunities && communities.map(community => (
                    <Marker
                      key={`community-${community.id}`}
                      coordinate={{
                        latitude: parseFloat(community.latitude),
                        longitude: parseFloat(community.longitude),
                      }}
                      title={community.name}
                      description={community.description || 'Community'}
                      pinColor="#10B981"
                    />
                  ))}
                </MapView>
              </>
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.muted, padding: spacing.xl }}>
                <Ionicons name="map-outline" size={48} color={colors.mutedForeground} />
                <Text variant="body" style={{ fontWeight: '600', color: colors.foreground, marginTop: spacing.md, textAlign: 'center' }}>
                  Loading Map...
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* List View */
          <>
            {/* Categories Section */}
            <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xs,
                  marginBottom: spacing.sm,
                }}
              >
                <Ionicons name="grid-outline" size={16} color="#4A90E2" />
                <Text variant="bodySmall" style={{ fontWeight: '700' }}>
                  Event Categories
                </Text>
              </View>

          {/* 2x2 Grid */}
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <EventCategoryCard category={categories[0]} onPress={() => onCategoryPress?.(categories[0])} />
              <EventCategoryCard category={categories[1]} onPress={() => onCategoryPress?.(categories[1])} />
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <EventCategoryCard category={categories[2]} onPress={() => onCategoryPress?.(categories[2])} />
              <EventCategoryCard category={categories[3]} onPress={() => onCategoryPress?.(categories[3])} />
            </View>
          </View>
        </View>

        {/* Upcoming Events Section */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.sm,
            }}
          >
            <Text variant="bodySmall" style={{ fontWeight: '700' }}>
              Upcoming Events
            </Text>
            <Pressable>
              <Text
                variant="caption"
                style={{ color: colors.secondary, fontWeight: '500' }}
              >
                View all
              </Text>
            </Pressable>
          </View>

          {/* Event List */}
          <View>
            {isLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text
                  variant="bodySmall"
                  color="mutedForeground"
                  style={{ marginTop: spacing.md }}
                >
                  Loading events...
                </Text>
              </View>
            ) : events.length === 0 ? (
              <View
                style={{
                  alignItems: 'center',
                  paddingVertical: spacing.xl * 2,
                  paddingHorizontal: spacing.lg,
                }}
              >
                <Ionicons name="calendar-outline" size={64} color={colors.mutedForeground} />
                <Text
                  variant="body"
                  style={{
                    fontWeight: '600',
                    marginTop: spacing.md,
                    textAlign: 'center',
                  }}
                >
                  No Events Found
                </Text>
                <Text
                  variant="bodySmall"
                  color="mutedForeground"
                  style={{ marginTop: spacing.sm, textAlign: 'center' }}
                >
                  {searchQuery || locationFilter
                    ? 'Try adjusting your search or filters.'
                    : 'Check back later for upcoming events.'}
                </Text>
              </View>
            ) : (
              events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onPress={() => onEventPress?.(event)}
                  onRsvp={handleRsvp}
                />
              ))
            )}
          </View>
        </View>
          </>
        )}
      </ScrollView>

      {/* Create Event Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Pressable onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </Pressable>
              <Text variant="body" style={{ fontWeight: '700' }}>
                Create Event
              </Text>
              <Pressable
                onPress={handleCreateEvent}
                disabled={createEventMutation.isPending}
              >
                <Text
                  style={{
                    color: createEventMutation.isPending ? colors.mutedForeground : colors.primary,
                    fontWeight: '600',
                  }}
                >
                  {createEventMutation.isPending ? 'Creating...' : 'Create'}
                </Text>
              </Pressable>
            </View>

            {/* Form */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg }}>
              {/* Community Selection */}
              <View style={{ marginBottom: spacing.lg }}>
                <Text variant="bodySmall" style={{ fontWeight: '600', marginBottom: spacing.xs }}>
                  Community *
                </Text>
                <Pressable
                  onPress={() => setShowCommunityPicker(!showCommunityPicker)}
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radii.lg,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm + 2,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: selectedCommunityId
                        ? colors.foreground
                        : colors.mutedForeground,
                    }}
                  >
                    {selectedCommunityId
                      ? adminCommunities.find((c) => c.id === selectedCommunityId)?.name
                      : 'Select a community'}
                  </Text>
                  <Ionicons
                    name={showCommunityPicker ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.mutedForeground}
                  />
                </Pressable>

                {/* Community Picker Dropdown */}
                {showCommunityPicker && (
                  <View
                    style={{
                      marginTop: spacing.xs,
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: radii.lg,
                      maxHeight: 200,
                    }}
                  >
                    <ScrollView>
                      {adminCommunities.map((community) => (
                        <Pressable
                          key={community.id}
                          onPress={() => {
                            setSelectedCommunityId(community.id);
                            setShowCommunityPicker(false);
                          }}
                          style={({ pressed }) => ({
                            paddingHorizontal: spacing.md,
                            paddingVertical: spacing.sm + 2,
                            backgroundColor: pressed ? colors.muted : 'transparent',
                            borderBottomWidth: 1,
                            borderBottomColor: colors.border,
                          })}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                            <View>
                              <Text style={{ fontSize: 14, fontWeight: '500' }}>
                                {community.name}
                              </Text>
                              <Text
                                variant="caption"
                                color="mutedForeground"
                                style={{ textTransform: 'capitalize' }}
                              >
                                {community.role}
                              </Text>
                            </View>
                            {selectedCommunityId === community.id && (
                              <Ionicons
                                name="checkmark-circle"
                                size={20}
                                color={colors.primary}
                                style={{ marginLeft: 'auto' }}
                              />
                            )}
                          </View>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Event Title */}
              <View style={{ marginBottom: spacing.lg }}>
                <Text variant="bodySmall" style={{ fontWeight: '600', marginBottom: spacing.xs }}>
                  Event Title *
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radii.lg,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm + 2,
                    fontSize: 14,
                    color: colors.foreground,
                  }}
                  placeholder="Enter event title"
                  placeholderTextColor={colors.mutedForeground}
                  value={newEventTitle}
                  onChangeText={setNewEventTitle}
                />
              </View>

              {/* Event Description */}
              <View style={{ marginBottom: spacing.lg }}>
                <Text variant="bodySmall" style={{ fontWeight: '600', marginBottom: spacing.xs }}>
                  Description *
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radii.lg,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm + 2,
                    fontSize: 14,
                    color: colors.foreground,
                    minHeight: 100,
                    textAlignVertical: 'top',
                  }}
                  placeholder="Describe your event"
                  placeholderTextColor={colors.mutedForeground}
                  value={newEventDescription}
                  onChangeText={setNewEventDescription}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Date */}
              <View style={{ marginBottom: spacing.lg }}>
                <Text variant="bodySmall" style={{ fontWeight: '600', marginBottom: spacing.xs }}>
                  Date *
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radii.lg,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm + 2,
                    fontSize: 14,
                    color: colors.foreground,
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.mutedForeground}
                  value={newEventDate}
                  onChangeText={setNewEventDate}
                />
              </View>

              {/* Start Time & End Time */}
              <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
                <View style={{ flex: 1 }}>
                  <Text variant="bodySmall" style={{ fontWeight: '600', marginBottom: spacing.xs }}>
                    Start Time *
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: radii.lg,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm + 2,
                      fontSize: 14,
                      color: colors.foreground,
                    }}
                    placeholder="HH:MM"
                    placeholderTextColor={colors.mutedForeground}
                    value={newEventStartTime}
                    onChangeText={setNewEventStartTime}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodySmall" style={{ fontWeight: '600', marginBottom: spacing.xs }}>
                    End Time *
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: radii.lg,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm + 2,
                      fontSize: 14,
                      color: colors.foreground,
                    }}
                    placeholder="HH:MM"
                    placeholderTextColor={colors.mutedForeground}
                    value={newEventEndTime}
                    onChangeText={setNewEventEndTime}
                  />
                </View>
              </View>

              {/* In-Person Toggle */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: spacing.lg,
                  paddingVertical: spacing.sm,
                }}
              >
                <View>
                  <Text variant="bodySmall" style={{ fontWeight: '600' }}>
                    In-Person Event
                  </Text>
                  <Text variant="caption" color="mutedForeground">
                    Turn off for virtual events
                  </Text>
                </View>
                <Switch
                  value={isInPerson}
                  onValueChange={setIsInPerson}
                  trackColor={{ false: colors.muted, true: colors.primary }}
                  thumbColor={colors.card}
                />
              </View>

              {/* Conditional Fields: In-Person */}
              {isInPerson ? (
                <>
                  {/* Location Name */}
                  <View style={{ marginBottom: spacing.lg }}>
                    <Text variant="bodySmall" style={{ fontWeight: '600', marginBottom: spacing.xs }}>
                      Location Name *
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: colors.card,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: radii.lg,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm + 2,
                        fontSize: 14,
                        color: colors.foreground,
                      }}
                      placeholder="e.g., Grace Community Church"
                      placeholderTextColor={colors.mutedForeground}
                      value={newEventLocation}
                      onChangeText={setNewEventLocation}
                    />
                  </View>

                  {/* Street Address */}
                  <View style={{ marginBottom: spacing.lg }}>
                    <Text variant="bodySmall" style={{ fontWeight: '600', marginBottom: spacing.xs }}>
                      Street Address
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: colors.card,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: radii.lg,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm + 2,
                        fontSize: 14,
                        color: colors.foreground,
                      }}
                      placeholder="123 Main St"
                      placeholderTextColor={colors.mutedForeground}
                      value={newEventAddress}
                      onChangeText={setNewEventAddress}
                    />
                  </View>

                  {/* City, State, Zip */}
                  <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
                    <View style={{ flex: 2 }}>
                      <Text variant="bodySmall" style={{ fontWeight: '600', marginBottom: spacing.xs }}>
                        City
                      </Text>
                      <TextInput
                        style={{
                          backgroundColor: colors.card,
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: radii.lg,
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.sm + 2,
                          fontSize: 14,
                          color: colors.foreground,
                        }}
                        placeholder="City"
                        placeholderTextColor={colors.mutedForeground}
                        value={newEventCity}
                        onChangeText={setNewEventCity}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodySmall" style={{ fontWeight: '600', marginBottom: spacing.xs }}>
                        State
                      </Text>
                      <TextInput
                        style={{
                          backgroundColor: colors.card,
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: radii.lg,
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.sm + 2,
                          fontSize: 14,
                          color: colors.foreground,
                        }}
                        placeholder="ST"
                        placeholderTextColor={colors.mutedForeground}
                        value={newEventState}
                        onChangeText={setNewEventState}
                        maxLength={2}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodySmall" style={{ fontWeight: '600', marginBottom: spacing.xs }}>
                        Zip
                      </Text>
                      <TextInput
                        style={{
                          backgroundColor: colors.card,
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: radii.lg,
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.sm + 2,
                          fontSize: 14,
                          color: colors.foreground,
                        }}
                        placeholder="12345"
                        placeholderTextColor={colors.mutedForeground}
                        value={newEventZipCode}
                        onChangeText={setNewEventZipCode}
                        keyboardType="numeric"
                        maxLength={5}
                      />
                    </View>
                  </View>
                </>
              ) : (
                /* Virtual Event URL */
                <View style={{ marginBottom: spacing.lg }}>
                  <Text variant="bodySmall" style={{ fontWeight: '600', marginBottom: spacing.xs }}>
                    Virtual Meeting URL *
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: radii.lg,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm + 2,
                      fontSize: 14,
                      color: colors.foreground,
                    }}
                    placeholder="https://zoom.us/j/..."
                    placeholderTextColor={colors.mutedForeground}
                    value={newEventVirtualUrl}
                    onChangeText={setNewEventVirtualUrl}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                </View>
              )}

              {/* Public Event Toggle */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: spacing.xl,
                  paddingVertical: spacing.sm,
                }}
              >
                <View>
                  <Text variant="bodySmall" style={{ fontWeight: '600' }}>
                    Public Event
                  </Text>
                  <Text variant="caption" color="mutedForeground">
                    Anyone can see and join
                  </Text>
                </View>
                <Switch
                  value={isPublicEvent}
                  onValueChange={setIsPublicEvent}
                  trackColor={{ false: colors.muted, true: colors.primary }}
                  thumbColor={colors.card}
                />
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
