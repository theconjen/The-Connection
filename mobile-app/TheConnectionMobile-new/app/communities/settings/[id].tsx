/**
 * Community Settings Screen
 * Allows admins to edit community details
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../../src/lib/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { geocodeAddress, getCurrentLocation, requestLocationPermission } from '../../../src/lib/locationService';
import * as Location from 'expo-location';

// Icon options for communities - includes seeded community icons
const ICON_OPTIONS = [
  { value: 'people', label: 'Users', icon: 'people' },
  { value: 'person', label: 'Person', icon: 'person' },
  { value: 'book', label: 'Book', icon: 'book' },
  { value: 'heart', label: 'Heart', icon: 'heart' },
  { value: 'heart-circle', label: 'Heart Circle', icon: 'heart-circle' },
  { value: 'star', label: 'Star', icon: 'star' },
  { value: 'musical-notes', label: 'Music', icon: 'musical-notes' },
  { value: 'prism', label: 'Prism', icon: 'prism' },
  { value: 'pizza', label: 'Food', icon: 'pizza' },
  { value: 'fitness', label: 'Fitness', icon: 'fitness' },
  { value: 'briefcase', label: 'Work', icon: 'briefcase' },
  { value: 'school', label: 'School', icon: 'school' },
  { value: 'medical', label: 'Medical', icon: 'medical' },
  { value: 'airplane', label: 'Travel', icon: 'airplane' },
  { value: 'hand-right', label: 'Prayer', icon: 'hand-right' },
  { value: 'trail-sign', label: 'Outdoors', icon: 'trail-sign' },
  { value: 'hardware-chip', label: 'Tech', icon: 'hardware-chip' },
  { value: 'shield', label: 'Shield', icon: 'shield' },
  { value: 'color-palette', label: 'Arts', icon: 'color-palette' },
];

// Color options for communities - includes seeded community colors
const COLOR_OPTIONS = [
  { value: '#4A90E2', label: 'Blue' },
  { value: '#2563EB', label: 'Royal Blue' },
  { value: '#3B82F6', label: 'Sky Blue' },
  { value: '#9B59B6', label: 'Purple' },
  { value: '#8B5CF6', label: 'Violet' },
  { value: '#7C3AED', label: 'Grape' },
  { value: '#4F46E5', label: 'Indigo' },
  { value: '#E67E22', label: 'Orange' },
  { value: '#D97706', label: 'Amber' },
  { value: '#F59E0B', label: 'Yellow' },
  { value: '#E91E63', label: 'Pink' },
  { value: '#EC4899', label: 'Hot Pink' },
  { value: '#DB2777', label: 'Magenta' },
  { value: '#E11D48', label: 'Rose' },
  { value: '#EF4444', label: 'Red' },
  { value: '#DC2626', label: 'Crimson' },
  { value: '#10B981', label: 'Green' },
  { value: '#059669', label: 'Emerald' },
  { value: '#14B8A6', label: 'Teal' },
];

// Helper to find color label or return "Custom"
function getColorLabel(hexColor: string): string {
  const normalizedHex = hexColor?.toUpperCase();
  const match = COLOR_OPTIONS.find(c => c.value.toUpperCase() === normalizedHex);
  return match?.label || 'Custom';
}

export default function CommunitySettingsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams() as { id: string };
  const communityId = parseInt(id || '0');
  const queryClient = useQueryClient();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('people');
  const [selectedColor, setSelectedColor] = useState('#4A90E2');
  const [isInviteOnly, setIsInviteOnly] = useState(false);
  const [location, setLocation] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isGeocodingLocation, setIsGeocodingLocation] = useState(false);
  const [geocodedCoordinates, setGeocodedCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch community data
  const { data: community, isLoading } = useQuery({
    queryKey: ['community', communityId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/communities/${communityId}`);
      return response.data;
    },
    enabled: !!communityId,
  });

  // Initialize form with community data
  useEffect(() => {
    if (community) {
      setName(community.name || '');
      setDescription(community.description || '');
      setSelectedIcon(community.iconName || 'people');
      setSelectedColor(community.iconColor || '#4A90E2');
      setIsInviteOnly(community.isPrivate || false);
      const locationStr = [community.city, community.state].filter(Boolean).join(', ');
      setLocation(locationStr);
      if (community.latitude && community.longitude) {
        setGeocodedCoordinates({
          latitude: parseFloat(community.latitude),
          longitude: parseFloat(community.longitude),
        });
      }
    }
  }, [community]);

  // Check if form is valid
  const isFormValid = name.trim().length >= 3 && description.trim().length >= 10;

  // Update community mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.patch(`/api/communities/${communityId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      Alert.alert('Success', 'Community settings updated!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to update community.';
      Alert.alert('Error', errorMessage);
    },
  });

  // Delete community mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete(`/api/communities/${communityId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      Alert.alert('Deleted', 'Community has been deleted.', [
        { text: 'OK', onPress: () => router.replace('/communities') },
      ]);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to delete community.';
      Alert.alert('Error', errorMessage);
    },
  });

  const handleUseCurrentLocation = async () => {
    setIsGeocodingLocation(true);
    try {
      const granted = await requestLocationPermission();
      if (!granted) {
        Alert.alert('Permission Denied', 'Location permission is required.');
        setIsGeocodingLocation(false);
        return;
      }

      const coords = await getCurrentLocation();
      if (!coords) {
        Alert.alert('Error', 'Could not get your current location.');
        setIsGeocodingLocation(false);
        return;
      }

      const [result] = await Location.reverseGeocodeAsync(coords);
      if (result) {
        const address = [result.city, result.region].filter(Boolean).join(', ');
        setLocation(address || 'Current Location');
        setGeocodedCoordinates(coords);
        setHasChanges(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get location.');
    } finally {
      setIsGeocodingLocation(false);
    }
  };

  const handleSave = async () => {
    if (!isFormValid) return;

    let finalCoordinates = geocodedCoordinates;

    // Geocode location if changed and not verified
    if (location.trim() && !geocodedCoordinates) {
      setIsGeocodingLocation(true);
      try {
        const result = await geocodeAddress(location.trim());
        if (result) {
          finalCoordinates = result.coordinates;
        }
      } catch (error) {
        console.error('Error geocoding:', error);
      } finally {
        setIsGeocodingLocation(false);
      }
    }

    // Parse city and state from location string
    const locationParts = location.split(',').map(s => s.trim());
    const city = locationParts[0] || undefined;
    const state = locationParts[1] || undefined;

    const updateData = {
      name: name.trim(),
      description: description.trim(),
      iconName: selectedIcon,
      iconColor: selectedColor,
      isPrivate: isInviteOnly,
      city,
      state,
      latitude: finalCoordinates?.latitude?.toString(),
      longitude: finalCoordinates?.longitude?.toString(),
    };

    updateMutation.mutate(updateData);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Community',
      'Are you sure you want to delete this community? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ]
    );
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert('Discard Changes?', 'You have unsaved changes.', [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  const selectedIconData = ICON_OPTIONS.find(i => i.value === selectedIcon);
  // Case-insensitive color matching
  const normalizedSelectedColor = selectedColor?.toUpperCase();
  const selectedColorData = COLOR_OPTIONS.find(c => c.value.toUpperCase() === normalizedSelectedColor);

  // Dynamic styles
  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    header: { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle },
    headerTitle: { color: colors.textPrimary },
    cancelText: { color: colors.textSecondary },
    saveText: { color: colors.primary },
    label: { color: colors.textPrimary },
    input: {
      backgroundColor: isDark ? colors.surfaceMuted : colors.surface,
      borderColor: colors.border,
      color: colors.textPrimary,
    },
    helpText: { color: colors.textSecondary },
    picker: {
      backgroundColor: isDark ? colors.surfaceMuted : colors.surface,
      borderColor: colors.border,
    },
    pickerText: { color: colors.textPrimary },
    pickerDropdown: {
      backgroundColor: isDark ? '#1E1E24' : colors.surface,
      borderColor: colors.border,
    },
    toggleSection: {
      backgroundColor: isDark ? colors.surfaceMuted : colors.surface,
      borderColor: colors.borderSubtle,
    },
    toggleLabel: { color: colors.textPrimary },
    toggleDescription: { color: colors.textSecondary },
    dangerSection: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
      borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA',
    },
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, dynamicStyles.container]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, dynamicStyles.container]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, dynamicStyles.header]}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Community Settings</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!isFormValid || updateMutation.isPending}
          style={styles.headerButton}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.saveText, dynamicStyles.saveText, !isFormValid && styles.saveTextDisabled]}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Community Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, dynamicStyles.label]}>Community Name</Text>
          <TextInput
            style={[styles.input, dynamicStyles.input]}
            value={name}
            onChangeText={(text) => { setName(text); setHasChanges(true); }}
            placeholder="Community name"
            placeholderTextColor={colors.textSecondary}
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, dynamicStyles.label]}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, dynamicStyles.input]}
            value={description}
            onChangeText={(text) => { setDescription(text); setHasChanges(true); }}
            placeholder="Describe your community"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
        </View>

        {/* Location */}
        <View style={styles.inputGroup}>
          <View style={styles.locationHeader}>
            <Text style={[styles.label, dynamicStyles.label]}>Location</Text>
            {geocodedCoordinates && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>

          <TextInput
            style={[styles.input, dynamicStyles.input]}
            value={location}
            onChangeText={(text) => {
              setLocation(text);
              setGeocodedCoordinates(null);
              setHasChanges(true);
            }}
            placeholder="City, State"
            placeholderTextColor={colors.textSecondary}
            maxLength={200}
          />

          <TouchableOpacity
            style={[styles.locationButton, { borderColor: colors.primary }]}
            onPress={handleUseCurrentLocation}
            disabled={isGeocodingLocation}
          >
            {isGeocodingLocation ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="navigate" size={16} color={colors.primary} />
                <Text style={[styles.locationButtonText, { color: colors.primary }]}>Use My Location</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Icon */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, dynamicStyles.label]}>Community Icon</Text>
          <TouchableOpacity
            style={[styles.picker, dynamicStyles.picker]}
            onPress={() => setShowIconPicker(!showIconPicker)}
          >
            <Ionicons name={selectedIconData?.icon as any} size={20} color={colors.textPrimary} />
            <Text style={[styles.pickerText, dynamicStyles.pickerText, { marginLeft: 8 }]}>
              {selectedIconData?.label}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          {showIconPicker && (
            <View style={[styles.pickerDropdown, dynamicStyles.pickerDropdown]}>
              {ICON_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.pickerOption}
                  onPress={() => {
                    setSelectedIcon(option.value);
                    setShowIconPicker(false);
                    setHasChanges(true);
                  }}
                >
                  <Ionicons name={option.icon as any} size={20} color={colors.textPrimary} />
                  <Text style={[styles.pickerOptionText, { color: colors.textPrimary }]}>{option.label}</Text>
                  {selectedIcon === option.value && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} style={{ marginLeft: 'auto' }} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Color */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, dynamicStyles.label]}>Community Color</Text>
          <TouchableOpacity
            style={[styles.picker, dynamicStyles.picker]}
            onPress={() => setShowColorPicker(!showColorPicker)}
          >
            <View style={[styles.colorDot, { backgroundColor: selectedColor }]} />
            <Text style={[styles.pickerText, dynamicStyles.pickerText, { marginLeft: 8 }]}>
              {selectedColorData?.label || 'Custom'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          {showColorPicker && (
            <View style={[styles.pickerDropdown, dynamicStyles.pickerDropdown]}>
              {COLOR_OPTIONS.map((option) => {
                const isSelected = selectedColor?.toUpperCase() === option.value.toUpperCase();
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.pickerOption, isSelected && { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.05)' }]}
                    onPress={() => {
                      setSelectedColor(option.value);
                      setShowColorPicker(false);
                      setHasChanges(true);
                    }}
                  >
                    <View style={[styles.colorDot, { backgroundColor: option.value }]} />
                    <Text style={[styles.pickerOptionText, { color: colors.textPrimary }]}>{option.label}</Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} style={{ marginLeft: 'auto' }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Invite Only Toggle */}
        <View style={[styles.toggleSection, dynamicStyles.toggleSection]}>
          <View style={styles.toggleContent}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, dynamicStyles.toggleLabel]}>Invite Only</Text>
              <Text style={[styles.toggleDescription, dynamicStyles.toggleDescription]}>
                {isInviteOnly
                  ? 'Only invited members can join'
                  : 'Anyone can discover and join'}
              </Text>
            </View>
            <Switch
              value={isInviteOnly}
              onValueChange={(value) => { setIsInviteOnly(value); setHasChanges(true); }}
              trackColor={{ false: colors.borderSubtle, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={[styles.dangerSection, dynamicStyles.dangerSection]}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <Text style={styles.dangerDescription}>
            Once you delete a community, there is no going back. Please be certain.
          </Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text style={styles.deleteButtonText}>Delete Community</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    minWidth: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveText: {
    fontSize: 17,
    fontWeight: '600',
  },
  saveTextDisabled: {
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
    borderWidth: 1.5,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  pickerText: {
    fontSize: 16,
    fontWeight: '500',
  },
  pickerDropdown: {
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  pickerOptionText: {
    fontSize: 16,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  toggleSection: {
    borderRadius: 12,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
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
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
  },
  dangerSection: {
    borderRadius: 12,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 8,
  },
  dangerDescription: {
    fontSize: 14,
    color: '#B91C1C',
    marginBottom: 16,
    lineHeight: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    padding: 14,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
