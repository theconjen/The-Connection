/**
 * Create Community Screen
 * Full-page form to create a new community
 * Uses dynamic theming from ThemeContext
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
import { useTheme } from '../../src/contexts/ThemeContext';

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
  const { colors, colorScheme } = useTheme();
  const styles = getThemedStyles(colors, colorScheme);

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

  const isFormValid = name.trim().length >= 3 && description.trim().length >= 10;

  const createMutation = useMutation({
    mutationFn: (data: any) => communitiesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      Alert.alert('Success', 'Your community has been created!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
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
        Alert.alert('Location Not Found', 'We couldn\'t find this location.', [
          { text: 'Keep Anyway', style: 'cancel' },
          { text: 'Clear', onPress: () => { setLocation(''); setGeocodedCoordinates(null); } }
        ]);
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
            Alert.alert('Location Not Found', 'Create community without a discoverable location?', [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Create Anyway', onPress: () => resolve(true) }
            ]);
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

    createMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      iconName: selectedIcon,
      iconColor: selectedColor,
      privacySetting: wallSetting,
      isPrivate: isInviteOnly,
      location: location.trim() || undefined,
      latitude: finalCoordinates?.latitude,
      longitude: finalCoordinates?.longitude,
    });
  };

  const handleCancel = () => {
    if (name.trim() || description.trim()) {
      Alert.alert('Discard Changes', 'Are you sure you want to discard your changes?', [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  const selectedIconData = ICON_OPTIONS.find(i => i.value === selectedIcon);
  const selectedColorData = COLOR_OPTIONS.find(c => c.value === selectedColor);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} disabled={createMutation.isPending} style={styles.headerButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Community</Text>
        <TouchableOpacity onPress={handleCreate} disabled={!isFormValid || createMutation.isPending} style={styles.headerButton}>
          {createMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Text style={[styles.createText, (!isFormValid || createMutation.isPending) && styles.createTextDisabled]}>
              Create
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Safety Warning Banner */}
        <View style={styles.warningBanner}>
          <Ionicons name="alert-circle" size={22} color={colorScheme === 'dark' ? '#F59E0B' : '#B26A00'} style={styles.warningIcon} />
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
            placeholderTextColor={colors.textTertiary}
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
            placeholderTextColor={colors.textTertiary}
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
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
          <View style={styles.locationInputGroup}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, geocodedCoordinates && styles.inputVerified]}
                value={location}
                onChangeText={(text) => { setLocation(text); setGeocodedCoordinates(null); }}
                placeholder="e.g., Downtown Chicago, IL"
                placeholderTextColor={colors.textTertiary}
                maxLength={200}
                editable={!createMutation.isPending && !isGeocodingLocation}
              />
              {isGeocodingLocation && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="small" color={colors.accent} />
                </View>
              )}
            </View>
            <View style={styles.locationButtons}>
              <TouchableOpacity style={styles.locationButton} onPress={handleUseCurrentLocation} disabled={createMutation.isPending || isGeocodingLocation}>
                <Ionicons name="navigate" size={16} color={colors.accent} />
                <Text style={styles.locationButtonText}>Use My Location</Text>
              </TouchableOpacity>
              {location.trim().length > 0 && !geocodedCoordinates && (
                <TouchableOpacity style={styles.locationButton} onPress={handleGeocodeLocation} disabled={createMutation.isPending || isGeocodingLocation}>
                  <Ionicons name="location" size={16} color={colors.accent} />
                  <Text style={styles.locationButtonText}>Verify Location</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <Text style={styles.helpText}>
            {geocodedCoordinates ? 'Location verified! Your community will be discoverable by nearby users.' : 'Enter a general area or city. This helps people find communities near them.'}
          </Text>
        </View>

        {/* Icon and Color Row */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Community Icon</Text>
            <TouchableOpacity style={styles.picker} onPress={() => setShowIconPicker(!showIconPicker)} disabled={createMutation.isPending}>
              <Ionicons name={selectedIconData?.icon as any} size={20} color={colors.textPrimary} style={{ marginRight: 8 }} />
              <Text style={styles.pickerText}>{selectedIconData?.label}</Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
            {showIconPicker && (
              <View style={styles.pickerDropdown}>
                {ICON_OPTIONS.map((option) => (
                  <TouchableOpacity key={option.value} style={styles.pickerOption} onPress={() => { setSelectedIcon(option.value); setShowIconPicker(false); }}>
                    <Ionicons name={option.icon as any} size={20} color={colors.textPrimary} />
                    <Text style={styles.pickerOptionText}>{option.label}</Text>
                    {selectedIcon === option.value && <Ionicons name="checkmark" size={20} color={colors.accent} style={{ marginLeft: 'auto' }} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Community Color</Text>
            <TouchableOpacity style={styles.picker} onPress={() => setShowColorPicker(!showColorPicker)} disabled={createMutation.isPending}>
              <View style={[styles.colorDot, { backgroundColor: selectedColorData?.color }]} />
              <Text style={styles.pickerText}>{selectedColorData?.label}</Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
            {showColorPicker && (
              <View style={styles.pickerDropdown}>
                {COLOR_OPTIONS.map((option) => (
                  <TouchableOpacity key={option.value} style={styles.pickerOption} onPress={() => { setSelectedColor(option.value); setShowColorPicker(false); }}>
                    <View style={[styles.colorDot, { backgroundColor: option.color }]} />
                    <Text style={styles.pickerOptionText}>{option.label}</Text>
                    {selectedColor === option.value && <Ionicons name="checkmark" size={20} color={colors.accent} style={{ marginLeft: 'auto' }} />}
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
                {isInviteOnly ? 'Only invited members can join this community' : 'Anyone can discover and join this community freely'}
              </Text>
            </View>
            <Switch
              value={isInviteOnly}
              onValueChange={setIsInviteOnly}
              trackColor={{ false: colors.borderSoft, true: colors.accent }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={colors.borderSoft}
              disabled={createMutation.isPending}
            />
          </View>
        </View>

        {/* Community Wall Settings */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Community Wall Settings</Text>
          <View style={styles.wallOptions}>
            <TouchableOpacity style={[styles.wallOption, wallSetting === 'public' && styles.wallOptionActive]} onPress={() => setWallSetting('public')} disabled={createMutation.isPending}>
              <Text style={[styles.wallOptionText, wallSetting === 'public' && styles.wallOptionTextActive]}>Public Wall</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.wallOption, wallSetting === 'private' && styles.wallOptionActive]} onPress={() => setWallSetting('private')} disabled={createMutation.isPending}>
              <Text style={[styles.wallOptionText, wallSetting === 'private' && styles.wallOptionTextActive]}>Private Wall</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helpText}>Wall settings control where members can post content within the community.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getThemedStyles = (colors: any, colorScheme: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerButton: {
    minWidth: 60,
  },
  cancelText: {
    fontSize: 17,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  createText: {
    fontSize: 17,
    color: colors.accent,
    fontWeight: '600',
    textAlign: 'right',
  },
  createTextDisabled: {
    color: colors.textTertiary,
    opacity: 0.6,
  },
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: colorScheme === 'dark' ? '#2D2518' : '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? '#4A3C20' : '#FDE68A',
  },
  warningIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: colorScheme === 'dark' ? '#FCD34D' : '#92400E',
    lineHeight: 20,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 28,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
  },
  inputVerified: {
    borderColor: colors.success,
    borderWidth: 2,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 16,
  },
  helpText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 10,
    lineHeight: 18,
  },
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
    color: colors.success,
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  locationButtonText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  halfWidth: {
    flex: 1,
    marginBottom: 0,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
  },
  pickerText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  pickerDropdown: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  pickerOptionText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  toggleSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 18,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
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
    color: colors.textPrimary,
    marginBottom: 6,
  },
  toggleDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  wallOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  wallOption: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.borderSoft,
    alignItems: 'center',
  },
  wallOptionActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  wallOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  wallOptionTextActive: {
    color: '#FFFFFF',
  },
  success: colors.success,
});
