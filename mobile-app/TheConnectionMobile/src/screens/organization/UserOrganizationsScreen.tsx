import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import type { Organization } from '@connection/shared/schema';
import { useRouter } from 'expo-router';

type Membership = {
  organization: Organization;
  role: string;
  joinedAt: string;
};

export function UserOrganizationsScreen() {
  const router = useRouter();
  const { data, isLoading } = useQuery<Membership[]>({
    queryKey: ['user-organizations'],
    queryFn: async () => {
      const response = await apiClient.get('/organizations');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>My Organizations</Text>
      <Text style={styles.subheading}>Data is sourced from the organizations routes shared with web.</Text>

      {(data || []).map(entry => (
        <TouchableOpacity
          key={entry.organization.id}
          style={styles.card}
          onPress={() => router.push(`/organizations/${entry.organization.id}`)}
        >
          <Text style={styles.cardTitle}>{entry.organization.name}</Text>
          <Text style={styles.cardSubtitle}>Role: {entry.role}</Text>
        </TouchableOpacity>
      ))}

      {(data || []).length === 0 && (
        <Text style={styles.empty}>You are not part of any organizations yet.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 12,
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  cardSubtitle: {
    color: '#334155',
    marginTop: 4,
  },
  empty: {
    marginTop: 16,
    color: '#475569',
  },
  loader: {
    padding: 40,
  },
});

export default UserOrganizationsScreen;
