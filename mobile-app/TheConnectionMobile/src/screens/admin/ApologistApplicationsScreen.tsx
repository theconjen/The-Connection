import React from 'react';
import { ScrollView, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import type { ApologistScholarApplication } from '@connection/shared/schema';

function ApplicationRow({ application }: { application: ApologistScholarApplication }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>{application.fullName}</Text>
      <Text style={styles.rowSubtitle}>Status: {application.status}</Text>
      {application.reviewNotes ? (
        <Text style={styles.rowNote}>Notes: {application.reviewNotes}</Text>
      ) : null}
    </View>
  );
}

export function ApologistApplicationsScreen() {
  const { data, isLoading } = useQuery<ApologistScholarApplication[]>({
    queryKey: ['admin-apologist-applications'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/apologist-scholar-applications');
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
      <Text style={styles.heading}>Apologist Scholar Applications</Text>
      <Text style={styles.subheading}>Applications pulled directly from the admin routes.</Text>

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

export default ApologistApplicationsScreen;
