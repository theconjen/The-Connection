/**
 * Create Event Screen
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsAPI } from '../../src/lib/apiClient';
import { Colors } from '../../src/shared/colors';

export default function CreateEventScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: any) => eventsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      Alert.alert('Success', 'Event created!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: () => Alert.alert('Error', 'Failed to create event'),
  });

  const handleCreate = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Description is required');
      return;
    }
    if (!startTime.trim()) {
      Alert.alert('Error', 'Start time is required');
      return;
    }

    createMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      location: location.trim() || undefined,
      startTime: new Date(startTime).toISOString(),
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Event</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Event title"
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Event description"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Event location"
              maxLength={200}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Start Time * (YYYY-MM-DD HH:MM)</Text>
            <TextInput
              style={styles.input}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="2025-01-15 18:00"
              maxLength={16}
            />
            <Text style={styles.hint}>Format: 2025-01-15 18:00</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, createMutation.isPending && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Create Event</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  cancelText: { color: 'Colors.primary', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  content: { flex: 1 },
  form: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#d1d5db' },
  textArea: { minHeight: 100, paddingTop: 12 },
  hint: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  footer: { backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  createButton: { backgroundColor: 'Colors.primary', borderRadius: 8, padding: 16, alignItems: 'center' },
  createButtonDisabled: { opacity: 0.6 },
  createButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
