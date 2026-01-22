import React, { useState } from 'react';
import { View, Modal, Pressable, ScrollView, TextInput, Alert, StyleSheet } from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { safetyAPI } from '../lib/apiClient';

interface ReportUserModalProps {
  visible: boolean;
  onClose: () => void;
  userId: number;
  username: string;
}

const REPORT_REASONS = [
  { id: 'harassment', label: 'Harassment or bullying', icon: 'alert-circle' },
  { id: 'spam', label: 'Spam or misleading', icon: 'mail' },
  { id: 'inappropriate', label: 'Inappropriate content', icon: 'warning' },
  { id: 'hate_speech', label: 'Hate speech', icon: 'skull' },
  { id: 'impersonation', label: 'Impersonation', icon: 'person' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

export function ReportUserModal({ visible, onClose, userId, username }: ReportUserModalProps) {
  const { colors, spacing } = useTheme();
  const queryClient = useQueryClient();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  const reportMutation = useMutation({
    mutationFn: () => safetyAPI.reportUser({
      userId,
      reason: selectedReason!,
      description: description || undefined,
    }),
    onSuccess: () => {
      Alert.alert('Report Submitted', 'Thank you for helping keep our community safe.');
      queryClient.invalidateQueries({ queryKey: ['/api/user-reports'] });
      handleClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to submit report';
      Alert.alert('Error', message);
    },
  });

  const handleClose = () => {
    setSelectedReason(null);
    setDescription('');
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedReason) {
      Alert.alert('Required', 'Please select a reason for reporting');
      return;
    }

    Alert.alert(
      'Confirm Report',
      `Are you sure you want to report @${username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => reportMutation.mutate(),
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.card,
              borderTopLeftRadius: spacing.lg,
              borderTopRightRadius: spacing.lg,
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.modalHeader,
              {
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
              },
            ]}
          >
            <Text variant="h3">Report User</Text>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }}>
            {/* Warning */}
            <View
              style={{
                backgroundColor: `${colors.destructive}15`,
                padding: spacing.md,
                margin: spacing.lg,
                borderRadius: spacing.md,
                borderLeftWidth: 3,
                borderLeftColor: colors.destructive,
              }}
            >
              <Text variant="bodySmall" style={{ color: colors.destructive, fontWeight: '600' }}>
                Reporting @{username}
              </Text>
              <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.xs }}>
                False reports may result in action against your account.
              </Text>
            </View>

            {/* Report Reasons */}
            <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
              <Text variant="bodySmall" style={{ fontWeight: '600', marginBottom: spacing.md }}>
                Why are you reporting this user?
              </Text>

              {REPORT_REASONS.map((reason) => (
                <Pressable
                  key={reason.id}
                  onPress={() => setSelectedReason(reason.id)}
                  style={({ pressed }) => [
                    styles.reasonOption,
                    {
                      backgroundColor:
                        selectedReason === reason.id ? `${colors.primary}15` : colors.muted,
                      borderColor: selectedReason === reason.id ? colors.primary : 'transparent',
                      borderWidth: selectedReason === reason.id ? 2 : 0,
                      padding: spacing.md,
                      marginBottom: spacing.sm,
                      borderRadius: spacing.md,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Ionicons
                      name={reason.icon as any}
                      size={20}
                      color={selectedReason === reason.id ? colors.primary : colors.foreground}
                      style={{ marginRight: spacing.md }}
                    />
                    <Text
                      variant="body"
                      style={{
                        color: selectedReason === reason.id ? colors.primary : colors.foreground,
                        fontWeight: selectedReason === reason.id ? '600' : '400',
                      }}
                    >
                      {reason.label}
                    </Text>
                  </View>
                  {selectedReason === reason.id && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </Pressable>
              ))}
            </View>

            {/* Additional Details */}
            <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.xl }}>
              <Text variant="bodySmall" style={{ fontWeight: '600', marginBottom: spacing.sm }}>
                Additional details (optional)
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Provide more context about this report..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={{
                  backgroundColor: colors.muted,
                  borderRadius: spacing.md,
                  padding: spacing.md,
                  color: colors.foreground,
                  minHeight: 100,
                  fontSize: 14,
                }}
              />
            </View>
          </ScrollView>

          {/* Actions */}
          <View
            style={{
              flexDirection: 'row',
              gap: spacing.md,
              padding: spacing.lg,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: spacing.md,
                borderRadius: spacing.md,
                backgroundColor: colors.muted,
                alignItems: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text variant="body" style={{ fontWeight: '600' }}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSubmit}
              disabled={!selectedReason || reportMutation.isPending}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: spacing.md,
                borderRadius: spacing.md,
                backgroundColor:
                  !selectedReason || reportMutation.isPending ? colors.muted : colors.destructive,
                alignItems: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                variant="body"
                style={{
                  fontWeight: '600',
                  color:
                    !selectedReason || reportMutation.isPending
                      ? colors.mutedForeground
                      : '#FFFFFF',
                }}
              >
                {reportMutation.isPending ? 'Reporting...' : 'Submit Report'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    padding: 4,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
