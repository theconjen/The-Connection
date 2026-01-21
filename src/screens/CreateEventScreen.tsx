/**
 * CREATE EVENT SCREEN - The Connection Mobile App
 * -----------------------------------------------
 * Event creation form for community admins/moderators
 *
 * API Endpoints:
 * - POST /api/events
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import apiClient from '../lib/apiClient';

// ============================================================================
// TYPES
// ============================================================================

interface CreateEventScreenProps {
  communityId: number;
  communityName: string;
  onBack?: () => void;
  onSuccess?: () => void;
}

interface EventFormData {
  title: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  isVirtual: boolean;
  isPublic: boolean;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  virtualMeetingUrl?: string;
}

// ============================================================================
// API HOOKS
// ============================================================================

function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/api/events', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    },
  });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CreateEventScreen({
  communityId,
  communityName,
  onBack,
  onSuccess,
}: CreateEventScreenProps) {
  const { colors } = useTheme();

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    isVirtual: false,
    isPublic: true,
    location: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    virtualMeetingUrl: '',
  });

  const createEventMutation = useCreateEvent();

  const updateField = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter an event description');
      return false;
    }
    if (!formData.eventDate) {
      Alert.alert('Error', 'Please enter an event date (YYYY-MM-DD)');
      return false;
    }
    if (!formData.startTime) {
      Alert.alert('Error', 'Please enter a start time (HH:MM)');
      return false;
    }
    if (!formData.isVirtual && !formData.location?.trim()) {
      Alert.alert('Error', 'Please enter a location for in-person events');
      return false;
    }
    if (formData.isVirtual && !formData.virtualMeetingUrl?.trim()) {
      Alert.alert('Error', 'Please enter a virtual meeting URL');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const payload = {
      ...formData,
      communityId,
      endTime: formData.endTime || formData.startTime, // Default to start time if not provided
    };

    createEventMutation.mutate(payload, {
      onSuccess: () => {
        Alert.alert('Success', 'Event created successfully!');
        onSuccess?.();
        onBack?.();
      },
      onError: (error: any) => {
        Alert.alert('Error', error.response?.data?.error || error.message || 'Failed to create event');
      },
    });
  };

  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={onBack}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Create Event</Text>
        <Pressable
          style={styles.headerButton}
          onPress={handleSubmit}
          disabled={createEventMutation.isPending}
        >
          <Text
            style={[
              styles.createText,
              createEventMutation.isPending && styles.createTextDisabled,
            ]}
          >
            {createEventMutation.isPending ? 'Creating...' : 'Create'}
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Community Badge */}
        <View style={styles.communityBadge}>
          <Ionicons name="people" size={16} color="#5C6B5E" />
          <Text style={styles.communityName}>{communityName}</Text>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Event Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Sunday Service"
            placeholderTextColor={colors.textMuted}
            value={formData.title}
            onChangeText={(text) => updateField('title', text)}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Join us for our weekly worship service..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            value={formData.description}
            onChangeText={(text) => updateField('description', text)}
          />
        </View>

        {/* Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Date * (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            placeholder="2026-01-15"
            placeholderTextColor={colors.textMuted}
            value={formData.eventDate}
            onChangeText={(text) => updateField('eventDate', text)}
          />
          <Text style={styles.hint}>Format: YYYY-MM-DD (e.g., 2026-01-15)</Text>
        </View>

        {/* Time */}
        <View style={styles.row}>
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.label}>Start Time * (HH:MM)</Text>
            <TextInput
              style={styles.input}
              placeholder="10:00"
              placeholderTextColor={colors.textMuted}
              value={formData.startTime}
              onChangeText={(text) => updateField('startTime', text)}
            />
            <Text style={styles.hint}>24-hour format</Text>
          </View>

          <View style={[styles.section, { flex: 1, marginLeft: 12 }]}>
            <Text style={styles.label}>End Time (HH:MM)</Text>
            <TextInput
              style={styles.input}
              placeholder="12:00"
              placeholderTextColor={colors.textMuted}
              value={formData.endTime}
              onChangeText={(text) => updateField('endTime', text)}
            />
            <Text style={styles.hint}>Optional</Text>
          </View>
        </View>

        {/* Virtual Event Toggle */}
        <View style={styles.toggleSection}>
          <View style={styles.toggleHeader}>
            <Ionicons name="videocam-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.toggleTitle}>Virtual Event</Text>
          </View>
          <Switch
            value={formData.isVirtual}
            onValueChange={(value) => updateField('isVirtual', value)}
            trackColor={{ false: colors.surfaceMuted, true: '#5C6B5E' }}
            thumbColor="#fff"
          />
        </View>
        <Text style={styles.toggleDescription}>
          {formData.isVirtual
            ? 'This event will be held online'
            : 'This event will be held in person'}
        </Text>

        {/* Location (if not virtual) */}
        {!formData.isVirtual && (
          <>
            <View style={styles.section}>
              <Text style={styles.label}>Location Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Main Church Building"
                placeholderTextColor={colors.textMuted}
                value={formData.location}
                onChangeText={(text) => updateField('location', text)}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Street Address</Text>
              <TextInput
                style={styles.input}
                placeholder="123 Main St"
                placeholderTextColor={colors.textMuted}
                value={formData.address}
                onChangeText={(text) => updateField('address', text)}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.section, { flex: 2 }]}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Springfield"
                  placeholderTextColor={colors.textMuted}
                  value={formData.city}
                  onChangeText={(text) => updateField('city', text)}
                />
              </View>

              <View style={[styles.section, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={styles.input}
                  placeholder="IL"
                  placeholderTextColor={colors.textMuted}
                  value={formData.state}
                  onChangeText={(text) => updateField('state', text)}
                />
              </View>

              <View style={[styles.section, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>ZIP</Text>
                <TextInput
                  style={styles.input}
                  placeholder="62701"
                  placeholderTextColor={colors.textMuted}
                  value={formData.zipCode}
                  onChangeText={(text) => updateField('zipCode', text)}
                />
              </View>
            </View>
          </>
        )}

        {/* Virtual Meeting URL (if virtual) */}
        {formData.isVirtual && (
          <View style={styles.section}>
            <Text style={styles.label}>Meeting URL *</Text>
            <TextInput
              style={styles.input}
              placeholder="https://zoom.us/j/123456789"
              placeholderTextColor={colors.textMuted}
              value={formData.virtualMeetingUrl}
              onChangeText={(text) => updateField('virtualMeetingUrl', text)}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        )}

        {/* Public Event Toggle */}
        <View style={styles.toggleSection}>
          <View style={styles.toggleHeader}>
            <Ionicons name="globe-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.toggleTitle}>Show on Events Page</Text>
          </View>
          <Switch
            value={formData.isPublic}
            onValueChange={(value) => updateField('isPublic', value)}
            trackColor={{ false: colors.surfaceMuted, true: '#5C6B5E' }}
            thumbColor="#fff"
          />
        </View>
        <Text style={styles.toggleDescription}>
          {formData.isPublic
            ? 'This event will be visible on the main events page to all users'
            : 'This event will only be visible to community members'}
        </Text>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#2563EB" />
          <Text style={styles.infoText}>
            Only community creators and moderators can create events. Members will be able to RSVP
            and see event details.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    headerButton: {
      minWidth: 60,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    cancelText: {
      fontSize: 16,
      color: colors.textMuted,
    },
    createText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#5C6B5E',
      textAlign: 'right',
    },
    createTextDisabled: {
      color: colors.textMuted,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    communityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: '#EEF2FF',
      borderRadius: 16,
      marginBottom: 24,
    },
    communityName: {
      fontSize: 14,
      fontWeight: '600',
      color: '#5C6B5E',
    },
    section: {
      marginBottom: 20,
    },
    row: {
      flexDirection: 'row',
      marginBottom: 20,
    },
    label: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    hint: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
    },
    toggleSection: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    toggleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    toggleTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    toggleDescription: {
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: 20,
      lineHeight: 18,
    },
    infoBox: {
      flexDirection: 'row',
      gap: 10,
      backgroundColor: '#EFF6FF',
      padding: 12,
      borderRadius: 8,
      marginTop: 8,
      borderWidth: 1,
      borderColor: '#BFDBFE',
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      color: '#1E40AF',
      lineHeight: 18,
    },
  });
