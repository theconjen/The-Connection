/**
 * Report Content Modal
 * Allows users to report inappropriate content or users
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

interface ReportContentModalProps {
  visible: boolean;
  onClose: () => void;
  contentType: 'post' | 'comment' | 'event' | 'community' | 'user';
  contentId: number;
  contentTitle?: string;
}

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam or Scam', icon: 'warning' as const },
  { id: 'harassment', label: 'Harassment or Bullying', icon: 'alert-circle' as const },
  { id: 'hate_speech', label: 'Hate Speech', icon: 'ban' as const },
  { id: 'inappropriate', label: 'Inappropriate Content', icon: 'eye-off' as const },
  { id: 'false_info', label: 'False Information', icon: 'information-circle' as const },
  { id: 'violence', label: 'Violence or Threats', icon: 'alert' as const },
  { id: 'sexual_content', label: 'Sexual Content', icon: 'close-circle' as const },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal' as const },
];

export function ReportContentModal({
  visible,
  onClose,
  contentType,
  contentId,
  contentTitle,
}: ReportContentModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const reportMutation = useMutation({
    mutationFn: async () => {
      if (contentType === 'user') {
        // Report user
        return apiClient.post('/api/user-reports', {
          userId: contentId,
          reason: selectedReason,
          description,
        });
      } else {
        // Report content
        return apiClient.post('/api/reports', {
          subjectType: contentType,
          subjectId: contentId,
          reason: selectedReason,
          description,
        });
      }
    },
    onSuccess: () => {
      Alert.alert(
        'Report Submitted',
        'Thank you for helping keep our community safe. Our moderation team will review your report.',
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedReason('');
              setDescription('');
              onClose();
            },
          },
        ]
      );
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to submit report. Please try again.'
      );
    },
  });

  const handleSubmit = () => {
    if (!selectedReason) {
      Alert.alert('Select a Reason', 'Please select a reason for reporting this content.');
      return;
    }

    Alert.alert(
      'Confirm Report',
      'Are you sure you want to report this content? False reports may affect your account standing.',
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

  const handleBlockUser = () => {
    if (contentType !== 'user') return;

    Alert.alert(
      'Block User',
      'Would you also like to block this user? You won\'t see their content anymore.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.post('/api/blocks', {
                userId: contentId,
                reason: selectedReason,
              });
              queryClient.invalidateQueries({ queryKey: ['/api/blocked-users'] });
              Alert.alert('User Blocked', 'You will no longer see content from this user.');
            } catch (error) {
              console.error('Error blocking user:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Report {contentType === 'user' ? 'User' : 'Content'}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#0D1829" />
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {contentTitle && (
              <View style={styles.contentPreview}>
                <Text style={styles.contentPreviewLabel}>Reporting:</Text>
                <Text style={styles.contentPreviewText} numberOfLines={2}>
                  {contentTitle}
                </Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>Why are you reporting this?</Text>

            {/* Reason Selection */}
            <View style={styles.reasonsList}>
              {REPORT_REASONS.map((reason) => (
                <Pressable
                  key={reason.id}
                  style={[
                    styles.reasonItem,
                    selectedReason === reason.id && styles.reasonItemSelected,
                  ]}
                  onPress={() => setSelectedReason(reason.id)}
                >
                  <Ionicons
                    name={reason.icon}
                    size={24}
                    color={selectedReason === reason.id ? '#222D99' : '#637083'}
                  />
                  <Text
                    style={[
                      styles.reasonLabel,
                      selectedReason === reason.id && styles.reasonLabelSelected,
                    ]}
                  >
                    {reason.label}
                  </Text>
                  {selectedReason === reason.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#222D99" />
                  )}
                </Pressable>
              ))}
            </View>

            {/* Additional Details */}
            <Text style={styles.sectionTitle}>Additional Details (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Provide any additional context..."
              placeholderTextColor="#637083"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
            />

            {/* Block User Option */}
            {contentType === 'user' && (
              <Pressable style={styles.blockUserButton} onPress={handleBlockUser}>
                <Ionicons name="ban-outline" size={20} color="#E63946" />
                <Text style={styles.blockUserButtonText}>Block this user</Text>
              </Pressable>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={reportMutation.isPending}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[
                styles.button,
                styles.submitButton,
                (!selectedReason || reportMutation.isPending) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!selectedReason || reportMutation.isPending}
            >
              {reportMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Report</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D8DE',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D1829',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  contentPreview: {
    backgroundColor: '#F5F8FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  contentPreviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#637083',
    marginBottom: 4,
  },
  contentPreviewText: {
    fontSize: 14,
    color: '#0D1829',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D1829',
    marginBottom: 12,
  },
  reasonsList: {
    marginBottom: 24,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D1D8DE',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  reasonItemSelected: {
    borderColor: '#222D99',
    backgroundColor: '#F0F2FF',
  },
  reasonLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#0D1829',
    marginLeft: 12,
  },
  reasonLabelSelected: {
    color: '#222D99',
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D8DE',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#0D1829',
    minHeight: 100,
    marginBottom: 16,
  },
  blockUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E63946',
    backgroundColor: '#FFF5F5',
  },
  blockUserButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E63946',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#D1D8DE',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F8FA',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D1829',
  },
  submitButton: {
    backgroundColor: '#222D99',
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D8DE',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
