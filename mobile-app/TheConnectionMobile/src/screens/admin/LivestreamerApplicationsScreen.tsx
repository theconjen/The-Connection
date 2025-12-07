import React from 'react';
import { ScrollView, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import type { LivestreamerApplication } from '@connection/shared/schema';

function ApplicationRow({ application }: { application: LivestreamerApplication }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>{application.ministryName || 'Unnamed Ministry'}</Text>
      <Text style={styles.rowSubtitle}>Status: {application.status}</Text>
      {application.reviewNotes ? (
        <Text style={styles.rowNote}>Notes: {application.reviewNotes}</Text>
      ) : null}
    </View>
  );
}

export function LivestreamerApplicationsScreen() {
  const { data, isLoading } = useQuery<LivestreamerApplication[]>({
    queryKey: ['admin-livestreamer-applications'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/applications/livestreamer');
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
      <Text style={styles.heading}>Livestreamer Applications</Text>
      <Text style={styles.subheading}>Data is pulled from the admin livestreamer routes.</Text>

      {(data || []).map(app => (
        <ApplicationRow key={app.id} application={app} />
      ))}

      {(data || []).length === 0 && (
        <Text style={styles.empty}>No applications found.</Text>
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
  row: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  rowSubtitle: {
    color: '#334155',
    marginTop: 4,
  },
  rowNote: {
    color: '#475569',
    marginTop: 4,
  },
  loader: {
    padding: 40,
  },
  empty: {
    marginTop: 16,
    color: '#475569',
  },
});

export default LivestreamerApplicationsScreen;
