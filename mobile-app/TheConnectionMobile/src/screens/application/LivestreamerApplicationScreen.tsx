import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { insertLivestreamerApplicationSchema, type InsertLivestreamerApplication } from '@connection/shared/schema';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../contexts/AuthContext';

type LivestreamerApplicationInput = Omit<InsertLivestreamerApplication, 'userId'>;

export function LivestreamerApplicationScreen() {
  const { user, isLoading } = useAuth();
  const [form, setForm] = useState<LivestreamerApplicationInput>({
    ministryName: '',
    ministryDescription: '',
    ministerialExperience: '',
    statementOfFaith: '',
    socialMediaLinks: '',
    referenceName: '',
    referenceContact: '',
    referenceRelationship: '',
    sampleContentUrl: '',
    livestreamTopics: '',
    targetAudience: '',
    agreedToTerms: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const updateField = (key: keyof LivestreamerApplicationInput, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!user?.isAdmin) {
    return (
      <View style={styles.closedContainer}>
        <Text style={styles.closedHeading}>Livestreamer applications are currently closed.</Text>
        <Text style={styles.closedSubheading}>
          Only administrators can access this form while we pause new submissions.
        </Text>
      </View>
    );
  }

  const submit = async () => {
    if (!user) {
      Alert.alert('Login required', 'Please sign in to submit an application.');
      return;
    }

    setSubmitting(true);
    try {
      const parsed = insertLivestreamerApplicationSchema.parse({
        ...form,
        userId: user.id,
      });
      await apiClient.post('/applications/livestreamer', parsed);
      Alert.alert('Submitted', 'Your livestreamer application has been submitted.');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to submit application';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Livestreamer Application</Text>
      <Text style={styles.subheading}>Powered by the same contracts used on the server routes.</Text>

      {(
        [
          ['ministryName', 'Ministry Name'],
          ['ministryDescription', 'Ministry Description'],
          ['ministerialExperience', 'Experience'],
          ['statementOfFaith', 'Statement of Faith'],
          ['socialMediaLinks', 'Social Links'],
          ['referenceName', 'Reference Name'],
          ['referenceContact', 'Reference Contact'],
          ['referenceRelationship', 'Reference Relationship'],
          ['sampleContentUrl', 'Sample Content URL'],
          ['livestreamTopics', 'Livestream Topics'],
          ['targetAudience', 'Target Audience'],
        ] as const
      ).map(([key, label]) => (
        <TextInput
          key={key}
          value={String(form[key])}
          onChangeText={text => updateField(key, text)}
          placeholder={label}
          style={styles.input}
          multiline={key === 'ministryDescription' || key === 'statementOfFaith'}
        />
      ))}

      <TouchableOpacity style={styles.button} onPress={submit} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Submitting...' : 'Submit'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 10,
    backgroundColor: '#f8fafc',
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  subheading: {
    color: '#475569',
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  closedHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  closedSubheading: {
    color: '#475569',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  button: {
    marginTop: 8,
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default LivestreamerApplicationScreen;
