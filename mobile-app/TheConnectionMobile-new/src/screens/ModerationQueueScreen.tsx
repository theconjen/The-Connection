/**
 * Moderation Queue Screen (ADMIN ONLY)
 * For admins/moderators to review reported content
 * Shows user reputation data and moderation tools
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import apiClient from '../lib/apiClient';
import { UserReputationBadge } from '../components/UserReputationBadge';

interface Report {
  id: number;
  reporterId: number;
  contentType: string;
  contentId: number;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  createdAt: string;
  moderatorId?: number;
  moderatorNotes?: string;
  reporter?: {
    id: number;
    username: string;
    displayName?: string;
    reputation?: {
      reputationScore: number;
      trustLevel: number;
      helpfulFlags: number;
      falseReports: number;
    };
  };
  reportedUser?: {
    id: number;
    username: string;
    displayName?: string;
    reputation?: {
      reputationScore: number;
      trustLevel: number;
      totalReports: number;
      validReports: number;
      warnings: number;
      suspensions: number;
    };
  };
}

type FilterTab = 'pending' | 'reviewing' | 'resolved' | 'all';

export default function ModerationQueueScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('pending');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const queryClient = useQueryClient();

  // Fetch reports
  const { data: reports = [], isLoading, refetch } = useQuery<Report[]>({
    queryKey: ['/api/admin/reports', activeFilter],
    queryFn: async () => {
      const params = activeFilter !== 'all' ? { status: activeFilter } : {};
      const response = await apiClient.get('/api/admin/reports', { params });
      return response.data;
    },
  });

  // Update report status mutation
  const updateReportMutation = useMutation({
    mutationFn: async ({
      reportId,
      status,
      notes,
    }: {
      reportId: number;
      status: string;
      notes?: string;
    }) => {
      return apiClient.patch(`/api/admin/reports/${reportId}`, {
        status,
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
      setSelectedReport(null);
    },
  });

  const handleResolveReport = (report: Report, action: 'resolved' | 'dismissed') => {
    Alert.alert(
      `${action === 'resolved' ? 'Resolve' : 'Dismiss'} Report`,
      `Are you sure you want to ${action === 'resolved' ? 'resolve' : 'dismiss'} this report?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'resolved' ? 'Resolve' : 'Dismiss',
          style: action === 'resolved' ? 'default' : 'destructive',
          onPress: () => {
            updateReportMutation.mutate({
              reportId: report.id,
              status: action,
              notes: action === 'resolved' ? 'Content removed' : 'Report dismissed',
            });
          },
        },
      ]
    );
  };

  const getReasonIcon = (reason: string) => {
    const icons: Record<string, any> = {
      spam: 'warning',
      harassment: 'alert-circle',
      hate_speech: 'ban',
      inappropriate: 'eye-off',
      false_info: 'information-circle',
      violence: 'alert',
      sexual_content: 'close-circle',
      other: 'ellipsis-horizontal',
    };
    return icons[reason] || 'flag';
  };

  const getReasonColor = (reason: string) => {
    const colors: Record<string, string> = {
      spam: '#F59E0B',
      harassment: '#EF4444',
      hate_speech: '#DC2626',
      inappropriate: '#F97316',
      false_info: '#3B82F6',
      violence: '#B91C1C',
      sexual_content: '#EC4899',
      other: '#6B7280',
    };
    return colors[reason] || '#6B7280';
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string; bg: string }> = {
      pending: { label: 'Pending', color: '#F59E0B', bg: '#FFF7ED' },
      reviewing: { label: 'Reviewing', color: '#3B82F6', bg: '#EFF6FF' },
      resolved: { label: 'Resolved', color: '#10B981', bg: '#ECFDF5' },
      dismissed: { label: 'Dismissed', color: '#6B7280', bg: '#F3F4F6' },
    };
    return badges[status] || badges.pending;
  };

  const renderReport = ({ item }: { item: Report }) => {
    const statusBadge = getStatusBadge(item.status);
    const reasonColor = getReasonColor(item.reason);

    return (
      <Pressable
        style={styles.reportCard}
        onPress={() => setSelectedReport(item)}
      >
        <View style={styles.reportHeader}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons
                name={getReasonIcon(item.reason)}
                size={18}
                color={reasonColor}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.reportReason}>
                {item.reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
            </View>
            <Text style={styles.reportMeta}>
              {item.contentType} #{item.contentId} • {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>
              {statusBadge.label}
            </Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.reportDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.reportFooter}>
          <Text style={styles.reporterText}>
            Reported by: {item.reporter?.displayName || item.reporter?.username || `User #${item.reporterId}`}
          </Text>

          {item.status === 'pending' && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                style={[styles.actionButton, styles.dismissButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleResolveReport(item, 'dismissed');
                }}
              >
                <Ionicons name="close" size={16} color="#6B7280" />
                <Text style={styles.dismissButtonText}>Dismiss</Text>
              </Pressable>

              <Pressable
                style={[styles.actionButton, styles.resolveButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleResolveReport(item, 'resolved');
                }}
              >
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={styles.resolveButtonText}>Resolve</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const renderReportDetailModal = () => {
    if (!selectedReport) return null;

    const statusBadge = getStatusBadge(selectedReport.status);

    return (
      <Modal
        visible={!!selectedReport}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedReport(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Details</Text>
              <Pressable onPress={() => setSelectedReport(null)}>
                <Ionicons name="close" size={24} color="#0D1829" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Status */}
              <View style={[styles.statusBadgeLarge, { backgroundColor: statusBadge.bg }]}>
                <Text style={[styles.statusBadgeTextLarge, { color: statusBadge.color }]}>
                  {statusBadge.label}
                </Text>
              </View>

              {/* Report Info */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Report Information</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Content Type:</Text>
                  <Text style={styles.infoValue}>{selectedReport.contentType}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Content ID:</Text>
                  <Text style={styles.infoValue}>#{selectedReport.contentId}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Reason:</Text>
                  <Text style={styles.infoValue}>
                    {selectedReport.reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Reported:</Text>
                  <Text style={styles.infoValue}>
                    {formatDistanceToNow(new Date(selectedReport.createdAt), { addSuffix: true })}
                  </Text>
                </View>
              </View>

              {/* Description */}
              {selectedReport.description && (
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.descriptionText}>{selectedReport.description}</Text>
                </View>
              )}

              {/* Reporter Info (Admin Only) */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Reporter (Admin View)</Text>
                <Text style={styles.usernameText}>
                  {selectedReport.reporter?.displayName || selectedReport.reporter?.username || `User #${selectedReport.reporterId}`}
                </Text>
                {selectedReport.reporter?.reputation && (
                  <View style={styles.reputationContainer}>
                    <UserReputationBadge
                      reputationScore={selectedReport.reporter.reputation.reputationScore}
                      trustLevel={selectedReport.reporter.reputation.trustLevel}
                      size="medium"
                    />
                    <View style={styles.reputationStats}>
                      <Text style={styles.reputationStat}>
                        ✓ {selectedReport.reporter.reputation.helpfulFlags} helpful reports
                      </Text>
                      <Text style={styles.reputationStat}>
                        ✗ {selectedReport.reporter.reputation.falseReports} false reports
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Reported User Info (Admin Only) */}
              {selectedReport.reportedUser && (
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>Reported User (Admin View)</Text>
                  <Text style={styles.usernameText}>
                    {selectedReport.reportedUser.displayName || selectedReport.reportedUser.username}
                  </Text>
                  {selectedReport.reportedUser.reputation && (
                    <View style={styles.reputationContainer}>
                      <UserReputationBadge
                        reputationScore={selectedReport.reportedUser.reputation.reputationScore}
                        trustLevel={selectedReport.reportedUser.reputation.trustLevel}
                        size="medium"
                      />
                      <View style={styles.reputationStats}>
                        <Text style={styles.reputationStat}>
                          📊 {selectedReport.reportedUser.reputation.totalReports} total reports
                        </Text>
                        <Text style={styles.reputationStat}>
                          ⚠️ {selectedReport.reportedUser.reputation.validReports} confirmed violations
                        </Text>
                        <Text style={styles.reputationStat}>
                          🚫 {selectedReport.reportedUser.reputation.warnings} warnings
                        </Text>
                        {selectedReport.reportedUser.reputation.suspensions > 0 && (
                          <Text style={[styles.reputationStat, { color: '#E63946' }]}>
                            🔒 {selectedReport.reportedUser.reputation.suspensions} suspensions
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Actions */}
              {selectedReport.status === 'pending' && (
                <View style={styles.actionSection}>
                  <Pressable
                    style={[styles.modalButton, styles.dismissButtonLarge]}
                    onPress={() => {
                      setSelectedReport(null);
                      handleResolveReport(selectedReport, 'dismissed');
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color="#6B7280" />
                    <Text style={styles.dismissButtonTextLarge}>Dismiss Report</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.modalButton, styles.resolveButtonLarge]}
                    onPress={() => {
                      setSelectedReport(null);
                      handleResolveReport(selectedReport, 'resolved');
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.resolveButtonTextLarge}>Resolve & Remove Content</Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Moderation Queue</Text>
        <Pressable style={styles.headerButton} onPress={() => refetch()}>
          <Ionicons name="refresh" size={24} color="#0D1829" />
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['pending', 'reviewing', 'resolved', 'all'] as FilterTab[]).map((filter) => (
          <Pressable
            key={filter}
            style={[
              styles.filterTab,
              activeFilter === filter && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === filter && styles.filterTabTextActive,
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
            {filter === 'pending' && reports.filter(r => r.status === 'pending').length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {reports.filter(r => r.status === 'pending').length}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {/* Reports List */}
      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#5C6B5E" />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.centerContent}>
          <Ionicons name="checkmark-done-circle-outline" size={64} color="#637083" />
          <Text style={styles.emptyText}>No {activeFilter !== 'all' ? activeFilter : ''} reports</Text>
          <Text style={styles.emptySubtext}>
            {activeFilter === 'pending' ? 'All caught up!' : 'Change filter to see more reports'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReport}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} />
          }
        />
      )}

      {/* Report Detail Modal (Admin Only) */}
      {renderReportDetailModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D8DE',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0D1829',
  },
  headerButton: {
    padding: 8,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D8DE',
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F8FA',
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: '#5C6B5E',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#637083',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  badge: {
    backgroundColor: '#E63946',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D1D8DE',
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reportReason: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D1829',
  },
  reportMeta: {
    fontSize: 13,
    color: '#637083',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reportDescription: {
    fontSize: 14,
    color: '#0D1829',
    marginBottom: 12,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F8FA',
  },
  reporterText: {
    fontSize: 13,
    color: '#637083',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  dismissButton: {
    backgroundColor: '#F5F8FA',
  },
  dismissButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  resolveButton: {
    backgroundColor: '#10B981',
  },
  resolveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#637083',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#0D1829',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#637083',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D8DE',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D1829',
  },
  modalBody: {
    padding: 20,
  },
  statusBadgeLarge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 20,
  },
  statusBadgeTextLarge: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1829',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#637083',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#0D1829',
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 14,
    color: '#0D1829',
    lineHeight: 20,
  },
  usernameText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0D1829',
    marginBottom: 12,
  },
  reputationContainer: {
    gap: 12,
  },
  reputationStats: {
    backgroundColor: '#F5F8FA',
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  reputationStat: {
    fontSize: 13,
    color: '#637083',
  },
  actionSection: {
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  dismissButtonLarge: {
    backgroundColor: '#F5F8FA',
    borderWidth: 1,
    borderColor: '#D1D8DE',
  },
  dismissButtonTextLarge: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  resolveButtonLarge: {
    backgroundColor: '#E63946',
  },
  resolveButtonTextLarge: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
