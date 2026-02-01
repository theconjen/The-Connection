/**
 * Create Event Screen
 * Theme-aware - respects light/dark mode
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
import { useTheme } from '../../src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

// App owner can create events without a community (The Connection official events)
const APP_OWNER_USER_ID = 19; // Janelle

// Event categories
const EVENT_CATEGORIES = [
  { value: 'sunday_service', label: 'Sunday Service', icon: 'sunny-outline' as const },
  { value: 'worship', label: 'Worship', icon: 'musical-notes-outline' as const },
  { value: 'bible_study', label: 'Bible Study', icon: 'book-outline' as const },
  { value: 'prayer', label: 'Prayer Meeting', icon: 'hand-left-outline' as const },
  { value: 'fellowship', label: 'Fellowship/Social', icon: 'people-outline' as const },
  { value: 'service_outreach', label: 'Service/Outreach', icon: 'heart-outline' as const },
  { value: 'activity', label: 'Activity', icon: 'fitness-outline' as const },
  { value: 'conference', label: 'Conference', icon: 'mic-outline' as const },
  { value: 'youth', label: 'Youth Event', icon: 'school-outline' as const },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' as const },
];

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
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

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
  const [isPublic, setIsPublic] = useState(true);
  const [selectedCommunityId, setSelectedCommunityId] = useState<number | null>(
    urlCommunityId ? parseInt(urlCommunityId) : null
  );

  // Date and time state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEndDate, setSelectedEndDate] = useState(new Date()); // End date for multi-day events
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [selectedEndTime, setSelectedEndTime] = useState(() => {
    // Default end time is 1 hour after start time
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + 1);
    return endTime;
  });

  // Category state
  const [category, setCategory] = useState<string>('other');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Modal state
  const [showCommunityPicker, setShowCommunityPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false); // End date picker for Conference
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false); // End time picker for Conference
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Multi-day events (Conference category)
  const isMultiDayEvent = category === 'conference';

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

  // Keep end date >= start date when start date changes
  useEffect(() => {
    if (isMultiDayEvent && selectedEndDate < selectedDate) {
      setSelectedEndDate(selectedDate);
    }
  }, [selectedDate, isMultiDayEvent]);

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
    setSelectedLocation(null);
  };

  // Fetch user's communities (only where user is moderator or owner)
  const { data: communities, isLoading: communitiesLoading } = useQuery<Community[]>({
    queryKey: ['communities', 'moderator'],
    queryFn: async () => {
      const allCommunities = await communitiesAPI.getAll();
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
    if (!selectedCommunityId && !isAppOwner) {
      Alert.alert('Error', 'Please select a community');
      return;
    }

    const eventDate = selectedDate.toISOString().slice(0, 10);

    // For Conference events, use end date; otherwise same as start date
    const eventEndDate = isMultiDayEvent
      ? selectedEndDate.toISOString().slice(0, 10)
      : eventDate;

    // Validate end date is after or equal to start date for conferences
    if (isMultiDayEvent && selectedEndDate < selectedDate) {
      Alert.alert('Error', 'End date must be on or after the start date');
      return;
    }

    const hours = selectedTime.getHours().toString().padStart(2, '0');
    const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
    const startTime = `${hours}:${minutes}:00`;

    // Always include end time
    const endHours = selectedEndTime.getHours().toString().padStart(2, '0');
    const endMinutes = selectedEndTime.getMinutes().toString().padStart(2, '0');
    const endTime = `${endHours}:${endMinutes}:00`;

    let latitude: number | undefined;
    let longitude: number | undefined;

    if (selectedLocation) {
      latitude = parseFloat(selectedLocation.lat);
      longitude = parseFloat(selectedLocation.lon);
    } else if (location.trim()) {
      setIsGeocoding(true);
      try {
        const results = await searchLocations(location.trim());
        if (results.length > 0) {
          latitude = parseFloat(results[0].lat);
          longitude = parseFloat(results[0].lon);
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
      latitude: latitude !== undefined ? String(latitude) : undefined,
      longitude: longitude !== undefined ? String(longitude) : undefined,
      eventDate,
      eventEndDate, // End date for multi-day events (Conference)
      startTime,
      endTime,
      communityId: selectedCommunityId || undefined,
      isPublic,
      category,
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

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: colors.background,
    },
    header: {
      borderBottomColor: colors.borderSubtle,
    },
    cancelText: {
      color: colors.textSecondary,
    },
    title: {
      color: colors.textPrimary,
    },
    createText: {
      color: colors.primary,
    },
    label: {
      color: colors.textPrimary,
    },
    input: {
      backgroundColor: isDark ? colors.surfaceMuted : colors.surface,
      borderColor: colors.border,
      color: colors.textPrimary,
    },
    pickerButton: {
      backgroundColor: isDark ? colors.surfaceMuted : colors.surface,
      borderColor: colors.border,
    },
    pickerText: {
      color: colors.textPrimary,
    },
    placeholderText: {
      color: colors.textSecondary,
    },
    dropdownContainer: {
      backgroundColor: isDark ? '#1A1A1E' : colors.surface,
      borderColor: colors.border,
    },
    dropdownOptionText: {
      color: colors.textPrimary,
    },
    dropdownOptionSubtext: {
      color: colors.textSecondary,
    },
    helpText: {
      color: colors.textSecondary,
    },
    toggleRow: {
      backgroundColor: isDark ? colors.surfaceMuted : colors.surface,
      borderColor: colors.border,
    },
    toggleLabel: {
      color: colors.textPrimary,
    },
    toggleDescription: {
      color: colors.textSecondary,
    },
    suggestionItem: {
      borderBottomColor: colors.borderSubtle,
    },
    suggestionText: {
      color: colors.textPrimary,
    },
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, dynamicStyles.container]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, dynamicStyles.header]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.cancelText, dynamicStyles.cancelText]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.title, dynamicStyles.title]}>Create Event</Text>
        <TouchableOpacity onPress={handleCreate} disabled={isDisabled}>
          {createMutation.isPending || isGeocoding ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Text style={[styles.createText, dynamicStyles.createText, isDisabled && styles.createTextDisabled]}>
              Create
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          {/* Community Selector */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.label]}>Community {isAppOwner ? '(Optional)' : '*'}</Text>
            <TouchableOpacity
              style={[
                styles.pickerButton,
                dynamicStyles.pickerButton,
                showCommunityPicker && styles.pickerButtonActive,
              ]}
              onPress={() => setShowCommunityPicker(!showCommunityPicker)}
              disabled={communitiesLoading || (!isAppOwner && communities && communities.length === 0)}
            >
              <Text style={[styles.pickerText, dynamicStyles.pickerText, !selectedCommunity && !isAppOwner && dynamicStyles.placeholderText]}>
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
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {/* Dropdown Options */}
            {showCommunityPicker && (
              <View style={[styles.dropdownContainer, dynamicStyles.dropdownContainer]}>
                {isAppOwner && (
                  <TouchableOpacity
                    style={[
                      styles.dropdownOption,
                      !selectedCommunityId && styles.dropdownOptionSelected,
                      { borderBottomColor: colors.borderSubtle },
                    ]}
                    onPress={() => {
                      setSelectedCommunityId(null);
                      setShowCommunityPicker(false);
                    }}
                  >
                    <View style={styles.dropdownOptionContent}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="star" size={16} color={colors.primary} />
                        <Text style={[styles.dropdownOptionText, { color: colors.primary, fontWeight: '600' }]}>
                          The Connection
                        </Text>
                      </View>
                      <Text style={[styles.dropdownOptionSubtext, dynamicStyles.dropdownOptionSubtext]}>
                        Official app event
                      </Text>
                    </View>
                    {!selectedCommunityId && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
                {communities?.map((community, index) => (
                  <TouchableOpacity
                    key={community.id}
                    style={[
                      styles.dropdownOption,
                      selectedCommunityId === community.id && styles.dropdownOptionSelected,
                      { borderBottomColor: colors.borderSubtle },
                    ]}
                    onPress={() => {
                      setSelectedCommunityId(community.id);
                      setShowCommunityPicker(false);
                    }}
                  >
                    <View style={styles.dropdownOptionContent}>
                      <Text style={[styles.dropdownOptionText, dynamicStyles.dropdownOptionText]}>
                        {community.name}
                      </Text>
                    </View>
                    {selectedCommunityId === community.id && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {isAppOwner && !showCommunityPicker && (
              <Text style={[styles.helpTextPrimary, { color: colors.primary }]}>
                <Ionicons name="star" size={12} color={colors.primary} /> You can create official app events without a community.
              </Text>
            )}
            {!isAppOwner && communities && communities.length === 0 && !communitiesLoading && (
              <Text style={[styles.helpText, dynamicStyles.helpText]}>
                You must be a creator or moderator of a community to create events.
              </Text>
            )}
          </View>

          {/* Category Selector */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.label]}>Category *</Text>
            <TouchableOpacity
              style={[
                styles.pickerButton,
                dynamicStyles.pickerButton,
                showCategoryPicker && styles.pickerButtonActive,
              ]}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Ionicons
                name={EVENT_CATEGORIES.find(c => c.value === category)?.icon || 'ellipsis-horizontal-outline'}
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.pickerText, dynamicStyles.pickerText]}>
                {EVENT_CATEGORIES.find(c => c.value === category)?.label || 'Select category'}
              </Text>
              <Ionicons
                name={showCategoryPicker ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {/* Category Dropdown Options */}
            {showCategoryPicker && (
              <View style={[styles.dropdownContainer, dynamicStyles.dropdownContainer]}>
                <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                  {EVENT_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      style={[
                        styles.dropdownOption,
                        category === cat.value && styles.dropdownOptionSelected,
                        { borderBottomColor: colors.borderSubtle },
                      ]}
                      onPress={() => {
                        setCategory(cat.value);
                        setShowCategoryPicker(false);
                      }}
                    >
                      <View style={styles.dropdownOptionContent}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <Ionicons name={cat.icon} size={18} color={category === cat.value ? colors.primary : colors.textSecondary} />
                          <Text style={[styles.dropdownOptionText, dynamicStyles.dropdownOptionText, category === cat.value && { color: colors.primary }]}>
                            {cat.label}
                          </Text>
                        </View>
                      </View>
                      {category === cat.value && (
                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.label]}>Title *</Text>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              value={title}
              onChangeText={setTitle}
              placeholder="Event title"
              placeholderTextColor={colors.textSecondary}
              maxLength={100}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.label]}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea, dynamicStyles.input]}
              value={description}
              onChangeText={setDescription}
              placeholder="Event description"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.label]}>Location</Text>
            <View style={styles.locationInputContainer}>
              <TextInput
                style={[styles.input, dynamicStyles.input]}
                value={location}
                onChangeText={handleLocationChange}
                placeholder="Search for a location..."
                placeholderTextColor={colors.textSecondary}
                maxLength={200}
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
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {showLocationSuggestions && locationSuggestions.length > 0 && (
              <View style={[styles.suggestionsContainer, { backgroundColor: isDark ? '#1A1A1E' : colors.surface, borderColor: colors.border }]}>
                {locationSuggestions.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion.place_id}
                    style={[styles.suggestionItem, dynamicStyles.suggestionItem]}
                    onPress={() => handleSelectLocation(suggestion)}
                  >
                    <Ionicons name="location-outline" size={18} color={colors.primary} />
                    <Text style={[styles.suggestionText, dynamicStyles.suggestionText]} numberOfLines={2}>
                      {suggestion.display_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {selectedLocation ? (
              <Text style={[styles.locationHintSelected, { color: '#10B981' }]}>
                <Ionicons name="checkmark-circle" size={12} color="#10B981" /> Location selected
              </Text>
            ) : (
              <Text style={[styles.locationHint, dynamicStyles.helpText]}>
                Start typing to search for a location
              </Text>
            )}
          </View>

          {/* Public/Private Toggle */}
          <View style={styles.inputGroup}>
            <View style={[styles.toggleRow, dynamicStyles.toggleRow]}>
              <View style={styles.toggleInfo}>
                <View style={styles.toggleHeader}>
                  <Ionicons
                    name={isPublic ? 'globe-outline' : 'lock-closed-outline'}
                    size={20}
                    color={colors.textPrimary}
                  />
                  <Text style={[styles.toggleLabel, dynamicStyles.toggleLabel]}>
                    {isPublic ? 'Public Event' : 'Private Event'}
                  </Text>
                </View>
                <Text style={[styles.toggleDescription, dynamicStyles.toggleDescription]}>
                  {isPublic
                    ? 'Visible on the main Events page to all users'
                    : 'Only visible to community members'}
                </Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: colors.borderSubtle, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Date Picker */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.label]}>{isMultiDayEvent ? 'Start Date *' : 'Date *'}</Text>
            <TouchableOpacity
              style={[styles.pickerButton, dynamicStyles.pickerButton]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={[styles.pickerText, dynamicStyles.pickerText]}>{formatDate(selectedDate)}</Text>
            </TouchableOpacity>
          </View>

          {/* End Date Picker - Only for Conference (multi-day events) */}
          {isMultiDayEvent && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, dynamicStyles.label]}>End Date *</Text>
              <TouchableOpacity
                style={[styles.pickerButton, dynamicStyles.pickerButton]}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                <Text style={[styles.pickerText, dynamicStyles.pickerText]}>{formatDate(selectedEndDate)}</Text>
              </TouchableOpacity>
              <Text style={[styles.helpText, dynamicStyles.helpText, { fontStyle: 'italic' }]}>
                Conferences typically span multiple days
              </Text>
            </View>
          )}

          {/* Start Time Picker */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.label]}>Start Time *</Text>
            <TouchableOpacity
              style={[styles.pickerButton, dynamicStyles.pickerButton]}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={[styles.pickerText, dynamicStyles.pickerText]}>{formatTime(selectedTime)}</Text>
            </TouchableOpacity>
          </View>

          {/* End Time Picker - Optional for all events */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.label]}>End Time</Text>
            <TouchableOpacity
              style={[styles.pickerButton, dynamicStyles.pickerButton]}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={[styles.pickerText, dynamicStyles.pickerText]}>{formatTime(selectedEndTime)}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* Date Picker - iOS with Done button */}
      {showDatePicker && Platform.OS === 'ios' && (
        <View style={{
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.borderSubtle,
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderSubtle,
          }}>
            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
              <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: 16, paddingBottom: 20, alignItems: 'center' }}>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="inline"
              onChange={(event, date) => {
                if (date) setSelectedDate(date);
              }}
              themeVariant={isDark ? 'dark' : 'light'}
              minimumDate={new Date()}
              style={{ height: 340, width: '100%' }}
            />
          </View>
        </View>
      )}

      {/* Date Picker - Android */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
          }}
          minimumDate={new Date()}
        />
      )}

      {/* End Date Picker - iOS with Done button (Conference only) */}
      {showEndDatePicker && Platform.OS === 'ios' && (
        <View style={{
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.borderSubtle,
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderSubtle,
          }}>
            <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
              <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: 16, paddingBottom: 20, alignItems: 'center' }}>
            <DateTimePicker
              value={selectedEndDate}
              mode="date"
              display="inline"
              onChange={(event, date) => {
                if (date) setSelectedEndDate(date);
              }}
              themeVariant={isDark ? 'dark' : 'light'}
              minimumDate={selectedDate}
              style={{ height: 340, width: '100%' }}
            />
          </View>
        </View>
      )}

      {/* End Date Picker - Android (Conference only) */}
      {showEndDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={selectedEndDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowEndDatePicker(false);
            if (date) setSelectedEndDate(date);
          }}
          minimumDate={selectedDate}
        />
      )}

      {/* Time Picker - iOS with Done button */}
      {showTimePicker && Platform.OS === 'ios' && (
        <View style={{
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.borderSubtle,
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderSubtle,
          }}>
            <TouchableOpacity onPress={() => setShowTimePicker(false)}>
              <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display="spinner"
              is24Hour={false}
              onChange={(event, date) => {
                if (date) setSelectedTime(date);
              }}
              themeVariant={isDark ? 'dark' : 'light'}
            />
          </View>
        </View>
      )}

      {/* Time Picker - Android */}
      {showTimePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display="default"
          is24Hour={false}
          onChange={(event, date) => {
            setShowTimePicker(false);
            if (date) setSelectedTime(date);
          }}
        />
      )}

      {/* End Time Picker - iOS with Done button (Conference only) */}
      {showEndTimePicker && Platform.OS === 'ios' && (
        <View style={{
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.borderSubtle,
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderSubtle,
          }}>
            <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
              <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center' }}>
            <DateTimePicker
              value={selectedEndTime}
              mode="time"
              display="spinner"
              is24Hour={false}
              onChange={(event, date) => {
                if (date) setSelectedEndTime(date);
              }}
              themeVariant={isDark ? 'dark' : 'light'}
            />
          </View>
        </View>
      )}

      {/* End Time Picker - Android (Conference only) */}
      {showEndTimePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={selectedEndTime}
          mode="time"
          display="default"
          is24Hour={false}
          onChange={(event, date) => {
            setShowEndTimePicker(false);
            if (date) setSelectedEndTime(date);
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 70,
    borderBottomWidth: 1,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  createText: {
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
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  pickerButton: {
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
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
    flex: 1,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 400,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
  },
  dropdownOptionSelected: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  dropdownOptionContent: {
    flex: 1,
    marginRight: 12,
  },
  dropdownOptionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  dropdownOptionSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  helpText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  helpTextPrimary: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  locationHint: {
    fontSize: 12,
    marginTop: 4,
  },
  locationHintSelected: {
    fontSize: 12,
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
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
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
  },
  toggleDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
});
