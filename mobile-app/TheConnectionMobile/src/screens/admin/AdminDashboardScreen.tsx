import React, { useMemo } from 'react';
import { ScrollView, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import type {
  LivestreamerApplication,
  ApologistScholarApplication,
} from '@connection/shared/schema';

type ApplicationStats = {
  total: number;
  pending: number;
  approved: number;
  rejected?: number;
  reviewedToday?: number;
};

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  );
}

export function AdminDashboardScreen() {
  const { user } = useAuth();

  const {
    data: livestreamerApps,
    isLoading: loadingLivestreamers,
  } = useQuery<LivestreamerApplication[]>({
    queryKey: ['admin-livestreamer-applications'],
    enabled: Boolean(user?.isAdmin),
    queryFn: async () => {
      const response = await apiClient.get('/admin/applications/livestreamer');
      return response.data;
    },
  });

  const { data: apologistApps, isLoading: loadingApologistApps } = useQuery<ApologistScholarApplication[]>({
    queryKey: ['admin-apologist-applications'],
    enabled: Boolean(user?.isAdmin),
    queryFn: async () => {
      const response = await apiClient.get('/admin/apologist-scholar-applications');
      return response.data;
    },
  });

  const { data: stats, isLoading: loadingStats } = useQuery<ApplicationStats>({
    queryKey: ['admin-application-stats'],
    enabled: Boolean(user?.isAdmin),
    queryFn: async () => {
      const response = await apiClient.get('/admin/livestreamer-applications/stats');
      return response.data;
    },
  });

  const pendingCounts = useMemo(() => {
    const pendingLivestreamers = (livestreamerApps || []).filter(app => app.status === 'pending').length;
    const pendingApologists = (apologistApps || []).filter(app => app.status === 'pending').length;
    return { pendingLivestreamers, pendingApologists };
  }, [livestreamerApps, apologistApps]);

  const isLoading = loadingLivestreamers || loadingApologistApps || loadingStats;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Admin Dashboard</Text>
      <Text style={styles.subheading}>Review creator applications and platform health.</Text>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <>
          <View style={styles.grid}>
            <StatCard label="Total Applications" value={stats?.total ?? 0} />
            <StatCard label="Pending Review" value={stats?.pending ?? 0} />
            <StatCard label="Approved" value={stats?.approved ?? 0} />
            <StatCard label="Rejected" value={stats?.rejected ?? 0} />
          </View>

          <View style={styles.card}> 
            <Text style={styles.cardTitle}>Pending by Track</Text>
            <Text style={styles.cardLine}>
              Livestreamers: <Text style={styles.cardEmphasis}>{pendingCounts.pendingLivestreamers}</Text>
            </Text>
            <Text style={styles.cardLine}>
              Apologist Scholars: <Text style={styles.cardEmphasis}>{pendingCounts.pendingApologists}</Text>
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  subheading: {
    color: '#475569',
    fontSize: 14,
    marginBottom: 8,
  },
  loader: {
    paddingVertical: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    flex: 1,
    minWidth: '45%',
  },
  cardLabel: {
    color: '#475569',
    fontSize: 13,
    marginBottom: 6,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  cardLine: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 4,
  },
  cardEmphasis: {
    fontWeight: '700',
    color: '#0f172a',
  },
});

export default AdminDashboardScreen;
