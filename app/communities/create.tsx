/**
 * Create Community Screen
 * Full-page form to create a new community
 * DARK MODE OPTIMIZED - All colors hardcoded for accessibility
 */

import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { communitiesAPI } from '../../src/lib/apiClient';
import { Ionicons } from '@expo/vector-icons';
import { geocodeAddress, getCurrentLocation, requestLocationPermission } from '../../src/lib/locationService';
import * as Location from 'expo-location';

// Dark Mode Color Constants - Single source of truth
const COLORS = {
  // Backgrounds
  background: '#0A0A0C',
  surface: '#151518',
  surfaceElevated: '#1A1A1E',
  surfaceDropdown: '#1E1E24',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#E8E4DC',
  textMuted: '#9A9A9A',
  textPlaceholder: '#6A6A6A',

  // Borders
  borderSubtle: '#2A2A30',
  borderVisible: '#3A3A42',
  borderFocus: '#D4A860',

  // Accents
  gold: '#D4A860',
  goldMuted: '#4A3D28',
  amber: '#2D2518',
  success: '#10B981',

  // Interactive
  chevron: '#8A8A8A',
  toggleTrackOff: '#3A3A42',
  toggleThumb: '#FFFFFF',
};

// Icon options for communities
const ICON_OPTIONS = [
  { value: 'people', label: 'Users', icon: 'people' },
  { value: 'book', label: 'Book', icon: 'book' },
  { value: 'heart', label: 'Heart', icon: 'heart' },
  { value: 'star', label: 'Star', icon: 'star' },
  { value: 'musical-notes', label: 'Music', icon: 'musical-notes' },
  { value: 'prism', label: 'Prism', icon: 'prism' },
  { value: 'pizza', label: 'Food', icon: 'pizza' },
  { value: 'fitness', label: 'Fitness', icon: 'fitness' },
];

// Color options for communities
const COLOR_OPTIONS = [
  { value: 'blue', label: 'Blue', color: '#4A90E2' },
  { value: 'purple', label: 'Purple', color: '#9B59B6' },
  { value: 'orange', label: 'Orange', color: '#E67E22' },
  { value: 'pink', label: 'Pink', color: '#E91E63' },
  { value: 'green', label: 'Green', color: '#10B981' },
  { value: 'yellow', label: 'Yellow', color: '#F59E0B' },
];

export default function CreateCommunityScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('people');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [isInviteOnly, setIsInviteOnly] = useState(false);
  const [wallSetting, setWallSetting] = useState<'public' | 'private'>('public');
  const [location, setLocation] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isGeocodingLocation, setIsGeocodingLocation] = useState(false);
  const [geocodedCoordinates, setGeocodedCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

  // Check if form is valid
  const isFormValid = name.trim().length >= 3 && description.trim().length >= 10;

  // Create community mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => {
      return communitiesAPI.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      Alert.alert(
        'Success',
        'Your community has been created!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    },
    onError: (error: any) => {
      console.error('Community creation error:', error);
      const errorMessage = error.response?.data?.message
        || error.response?.data?.error
        || error.message
        || 'Failed to create community. Please try again.';
      Alert.alert('Error Creating Community', errorMessage);
    },
  });

  const handleUseCurrentLocation = async () => {
    setIsGeocodingLocation(true);
    try {
      const granted = await requestLocationPermission();
      if (!granted) {
        Alert.alert('Permission Denied', 'Location permission is required to use your current location.');
        setIsGeocodingLocation(false);
        return;
      }

      const coords = await getCurrentLocation();
      if (!coords) {
        Alert.alert('Error', 'Could not get your current location. Please try again.');
        setIsGeocodingLocation(false);
        return;
      }

      const [result] = await Location.reverseGeocodeAsync(coords);
      if (result) {
        const address = [result.city, result.region].filter(Boolean).join(', ');
        setLocation(address || 'Current Location');
        setGeocodedCoordinates(coords);
        Alert.alert('Success', `Location set to: ${address || 'Current Location'}`);
      } else {
        setLocation('Current Location');
        setGeocodedCoordinates(coords);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Failed to get your current location. Please enter it manually.');
    } finally {
      setIsGeocodingLocation(false);
    }
  };

  const handleGeocodeLocation = async () => {
    if (!location.trim()) {
      setGeocodedCoordinates(null);
      return;
    }

    setIsGeocodingLocation(true);
    try {
      const result = await geocodeAddress(location.trim());
      if (result) {
        setGeocodedCoordinates(result.coordinates);
        Alert.alert('Location Confirmed', `Your community will be discoverable near: ${location.trim()}`);
      } else {
        Alert.alert(
          'Location Not Found',
          'We couldn\'t find this location. Please check the spelling or try a different location.',
          [
            { text: 'Keep Anyway', style: 'cancel' },
            { text: 'Clear', onPress: () => { setLocation(''); setGeocodedCoordinates(null); } }
          ]
        );
      }
    } catch (error) {
      console.error('Error geocoding location:', error);
      Alert.alert('Error', 'Failed to verify location. Please try again.');
    } finally {
      setIsGeocodingLocation(false);
    }
  };

  const handleCreate = async () => {
    if (!isFormValid) return;

    let finalCoordinates = geocodedCoordinates;

    if (location.trim() && !geocodedCoordinates) {
      setIsGeocodingLocation(true);
      try {
        const result = await geocodeAddress(location.trim());
        if (result) {
          finalCoordinates = result.coordinates;
          setGeocodedCoordinates(result.coordinates);
        } else {
          const shouldProceed = await new Promise<boolean>((resolve) => {
            Alert.alert(
              'Location Not Found',
              'We couldn\'t find this location. Create community without a discoverable location?',
              [
                { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Create Anyway', onPress: () => resolve(true) }
              ]
            );
          });

          if (!shouldProceed) {
            setIsGeocodingLocation(false);
            return;
          }
          setLocation('');
        }
      } catch (error) {
        console.error('Error geocoding location:', error);
        Alert.alert('Error', 'Failed to verify location. Your community will still be created.');
      } finally {
        setIsGeocodingLocation(false);
      }
    }

    const communityData = {
      name: name.trim(),
      description: description.trim(),
      iconName: selectedIcon,
      iconColor: selectedColor,
      privacySetting: wallSetting,
      isPrivate: isInviteOnly,
      location: location.trim() || undefined,
      latitude: finalCoordinates?.latitude,
      longitude: finalCoordinates?.longitude,
    };

    createMutation.mutate(communityData);
  };

  const handleCancel = () => {
    if (name.trim() || description.trim()) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const selectedIconData = ICON_OPTIONS.find(i => i.value === selectedIcon);
  const selectedColorData = COLOR_OPTIONS.find(c => c.value === selectedColor);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleCancel}
          disabled={createMutation.isPending}
          style={styles.headerButton}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.title}>DARK FIX V2</Text>

        <TouchableOpacity
          onPress={handleCreate}
          disabled={!isFormValid || createMutation.isPending}
          style={styles.headerButton}
        >
          {createMutation.isPending ? (
            <ActivityIndicator size="small" color={COLORS.gold} />
          ) : (
            <Text style={[
              styles.createText,
              (!isFormValid || createMutation.isPending) && styles.createTextDisabled
            ]}>
              Create
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Safety Warning Banner */}
        <View style={styles.warningBanner}>
          <Ionicons name="alert-circle" size={22} color={COLORS.gold} style={styles.warningIcon} />
          <Text style={styles.warningText}>
            For safety, avoid listing personal home addresses as meeting locations. Share only public meeting points or general areas.
          </Text>
        </View>

        {/* Community Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Community Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Bible Study Group"
            placeholderTextColor={COLORS.textPlaceholder}
            maxLength={100}
            editable={!createMutation.isPending}
            autoFocus
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="A community for those interested in studying the Bible together"
            placeholderTextColor={COLORS.textPlaceholder}
            multiline
            numberOfLines={6}
            maxLength={500}
            textAlignVertical="top"
            editable={!createMutation.isPending}
          />
        </View>

        {/* Location */}
        <View style={styles.inputGroup}>
          <View style={styles.locationHeader}>
            <Text style={styles.label}>Location (Optional)</Text>
            {geocodedCoordinates && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>

          <View style={styles.locationInputGroup}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, geocodedCoordinates && styles.inputVerified]}
                value={location}
                onChangeText={(text) => {
                  setLocation(text);
                  setGeocodedCoordinates(null);
                }}
                placeholder="e.g., Downtown Chicago, IL"
                placeholderTextColor={COLORS.textPlaceholder}
                maxLength={200}
                editable={!createMutation.isPending && !isGeocodingLocation}
              />
              {isGeocodingLocation && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="small" color={COLORS.gold} />
                </View>
              )}
            </View>

            <View style={styles.locationButtons}>
              <TouchableOpacity
                style={[styles.locationButton, { flex: 1 }]}
                onPress={handleUseCurrentLocation}
                disabled={createMutation.isPending || isGeocodingLocation}
              >
                <Ionicons name="navigate" size={16} color={COLORS.gold} />
                <Text style={styles.locationButtonText}>Use My Location</Text>
              </TouchableOpacity>

              {location.trim().length > 0 && !geocodedCoordinates && (
                <TouchableOpacity
                  style={[styles.locationButton, { flex: 1 }]}
                  onPress={handleGeocodeLocation}
                  disabled={createMutation.isPending || isGeocodingLocation}
                >
                  <Ionicons name="location" size={16} color={COLORS.gold} />
                  <Text style={styles.locationButtonText}>Verify Location</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.helpText}>
            {geocodedCoordinates
              ? 'Location verified! Your community will be discoverable by nearby users.'
              : 'Enter a general area or city. This helps people find communities near them.'}
          </Text>
        </View>

        {/* Icon and Color Row */}
        <View style={styles.row}>
          {/* Community Icon */}
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Community Icon</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowIconPicker(!showIconPicker)}
              disabled={createMutation.isPending}
            >
              <Ionicons
                name={selectedIconData?.icon as any}
                size={20}
                color={COLORS.textPrimary}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.pickerText}>{selectedIconData?.label}</Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.chevron} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
            {showIconPicker && (
              <View style={styles.pickerDropdown}>
                {ICON_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.pickerOption}
                    onPress={() => {
                      setSelectedIcon(option.value);
                      setShowIconPicker(false);
                    }}
                  >
                    <Ionicons name={option.icon as any} size={20} color={COLORS.textPrimary} />
                    <Text style={styles.pickerOptionText}>{option.label}</Text>
                    {selectedIcon === option.value && (
                      <Ionicons name="checkmark" size={20} color={COLORS.gold} style={{ marginLeft: 'auto' }} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Community Color */}
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Community Color</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowColorPicker(!showColorPicker)}
              disabled={createMutation.isPending}
            >
              <View style={[styles.colorDot, { backgroundColor: selectedColorData?.color }]} />
              <Text style={styles.pickerText}>{selectedColorData?.label}</Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.chevron} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
            {showColorPicker && (
              <View style={styles.pickerDropdown}>
                {COLOR_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.pickerOption}
                    onPress={() => {
                      setSelectedColor(option.value);
                      setShowColorPicker(false);
                    }}
                  >
                    <View style={[styles.colorDot, { backgroundColor: option.color }]} />
                    <Text style={styles.pickerOptionText}>{option.label}</Text>
                    {selectedColor === option.value && (
                      <Ionicons name="checkmark" size={20} color={COLORS.gold} style={{ marginLeft: 'auto' }} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Invite Only Toggle */}
        <View style={styles.toggleSection}>
          <View style={styles.toggleContent}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Invite Only Community</Text>
              <Text style={styles.toggleDescription}>
                {isInviteOnly
                  ? 'Only invited members can join this community'
                  : 'Anyone can discover and join this community freely'}
              </Text>
            </View>
            <Switch
              value={isInviteOnly}
              onValueChange={setIsInviteOnly}
              trackColor={{ false: COLORS.toggleTrackOff, true: COLORS.gold }}
              thumbColor={COLORS.toggleThumb}
              ios_backgroundColor={COLORS.toggleTrackOff}
              disabled={createMutation.isPending}
            />
          </View>
        </View>

        {/* Community Wall Settings */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Community Wall Settings</Text>
          <View style={styles.wallOptions}>
            <TouchableOpacity
              style={[
                styles.wallOption,
                wallSetting === 'public' && styles.wallOptionActive
              ]}
              onPress={() => setWallSetting('public')}
              disabled={createMutation.isPending}
            >
              <Text style={[
                styles.wallOptionText,
                wallSetting === 'public' && styles.wallOptionTextActive
              ]}>
                Public Wall
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.wallOption,
                wallSetting === 'private' && styles.wallOptionActive
              ]}
              onPress={() => setWallSetting('private')}
              disabled={createMutation.isPending}
            >
              <Text style={[
                styles.wallOptionText,
                wallSetting === 'private' && styles.wallOptionTextActive
              ]}>
                Private Wall
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helpText}>
            Wall settings control where members can post content within the community.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Container & Layout
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  headerButton: {
    minWidth: 60,
  },
  cancelText: {
    fontSize: 17,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  createText: {
    fontSize: 17,
    color: COLORS.gold,
    fontWeight: '600',
    textAlign: 'right',
  },
  createTextDisabled: {
    color: '#5A5A5A',
    opacity: 0.6,
  },

  // Safety Warning Banner
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.amber,
    borderRadius: 12,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
  },
  warningIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gold,
    lineHeight: 20,
    fontWeight: '500',
  },

  // Form Sections
  inputGroup: {
    marginBottom: 28,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 10,
    letterSpacing: 0.2,
  },

  // Input Fields
  input: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1.5,
    borderColor: COLORS.borderVisible,
  },
  inputVerified: {
    borderColor: COLORS.success,
    borderWidth: 2,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 16,
  },

  // Helper Text
  helpText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 10,
    lineHeight: 18,
  },

  // Location Section
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '600',
  },
  locationInputGroup: {
    gap: 8,
  },
  inputWrapper: {
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  locationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
  },
  locationButtonText: {
    fontSize: 14,
    color: COLORS.gold,
    fontWeight: '600',
  },

  // Layout
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  halfWidth: {
    flex: 1,
    marginBottom: 0,
  },

  // Dropdowns / Pickers
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.borderVisible,
  },
  pickerText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  pickerDropdown: {
    backgroundColor: COLORS.surfaceDropdown,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.borderVisible,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  pickerOptionText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },

  // Toggle Section
  toggleSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 18,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  toggleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  toggleDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },

  // Wall Options
  wallOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  wallOption: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.borderVisible,
    alignItems: 'center',
  },
  wallOptionActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  wallOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  wallOptionTextActive: {
    color: COLORS.background,
  },
});
