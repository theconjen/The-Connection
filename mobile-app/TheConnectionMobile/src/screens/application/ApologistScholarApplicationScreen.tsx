import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import {
  insertApologistScholarApplicationSchema,
  type InsertApologistScholarApplication,
} from '@connection/shared/schema';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../contexts/AuthContext';

type ApologistApplicationInput = Omit<InsertApologistScholarApplication, 'userId'>;

export function ApologistScholarApplicationScreen() {
  const { user } = useAuth();
  const [form, setForm] = useState<ApologistApplicationInput>({
    fullName: '',
    academicCredentials: '',
    educationalBackground: '',
    theologicalPerspective: '',
    statementOfFaith: '',
    areasOfExpertise: '',
    publishedWorks: '',
    priorApologeticsExperience: '',
    writingSample: '',
    onlineSocialHandles: '',
    referenceName: '',
    referenceContact: '',
    referenceInstitution: '',
    motivation: '',
    weeklyTimeCommitment: '',
    agreedToGuidelines: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const updateField = (key: keyof ApologistApplicationInput, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const submit = async () => {
    if (!user) {
      Alert.alert('Login required', 'Please sign in to submit an application.');
      return;
    }

    setSubmitting(true);
    try {
      const parsed = insertApologistScholarApplicationSchema.parse({
        ...form,
        userId: user.id,
      });
      await apiClient.post('/applications/apologist-scholar', parsed);
      Alert.alert('Submitted', 'Your apologist scholar application has been submitted.');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to submit application';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Apologist Scholar Application</Text>
      <Text style={styles.subheading}>Validated with the shared schema used on the server.</Text>

      {(
        [
          ['fullName', 'Full Name'],
          ['academicCredentials', 'Academic Credentials'],
          ['educationalBackground', 'Educational Background'],
          ['theologicalPerspective', 'Theological Perspective'],
          ['statementOfFaith', 'Statement of Faith'],
          ['areasOfExpertise', 'Areas of Expertise'],
          ['publishedWorks', 'Published Works'],
          ['priorApologeticsExperience', 'Prior Apologetics Experience'],
          ['writingSample', 'Writing Sample'],
          ['onlineSocialHandles', 'Online Social Handles'],
          ['referenceName', 'Reference Name'],
          ['referenceContact', 'Reference Contact'],
          ['referenceInstitution', 'Reference Institution'],
          ['motivation', 'Motivation'],
          ['weeklyTimeCommitment', 'Weekly Commitment'],
        ] as const
      ).map(([key, label]) => (
        <TextInput
          key={key}
          value={String(form[key])}
          onChangeText={text => updateField(key, text)}
          placeholder={label}
          style={styles.input}
          multiline
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

export default ApologistScholarApplicationScreen;
