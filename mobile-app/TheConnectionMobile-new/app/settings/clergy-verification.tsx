/**
 * Clergy Verification Settings Screen
 * Allows users to request clergy verification from organizations they belong to
 * Shows status of pending requests
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import apiClient from '../../src/lib/apiClient';
import { ClergyBadge } from '../../src/components/ClergyBadge';

interface Organization {
  organization: {
    id: number;
    name: string;
    description?: string;
  };
  role: string;
  joinedAt: string;
}

interface VerificationRequest {
  id: number;
  organizationId: number;
  organizationName: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  notes?: string;
}

interface VerificationStatus {
  isVerifiedClergy: boolean;
  clergyVerifiedAt?: string;
  verifyingOrganization?: string;
}

export default function ClergyVerificationScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [requestingOrgId, setRequestingOrgId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load all data in parallel
      const [orgsResponse, requestsResponse, statusResponse] = await Promise.all([
        apiClient.get('/api/organizations').catch(() => ({ data: [] })),
        apiClient.get('/api/clergy-verification/my-requests').catch(() => ({ data: [] })),
        apiClient.get('/api/clergy-verification/status').catch(() => ({ data: null })),
      ]);

      setOrganizations(orgsResponse.data || []);
      setRequests(requestsResponse.data || []);
      setVerificationStatus(statusResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load verification data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const requestVerification = async (organizationId: number, organizationName: string) => {
    setRequestingOrgId(organizationId);
    try {
      await apiClient.post('/api/clergy-verification/request', { organizationId });
      Alert.alert(
        'Request Submitted',
        `Your clergy verification request has been sent to ${organizationName}. An administrator will review your request.`
      );
      loadData(); // Refresh the data
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to submit verification request';
      Alert.alert('Error', message);
    } finally {
      setRequestingOrgId(null);
    }
  };

  const getRequestStatusForOrg = (orgId: number) => {
    return requests.find(r => r.organizationId === orgId);
  };

  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: '#F59E0B', bg: '#FEF3C7', text: 'Pending' },
      approved: { color: '#10B981', bg: '#D1FAE5', text: 'Approved' },
      rejected: { color: '#EF4444', bg: '#FEE2E2', text: 'Rejected' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
        <Text style={[styles.statusBadgeText, { color: config.color }]}>{config.text}</Text>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      paddingTop: 60,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    content: {
      flex: 1,
    },
    section: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 12,
    },
    sectionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    verifiedCard: {
      backgroundColor: '#FEF3C7',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#D97706',
    },
    verifiedHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    verifiedTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#92400E',
      marginLeft: 8,
    },
    verifiedText: {
      fontSize: 14,
      color: '#92400E',
    },
    orgCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    orgHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    orgName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      flex: 1,
    },
    orgRole: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    requestButton: {
      backgroundColor: '#D97706',
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    requestButtonDisabled: {
      backgroundColor: colors.surfaceMuted,
    },
    requestButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
      marginLeft: 6,
    },
    statusBadge: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 12,
    },
    statusBadgeText: {
      fontSize: 12,
      fontWeight: '600',
    },
    requestInfo: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
    },
    requestInfoText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    emptyState: {
      padding: 32,
      alignItems: 'center',
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.surfaceMuted,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    previewCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    previewTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 12,
    },
    previewRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 16,
    },
    previewItem: {
      alignItems: 'center',
      gap: 8,
    },
    previewLabel: {
      fontSize: 12,
      color: colors.textMuted,
    },
    previewExample: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
    },
    previewExampleName: {
      fontSize: 16,
      fontWeight: '600',
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Clergy Verification</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clergy Verification</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionDescription}>
            Pastors, priests, and other clergy members can request verification from their church or organization.
            Verified clergy receive a shepherd's staff badge and priority in community responses.
          </Text>

          {/* Badge Preview - always visible */}
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Badge Preview</Text>
            <View style={styles.previewRow}>
              <View style={styles.previewItem}>
                <ClergyBadge size="small" />
                <Text style={styles.previewLabel}>Small</Text>
              </View>
              <View style={styles.previewItem}>
                <ClergyBadge size="medium" />
                <Text style={styles.previewLabel}>Medium</Text>
              </View>
              <View style={styles.previewItem}>
                <ClergyBadge size="large" />
                <Text style={styles.previewLabel}>Large</Text>
              </View>
            </View>
            <View style={styles.previewExample}>
              <Text style={[styles.previewExampleName, { color: colors.textPrimary }]}>
                Pastor John Smith
              </Text>
              <ClergyBadge size="small" style={{ marginLeft: 6 }} />
            </View>
          </View>

          {/* Verification Status */}
          {verificationStatus?.isVerifiedClergy && (
            <View style={styles.verifiedCard}>
              <View style={styles.verifiedHeader}>
                <ClergyBadge size="medium" />
                <Text style={styles.verifiedTitle}>Verified Clergy</Text>
              </View>
              <Text style={styles.verifiedText}>
                Verified by {verificationStatus.verifyingOrganization || 'your organization'}
              </Text>
            </View>
          )}

          {/* Organizations */}
          <Text style={styles.sectionTitle}>Your Organizations</Text>

          {organizations.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="business-outline" size={32} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No Organizations</Text>
              <Text style={styles.emptyText}>
                You need to be a member of an organization (church or ministry) to request clergy verification.
              </Text>
            </View>
          ) : (
            organizations.map((org) => {
              const existingRequest = getRequestStatusForOrg(org.organization.id);
              const isVerifiedFromThisOrg = verificationStatus?.isVerifiedClergy &&
                verificationStatus.verifyingOrganization === org.organization.name;

              return (
                <View key={org.organization.id} style={styles.orgCard}>
                  <View style={styles.orgHeader}>
                    <Text style={styles.orgName}>{org.organization.name}</Text>
                    {existingRequest && renderStatusBadge(existingRequest.status)}
                  </View>
                  <Text style={styles.orgRole}>
                    Member since {new Date(org.joinedAt).toLocaleDateString()}
                  </Text>

                  {isVerifiedFromThisOrg ? (
                    <View style={[styles.requestButton, { backgroundColor: '#10B981' }]}>
                      <Ionicons name="checkmark-circle" size={18} color="#fff" />
                      <Text style={styles.requestButtonText}>Verified</Text>
                    </View>
                  ) : existingRequest?.status === 'pending' ? (
                    <View style={[styles.requestButton, styles.requestButtonDisabled]}>
                      <Ionicons name="time" size={18} color={colors.textMuted} />
                      <Text style={[styles.requestButtonText, { color: colors.textMuted }]}>
                        Request Pending
                      </Text>
                    </View>
                  ) : existingRequest?.status === 'rejected' ? (
                    <View>
                      <TouchableOpacity
                        style={styles.requestButton}
                        onPress={() => requestVerification(org.organization.id, org.organization.name)}
                        disabled={requestingOrgId === org.organization.id}
                      >
                        {requestingOrgId === org.organization.id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="refresh" size={18} color="#fff" />
                            <Text style={styles.requestButtonText}>Request Again</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      {existingRequest.notes && (
                        <View style={styles.requestInfo}>
                          <Text style={styles.requestInfoText}>
                            Previous request was declined
                            {existingRequest.notes ? `: ${existingRequest.notes}` : ''}
                          </Text>
                        </View>
                      )}
                    </View>
                  ) : verificationStatus?.isVerifiedClergy ? (
                    <View style={[styles.requestButton, styles.requestButtonDisabled]}>
                      <Text style={[styles.requestButtonText, { color: colors.textMuted }]}>
                        Already Verified
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.requestButton}
                      onPress={() => requestVerification(org.organization.id, org.organization.name)}
                      disabled={requestingOrgId === org.organization.id}
                    >
                      {requestingOrgId === org.organization.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="shield-checkmark" size={18} color="#fff" />
                          <Text style={styles.requestButtonText}>Request Verification</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
