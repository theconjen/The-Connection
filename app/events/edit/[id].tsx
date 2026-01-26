/**
 * Edit Event Screen
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
  SectionList,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { eventsAPI } from '../../../src/lib/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

interface Event {
  id: number;
  title: string;
  description: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  eventDate: string;
  startTime: string;
  endTime?: string;
  isPublic?: boolean;
  creatorId: number;
  hostUserId?: number;
  imageUrl?: string | null;
  attendeeCount?: number;
}

interface Attendee {
  id: number;
  userId: number;
  status: 'going' | 'maybe' | 'not_going';
  user: {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  } | null;
}

interface AttendeesResponse {
  going: Attendee[];
  maybe: Attendee[];
  notGoing: Attendee[];
  counts: {
    going: number;
    maybe: number;
    notGoing: number;
    total: number;
  };
}

export default function EditEventScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams() as { id: string };
  const eventId = parseInt(id || '0');
  const queryClient = useQueryClient();
  const { colors, colorScheme } = useTheme();
  const { user } = useAuth();
  const styles = getStyles(colors, colorScheme);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState<Date | null>(null);

  // Picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [tempTime, setTempTime] = useState(new Date());

  // RSVP list modal
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);

  // Flyer image state
  const [flyerImage, setFlyerImage] = useState<string | null>(null);
  const [flyerChanged, setFlyerChanged] = useState(false);

  // Fetch event data
  const { data: event, isLoading: eventLoading } = useQuery<Event>({
    queryKey: ['event', eventId],
    queryFn: () => eventsAPI.getById(eventId),
    enabled: !!eventId,
  });

  // Fetch attendees (server returns grouped response)
  const { data: attendeesData, isLoading: attendeesLoading } = useQuery<AttendeesResponse>({
    queryKey: ['event-attendees', eventId],
    queryFn: () => eventsAPI.getAttendees(eventId),
    enabled: !!eventId && showAttendeesModal,
  });

  // Flatten attendees for display with section headers
  const allAttendees = React.useMemo(() => {
    if (!attendeesData) return [];
    const sections: { title: string; data: Attendee[] }[] = [];
    if (attendeesData.going?.length > 0) {
      sections.push({ title: `Going (${attendeesData.going.length})`, data: attendeesData.going });
    }
    if (attendeesData.maybe?.length > 0) {
      sections.push({ title: `Maybe (${attendeesData.maybe.length})`, data: attendeesData.maybe });
    }
    if (attendeesData.notGoing?.length > 0) {
      sections.push({ title: `Can't Go (${attendeesData.notGoing.length})`, data: attendeesData.notGoing });
    }
    return sections;
  }, [attendeesData]);

  // Populate form when event loads
  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      setLocation(event.location || '');

      // Parse event date
      if (event.eventDate) {
        const datePart = event.eventDate.split(' ')[0];
        const [year, month, day] = datePart.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        setSelectedDate(date);
        setTempDate(date);
      }

      // Parse start time
      if (event.startTime) {
        const [hours, minutes] = event.startTime.split(':').map(Number);
        const timeDate = new Date();
        timeDate.setHours(hours, minutes, 0);
        setStartTime(timeDate);
      }

      // Parse end time
      if (event.endTime) {
        const [hours, minutes] = event.endTime.split(':').map(Number);
        const timeDate = new Date();
        timeDate.setHours(hours, minutes, 0);
        setEndTime(timeDate);
      }

      // Load existing flyer image
      if (event.imageUrl) {
        setFlyerImage(event.imageUrl);
      }
    }
  }, [event]);

  // Check if user can edit this event
  const canEdit = user && event && (
    event.hostUserId === user.id ||
    event.creatorId === user.id
  );

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<Event>) => eventsAPI.update(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      Alert.alert('Success', 'Event updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.message || 'Failed to update event');
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter an event description');
      return;
    }

    const dateStr = selectedDate.toISOString().split('T')[0];
    const startHours = startTime.getHours().toString().padStart(2, '0');
    const startMinutes = startTime.getMinutes().toString().padStart(2, '0');
    const startTimeStr = `${startHours}:${startMinutes}:00`;

    let endTimeStr: string | undefined;
    if (endTime) {
      const endHours = endTime.getHours().toString().padStart(2, '0');
      const endMinutes = endTime.getMinutes().toString().padStart(2, '0');
      endTimeStr = `${endHours}:${endMinutes}:00`;
    }

    const updateData: any = {
      title: title.trim(),
      description: description.trim(),
      location: location.trim() || undefined,
      eventDate: dateStr,
      startTime: startTimeStr,
      endTime: endTimeStr,
    };

    // Only include imageUrl if it was changed
    if (flyerChanged) {
      updateData.imageUrl = flyerImage; // Can be null to remove the image
    }

    updateMutation.mutate(updateData);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Handle image picker for event flyer
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to update the flyer.');
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
        const uri = asset.uri;
        const extension = uri.split('.').pop()?.toLowerCase() || 'jpeg';
        const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
        const base64Image = `data:${mimeType};base64,${asset.base64}`;
        setFlyerImage(base64Image);
        setFlyerChanged(true);
      }
    }
  };

  const removeImage = () => {
    setFlyerImage(null);
    setFlyerChanged(true);
  };

  // Handle date picker confirm
  const handleDateConfirm = () => {
    setSelectedDate(tempDate);
    setShowDatePicker(false);
  };

  // Handle time picker confirm for start time
  const handleStartTimeConfirm = () => {
    setStartTime(tempTime);
    setShowStartTimePicker(false);
  };

  // Handle time picker confirm for end time
  const handleEndTimeConfirm = () => {
    setEndTime(tempTime);
    setShowEndTimePicker(false);
  };

  const renderAttendeeItem = ({ item }: { item: Attendee }) => {
    const displayName = item.user?.displayName || item.user?.username || 'Unknown';
    const username = item.user?.username || 'unknown';

    return (
      <View style={styles.attendeeItem}>
        <View style={styles.attendeeAvatar}>
          <Text style={styles.attendeeAvatarText}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.attendeeInfo}>
          <Text style={styles.attendeeName}>{displayName}</Text>
          <Text style={styles.attendeeUsername}>@{username}</Text>
        </View>
        <View style={[styles.statusBadge,
          item.status === 'going' && styles.statusGoing,
          item.status === 'maybe' && styles.statusMaybe,
          item.status === 'not_going' && styles.statusNotGoing,
        ]}>
          <Text style={styles.statusText}>
            {item.status === 'going' ? 'Going' : item.status === 'maybe' ? 'Maybe' : "Can't Go"}
          </Text>
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <Text style={styles.sectionHeader}>{section.title}</Text>
  );

  if (eventLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Event not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!canEdit) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>You don't have permission to edit this event</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Event</Text>
        <TouchableOpacity onPress={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Event Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter event title"
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
            placeholder="Describe your event"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={1000}
          />
        </View>

        {/* Location */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Enter location (optional)"
            placeholderTextColor={colors.textMuted}
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
                <Ionicons name="image-outline" size={32} color={colors.accent} />
                <Text style={[styles.flyerUploadText, { color: colors.textPrimary }]}>Add Event Flyer</Text>
                <Text style={[styles.flyerUploadHint, { color: colors.textMuted }]}>
                  Tap to select an image from your library
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => {
              setTempDate(selectedDate);
              setShowDatePicker(true);
            }}
          >
            <Text style={styles.pickerText}>{formatDate(selectedDate)}</Text>
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Start Time */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Start Time *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => {
              setTempTime(startTime);
              setShowStartTimePicker(true);
            }}
          >
            <Text style={styles.pickerText}>{formatTime(startTime)}</Text>
            <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* End Time */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>End Time</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => {
              setTempTime(endTime || startTime);
              setShowEndTimePicker(true);
            }}
          >
            <Text style={[styles.pickerText, !endTime && { color: colors.textMuted }]}>
              {endTime ? formatTime(endTime) : 'Set end time (optional)'}
            </Text>
            <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          {endTime && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setEndTime(null)}
            >
              <Text style={styles.clearButtonText}>Clear end time</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* View Attendees Button */}
        <TouchableOpacity
          style={styles.attendeesButton}
          onPress={() => setShowAttendeesModal(true)}
        >
          <Ionicons name="people-outline" size={20} color={colors.accent} />
          <Text style={styles.attendeesButtonText}>
            View RSVPs ({attendeesData?.counts?.total || event.attendeeCount || 0})
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal visible={showDatePicker} transparent animationType="slide">
        <View style={styles.pickerModal}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.pickerModalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.pickerModalTitle}>Select Date</Text>
              <TouchableOpacity onPress={handleDateConfirm}>
                <Text style={styles.pickerModalDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={(_, date) => date && setTempDate(date)}
              style={styles.picker}
            />
          </View>
        </View>
      </Modal>

      {/* Start Time Picker Modal */}
      <Modal visible={showStartTimePicker} transparent animationType="slide">
        <View style={styles.pickerModal}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <TouchableOpacity onPress={() => setShowStartTimePicker(false)}>
                <Text style={styles.pickerModalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.pickerModalTitle}>Start Time</Text>
              <TouchableOpacity onPress={handleStartTimeConfirm}>
                <Text style={styles.pickerModalDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempTime}
              mode="time"
              display="spinner"
              onChange={(_, date) => date && setTempTime(date)}
              style={styles.picker}
            />
          </View>
        </View>
      </Modal>

      {/* End Time Picker Modal */}
      <Modal visible={showEndTimePicker} transparent animationType="slide">
        <View style={styles.pickerModal}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                <Text style={styles.pickerModalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.pickerModalTitle}>End Time</Text>
              <TouchableOpacity onPress={handleEndTimeConfirm}>
                <Text style={styles.pickerModalDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempTime}
              mode="time"
              display="spinner"
              onChange={(_, date) => date && setTempTime(date)}
              style={styles.picker}
            />
          </View>
        </View>
      </Modal>

      {/* Attendees Modal */}
      <Modal visible={showAttendeesModal} animationType="slide">
        <View style={styles.attendeesModal}>
          <View style={styles.attendeesModalHeader}>
            <TouchableOpacity onPress={() => setShowAttendeesModal(false)}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.attendeesModalTitle}>RSVPs</Text>
            <View style={{ width: 28 }} />
          </View>

          {attendeesLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : allAttendees.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyStateText}>No RSVPs yet</Text>
            </View>
          ) : (
            <SectionList
              sections={allAttendees}
              renderItem={renderAttendeeItem}
              renderSectionHeader={renderSectionHeader}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.attendeesList}
              stickySectionHeadersEnabled={false}
            />
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: any, colorScheme: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  cancelText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
  },
  form: {
    flex: 1,
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
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
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
    borderColor: colors.borderSoft,
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
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  clearButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#ef4444',
  },
  attendeesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 10,
    gap: 10,
  },
  attendeesButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.accent,
  },

  // Picker Modal
  pickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
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
  pickerModalCancel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  pickerModalDone: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
  },
  picker: {
    height: 200,
  },

  // Attendees Modal
  attendeesModal: {
    flex: 1,
    backgroundColor: colors.background,
  },
  attendeesModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  attendeesModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  attendeesList: {
    padding: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  attendeeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attendeeAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  attendeeUsername: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.borderSoft,
  },
  statusGoing: {
    backgroundColor: '#10b981',
  },
  statusMaybe: {
    backgroundColor: '#f59e0b',
  },
  statusNotGoing: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 12,
  },

  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: colors.accent,
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
