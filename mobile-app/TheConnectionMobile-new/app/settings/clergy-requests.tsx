/**
 * Clergy Verification Requests Screen (Admin View)
 * For organization admins to review and approve/reject clergy verification requests
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
  Image,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import apiClient from '../../src/lib/apiClient';

interface VerificationRequest {
  id: number;
  userId: number;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  notes?: string;
}

interface Organization {
  organization: {
    id: number;
    name: string;
  };
  role: string;
}

export default function ClergyRequestsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<number | null>(null);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Modal state for rejection notes
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectRequestId, setRejectRequestId] = useState<number | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrg) {
      loadRequests(selectedOrg);
    }
  }, [selectedOrg]);

  const loadOrganizations = async () => {
    try {
      const response = await apiClient.get('/api/organizations');
      const orgs = response.data || [];
      // Filter to only orgs where user is admin or pastor
      const adminOrgs = orgs.filter(
        (o: Organization) => o.role === 'admin' || o.role === 'pastor'
      );
      setOrganizations(adminOrgs);

      // Auto-select first org or use param
      if (params.orgId) {
        setSelectedOrg(parseInt(params.orgId as string));
      } else if (adminOrgs.length > 0) {
        setSelectedOrg(adminOrgs[0].organization.id);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
      Alert.alert('Error', 'Failed to load organizations');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRequests = async (orgId: number) => {
    try {
      setRefreshing(true);
      const response = await apiClient.get(`/api/clergy-verification/organizations/${orgId}/requests`);
      setRequests(response.data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
      // Don't show alert for every refresh
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    if (selectedOrg) {
      loadRequests(selectedOrg);
    }
  };

  const handleApprove = async (requestId: number) => {
    Alert.alert(
      'Approve Verification',
      'Are you sure you want to verify this person as clergy? They will receive the verified clergy badge.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setProcessingId(requestId);
            try {
              await apiClient.post(
                `/api/clergy-verification/organizations/${selectedOrg}/requests/${requestId}/approve`,
                {}
              );
              Alert.alert('Success', 'Clergy verification approved');
              loadRequests(selectedOrg!);
            } catch (error: any) {
              const message = error.response?.data?.message || 'Failed to approve verification';
              Alert.alert('Error', message);
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = (requestId: number) => {
    setRejectRequestId(requestId);
    setRejectNotes('');
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectRequestId || !selectedOrg) return;

    setProcessingId(rejectRequestId);
    setShowRejectModal(false);

    try {
      await apiClient.post(
        `/api/clergy-verification/organizations/${selectedOrg}/requests/${rejectRequestId}/reject`,
        { notes: rejectNotes || undefined }
      );
      Alert.alert('Done', 'Verification request declined');
      loadRequests(selectedOrg);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to decline verification';
      Alert.alert('Error', message);
    } finally {
      setProcessingId(null);
      setRejectRequestId(null);
      setRejectNotes('');
    }
  };

  const getAvatarUrl = (request: VerificationRequest) => {
    if (request.avatarUrl) return request.avatarUrl;
    const name = request.displayName || request.username || 'U';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=222D99&color=fff`;
  };

  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: '#F59E0B', bg: '#FEF3C7', text: 'Pending' },
      approved: { color: '#10B981', bg: '#D1FAE5', text: 'Approved' },
      rejected: { color: '#EF4444', bg: '#FEE2E2', text: 'Declined' },
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
      flex: 1,
    },
    content: {
      flex: 1,
    },
    orgSelector: {
      flexDirection: 'row',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
      backgroundColor: colors.surface,
    },
    orgButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      marginRight: 8,
      backgroundColor: colors.surfaceMuted,
    },
    orgButtonSelected: {
      backgroundColor: '#D97706',
    },
    orgButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    orgButtonTextSelected: {
      color: '#fff',
    },
    section: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    requestCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    requestHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    requestAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: 12,
    },
    requestInfo: {
      flex: 1,
    },
    requestName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    requestUsername: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    requestDate: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
    },
    requestActions: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    approveButton: {
      backgroundColor: '#10B981',
    },
    rejectButton: {
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
    approveButtonText: {
      color: '#fff',
    },
    rejectButtonText: {
      color: colors.textSecondary,
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
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    noOrgState: {
      flex: 1,
      padding: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      width: '100%',
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    modalDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    modalInput: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      color: colors.textPrimary,
      fontSize: 14,
      minHeight: 80,
      textAlignVertical: 'top',
      marginBottom: 16,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    modalCancelButton: {
      backgroundColor: colors.surfaceMuted,
    },
    modalConfirmButton: {
      backgroundColor: '#EF4444',
    },
    modalButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    modalCancelText: {
      color: colors.textPrimary,
    },
    modalConfirmText: {
      color: '#fff',
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Clergy Verification Requests</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (organizations.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Clergy Verification Requests</Text>
        </View>
        <View style={styles.noOrgState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="shield-outline" size={32} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No Admin Access</Text>
          <Text style={styles.emptyText}>
            You need to be an admin or pastor of an organization to review clergy verification requests.
          </Text>
        </View>
      </View>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clergy Verification Requests</Text>
      </View>

      {/* Org Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.orgSelector}>
        {organizations.map((org) => (
          <TouchableOpacity
            key={org.organization.id}
            style={[
              styles.orgButton,
              selectedOrg === org.organization.id && styles.orgButtonSelected,
            ]}
            onPress={() => setSelectedOrg(org.organization.id)}
          >
            <Text
              style={[
                styles.orgButtonText,
                selectedOrg === org.organization.id && styles.orgButtonTextSelected,
              ]}
            >
              {org.organization.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Pending Requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Requests</Text>
          <Text style={styles.sectionSubtitle}>
            {pendingRequests.length} request{pendingRequests.length !== 1 ? 's' : ''} awaiting review
          </Text>

          {pendingRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="checkmark-circle-outline" size={32} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>All Caught Up</Text>
              <Text style={styles.emptyText}>
                No pending clergy verification requests.
              </Text>
            </View>
          ) : (
            pendingRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Image
                    source={{ uri: getAvatarUrl(request) }}
                    style={styles.requestAvatar}
                  />
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestName}>
                      {request.displayName || request.username}
                    </Text>
                    <Text style={styles.requestUsername}>@{request.username}</Text>
                    <Text style={styles.requestDate}>
                      Requested {new Date(request.requestedAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleReject(request.id)}
                    disabled={processingId === request.id}
                  >
                    {processingId === request.id ? (
                      <ActivityIndicator size="small" color={colors.textMuted} />
                    ) : (
                      <>
                        <Ionicons name="close" size={18} color={colors.textSecondary} />
                        <Text style={[styles.actionButtonText, styles.rejectButtonText]}>
                          Decline
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApprove(request.id)}
                    disabled={processingId === request.id}
                  >
                    {processingId === request.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={18} color="#fff" />
                        <Text style={[styles.actionButtonText, styles.approveButtonText]}>
                          Approve
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Processed Requests */}
        {processedRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Past Requests</Text>
            <Text style={styles.sectionSubtitle}>
              Previously reviewed requests
            </Text>

            {processedRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Image
                    source={{ uri: getAvatarUrl(request) }}
                    style={styles.requestAvatar}
                  />
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestName}>
                      {request.displayName || request.username}
                    </Text>
                    <Text style={styles.requestUsername}>@{request.username}</Text>
                    <Text style={styles.requestDate}>
                      Reviewed {request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString() : 'N/A'}
                    </Text>
                  </View>
                  {renderStatusBadge(request.status)}
                </View>
                {request.notes && (
                  <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
                    Note: {request.notes}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Decline Request</Text>
            <Text style={styles.modalDescription}>
              Optionally provide a reason for declining this verification request.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={rejectNotes}
              onChangeText={setRejectNotes}
              placeholder="Reason (optional)"
              placeholderTextColor={colors.textMuted}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowRejectModal(false)}
              >
                <Text style={[styles.modalButtonText, styles.modalCancelText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={confirmReject}
              >
                <Text style={[styles.modalButtonText, styles.modalConfirmText]}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
