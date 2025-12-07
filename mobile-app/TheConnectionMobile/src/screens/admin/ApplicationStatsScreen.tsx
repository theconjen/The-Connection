import React from 'react';
import { ScrollView, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';

type ApplicationStats = {
  total: number;
  pending: number;
  approved: number;
  rejected?: number;
  reviewedToday?: number;
};

export function ApplicationStatsScreen() {
  const { data, isLoading } = useQuery<ApplicationStats>({
    queryKey: ['admin-application-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/livestreamer-applications/stats');
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
      <Text style={styles.heading}>Application Stats</Text>
      <Text style={styles.subheading}>This mirrors the admin stats route used on web.</Text>

      <View style={styles.card}>
        <Text style={styles.row}>Total: {data?.total ?? 0}</Text>
        <Text style={styles.row}>Pending: {data?.pending ?? 0}</Text>
        <Text style={styles.row}>Approved: {data?.approved ?? 0}</Text>
        <Text style={styles.row}>Rejected: {data?.rejected ?? 0}</Text>
        {data?.reviewedToday !== undefined && (
          <Text style={styles.row}>Reviewed Today: {data.reviewedToday}</Text>
        )}
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
  row: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 8,
  },
  loader: {
    padding: 40,
  },
});

export default ApplicationStatsScreen;
