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
  Modal,
  Pressable,
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
  const [startDate, setStartDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [endTime, setEndTime] = useState(() => {
    const et = new Date();
    et.setHours(et.getHours() + 1); // Default to 1 hour later
    return et;
  });

  // Modal state
  const [showCommunityPicker, setShowCommunityPicker] = useState(false);
  const [showDateTimeModal, setShowDateTimeModal] = useState(false);
  const [activePickerTab, setActivePickerTab] = useState<'startDate' | 'startTime' | 'endDate' | 'endTime'>('startDate');
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Auto-adjust end time when start changes (keep end at least 60 min after start)
  useEffect(() => {
    const startDateTime = new Date(startDate);
    startDateTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

    const endDateTime = new Date(endDate);
    endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

    // If end is before or equal to start, adjust end to start + 60 min
    if (endDateTime <= startDateTime) {
      const newEndDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
      setEndDate(newEndDateTime);
      setEndTime(newEndDateTime);
    }
  }, [startDate, startTime]);

  // Validate end is after start before submit
  const validateDateTime = (): boolean => {
    const startDateTime = new Date(startDate);
    startDateTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

    const endDateTime = new Date(endDate);
    endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

    return endDateTime > startDateTime;
  };

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
    if (!validateDateTime()) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    const eventDate = startDate.toISOString().slice(0, 10);
    const eventEndDate = endDate.toISOString().slice(0, 10);
    const startHours = startTime.getHours().toString().padStart(2, '0');
    const startMinutes = startTime.getMinutes().toString().padStart(2, '0');
    const startTimeStr = `${startHours}:${startMinutes}:00`;
    const endHours = endTime.getHours().toString().padStart(2, '0');
    const endMinutes = endTime.getMinutes().toString().padStart(2, '0');
    const endTimeStr = `${endHours}:${endMinutes}:00`;

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
      eventEndDate,
      startTime: startTimeStr,
      endTime: endTimeStr,
      communityId: selectedCommunityId || undefined,
      isPublic,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString('en-US', {
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

  // Compact format: "Jan 15, 2:00 PM - 3:00 PM" or "Jan 15, 2:00 PM - Jan 16, 10:00 AM"
  const formatDateTimeRange = () => {
    const sameDay = startDate.toDateString() === endDate.toDateString();
    if (sameDay) {
      return `${formatDateShort(startDate)}, ${formatTime(startTime)} - ${formatTime(endTime)}`;
    } else {
      return `${formatDateShort(startDate)}, ${formatTime(startTime)} - ${formatDateShort(endDate)}, ${formatTime(endTime)}`;
    }
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

          {/* Date & Time Picker - Single button showing range */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.label]}>Date & Time *</Text>
            <TouchableOpacity
              style={[styles.pickerButton, dynamicStyles.pickerButton]}
              onPress={() => {
                setActivePickerTab('startDate');
                setShowDateTimeModal(true);
              }}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={[styles.pickerText, dynamicStyles.pickerText, { flex: 1 }]}>
                {formatDateTimeRange()}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* Unified Date & Time Modal */}
      <Modal
        visible={showDateTimeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDateTimeModal(false)}
      >
        <Pressable
          style={styles.pickerModalOverlay}
          onPress={() => setShowDateTimeModal(false)}
        >
          <Pressable
            style={[styles.dateTimeModalContent, { backgroundColor: colors.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header with Cancel and Done */}
            <View style={[styles.pickerModalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <TouchableOpacity onPress={() => setShowDateTimeModal(false)}>
                <Text style={[styles.pickerModalCancel, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.pickerModalTitle, { color: colors.textPrimary }]}>Date & Time</Text>
              <TouchableOpacity onPress={() => setShowDateTimeModal(false)}>
                <Text style={[styles.pickerModalDone, { color: colors.primary }]}>Done</Text>
              </TouchableOpacity>
            </View>

            {/* Tab Selector */}
            <View style={[styles.dateTimeTabContainer, { backgroundColor: isDark ? colors.surfaceMuted : '#F3F4F6' }]}>
              <TouchableOpacity
                style={[
                  styles.dateTimeTab,
                  activePickerTab === 'startDate' && { backgroundColor: colors.surface },
                ]}
                onPress={() => setActivePickerTab('startDate')}
              >
                <Text style={[
                  styles.dateTimeTabText,
                  { color: activePickerTab === 'startDate' ? colors.primary : colors.textSecondary }
                ]}>Start Date</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.dateTimeTab,
                  activePickerTab === 'startTime' && { backgroundColor: colors.surface },
                ]}
                onPress={() => setActivePickerTab('startTime')}
              >
                <Text style={[
                  styles.dateTimeTabText,
                  { color: activePickerTab === 'startTime' ? colors.primary : colors.textSecondary }
                ]}>Start Time</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.dateTimeTab,
                  activePickerTab === 'endDate' && { backgroundColor: colors.surface },
                ]}
                onPress={() => setActivePickerTab('endDate')}
              >
                <Text style={[
                  styles.dateTimeTabText,
                  { color: activePickerTab === 'endDate' ? colors.primary : colors.textSecondary }
                ]}>End Date</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.dateTimeTab,
                  activePickerTab === 'endTime' && { backgroundColor: colors.surface },
                ]}
                onPress={() => setActivePickerTab('endTime')}
              >
                <Text style={[
                  styles.dateTimeTabText,
                  { color: activePickerTab === 'endTime' ? colors.primary : colors.textSecondary }
                ]}>End Time</Text>
              </TouchableOpacity>
            </View>

            {/* Current Selection Summary */}
            <View style={[styles.dateTimeSummary, { borderBottomColor: colors.borderSubtle }]}>
              <View style={styles.dateTimeSummaryRow}>
                <Text style={[styles.dateTimeSummaryLabel, { color: colors.textSecondary }]}>Start:</Text>
                <Text style={[styles.dateTimeSummaryValue, { color: colors.textPrimary }]}>
                  {formatDateShort(startDate)}, {formatTime(startTime)}
                </Text>
              </View>
              <View style={styles.dateTimeSummaryRow}>
                <Text style={[styles.dateTimeSummaryLabel, { color: colors.textSecondary }]}>End:</Text>
                <Text style={[styles.dateTimeSummaryValue, { color: colors.textPrimary }]}>
                  {formatDateShort(endDate)}, {formatTime(endTime)}
                </Text>
              </View>
            </View>

            {/* Pickers */}
            {Platform.OS === 'ios' ? (
              <View style={styles.dateTimePickerContainer}>
                {activePickerTab === 'startDate' && (
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display="inline"
                    onChange={(event, date) => {
                      if (date) setStartDate(date);
                    }}
                    themeVariant={isDark ? 'dark' : 'light'}
                    minimumDate={new Date()}
                    style={styles.iosCalendarPicker}
                  />
                )}
                {activePickerTab === 'startTime' && (
                  <DateTimePicker
                    value={startTime}
                    mode="time"
                    display="spinner"
                    is24Hour={false}
                    onChange={(event, date) => {
                      if (date) setStartTime(date);
                    }}
                    themeVariant={isDark ? 'dark' : 'light'}
                    style={styles.iosPicker}
                  />
                )}
                {activePickerTab === 'endDate' && (
                  <DateTimePicker
                    value={endDate}
                    mode="date"
                    display="inline"
                    onChange={(event, date) => {
                      if (date) setEndDate(date);
                    }}
                    themeVariant={isDark ? 'dark' : 'light'}
                    minimumDate={startDate}
                    style={styles.iosCalendarPicker}
                  />
                )}
                {activePickerTab === 'endTime' && (
                  <DateTimePicker
                    value={endTime}
                    mode="time"
                    display="spinner"
                    is24Hour={false}
                    onChange={(event, date) => {
                      if (date) setEndTime(date);
                    }}
                    themeVariant={isDark ? 'dark' : 'light'}
                    style={styles.iosPicker}
                  />
                )}
              </View>
            ) : (
              <View style={styles.androidPickerButtons}>
                <TouchableOpacity
                  style={[styles.androidPickerButton, { backgroundColor: isDark ? colors.surfaceMuted : '#F3F4F6' }]}
                  onPress={() => setActivePickerTab('startDate')}
                >
                  <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                  <View>
                    <Text style={[styles.androidPickerLabel, { color: colors.textSecondary }]}>Start Date</Text>
                    <Text style={[styles.androidPickerValue, { color: colors.textPrimary }]}>{formatDate(startDate)}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.androidPickerButton, { backgroundColor: isDark ? colors.surfaceMuted : '#F3F4F6' }]}
                  onPress={() => setActivePickerTab('startTime')}
                >
                  <Ionicons name="time-outline" size={20} color={colors.primary} />
                  <View>
                    <Text style={[styles.androidPickerLabel, { color: colors.textSecondary }]}>Start Time</Text>
                    <Text style={[styles.androidPickerValue, { color: colors.textPrimary }]}>{formatTime(startTime)}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.androidPickerButton, { backgroundColor: isDark ? colors.surfaceMuted : '#F3F4F6' }]}
                  onPress={() => setActivePickerTab('endDate')}
                >
                  <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                  <View>
                    <Text style={[styles.androidPickerLabel, { color: colors.textSecondary }]}>End Date</Text>
                    <Text style={[styles.androidPickerValue, { color: colors.textPrimary }]}>{formatDate(endDate)}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.androidPickerButton, { backgroundColor: isDark ? colors.surfaceMuted : '#F3F4F6' }]}
                  onPress={() => setActivePickerTab('endTime')}
                >
                  <Ionicons name="time-outline" size={20} color={colors.primary} />
                  <View>
                    <Text style={[styles.androidPickerLabel, { color: colors.textSecondary }]}>End Time</Text>
                    <Text style={[styles.androidPickerValue, { color: colors.textPrimary }]}>{formatTime(endTime)}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Android Native Pickers (shown outside modal when tab is active) */}
      {Platform.OS === 'android' && showDateTimeModal && activePickerTab === 'startDate' && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            if (event.type === 'dismissed') {
              setActivePickerTab('startDate');
            } else if (date) {
              setStartDate(date);
              setActivePickerTab('startTime');
            }
          }}
          minimumDate={new Date()}
        />
      )}
      {Platform.OS === 'android' && showDateTimeModal && activePickerTab === 'startTime' && (
        <DateTimePicker
          value={startTime}
          mode="time"
          display="default"
          is24Hour={false}
          onChange={(event, date) => {
            if (event.type === 'dismissed') {
              setActivePickerTab('startTime');
            } else if (date) {
              setStartTime(date);
              setActivePickerTab('endDate');
            }
          }}
        />
      )}
      {Platform.OS === 'android' && showDateTimeModal && activePickerTab === 'endDate' && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            if (event.type === 'dismissed') {
              setActivePickerTab('endDate');
            } else if (date) {
              setEndDate(date);
              setActivePickerTab('endTime');
            }
          }}
          minimumDate={startDate}
        />
      )}
      {Platform.OS === 'android' && showDateTimeModal && activePickerTab === 'endTime' && (
        <DateTimePicker
          value={endTime}
          mode="time"
          display="default"
          is24Hour={false}
          onChange={(event, date) => {
            if (event.type === 'dismissed') {
              setActivePickerTab('endTime');
            } else if (date) {
              setEndTime(date);
              setShowDateTimeModal(false);
            }
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
    maxHeight: 200,
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
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
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
  },
  pickerModalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  pickerModalCancel: {
    fontSize: 16,
  },
  pickerModalDone: {
    fontSize: 16,
    fontWeight: '600',
  },
  iosPicker: {
    height: 200,
  },
  iosCalendarPicker: {
    height: 340,
  },
  dateTimeModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: '85%',
  },
  dateTimeTabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
    padding: 4,
  },
  dateTimeTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateTimeTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateTimeSummary: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  dateTimeSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateTimeSummaryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateTimeSummaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateTimePickerContainer: {
    alignItems: 'center',
  },
  androidPickerButtons: {
    padding: 16,
    gap: 12,
  },
  androidPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  androidPickerLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  androidPickerValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});
