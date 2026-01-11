import React, { useState } from 'react';
import { View, Modal, Pressable, ScrollView, Alert, StyleSheet } from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

interface BlockUserModalProps {
  visible: boolean;
  onClose: () => void;
  userId: number;
  username: string;
}

const BLOCK_REASONS = [
  { id: 'harassment', label: 'Harassment or bullying' },
  { id: 'spam', label: 'Spam or unwanted messages' },
  { id: 'inappropriate', label: 'Inappropriate behavior' },
  { id: 'other', label: 'Other' },
];

export function BlockUserModal({ visible, onClose, userId, username }: BlockUserModalProps) {
  const { colors, spacing } = useTheme();
  const queryClient = useQueryClient();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  const blockMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/api/blocks', {
        userId,
        reason: selectedReason,
      });
      return response.data;
    },
    onSuccess: () => {
      Alert.alert('User Blocked', `You have blocked @${username}.`);
      queryClient.invalidateQueries({ queryKey: ['/api/blocked-users'] });
      handleClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to block user';
      Alert.alert('Error', message);
    },
  });

  const handleClose = () => {
    setSelectedReason(null);
    onClose();
  };

  const handleBlock = () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block @${username}?\n\nYou won't see their posts, and they won't be able to contact you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => blockMutation.mutate(),
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
            <Text variant="h3">Block User</Text>
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
              <Text variant="body" style={{ color: colors.destructive, fontWeight: '600' }}>
                Blocking @{username}
              </Text>
              <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.xs }}>
                • You won't see their posts or comments{'\n'}
                • They won't be able to send you messages{'\n'}
                • They won't see your posts on the feed{'\n'}
                • You can unblock them anytime from Settings
              </Text>
            </View>

            {/* Block Reasons */}
            <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
              <Text variant="bodySmall" style={{ fontWeight: '600', marginBottom: spacing.md }}>
                Why are you blocking this user? (optional)
              </Text>

              {BLOCK_REASONS.map((reason) => (
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
                  <Text
                    variant="body"
                    style={{
                      color: selectedReason === reason.id ? colors.primary : colors.foreground,
                      fontWeight: selectedReason === reason.id ? '600' : '400',
                    }}
                  >
                    {reason.label}
                  </Text>
                  {selectedReason === reason.id && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </Pressable>
              ))}
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
              onPress={handleBlock}
              disabled={blockMutation.isPending}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: spacing.md,
                borderRadius: spacing.md,
                backgroundColor: blockMutation.isPending ? colors.muted : colors.destructive,
                alignItems: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                variant="body"
                style={{
                  fontWeight: '600',
                  color: blockMutation.isPending ? colors.mutedForeground : '#FFFFFF',
                }}
              >
                {blockMutation.isPending ? 'Blocking...' : 'Block User'}
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
    maxHeight: '85%',
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
