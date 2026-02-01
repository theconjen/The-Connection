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
  Modal,
  Pressable,
  Switch,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { eventsAPI, communitiesAPI } from '../../src/lib/apiClient';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

interface Community {
  id: number;
  name: string;
  description: string;
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
  const { colors, colorScheme } = useTheme();
  const { user } = useAuth();
  const styles = getStyles(colors, colorScheme);

  // Only Janelle (app owner) can create events hosted by "The Connection" (no community)
  // Other community admins can create public events for their own communities
  const isAppOwner = user?.username === 'Janelle';

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
  const [flyerImage, setFlyerImage] = useState<string | null>(null); // Base64 image for event flyer

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

  // Event category/type
  const [category, setCategory] = useState<string | null>(null);

  // Modal state
  const [showCommunityPicker, setShowCommunityPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false); // End date picker for Conference
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Multi-day events (Conference category)
  const isMultiDayEvent = category === 'conference';

  // Keep end date >= start date when start date changes
  useEffect(() => {
    if (isMultiDayEvent && selectedEndDate < selectedDate) {
      setSelectedEndDate(selectedDate);
    }
  }, [selectedDate, isMultiDayEvent]);

  // Event categories
  const EVENT_CATEGORIES = [
    { value: 'sunday_service', label: 'Sunday Service', icon: 'sunny-outline' },
    { value: 'worship', label: 'Worship', icon: 'musical-notes-outline' },
    { value: 'bible_study', label: 'Bible Study', icon: 'book-outline' },
    { value: 'prayer', label: 'Prayer Meeting', icon: 'hand-left-outline' },
    { value: 'fellowship', label: 'Fellowship/Social', icon: 'people-outline' },
    { value: 'outreach', label: 'Service/Outreach', icon: 'heart-outline' },
    { value: 'conference', label: 'Conference', icon: 'mic-outline' },
    { value: 'youth', label: 'Youth Event', icon: 'school-outline' },
    { value: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
  ] as const;

  // Fetch user's communities (only where user is moderator or owner)
  const { data: communities, isLoading: communitiesLoading } = useQuery<Community[]>({
    queryKey: ['communities', 'canCreateEvents'],
    queryFn: async () => {
      const allCommunities = await communitiesAPI.getAll();
      // Filter to only communities where user is moderator or owner
      return allCommunities.filter((c: any) => {
        const role = c.role || c.userRole;
        return role === 'moderator' || role === 'owner';
      });
    },
  });

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

  // Handle image picker for event flyer
  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to add a flyer.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Allow full image without forced cropping
      quality: 0.8, // Good quality while keeping size reasonable
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        // Get the file extension
        const uri = asset.uri;
        const extension = uri.split('.').pop()?.toLowerCase() || 'jpeg';
        const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';

        // Create base64 data URL
        const base64Image = `data:${mimeType};base64,${asset.base64}`;
        setFlyerImage(base64Image);
      }
    }
  };

  // Remove selected flyer image
  const removeImage = () => {
    setFlyerImage(null);
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Log the payload for debugging
      console.info('[CreateEvent] Sending payload:', JSON.stringify(data, null, 2));
      const response = await eventsAPI.create(data);
      console.info('[CreateEvent] API Response:', JSON.stringify(response));
      return response;
    },
    onSuccess: (data) => {
      console.info('[CreateEvent] SUCCESS - Created event:', JSON.stringify(data));
      queryClient.invalidateQueries({ queryKey: ['events'] });
      if (selectedCommunityId) {
        queryClient.invalidateQueries({ queryKey: ['community-events', selectedCommunityId] });
      }
      Alert.alert('Success', `Event created! (ID: ${data?.id || 'unknown'})`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      // Extract detailed error message from backend
      const errorData = error.response?.data;
      let message = 'Failed to create event';

      if (errorData) {
        // Handle various error response formats
        if (errorData.error) {
          message = errorData.error;
        } else if (errorData.message) {
          message = errorData.message;
        } else if (errorData.details) {
          // Zod validation errors
          message = Array.isArray(errorData.details)
            ? errorData.details.map((d: any) => d.message || d).join(', ')
            : errorData.details;
        }
      }

      console.error('[CreateEvent] Error:', error.response?.status, errorData);
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
    // App owner can create events without a community (hosted by "The Connection")
    if (!selectedCommunityId && !isAppOwner) {
      Alert.alert('Error', 'Please select a community');
      return;
    }

    // Format date as YYYY-MM-DD
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

    // Format start time as HH:MM:SS
    const hours = selectedTime.getHours().toString().padStart(2, '0');
    const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
    const startTime = `${hours}:${minutes}:00`;

    // Format end time as HH:MM:SS
    const endHours = selectedEndTime.getHours().toString().padStart(2, '0');
    const endMinutes = selectedEndTime.getMinutes().toString().padStart(2, '0');
    const endTime = `${endHours}:${endMinutes}:00`;

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

    // Build payload - use null instead of undefined for optional fields
    // Zod schemas from Drizzle expect null for nullable fields, not undefined
    const payload: any = {
      title: title.trim(),
      description: description.trim(),
      eventDate,
      eventEndDate, // End date for multi-day events (Conference)
      startTime,
      endTime,
      isPublic,
      // IMPORTANT: Always include communityId - use null for "The Connection" events
      // Backend requires this field to be present (null is valid for app-owner events)
      communityId: selectedCommunityId,
    };

    // Add flyer image if selected
    if (flyerImage) {
      payload.imageUrl = flyerImage;
    }

    // Only add optional fields if they have values
    if (location.trim()) {
      payload.location = location.trim();
    }
    if (latitude !== undefined && longitude !== undefined) {
      // Backend expects latitude/longitude as strings (text columns)
      payload.latitude = String(latitude);
      payload.longitude = String(longitude);
    }
    if (category) {
      payload.category = category;
    }

    // Debug logging - show exactly what's being sent
    console.info('[CreateEvent] === PAYLOAD DEBUG ===');
    console.info('[CreateEvent] selectedCommunityId:', selectedCommunityId, '(type:', typeof selectedCommunityId, ')');
    console.info('[CreateEvent] isAppOwner:', isAppOwner);
    console.info('[CreateEvent] Full payload:', JSON.stringify(payload));

    createMutation.mutate(payload);
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
  const isTheConnectionSelected = selectedCommunityId === null && isAppOwner;

  // Form validation - check all required fields
  const isFormValid = (() => {
    // Title and description are required
    if (!title.trim() || !description.trim()) return false;

    // Community is required unless user is app owner
    if (!selectedCommunityId && !isAppOwner) return false;

    // Date must be today or in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) return false;

    return true;
  })();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Event</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          {/* Community Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{isAppOwner ? 'Host' : 'Community'} *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowCommunityPicker(true)}
              disabled={communitiesLoading || (!isAppOwner && communities && communities.length === 0)}
            >
              <Text style={[styles.pickerText, !selectedCommunity && !isTheConnectionSelected && styles.placeholderText]}>
                {communitiesLoading
                  ? 'Loading communities...'
                  : isTheConnectionSelected
                  ? 'The Connection'
                  : !isAppOwner && communities && communities.length === 0
                  ? 'No communities available'
                  : selectedCommunity
                  ? selectedCommunity.name
                  : isAppOwner
                  ? 'Select host...'
                  : 'Select a community'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
            </TouchableOpacity>
            {!isAppOwner && communities && communities.length === 0 && !communitiesLoading && (
              <Text style={styles.locationHint}>
                You must be a creator or moderator of a community to create events.
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
              placeholderTextColor={colors.textMuted}
              maxLength={100}
            />
          </View>

          {/* Event Type/Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Type</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowCategoryPicker(true)}
            >
              {category ? (
                <>
                  <Ionicons
                    name={EVENT_CATEGORIES.find(c => c.value === category)?.icon as any || 'calendar-outline'}
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.pickerText}>
                    {EVENT_CATEGORIES.find(c => c.value === category)?.label || 'Select type'}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="pricetag-outline" size={20} color={colors.textMuted} />
                  <Text style={[styles.pickerText, styles.placeholderText]}>Select event type</Text>
                </>
              )}
              <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
            </TouchableOpacity>
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

          {/* Event Flyer Image */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Flyer</Text>
            {flyerImage ? (
              <View style={styles.flyerPreviewContainer}>
                <Image source={{ uri: flyerImage }} style={styles.flyerPreview} />
                <View style={styles.flyerOverlay}>
                  <TouchableOpacity style={styles.flyerActionButton} onPress={pickImage}>
                    <Ionicons name="pencil" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.flyerActionButton, styles.flyerRemoveButton]} onPress={removeImage}>
                    <Ionicons name="trash" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.flyerUploadButton} onPress={pickImage}>
                <View style={styles.flyerUploadContent}>
                  <Ionicons name="image-outline" size={32} color={colors.primary} />
                  <Text style={[styles.flyerUploadText, { color: colors.textPrimary }]}>Add Event Flyer</Text>
                  <Text style={[styles.flyerUploadHint, { color: colors.textMuted }]}>
                    Tap to select an image from your library
                  </Text>
                </View>
              </TouchableOpacity>
            )}
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
                placeholderTextColor={colors.textMuted}
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
                  <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Location Suggestions */}
            {showLocationSuggestions && locationSuggestions.length > 0 && (
              <View style={[styles.suggestionsContainer, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
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
              </View>
            )}

            {selectedLocation ? (
              <Text style={[styles.locationHint, { color: colors.primary }]}>
                <Ionicons name="checkmark-circle" size={12} color={colors.primary} /> Location selected
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
            <Text style={styles.label}>{isMultiDayEvent ? 'Start Date *' : 'Date *'}</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={styles.pickerText}>{formatDate(selectedDate)}</Text>
            </TouchableOpacity>
          </View>

          {/* End Date Picker - Only for Conference (multi-day events) */}
          {isMultiDayEvent && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>End Date *</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                <Text style={styles.pickerText}>{formatDate(selectedEndDate)}</Text>
              </TouchableOpacity>
              <Text style={[styles.locationHint, { color: colors.textMuted, fontStyle: 'italic' }]}>
                Conferences typically span multiple days
              </Text>
            </View>
          )}

          {/* Start Time Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Start Time *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={styles.pickerText}>{formatTime(selectedTime)}</Text>
            </TouchableOpacity>
          </View>

          {/* End Time Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>End Time *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={styles.pickerText}>{formatTime(selectedEndTime)}</Text>
            </TouchableOpacity>
            {selectedEndTime <= selectedTime && (
              <Text style={[styles.locationHint, { color: colors.warning || '#f59e0b' }]}>
                End time should be after start time
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Create Button */}
      <View style={styles.footer}>
        {/* Validation hint */}
        {!isFormValid && (
          <Text style={[styles.validationHint, { color: colors.textMuted }]}>
            {!title.trim()
              ? 'Title is required'
              : !description.trim()
              ? 'Description is required'
              : !selectedCommunityId && !isAppOwner
              ? 'Please select a community'
              : 'Please fill in all required fields'}
          </Text>
        )}
        <TouchableOpacity
          style={[styles.createButton, (!isFormValid || createMutation.isPending || isGeocoding) && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={!isFormValid || createMutation.isPending || isGeocoding}
        >
          {createMutation.isPending || isGeocoding ? (
            <View style={styles.buttonLoadingContainer}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.createButtonText}>
                {isGeocoding ? 'Getting coordinates...' : 'Creating...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.createButtonText}>Create Event</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Community Picker Modal */}
      <Modal
        visible={showCommunityPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCommunityPicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCommunityPicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isAppOwner ? 'Select Host' : 'Select Community'}</Text>
              <TouchableOpacity onPress={() => setShowCommunityPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {/* "The Connection" option - only for app owner */}
              {isAppOwner && (
                <TouchableOpacity
                  style={[
                    styles.communityOption,
                    selectedCommunityId === null && styles.communityOptionSelected,
                    styles.theConnectionOption,
                  ]}
                  onPress={() => {
                    setSelectedCommunityId(null);
                    setShowCommunityPicker(false);
                  }}
                >
                  <View style={styles.communityInfo}>
                    <Text style={[styles.communityName, styles.theConnectionName]}>The Connection</Text>
                    <Text style={styles.communityDescription} numberOfLines={1}>
                      Official app-wide event hosted by The Connection
                    </Text>
                  </View>
                  {selectedCommunityId === null && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              {communities?.map((community) => (
                <TouchableOpacity
                  key={community.id}
                  style={[
                    styles.communityOption,
                    selectedCommunityId === community.id && styles.communityOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedCommunityId(community.id);
                    setShowCommunityPicker(false);
                  }}
                >
                  <View style={styles.communityInfo}>
                    <Text style={styles.communityName}>{community.name}</Text>
                    <Text style={styles.communityDescription} numberOfLines={1}>
                      {community.description}
                    </Text>
                  </View>
                  {selectedCommunityId === community.id && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCategoryPicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Event Type</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {EVENT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.communityOption,
                    category === cat.value && styles.communityOptionSelected,
                  ]}
                  onPress={() => {
                    setCategory(cat.value);
                    setShowCategoryPicker(false);
                  }}
                >
                  <View style={styles.categoryOptionContent}>
                    <Ionicons name={cat.icon as any} size={22} color={category === cat.value ? colors.primary : colors.textMuted} />
                    <Text style={[styles.communityName, category === cat.value && { color: colors.primary }]}>
                      {cat.label}
                    </Text>
                  </View>
                  {category === cat.value && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Date Picker - iOS: wrapped in Modal with Done button */}
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
                  <Text style={[styles.pickerModalButton, { color: colors.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerModalTitle}>{isMultiDayEvent ? 'Select Start Date' : 'Select Date'}</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={[styles.pickerModalButton, { color: colors.primary }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={{ paddingHorizontal: 12, paddingBottom: 16 }}>
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
                  style={{ height: 340 }}
                />
              </View>
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
            themeVariant={colorScheme}
            minimumDate={new Date()}
          />
        )
      )}

      {/* End Date Picker - iOS: wrapped in Modal with Done button (Conference only) */}
      {Platform.OS === 'ios' ? (
        <Modal
          visible={showEndDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowEndDatePicker(false)}
        >
          <Pressable
            style={styles.pickerModalOverlay}
            onPress={() => setShowEndDatePicker(false)}
          >
            <View style={styles.pickerModalContent}>
              <View style={styles.pickerModalHeader}>
                <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                  <Text style={[styles.pickerModalButton, { color: colors.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerModalTitle}>Select End Date</Text>
                <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                  <Text style={[styles.pickerModalButton, { color: colors.primary }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={{ paddingHorizontal: 12, paddingBottom: 16 }}>
                <DateTimePicker
                  value={selectedEndDate}
                  mode="date"
                  display="inline"
                  onChange={(event, date) => {
                    if (date) {
                      setSelectedEndDate(date);
                    }
                  }}
                  themeVariant={colorScheme}
                  minimumDate={selectedDate}
                  style={{ height: 340 }}
                />
              </View>
            </View>
          </Pressable>
        </Modal>
      ) : (
        showEndDatePicker && (
          <DateTimePicker
            value={selectedEndDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowEndDatePicker(false);
              if (date) {
                setSelectedEndDate(date);
              }
            }}
            themeVariant={colorScheme}
            minimumDate={selectedDate}
          />
        )
      )}

      {/* Start Time Picker - iOS: wrapped in Modal with Done button */}
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
                  <Text style={[styles.pickerModalButton, { color: colors.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerModalTitle}>Start Time</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={[styles.pickerModalButton, { color: colors.primary }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  display="spinner"
                  is24Hour={false}
                  onChange={(event, date) => {
                    if (date) {
                      setSelectedTime(date);
                      // Auto-update end time if it's before or equal to new start time
                      if (selectedEndTime <= date) {
                        const newEndTime = new Date(date);
                        newEndTime.setHours(newEndTime.getHours() + 1);
                        setSelectedEndTime(newEndTime);
                      }
                    }
                  }}
                  themeVariant={colorScheme}
                  style={{ height: 200 }}
                />
              </View>
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
                // Auto-update end time if it's before or equal to new start time
                if (selectedEndTime <= date) {
                  const newEndTime = new Date(date);
                  newEndTime.setHours(newEndTime.getHours() + 1);
                  setSelectedEndTime(newEndTime);
                }
              }
            }}
            themeVariant={colorScheme}
          />
        )
      )}

      {/* End Time Picker - iOS: wrapped in Modal with Done button */}
      {Platform.OS === 'ios' ? (
        <Modal
          visible={showEndTimePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowEndTimePicker(false)}
        >
          <Pressable
            style={styles.pickerModalOverlay}
            onPress={() => setShowEndTimePicker(false)}
          >
            <View style={styles.pickerModalContent}>
              <View style={styles.pickerModalHeader}>
                <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                  <Text style={[styles.pickerModalButton, { color: colors.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerModalTitle}>End Time</Text>
                <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                  <Text style={[styles.pickerModalButton, { color: colors.primary }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
                <DateTimePicker
                  value={selectedEndTime}
                  mode="time"
                  display="spinner"
                  is24Hour={false}
                  onChange={(event, date) => {
                    if (date) {
                      setSelectedEndTime(date);
                    }
                  }}
                  themeVariant={colorScheme}
                  style={{ height: 200 }}
                />
              </View>
            </View>
          </Pressable>
        </Modal>
      ) : (
        showEndTimePicker && (
          <DateTimePicker
            value={selectedEndTime}
            mode="time"
            display="default"
            is24Hour={false}
            onChange={(event, date) => {
              setShowEndTimePicker(false);
              if (date) {
                setSelectedEndTime(date);
              }
            }}
            themeVariant={colorScheme}
          />
        )
      )}
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: any, colorScheme: 'light' | 'dark') =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
    cancelText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.textPrimary,
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
    flyerPreviewContainer: {
      position: 'relative',
      borderRadius: 12,
      overflow: 'hidden',
    },
    flyerPreview: {
      width: '100%',
      height: 180,
      borderRadius: 12,
    },
    flyerOverlay: {
      position: 'absolute',
      top: 8,
      right: 8,
      flexDirection: 'row',
      gap: 8,
    },
    flyerActionButton: {
      backgroundColor: 'rgba(0,0,0,0.6)',
      borderRadius: 20,
      padding: 8,
    },
    flyerRemoveButton: {
      backgroundColor: 'rgba(239,68,68,0.9)',
    },
    flyerUploadButton: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.borderSubtle,
      borderStyle: 'dashed',
      paddingVertical: 32,
      paddingHorizontal: 16,
    },
    flyerUploadContent: {
      alignItems: 'center',
      gap: 8,
    },
    flyerUploadText: {
      fontSize: 16,
      fontWeight: '600',
    },
    flyerUploadHint: {
      fontSize: 13,
      textAlign: 'center',
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
    placeholderText: {
      color: colors.textMuted,
    },
    footer: {
      backgroundColor: colors.surface,
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
    },
    createButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
    },
    createButtonDisabled: {
      opacity: 0.6,
    },
    validationHint: {
      fontSize: 12,
      textAlign: 'center',
      marginBottom: 8,
    },
    createButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    buttonLoadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    locationHint: {
      fontSize: 12,
      color: colors.textMuted,
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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
      paddingBottom: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    modalList: {
      maxHeight: 400,
    },
    communityOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    communityOptionSelected: {
      backgroundColor: colorScheme === 'dark' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.05)',
    },
    communityInfo: {
      flex: 1,
      marginRight: 12,
    },
    communityName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    communityDescription: {
      fontSize: 14,
      color: colors.textMuted,
    },
    theConnectionOption: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    theConnectionName: {
      color: colors.primary,
    },
    categoryOptionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    // iOS Date/Time Picker Modal Styles
    pickerModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'flex-end',
    },
    pickerModalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingBottom: 20,
    },
    pickerModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    pickerModalTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    pickerModalButton: {
      fontSize: 16,
      fontWeight: '600',
    },
  });
