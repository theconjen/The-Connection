import React from 'react';
import {
  View,
  Modal,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsAPI } from '../lib/apiClient';

interface Event {
  id: number;
  title: string;
  eventDate: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  city?: string;
  imageUrl?: string;
  host?: {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

interface AttendanceConfirmationModalProps {
  visible: boolean;
  event: Event | null;
  onClose: () => void;
  onConfirmed?: () => void;
}

export function AttendanceConfirmationModal({
  visible,
  event,
  onClose,
  onConfirmed,
}: AttendanceConfirmationModalProps) {
  const { colors, spacing } = useTheme();
  const queryClient = useQueryClient();

  const confirmMutation = useMutation({
    mutationFn: () => eventsAPI.confirmAttendance(event?.id || 0),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['pending-confirmations'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['attended-events'] });
      onConfirmed?.();
      onClose();
    },
    onError: (error: any) => {
      console.error('Error confirming attendance:', error);
      onClose();
    },
  });

  const handleConfirm = () => {
    if (event?.id) {
      confirmMutation.mutate();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const formatEventDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (!event) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleSkip}
    >
      <Pressable style={styles.modalOverlay} onPress={handleSkip}>
        <Pressable
          style={[styles.modalContent, { backgroundColor: colors.card }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Success Icon */}
          <View style={[styles.iconContainer, { backgroundColor: '#10B98115' }]}>
            <Ionicons name="calendar-outline" size={48} color="#10B981" />
          </View>

          {/* Title */}
          <Text variant="h3" style={styles.title}>
            Did you attend?
          </Text>

          {/* Event Card */}
          <View
            style={[
              styles.eventCard,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          >
            {event.imageUrl && (
              <Image
                source={{ uri: event.imageUrl }}
                style={styles.eventImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.eventInfo}>
              <Text variant="body" style={[styles.eventTitle, { color: colors.foreground }]}>
                {event.title}
              </Text>
              <View style={styles.eventMeta}>
                <Ionicons name="calendar" size={14} color={colors.mutedForeground} />
                <Text variant="caption" color="mutedForeground" style={{ marginLeft: 4 }}>
                  {formatEventDate(event.eventDate)}
                </Text>
              </View>
              {(event.location || event.city) && (
                <View style={styles.eventMeta}>
                  <Ionicons name="location" size={14} color={colors.mutedForeground} />
                  <Text variant="caption" color="mutedForeground" style={{ marginLeft: 4 }}>
                    {event.location || event.city}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          <Text
            variant="bodySmall"
            color="mutedForeground"
            style={styles.description}
          >
            Confirm your attendance to add this event to your profile!
          </Text>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Pressable
              onPress={handleSkip}
              disabled={confirmMutation.isPending}
              style={({ pressed }) => [
                styles.skipButton,
                {
                  backgroundColor: colors.muted,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text variant="body" style={{ color: colors.mutedForeground }}>
                Not this time
              </Text>
            </Pressable>

            <Pressable
              onPress={handleConfirm}
              disabled={confirmMutation.isPending}
              style={({ pressed }) => [
                styles.confirmButton,
                {
                  backgroundColor: '#10B981',
                  opacity: pressed || confirmMutation.isPending ? 0.7 : 1,
                },
              ]}
            >
              {confirmMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text variant="body" style={styles.confirmButtonText}>
                    Yes, I attended!
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  eventCard: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  eventImage: {
    width: '100%',
    height: 100,
  },
  eventInfo: {
    padding: 12,
  },
  eventTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  skipButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default AttendanceConfirmationModal;
