/**
 * Create Event Screen
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
  Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { eventsAPI, communitiesAPI } from '../../src/lib/apiClient';
import { useAuth } from '../../src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

// Hardcoded dark mode colors - single source of truth
const COLORS = {
  background: '#0A0A0C',
  surface: '#151518',
  surfaceElevated: '#1A1A1E',
  surfaceMuted: '#1E1E24',
  textPrimary: '#FFFFFF',
  textSecondary: '#E8E4DC',
  textMuted: '#9A9A9A',
  textPlaceholder: '#6A6A6A',
  borderSubtle: '#2A2A30',
  borderVisible: '#3A3A42',
  primary: '#D4A860',
  primaryForeground: '#1A1A1E',
  icon: '#9A9A9A',
  toggleTrackOff: '#3A3A42',
  toggleThumb: '#FFFFFF',
  success: '#10B981',
};

// App owner can create events without a community (The Connection official events)
const APP_OWNER_USER_ID = 19; // Janelle

interface Community {
  id: number;
  name: string;
  description: string;
  role?: string;
  userRole?: string;
}

// Location suggestion type
interface LocationSuggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
}

// Search for location suggestions using Nominatim
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

export default function CreateEventScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { communityId: urlCommunityId } = useLocalSearchParams() as { communityId?: string };
  const { user } = useAuth();

  // Check if current user is the app owner (Janelle) who can create events without a community
  const isAppOwner = user?.id === APP_OWNER_USER_ID || user?.isAdmin === true;

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);
  const [isPublic, setIsPublic] = useState(true); // New: public/private toggle
  const [selectedCommunityId, setSelectedCommunityId] = useState<number | null>(
    urlCommunityId ? parseInt(urlCommunityId) : null
  );

  // Date and time state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());

  // Modal state
  const [showCommunityPicker, setShowCommunityPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

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

  // Handle location selection
  const handleSelectLocation = (suggestion: LocationSuggestion) => {
    setSelectedLocation(suggestion);
    setLocation(suggestion.display_name);
    setShowLocationSuggestions(false);
    setLocationSuggestions([]);
  };

  // Handle location text change
  const handleLocationChange = (text: string) => {
    setLocation(text);
    setSelectedLocation(null); // Clear selected location when user types
  };

  // Fetch user's communities (only where user is moderator or owner)
  const { data: communities, isLoading: communitiesLoading } = useQuery<Community[]>({
    queryKey: ['communities', 'moderator'],
    queryFn: async () => {
      const allCommunities = await communitiesAPI.getAll();
      // Filter to only communities where user is moderator or owner
      return allCommunities.filter((c: any) => {
        const role = c.role || c.userRole;
        return role === 'moderator' || role === 'owner';
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => eventsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      if (selectedCommunityId) {
        queryClient.invalidateQueries({ queryKey: ['community-events', selectedCommunityId] });
      }
      Alert.alert('Success', 'Event created!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to create event';
      Alert.alert('Error', message);
    },
  });

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Description is required');
      return;
    }
    // App owners can create events without a community
    if (!selectedCommunityId && !isAppOwner) {
      Alert.alert('Error', 'Please select a community');
      return;
    }

    // Format date as YYYY-MM-DD
    const eventDate = selectedDate.toISOString().slice(0, 10);

    // Format time as HH:MM:SS
    const hours = selectedTime.getHours().toString().padStart(2, '0');
    const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
    const startTime = `${hours}:${minutes}:00`;
    const endTime = startTime; // Default to same as start time

    // Use coordinates from selected location suggestion
    let latitude: number | undefined;
    let longitude: number | undefined;

    if (selectedLocation) {
      latitude = parseFloat(selectedLocation.lat);
      longitude = parseFloat(selectedLocation.lon);
      console.info('[CreateEvent] Using selected location coordinates:', { latitude, longitude });
    } else if (location.trim()) {
      // Fallback: try to geocode if location text entered but no suggestion selected
      setIsGeocoding(true);
      try {
        const results = await searchLocations(location.trim());
        if (results.length > 0) {
          latitude = parseFloat(results[0].lat);
          longitude = parseFloat(results[0].lon);
          console.info('[CreateEvent] Geocoded location:', { latitude, longitude });
        } else {
          console.warn('[CreateEvent] Could not geocode location, creating event without coordinates');
        }
      } catch (error) {
        console.warn('[CreateEvent] Geocoding error:', error);
      } finally {
        setIsGeocoding(false);
      }
    }

    createMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      location: location.trim() || undefined,
      latitude,
      longitude,
      eventDate,
      startTime,
      endTime,
      communityId: selectedCommunityId || undefined, // undefined for app-level events
      isPublic, // Send public/private status
    });
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

  const selectedCommunity = communities?.find(c => c.id === selectedCommunityId);

  const isDisabled = createMutation.isPending || isGeocoding || !title.trim() || !description.trim();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header with Create on right */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Event</Text>
        <TouchableOpacity onPress={handleCreate} disabled={isDisabled}>
          {createMutation.isPending || isGeocoding ? (
            <ActivityIndicator color={COLORS.primary} size="small" />
          ) : (
            <Text style={[styles.createText, isDisabled && styles.createTextDisabled]}>
              Create
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          {/* Community Selector - Inline Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Community {isAppOwner ? '(Optional)' : '*'}</Text>
            <TouchableOpacity
              style={[
                styles.pickerButton,
                showCommunityPicker && styles.pickerButtonActive,
              ]}
              onPress={() => setShowCommunityPicker(!showCommunityPicker)}
              disabled={communitiesLoading || (!isAppOwner && communities && communities.length === 0)}
            >
              <Text style={[styles.pickerText, !selectedCommunity && !isAppOwner && styles.placeholderText]}>
                {communitiesLoading
                  ? 'Loading communities...'
                  : selectedCommunity
                  ? selectedCommunity.name
                  : isAppOwner && !selectedCommunityId
                  ? 'The Connection (App Event)'
                  : communities && communities.length === 0
                  ? 'No communities available'
                  : 'Select a community'}
              </Text>
              <Ionicons
                name={showCommunityPicker ? "chevron-up" : "chevron-down"}
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>

            {/* Inline Dropdown Options */}
            {showCommunityPicker && (
              <View style={styles.dropdownContainer}>
                {/* App Owner: The Connection option */}
                {isAppOwner && (
                  <TouchableOpacity
                    style={[
                      styles.dropdownOption,
                      !selectedCommunityId && styles.dropdownOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedCommunityId(null);
                      setShowCommunityPicker(false);
                    }}
                  >
                    <View style={styles.dropdownOptionContent}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="star" size={16} color={COLORS.primary} />
                        <Text style={[styles.dropdownOptionText, { color: COLORS.primary, fontWeight: '600' }]}>
                          The Connection
                        </Text>
                      </View>
                      <Text style={styles.dropdownOptionSubtext}>
                        Official app event
                      </Text>
                    </View>
                    {!selectedCommunityId && (
                      <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                )}
                {/* Community options */}
                {communities?.map((community, index) => (
                  <TouchableOpacity
                    key={community.id}
                    style={[
                      styles.dropdownOption,
                      selectedCommunityId === community.id && styles.dropdownOptionSelected,
                      index === (communities.length - 1) && !isAppOwner && { borderBottomWidth: 0 }
                    ]}
                    onPress={() => {
                      setSelectedCommunityId(community.id);
                      setShowCommunityPicker(false);
                    }}
                  >
                    <View style={styles.dropdownOptionContent}>
                      <Text style={styles.dropdownOptionText}>
                        {community.name}
                      </Text>
                    </View>
                    {selectedCommunityId === community.id && (
                      <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {isAppOwner && !showCommunityPicker && (
              <Text style={styles.helpTextPrimary}>
                <Ionicons name="star" size={12} color={COLORS.primary} /> You can create official app events without a community.
              </Text>
            )}
            {!isAppOwner && communities && communities.length === 0 && !communitiesLoading && (
              <Text style={styles.helpText}>
                You must be a creator or moderator of a community to create events. Join or create a community first.
              </Text>
            )}
          </View>

          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Event title"
              placeholderTextColor={COLORS.textPlaceholder}
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
              placeholderTextColor={COLORS.textPlaceholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>

          {/* Location with Autocomplete */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <View style={styles.locationInputContainer}>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={handleLocationChange}
                placeholder="Search for a location..."
                placeholderTextColor={COLORS.textPlaceholder}
                maxLength={200}
              />
              {isSearchingLocations && (
                <ActivityIndicator
                  size="small"
                  color={COLORS.primary}
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
                  <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Location Suggestions */}
            {showLocationSuggestions && locationSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {locationSuggestions.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion.place_id}
                    style={styles.suggestionItem}
                    onPress={() => handleSelectLocation(suggestion)}
                  >
                    <Ionicons name="location-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.suggestionText} numberOfLines={2}>
                      {suggestion.display_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {selectedLocation ? (
              <Text style={styles.locationHintSelected}>
                <Ionicons name="checkmark-circle" size={12} color={COLORS.success} /> Location selected
              </Text>
            ) : (
              <Text style={styles.locationHint}>
                Start typing to search for a location
              </Text>
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
                    color={COLORS.textPrimary}
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
                trackColor={{ false: COLORS.toggleTrackOff, true: COLORS.primary }}
                thumbColor={COLORS.toggleThumb}
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
              <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
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
              <Ionicons name="time-outline" size={20} color={COLORS.primary} />
              <Text style={styles.pickerText}>{formatTime(selectedTime)}</Text>
            </TouchableOpacity>
          </View>

          {/* Spacer at bottom for scrolling */}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (date) {
              setSelectedDate(date);
            }
            if (Platform.OS === 'android') {
              setShowDatePicker(false);
            }
          }}
          themeVariant="dark"
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          is24Hour={false}
          onChange={(event, date) => {
            setShowTimePicker(Platform.OS === 'ios');
            if (date) {
              setSelectedTime(date);
            }
            if (Platform.OS === 'android') {
              setShowTimePicker(false);
            }
          }}
          themeVariant="dark"
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 70,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  createText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  createTextDisabled: {
    opacity: 0.4,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.borderVisible,
    color: COLORS.textPrimary,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  pickerButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderVisible,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pickerButtonActive: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  pickerText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    flex: 1,
  },
  placeholderText: {
    color: COLORS.textPlaceholder,
  },
  dropdownContainer: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: COLORS.borderVisible,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 200,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  dropdownOptionSelected: {
    backgroundColor: 'rgba(212, 168, 96, 0.1)',
  },
  dropdownOptionContent: {
    flex: 1,
    marginRight: 12,
  },
  dropdownOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  dropdownOptionSubtext: {
    fontSize: 13,
    marginTop: 2,
    color: COLORS.textMuted,
  },
  helpText: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginTop: 8,
  },
  helpTextPrimary: {
    fontSize: 13,
    color: COLORS.primary,
    lineHeight: 18,
    marginTop: 8,
  },
  locationHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  locationHintSelected: {
    fontSize: 12,
    color: COLORS.success,
    marginTop: 4,
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
    borderColor: COLORS.borderVisible,
    backgroundColor: COLORS.surfaceElevated,
    maxHeight: 200,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textPrimary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderVisible,
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
    color: COLORS.textPrimary,
  },
  toggleDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
});
