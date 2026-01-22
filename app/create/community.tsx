/**
 * Create Community Screen
 * Full-page form to create a new community
 * Theme-aware - uses ThemeContext for light/dark mode
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
import { useTheme } from '../../src/contexts/ThemeContext';
import * as Location from 'expo-location';

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
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create community.';
      Alert.alert('Error Creating Community', errorMessage);
    },
  });

  const handleUseCurrentLocation = async () => {
    setIsGeocodingLocation(true);
    try {
      const granted = await requestLocationPermission();
      if (!granted) {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }
      const coords = await getCurrentLocation();
      if (!coords) {
        Alert.alert('Error', 'Could not get your current location.');
        return;
      }
      const [result] = await Location.reverseGeocodeAsync(coords);
      const address = result ? [result.city, result.region].filter(Boolean).join(', ') : 'Current Location';
      setLocation(address);
      setGeocodedCoordinates(coords);
      Alert.alert('Success', `Location set to: ${address}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to get location.');
    } finally {
      setIsGeocodingLocation(false);
    }
  };

  const handleGeocodeLocation = async () => {
    if (!location.trim()) return;
    setIsGeocodingLocation(true);
    try {
      const result = await geocodeAddress(location.trim());
      if (result) {
        setGeocodedCoordinates(result.coordinates);
        Alert.alert('Location Confirmed', `Your community will be discoverable near: ${location.trim()}`);
      } else {
        Alert.alert('Location Not Found', 'Could not find this location.', [
          { text: 'Keep Anyway', style: 'cancel' },
          { text: 'Clear', onPress: () => { setLocation(''); setGeocodedCoordinates(null); } }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify location.');
    } finally {
      setIsGeocodingLocation(false);
    }
  };

  const handleCreate = async () => {
    if (!isFormValid) return;
    let finalCoordinates = geocodedCoordinates;
    if (location.trim() && !geocodedCoordinates) {
      const result = await geocodeAddress(location.trim());
      if (result) finalCoordinates = result.coordinates;
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
      Alert.alert('Discard Changes', 'Are you sure?', [
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
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Community</Text>
        <TouchableOpacity onPress={handleCreate} disabled={!isFormValid || createMutation.isPending} style={styles.headerButton}>
          {createMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Text style={[styles.createText, !isFormValid && styles.createTextDisabled]}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.warningBanner}>
          <Ionicons name="alert-circle" size={22} color={colors.warning || '#B26A00'} style={{ marginRight: 12 }} />
          <Text style={styles.warningText}>For safety, avoid listing personal addresses. Share only public locations.</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Community Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Bible Study Group" placeholderTextColor={colors.textMuted} maxLength={100} autoFocus />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="A community for studying the Bible together" placeholderTextColor={colors.textMuted} multiline numberOfLines={6} maxLength={500} textAlignVertical="top" />
        </View>

        <View style={styles.inputGroup}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={styles.label}>Location (Optional)</Text>
            {geocodedCoordinates && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={{ color: colors.success, fontSize: 13, fontWeight: '600' }}>Verified</Text>
              </View>
            )}
          </View>
          <TextInput style={styles.input} value={location} onChangeText={(t) => { setLocation(t); setGeocodedCoordinates(null); }} placeholder="e.g., Downtown Chicago, IL" placeholderTextColor={colors.textMuted} maxLength={200} />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TouchableOpacity style={styles.locationButton} onPress={handleUseCurrentLocation} disabled={isGeocodingLocation}>
              <Ionicons name="navigate" size={16} color={colors.accent} />
              <Text style={{ color: colors.accent, fontWeight: '600', fontSize: 14 }}>Use My Location</Text>
            </TouchableOpacity>
            {location.trim() && !geocodedCoordinates && (
              <TouchableOpacity style={styles.locationButton} onPress={handleGeocodeLocation} disabled={isGeocodingLocation}>
                <Ionicons name="location" size={16} color={colors.accent} />
                <Text style={{ color: colors.accent, fontWeight: '600', fontSize: 14 }}>Verify</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.helpText}>{geocodedCoordinates ? 'Location verified!' : 'Enter a general area to help people find your community.'}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 28 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Community Icon</Text>
            <TouchableOpacity style={styles.picker} onPress={() => setShowIconPicker(!showIconPicker)}>
              <Ionicons name={selectedIconData?.icon as any} size={20} color={colors.textPrimary} style={{ marginRight: 8 }} />
              <Text style={{ color: colors.textPrimary, fontSize: 16 }}>{selectedIconData?.label}</Text>
              <Ionicons name="chevron-down" size={20} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
            {showIconPicker && (
              <View style={styles.dropdown}>
                {ICON_OPTIONS.map((opt) => (
                  <TouchableOpacity key={opt.value} style={styles.dropdownItem} onPress={() => { setSelectedIcon(opt.value); setShowIconPicker(false); }}>
                    <Ionicons name={opt.icon as any} size={20} color={colors.textPrimary} />
                    <Text style={{ color: colors.textPrimary, fontSize: 16 }}>{opt.label}</Text>
                    {selectedIcon === opt.value && <Ionicons name="checkmark" size={20} color={colors.accent} style={{ marginLeft: 'auto' }} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Community Color</Text>
            <TouchableOpacity style={styles.picker} onPress={() => setShowColorPicker(!showColorPicker)}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: selectedColorData?.color, marginRight: 8 }} />
              <Text style={{ color: colors.textPrimary, fontSize: 16 }}>{selectedColorData?.label}</Text>
              <Ionicons name="chevron-down" size={20} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
            {showColorPicker && (
              <View style={styles.dropdown}>
                {COLOR_OPTIONS.map((opt) => (
                  <TouchableOpacity key={opt.value} style={styles.dropdownItem} onPress={() => { setSelectedColor(opt.value); setShowColorPicker(false); }}>
                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: opt.color }} />
                    <Text style={{ color: colors.textPrimary, fontSize: 16 }}>{opt.label}</Text>
                    {selectedColor === opt.value && <Ionicons name="checkmark" size={20} color={colors.accent} style={{ marginLeft: 'auto' }} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.toggleSection}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 6 }}>Invite Only Community</Text>
            <Text style={{ fontSize: 14, color: colors.textMuted }}>{isInviteOnly ? 'Only invited members can join' : 'Anyone can discover and join'}</Text>
          </View>
          <Switch value={isInviteOnly} onValueChange={setIsInviteOnly} trackColor={{ false: colors.surfaceMuted, true: colors.accent }} thumbColor="#FFF" ios_backgroundColor={colors.surfaceMuted} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Community Wall Settings</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity style={[styles.wallOption, wallSetting === 'public' && styles.wallOptionActive]} onPress={() => setWallSetting('public')}>
              <Text style={[styles.wallOptionText, wallSetting === 'public' && styles.wallOptionTextActive]}>Public Wall</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.wallOption, wallSetting === 'private' && styles.wallOptionActive]} onPress={() => setWallSetting('private')}>
              <Text style={[styles.wallOptionText, wallSetting === 'private' && styles.wallOptionTextActive]}>Private Wall</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helpText}>Wall settings control where members can post content.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getThemedStyles = (colors: any, colorScheme: string) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  headerButton: { minWidth: 60 },
  cancelText: { fontSize: 17, color: colors.textPrimary, fontWeight: '500' },
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  createText: { fontSize: 17, color: colors.accent, fontWeight: '600', textAlign: 'right' },
  createTextDisabled: { color: colors.textMuted, opacity: 0.6 },
  warningBanner: { flexDirection: 'row', backgroundColor: colorScheme === 'dark' ? '#2D2518' : '#FEF3C7', borderRadius: 12, padding: 16, marginBottom: 28, borderWidth: 1, borderColor: colorScheme === 'dark' ? '#4A3D28' : '#FDE68A' },
  warningText: { flex: 1, fontSize: 14, color: colorScheme === 'dark' ? '#D4A860' : '#92400E', lineHeight: 20, fontWeight: '500' },
  inputGroup: { marginBottom: 28 },
  label: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 10 },
  input: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, fontSize: 16, color: colors.textPrimary, borderWidth: 1.5, borderColor: colors.borderSoft },
  textArea: { minHeight: 120, paddingTop: 16 },
  helpText: { fontSize: 13, color: colors.textMuted, marginTop: 10, lineHeight: 18 },
  locationButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: 10, padding: 14, borderWidth: 1.5, borderColor: colors.accent, flex: 1 },
  picker: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 16, borderWidth: 1.5, borderColor: colors.borderSoft },
  dropdown: { backgroundColor: colors.surface, borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: colors.borderSoft, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.1, shadowRadius: 12, elevation: 8 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  toggleSection: { backgroundColor: colors.surface, borderRadius: 12, padding: 18, marginBottom: 28, borderWidth: 1, borderColor: colors.borderSubtle, flexDirection: 'row', alignItems: 'center' },
  wallOption: { flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 16, borderWidth: 2, borderColor: colors.borderSoft, alignItems: 'center' },
  wallOptionActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  wallOptionText: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  wallOptionTextActive: { color: colors.textInverse || '#FFFFFF' },
});
