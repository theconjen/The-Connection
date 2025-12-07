import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import type { Organization, OrganizationUser, User } from '@connection/shared/schema';

type Member = {
  membership: OrganizationUser;
  user: Pick<User, 'id' | 'username' | 'displayName' | 'email' | 'avatarUrl'>;
};

export function OrganizationDashboardScreen({ organizationId }: { organizationId: string }) {
  const { data: organization, isLoading } = useQuery<Organization>({
    queryKey: ['organization', organizationId],
    enabled: Boolean(organizationId),
    queryFn: async () => {
      const response = await apiClient.get(`/organizations/${organizationId}`);
      return response.data;
    },
  });

  const { data: members = [], isLoading: loadingMembers } = useQuery<Member[]>({
    queryKey: ['organization-members', organizationId],
    enabled: Boolean(organizationId),
    queryFn: async () => {
      const response = await apiClient.get(`/organizations/${organizationId}/members`);
      return response.data;
    },
  });

  if (isLoading || loadingMembers) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!organization) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Organization not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>{organization.name}</Text>
      {organization.description ? (
        <Text style={styles.subheading}>{organization.description}</Text>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Plan</Text>
        <Text style={styles.cardText}>{organization.plan}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Members</Text>
        {(members || []).map(member => (
          <Text key={member.user.id} style={styles.cardText}>
            {member.user.displayName || member.user.username} · {member.membership.role}
          </Text>
        ))}
        {(members || []).length === 0 && <Text style={styles.cardText}>No members yet.</Text>}
      </View>
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
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 6,
  },
  cardText: {
    color: '#1f2937',
    marginBottom: 4,
  },
  empty: {
    color: '#475569',
  },
  loader: {
    padding: 40,
  },
});

export default OrganizationDashboardScreen;
