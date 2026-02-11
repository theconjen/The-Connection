/**
 * Churches Directory Screen
 * Browse and search for churches
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  TextInput,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { churchesAPI, ChurchListItem } from '../queries/churches';

interface ChurchesScreenProps {
  onBack: () => void;
  onChurchPress: (church: ChurchListItem) => void;
}

export function ChurchesScreen({ onBack, onChurchPress }: ChurchesScreenProps) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedDenomination, setSelectedDenomination] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Invite form state
  const [inviteForm, setInviteForm] = useState({
    churchName: '',
    churchEmail: '',
    churchCity: '',
    churchState: '',
    churchWebsite: '',
  });

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch filter options
  const { data: filtersData } = useQuery({
    queryKey: ['churches', 'filters'],
    queryFn: () => churchesAPI.getFilters(),
  });

  // Fetch churches with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['churches', 'directory', debouncedQuery, selectedDenomination, selectedState],
    queryFn: async ({ pageParam }) => {
      return churchesAPI.getDirectory({
        limit: 20,
        cursor: pageParam,
        q: debouncedQuery || undefined,
        denomination: selectedDenomination || undefined,
        state: selectedState || undefined,
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
  });

  // Invitation mutation
  const inviteMutation = useMutation({
    mutationFn: churchesAPI.requestChurchInvitation,
    onSuccess: () => {
      setShowInviteModal(false);
      setInviteForm({
        churchName: '',
        churchEmail: '',
        churchCity: '',
        churchState: '',
        churchWebsite: '',
      });
      queryClient.invalidateQueries({ queryKey: ['churches', 'invitations'] });
    },
  });

  const churches = data?.pages.flatMap((page) => page.items) ?? [];
  const activeFiltersCount = (selectedDenomination ? 1 : 0) + (selectedState ? 1 : 0);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderChurchCard = ({ item }: { item: ChurchListItem }) => (
    <Pressable
      style={[styles.churchCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
      onPress={() => onChurchPress(item)}
    >
      <View style={styles.churchContent}>
        {item.logoUrl ? (
          <Image source={{ uri: item.logoUrl }} style={styles.churchLogo} />
        ) : (
          <View style={[styles.churchLogoPlaceholder, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="business" size={28} color={colors.primary} />
          </View>
        )}
        <View style={styles.churchInfo}>
          <Text style={[styles.churchName, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.name}
          </Text>
          {(item.city || item.state) && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.churchLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                {[item.city, item.state].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}
          {item.denomination && (
            <Text style={[styles.churchDenomination, { color: colors.textMuted }]} numberOfLines={1}>
              {item.denomination}
            </Text>
          )}
          {item.description && (
            <Text style={[styles.churchDescription, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </View>
    </Pressable>
  );

  const clearFilters = () => {
    setSelectedDenomination(null);
    setSelectedState(null);
  };

  const handleInviteSubmit = () => {
    if (!inviteForm.churchName.trim() || !inviteForm.churchEmail.trim()) return;
    inviteMutation.mutate({
      churchName: inviteForm.churchName.trim(),
      churchEmail: inviteForm.churchEmail.trim().toLowerCase(),
      churchCity: inviteForm.churchCity.trim() || undefined,
      churchState: inviteForm.churchState.trim() || undefined,
      churchWebsite: inviteForm.churchWebsite.trim() || undefined,
    });
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="business-outline" size={64} color={colors.textMuted} />
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
          {debouncedQuery || selectedDenomination || selectedState ? 'No churches found' : 'No churches yet'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {debouncedQuery || selectedDenomination || selectedState
            ? 'Try adjusting your search or filters'
            : 'Churches will appear here once they join the platform'}
        </Text>
        {(selectedDenomination || selectedState) && (
          <Pressable style={[styles.clearFiltersButton, { borderColor: colors.primary }]} onPress={clearFilters}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Clear Filters</Text>
          </Pressable>
        )}
      </View>
    );
  };

  const renderFooter = () => {
    return (
      <View>
        {isFetchingNextPage && (
          <View style={styles.footerLoader}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
        {/* Can't find your church CTA */}
        <View style={[styles.inviteCTA, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
          <View style={styles.inviteCTAText}>
            <Text style={[styles.inviteCTATitle, { color: colors.textPrimary }]}>
              Can't find your church?
            </Text>
            <Text style={[styles.inviteCTASubtitle, { color: colors.textSecondary }]}>
              We'll reach out and invite them to join
            </Text>
          </View>
          <Pressable
            style={[styles.inviteButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowInviteModal(true)}
          >
            <Text style={{ color: colors.primaryForeground, fontWeight: '600', fontSize: 14 }}>Invite</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Churches</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search churches..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </Pressable>
        )}
        <Pressable
          style={[styles.filterButton, activeFiltersCount > 0 && { backgroundColor: colors.primary + '20' }]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="options-outline" size={20} color={activeFiltersCount > 0 ? colors.primary : colors.textSecondary} />
          {activeFiltersCount > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
              <Text style={{ color: colors.primaryForeground, fontSize: 10, fontWeight: '700' }}>{activeFiltersCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Filter Panel */}
      {showFilters && (
        <View style={[styles.filterPanel, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          {/* Denomination Filter */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Denomination</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <Pressable
                style={[
                  styles.filterChip,
                  { borderColor: !selectedDenomination ? colors.primary : colors.borderSubtle },
                  !selectedDenomination && { backgroundColor: colors.primary + '15' },
                ]}
                onPress={() => setSelectedDenomination(null)}
              >
                <Text style={{ color: !selectedDenomination ? colors.primary : colors.textSecondary, fontSize: 13 }}>All</Text>
              </Pressable>
              {filtersData?.denominations.slice(0, 8).map((denom) => (
                <Pressable
                  key={denom}
                  style={[
                    styles.filterChip,
                    { borderColor: selectedDenomination === denom ? colors.primary : colors.borderSubtle },
                    selectedDenomination === denom && { backgroundColor: colors.primary + '15' },
                  ]}
                  onPress={() => setSelectedDenomination(selectedDenomination === denom ? null : denom)}
                >
                  <Text style={{ color: selectedDenomination === denom ? colors.primary : colors.textSecondary, fontSize: 13 }}>
                    {denom}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* State Filter */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>State</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <Pressable
                style={[
                  styles.filterChip,
                  { borderColor: !selectedState ? colors.primary : colors.borderSubtle },
                  !selectedState && { backgroundColor: colors.primary + '15' },
                ]}
                onPress={() => setSelectedState(null)}
              >
                <Text style={{ color: !selectedState ? colors.primary : colors.textSecondary, fontSize: 13 }}>All</Text>
              </Pressable>
              {filtersData?.states.map((state) => (
                <Pressable
                  key={state}
                  style={[
                    styles.filterChip,
                    { borderColor: selectedState === state ? colors.primary : colors.borderSubtle },
                    selectedState === state && { backgroundColor: colors.primary + '15' },
                  ]}
                  onPress={() => setSelectedState(selectedState === state ? null : state)}
                >
                  <Text style={{ color: selectedState === state ? colors.primary : colors.textSecondary, fontSize: 13 }}>
                    {state}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Church List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading churches...</Text>
        </View>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.textPrimary }]}>Failed to load churches</Text>
          <Pressable style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
            <Text style={[styles.retryButtonText, { color: colors.primaryForeground }]}>Try Again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={churches}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderChurchCard}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* Invite Church Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalContainer, { backgroundColor: colors.background }]}
        >
          <SafeAreaView style={styles.modalContent}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <Pressable onPress={() => setShowInviteModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Invite Your Church</Text>
              <View style={styles.modalCloseButton} />
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                We'll reach out to your church and invite them to join The Connection. Once they sign up, you'll be able to connect with them on the platform.
              </Text>

              {/* Form Fields */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Church Name *</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.borderSubtle, color: colors.textPrimary }]}
                  placeholder="e.g., First Baptist Church"
                  placeholderTextColor={colors.textMuted}
                  value={inviteForm.churchName}
                  onChangeText={(text) => setInviteForm({ ...inviteForm, churchName: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Church Email *</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.borderSubtle, color: colors.textPrimary }]}
                  placeholder="e.g., info@church.org"
                  placeholderTextColor={colors.textMuted}
                  value={inviteForm.churchEmail}
                  onChangeText={(text) => setInviteForm({ ...inviteForm, churchEmail: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: colors.textPrimary }]}>City</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.borderSubtle, color: colors.textPrimary }]}
                    placeholder="City"
                    placeholderTextColor={colors.textMuted}
                    value={inviteForm.churchCity}
                    onChangeText={(text) => setInviteForm({ ...inviteForm, churchCity: text })}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
                  <Text style={[styles.formLabel, { color: colors.textPrimary }]}>State</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.borderSubtle, color: colors.textPrimary }]}
                    placeholder="State"
                    placeholderTextColor={colors.textMuted}
                    value={inviteForm.churchState}
                    onChangeText={(text) => setInviteForm({ ...inviteForm, churchState: text })}
                    maxLength={2}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Church Website</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.borderSubtle, color: colors.textPrimary }]}
                  placeholder="https://church.org"
                  placeholderTextColor={colors.textMuted}
                  value={inviteForm.churchWebsite}
                  onChangeText={(text) => setInviteForm({ ...inviteForm, churchWebsite: text })}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>

              {inviteMutation.isError && (
                <View style={[styles.modalErrorBox, { backgroundColor: colors.destructive + '15' }]}>
                  <Ionicons name="alert-circle" size={20} color={colors.destructive} />
                  <Text style={[styles.modalErrorText, { color: colors.destructive }]}>
                    {(inviteMutation.error as any)?.response?.data?.error || 'Failed to submit request. Please try again.'}
                  </Text>
                </View>
              )}

              {inviteMutation.isSuccess && (
                <View style={[styles.modalSuccessBox, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  <Text style={[styles.modalSuccessText, { color: colors.primary }]}>
                    Request submitted! We'll reach out to your church on your behalf.
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Submit Button */}
            <View style={[styles.modalFooter, { borderTopColor: colors.borderSubtle }]}>
              <Pressable
                style={[
                  styles.submitButton,
                  { backgroundColor: colors.primary },
                  (!inviteForm.churchName.trim() || !inviteForm.churchEmail.trim() || inviteMutation.isPending) && { opacity: 0.5 },
                ]}
                onPress={handleInviteSubmit}
                disabled={!inviteForm.churchName.trim() || !inviteForm.churchEmail.trim() || inviteMutation.isPending}
              >
                {inviteMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <Text style={{ color: colors.primaryForeground, fontWeight: '600', fontSize: 16 }}>Send Invitation Request</Text>
                )}
              </Pressable>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  churchCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  churchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  churchLogo: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  churchLogoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  churchInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  churchName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  churchLocation: {
    fontSize: 13,
  },
  churchDenomination: {
    fontSize: 12,
    marginBottom: 4,
  },
  churchDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  clearFiltersButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  filterBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPanel: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  inviteCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  inviteCTAText: {
    flex: 1,
  },
  inviteCTATitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  inviteCTASubtitle: {
    fontSize: 13,
  },
  inviteButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalContainer: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  modalDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  formRow: {
    flexDirection: 'row',
  },
  modalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 10,
    marginTop: 8,
  },
  modalErrorText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  modalSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 10,
    marginTop: 8,
  },
  modalSuccessText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  submitButton: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChurchesScreen;
