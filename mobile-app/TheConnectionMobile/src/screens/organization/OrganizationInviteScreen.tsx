import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import apiClient from '../../lib/apiClient';

const ROLES = ['member', 'leader', 'pastor', 'admin'];

export function OrganizationInviteScreen({ organizationId }: { organizationId: string }) {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('member');
  const [submitting, setSubmitting] = useState(false);

  const submitInvite = async () => {
    if (!userId) {
      Alert.alert('User required', 'Please enter a user id to invite.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(`/organizations/${organizationId}/invite`, {
        userId: Number(userId),
        role,
      });
      Alert.alert('Success', 'Invitation sent');
      setUserId('');
      setRole('member');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to send invite';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Invite Member</Text>
      <Text style={styles.subheading}>
        Uses the organization invite contract shared with the web experience.
      </Text>

      <TextInput
        value={userId}
        onChangeText={setUserId}
        placeholder="User ID"
        keyboardType="numeric"
        style={styles.input}
      />

      <View style={styles.roleContainer}>
        {ROLES.map(option => (
          <TouchableOpacity
            key={option}
            style={[styles.rolePill, role === option && styles.rolePillActive]}
            onPress={() => setRole(option)}
            disabled={submitting}
          >
            <Text style={styles.roleText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={submitInvite} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Sending...' : 'Send Invite'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 12,
    backgroundColor: '#f8fafc',
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  subheading: {
    color: '#475569',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rolePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
  },
  rolePillActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#38bdf8',
  },
  roleText: {
    color: '#0f172a',
    textTransform: 'capitalize',
  },
  button: {
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

export default OrganizationInviteScreen;
