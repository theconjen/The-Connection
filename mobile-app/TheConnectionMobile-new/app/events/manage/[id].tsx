/**
 * Manage Event Screen (Host-Only)
 * Three tabs: Details (edit), RSVPs (attendees), Settings (cancel)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  Switch,
  Image,
  FlatList,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsAPI } from '../../../src/lib/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import { isHost } from '../../../src/lib/eventHelpers';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

type TabType = 'details' | 'rsvps' | 'settings';

// Event type categories
const EVENT_CATEGORIES = [
  'Sunday Service',
  'Worship',
  'Bible Study',
  'Prayer Meeting',
  'Youth Group',
  'Small Group',
  'Fellowship',
  'Outreach',
  'Conference',
  'Workshop',
  'Activity',
  'Other',
] as const;

type EventCategory = typeof EVENT_CATEGORIES[number];

interface RsvpUser {
  id: number;
  username: string;
  displayName?: string;
  avatarUrl?: string | null;
  rsvpAt: string;
}

interface RsvpsManageResponse {
  going: RsvpUser[];
  maybe: RsvpUser[];
  notGoing: RsvpUser[];
  counts: {
    going: number;
    maybe: number;
    notGoing: number;
    total: number;
  };
}

interface LocationSuggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
}

async function searchLocations(query: string): Promise<LocationSuggestion[]> {
  if (!query.trim() || query.length < 3) return [];

  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=5&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'TheConnectionApp/1.0',
        },
      }
    );
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.warn('[Geocoding] Failed to search locations:', error);
    return [];
  }
}

export default function ManageEventScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams() as { id: string };
  const eventId = parseInt(id || '0');
  const { colors, colorScheme } = useTheme();
  const { user } = useAuth();

  // Check if eventId is valid
  const isValidEventId = eventId > 0 && !isNaN(eventId);
  const styles = getStyles(colors, colorScheme);

  // Active tab
  const [activeTab, setActiveTab] = useState<TabType>('details');

  // Fetch event data
  const { data: event, isLoading: eventLoading, error: eventError } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsAPI.getById(eventId),
    enabled: !!eventId,
  });

  // Fetch RSVPs (host only)
  const { data: rsvpsData, isLoading: rsvpsLoading } = useQuery<RsvpsManageResponse>({
    queryKey: ['event-rsvps-manage', eventId],
    queryFn: () => eventsAPI.getRsvpsManage(eventId),
    enabled: !!eventId && activeTab === 'rsvps',
  });

  // Form state (Details tab)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('Sunday Service');
  const [location, setLocation] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  // Date and time state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Initialize form with event data
  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      setCategory((event.category as EventCategory) || 'Sunday Service');
      setLocation(event.location || '');
      setIsPublic(event.isPublic !== false);

      // Parse date
      if (event.eventDate) {
        const dateStr = event.eventDate.split('T')[0];
        const [year, month, day] = dateStr.split('-').map(Number);
        setSelectedDate(new Date(year, month - 1, day));
      }

      // Parse time
      if (event.startTime) {
        const [hours, minutes] = event.startTime.split(':').map(Number);
        const timeDate = new Date();
        timeDate.setHours(hours, minutes, 0, 0);
        setSelectedTime(timeDate);
      }
    }
  }, [event]);

  // Debounced location search
  useEffect(() => {
    if (!location.trim() || location.length < 3 || selectedLocation) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLocations(true);
      const results = await searchLocations(location);
      setLocationSuggestions(results);
      setShowLocationSuggestions(results.length > 0);
      setIsSearchingLocations(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [location, selectedLocation]);

  // Check host permission
  const userIsHost = isHost(event, user?.id);

  // Dev-only debug log
  useEffect(() => {
    if (__DEV__ && event) {
      console.info('[ManageEvent] Host check:', {
        viewerId: user?.id,
        hostUserId: event.hostUserId,
        'host.id': event.host?.id,
        creatorId: event.creatorId,
        isHost: userIsHost,
      });
    }
  }, [event, user?.id, userIsHost]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => eventsAPI.update(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['events', 'my'] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      Alert.alert('Success', 'Event updated!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to update event';
      Alert.alert('Error', message);
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: () => eventsAPI.cancel(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['events', 'my'] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      Alert.alert('Event Cancelled', 'The event has been cancelled and attendees have been notified.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to cancel event';
      Alert.alert('Error', message);
    },
  });

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Description is required');
      return;
    }

    // Format date as YYYY-MM-DD
    const eventDate = selectedDate.toISOString().slice(0, 10);

    // Format time as HH:MM:SS
    const hours = selectedTime.getHours().toString().padStart(2, '0');
    const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
    const startTime = `${hours}:${minutes}:00`;

    // Use coordinates from selected location suggestion, or preserve existing if location unchanged
    let latitude: number | undefined;
    let longitude: number | undefined;

    if (selectedLocation) {
      // User selected a new location from suggestions
      latitude = parseFloat(selectedLocation.lat);
      longitude = parseFloat(selectedLocation.lon);
    } else if (location.trim() && location !== event?.location) {
      // Location text changed but no suggestion selected - try to geocode
      try {
        const results = await searchLocations(location.trim());
        if (results.length > 0) {
          latitude = parseFloat(results[0].lat);
          longitude = parseFloat(results[0].lon);
        }
      } catch (error) {
        console.warn('[ManageEvent] Geocoding error:', error);
      }
    } else if (location.trim() === event?.location && event?.latitude && event?.longitude) {
      // Location unchanged - preserve existing coordinates
      latitude = typeof event.latitude === 'string' ? parseFloat(event.latitude) : event.latitude;
      longitude = typeof event.longitude === 'string' ? parseFloat(event.longitude) : event.longitude;
    }

    updateMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      category, // Event type: Sunday Service, Worship, Bible Study, etc.
      location: location.trim() || undefined,
      latitude,
      longitude,
      eventDate,
      startTime,
      endTime: startTime,
      isPublic,
    });
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Event',
      'Are you sure you want to cancel this event? All attendees will be notified and the event will be permanently deleted.',
      [
        { text: 'No, Keep Event', style: 'cancel' },
        {
          text: 'Yes, Cancel Event',
          style: 'destructive',
          onPress: () => cancelMutation.mutate(),
        },
      ]
    );
  };

  const handleLocationChange = (text: string) => {
    setLocation(text);
    setSelectedLocation(null);
  };

  const handleSelectLocation = (suggestion: LocationSuggestion) => {
    setSelectedLocation(suggestion);
    setLocation(suggestion.display_name);
    setShowLocationSuggestions(false);
    setLocationSuggestions([]);
    Keyboard.dismiss(); // Dismiss keyboard after selecting location
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Invalid event ID
  if (!isValidEventId) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={styles.errorText}>Invalid event</Text>
        {__DEV__ && (
          <Text style={{ color: colors.textMuted, marginTop: 5, fontSize: 12 }}>
            id param: "{id}", parsed eventId: {eventId}
          </Text>
        )}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Loading state
  if (eventLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading event...</Text>
      </View>
    );
  }

  // Error state
  if (eventError || !event) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={styles.errorText}>Event not found</Text>
        {__DEV__ && (
          <Text style={{ color: colors.textMuted, marginTop: 5, fontSize: 12 }}>
            eventId: {eventId}, error: {eventError?.message || 'no data'}
          </Text>
        )}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Not host - access denied
  if (!userIsHost) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="lock-closed-outline" size={48} color={colors.warning} />
        <Text style={styles.errorText}>Only the event host can manage this event</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render RSVP user item
  const renderRsvpUser = ({ item }: { item: RsvpUser }) => (
    <View style={styles.rsvpUserItem}>
      {item.avatarUrl ? (
        <Image source={{ uri: item.avatarUrl }} style={styles.rsvpAvatar} />
      ) : (
        <View style={[styles.rsvpAvatar, styles.rsvpAvatarPlaceholder]}>
          <Ionicons name="person" size={20} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.rsvpUserInfo}>
        <Text style={styles.rsvpUserName}>{item.displayName || item.username}</Text>
        <Text style={styles.rsvpUserUsername}>@{item.username}</Text>
      </View>
    </View>
  );

  // Render RSVPs section
  const renderRsvpSection = (title: string, users: RsvpUser[], icon: string, iconColor: string) => (
    <View style={styles.rsvpSection}>
      <View style={styles.rsvpSectionHeader}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
        <Text style={styles.rsvpSectionTitle}>{title}</Text>
        <View style={[styles.rsvpCount, { backgroundColor: iconColor }]}>
          <Text style={styles.rsvpCountText}>{users.length}</Text>
        </View>
      </View>
      {users.length > 0 ? (
        <FlatList
          data={users}
          renderItem={renderRsvpUser}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
        />
      ) : (
        <Text style={styles.rsvpEmptyText}>No attendees</Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Event</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'details' && styles.tabActive]}
          onPress={() => setActiveTab('details')}
        >
          <Ionicons
            name="create-outline"
            size={20}
            color={activeTab === 'details' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'details' && styles.tabTextActive]}>
            Details
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rsvps' && styles.tabActive]}
          onPress={() => setActiveTab('rsvps')}
        >
          <Ionicons
            name="people-outline"
            size={20}
            color={activeTab === 'rsvps' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'rsvps' && styles.tabTextActive]}>
            RSVPs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Ionicons
            name="settings-outline"
            size={20}
            color={activeTab === 'settings' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <View style={styles.form}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Event title"
                placeholderTextColor={colors.textMuted}
                maxLength={100}
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Event description"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
            </View>

            {/* Category/Type Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Event Type</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowCategoryPicker(true)}
              >
                <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
                <Text style={styles.pickerText}>{category}</Text>
                <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Location with Autocomplete */}
            <View style={[styles.inputGroup, { zIndex: 1000, elevation: 1000 }]}>
              <Text style={styles.label}>Location</Text>
              <View style={styles.locationInputContainer}>
                <TextInput
                  style={styles.input}
                  value={location}
                  onChangeText={handleLocationChange}
                  placeholder="Search for a location..."
                  placeholderTextColor={colors.textMuted}
                  maxLength={200}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {isSearchingLocations && (
                  <ActivityIndicator
                    size="small"
                    color={colors.primary}
                    style={styles.locationSpinner}
                  />
                )}
                {selectedLocation && (
                  <TouchableOpacity
                    style={styles.clearLocationButton}
                    onPress={() => {
                      setLocation('');
                      setSelectedLocation(null);
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Location Suggestions - absolute positioned to overlay other content */}
              {showLocationSuggestions && locationSuggestions.length > 0 && (
                <View style={[
                  styles.suggestionsContainer,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderSubtle,
                    position: 'absolute',
                    top: 80, // Below input
                    left: 0,
                    right: 0,
                    zIndex: 2000,
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                  }
                ]}>
                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled={true}
                    style={{ maxHeight: 200 }}
                  >
                    {locationSuggestions.map((suggestion) => (
                      <TouchableOpacity
                        key={suggestion.place_id}
                        style={[styles.suggestionItem, { borderBottomColor: colors.borderSubtle }]}
                        onPress={() => handleSelectLocation(suggestion)}
                      >
                        <Ionicons name="location-outline" size={18} color={colors.primary} />
                        <Text style={[styles.suggestionText, { color: colors.textPrimary }]} numberOfLines={2}>
                          {suggestion.display_name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Public/Private Toggle */}
            <View style={styles.inputGroup}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <View style={styles.toggleHeader}>
                    <Ionicons
                      name={isPublic ? 'globe-outline' : 'lock-closed-outline'}
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={styles.toggleLabel}>
                      {isPublic ? 'Public Event' : 'Private Event'}
                    </Text>
                  </View>
                  <Text style={styles.toggleDescription}>
                    {isPublic
                      ? 'Visible on the main Events page to all users'
                      : 'Only visible to community members'}
                  </Text>
                </View>
                <Switch
                  value={isPublic}
                  onValueChange={setIsPublic}
                  trackColor={{ false: colors.surfaceMuted, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            {/* Date Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date *</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                <Text style={styles.pickerText}>{formatDate(selectedDate)}</Text>
              </TouchableOpacity>
            </View>

            {/* Time Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Time *</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color={colors.primary} />
                <Text style={styles.pickerText}>{formatTime(selectedTime)}</Text>
              </TouchableOpacity>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, updateMutation.isPending && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* RSVPs Tab */}
        {activeTab === 'rsvps' && (
          <View style={styles.rsvpsContainer}>
            {rsvpsLoading ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading attendees...</Text>
              </View>
            ) : rsvpsData ? (
              <>
                {/* Summary */}
                <View style={styles.rsvpSummary}>
                  <Text style={styles.rsvpSummaryTitle}>Total Responses</Text>
                  <Text style={styles.rsvpSummaryCount}>{rsvpsData.counts.total}</Text>
                </View>

                {renderRsvpSection('Going', rsvpsData.going, 'checkmark-circle', colors.success)}
                {renderRsvpSection('Maybe', rsvpsData.maybe, 'help-circle', colors.warning)}
                {renderRsvpSection('Not Going', rsvpsData.notGoing, 'close-circle', colors.danger)}
              </>
            ) : (
              <Text style={styles.rsvpEmptyText}>No RSVP data available</Text>
            )}
          </View>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <View style={styles.settingsContainer}>
            <View style={styles.dangerZone}>
              <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
              <Text style={styles.dangerZoneDescription}>
                Cancelling an event will permanently delete it and notify all attendees via email.
              </Text>
              <TouchableOpacity
                style={[styles.cancelEventButton, cancelMutation.isPending && styles.buttonDisabled]}
                onPress={handleCancel}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                    <Text style={styles.cancelEventButtonText}>Cancel Event</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Date Picker Modal (iOS) */}
      {Platform.OS === 'ios' ? (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <Pressable
            style={styles.pickerModalOverlay}
            onPress={() => setShowDatePicker(false)}
          >
            <View style={styles.pickerModalContent}>
              <View style={styles.pickerModalHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.pickerModalCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerModalTitle}>Select Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.pickerModalDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="inline"
                onChange={(event, date) => {
                  if (date) {
                    setSelectedDate(date);
                  }
                }}
                themeVariant={colorScheme}
                minimumDate={new Date()}
                style={styles.iosCalendarPicker}
              />
            </View>
          </Pressable>
        </Modal>
      ) : (
        showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) {
                setSelectedDate(date);
              }
            }}
            minimumDate={new Date()}
          />
        )
      )}

      {/* Time Picker Modal (iOS) */}
      {Platform.OS === 'ios' ? (
        <Modal
          visible={showTimePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <Pressable
            style={styles.pickerModalOverlay}
            onPress={() => setShowTimePicker(false)}
          >
            <View style={styles.pickerModalContent}>
              <View style={styles.pickerModalHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.pickerModalCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerModalTitle}>Select Time</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.pickerModalDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display="spinner"
                is24Hour={false}
                onChange={(event, date) => {
                  if (date) {
                    setSelectedTime(date);
                  }
                }}
                themeVariant={colorScheme}
                style={styles.iosPicker}
              />
            </View>
          </Pressable>
        </Modal>
      ) : (
        showTimePicker && (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            display="default"
            is24Hour={false}
            onChange={(event, date) => {
              setShowTimePicker(false);
              if (date) {
                setSelectedTime(date);
              }
            }}
          />
        )
      )}

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <Pressable
          style={styles.pickerModalOverlay}
          onPress={() => setShowCategoryPicker(false)}
        >
          <View style={styles.categoryModalContent}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select Event Type</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.categoryList}>
              {EVENT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryOption,
                    category === cat && styles.categoryOptionSelected,
                  ]}
                  onPress={() => {
                    setCategory(cat);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={styles.categoryOptionText}>{cat}</Text>
                  {category === cat && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: any, colorScheme: 'light' | 'dark') =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: 60,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.textPrimary,
    },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      gap: 6,
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: 14,
      color: colors.textMuted,
      fontWeight: '500',
    },
    tabTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    content: {
      flex: 1,
    },
    form: {
      padding: 20,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 16,
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      color: colors.textPrimary,
    },
    textArea: {
      minHeight: 100,
      paddingTop: 12,
    },
    pickerButton: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    pickerText: {
      fontSize: 16,
      color: colors.textPrimary,
      flex: 1,
    },
    locationInputContainer: {
      position: 'relative',
    },
    locationSpinner: {
      position: 'absolute',
      right: 16,
      top: 16,
    },
    clearLocationButton: {
      position: 'absolute',
      right: 12,
      top: 14,
      padding: 4,
    },
    suggestionsContainer: {
      marginTop: 4,
      borderRadius: 8,
      borderWidth: 1,
      maxHeight: 200,
      overflow: 'hidden',
    },
    suggestionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      gap: 10,
      borderBottomWidth: 1,
    },
    suggestionText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    toggleInfo: {
      flex: 1,
      marginRight: 12,
    },
    toggleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    toggleLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    toggleDescription: {
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 18,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      marginTop: 10,
    },
    saveButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    // RSVPs tab styles
    rsvpsContainer: {
      padding: 20,
    },
    rsvpSummary: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    rsvpSummaryTitle: {
      fontSize: 14,
      color: colors.textMuted,
      marginBottom: 4,
    },
    rsvpSummaryCount: {
      fontSize: 36,
      fontWeight: 'bold',
      color: colors.textPrimary,
    },
    rsvpSection: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    rsvpSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
    },
    rsvpSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      flex: 1,
    },
    rsvpCount: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    rsvpCountText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    rsvpUserItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    rsvpAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    rsvpAvatarPlaceholder: {
      backgroundColor: colors.surfaceMuted,
      justifyContent: 'center',
      alignItems: 'center',
    },
    rsvpUserInfo: {
      flex: 1,
    },
    rsvpUserName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    rsvpUserUsername: {
      fontSize: 13,
      color: colors.textMuted,
    },
    rsvpEmptyText: {
      fontSize: 14,
      color: colors.textMuted,
      fontStyle: 'italic',
      textAlign: 'center',
      padding: 12,
    },
    // Settings tab styles
    settingsContainer: {
      padding: 20,
    },
    dangerZone: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.danger,
    },
    dangerZoneTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.danger,
      marginBottom: 8,
    },
    dangerZoneDescription: {
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 20,
      marginBottom: 20,
    },
    cancelEventButton: {
      backgroundColor: colors.danger,
      borderRadius: 8,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    cancelEventButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    // Modal styles
    pickerModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    pickerModalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 20,
    },
    pickerModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    pickerModalTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    pickerModalCancel: {
      fontSize: 16,
      color: colors.textMuted,
    },
    pickerModalDone: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
    },
    iosPicker: {
      height: 200,
    },
    iosCalendarPicker: {
      height: 340,
    },
    // Category picker styles
    categoryModalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
      paddingBottom: 20,
    },
    categoryList: {
      maxHeight: 400,
    },
    categoryOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    categoryOptionSelected: {
      backgroundColor: colorScheme === 'dark' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.05)',
    },
    categoryOptionText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    // Error/Loading states
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.textMuted,
    },
    errorText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.textMuted,
      textAlign: 'center',
    },
    backButton: {
      marginTop: 20,
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    backButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
