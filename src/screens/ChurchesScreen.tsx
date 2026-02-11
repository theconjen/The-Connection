/**
 * Churches Screen
 * Connect with local churches and faith communities
 */

import React, { useState, useCallback, useEffect } from 'react';
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
import * as Location from 'expo-location';
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

// State name to abbreviation map
const STATE_ABBREVS: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
  'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
  'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
  'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
  'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
  'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
  'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
};

const getStateAbbreviation = (stateName: string): string | null => {
  if (!stateName) return null;
  // If already an abbreviation
  if (stateName.length === 2) return stateName.toUpperCase();
  return STATE_ABBREVS[stateName] || null;
};

// Church traditions with their denominations (alphabetized)
const CHURCH_TRADITIONS = [
  {
    id: 'protestant',
    label: 'Protestant',
    denominations: [
      'African Methodist Episcopal',
      'American Baptist',
      'Anglican',
      'Assembly of God',
      'Baptist',
      'Bible Church',
      'Brethren',
      'Calvary Chapel',
      'Charismatic',
      'Christian & Missionary Alliance',
      'Church of God',
      'Church of God in Christ',
      'Congregational',
      'Dutch Reformed',
      'Evangelical',
      'Evangelical Covenant',
      'Evangelical Free',
      'First Baptist',
      'Holiness',
      'Lutheran',
      'Mennonite',
      'Nazarene',
      'Non-Denominational',
      'Orthodox Presbyterian',
      'PCA',
      'Pentecostal',
      'Presbyterian',
      'Reformed',
      'Southern Baptist',
      'Vineyard',
      'Wesleyan',
    ],
  },
  {
    id: 'catholic',
    label: 'Catholic',
    denominations: [
      'Byzantine Catholic',
      'Catholic',
      'Chaldean Catholic',
      'Maronite Catholic',
      'Melkite Catholic',
      'Roman Catholic',
      'Syro-Malabar',
      'Ukrainian Catholic',
    ],
  },
  {
    id: 'orthodox',
    label: 'Orthodox',
    denominations: [
      'Ancient Church of the East',
      'Antiochian Orthodox',
      'Armenian Apostolic',
      'Assyrian Church of the East',
      'Bulgarian Orthodox',
      'Coptic Orthodox',
      'Eastern Orthodox',
      'Eritrean Orthodox',
      'Ethiopian Orthodox',
      'Greek Orthodox',
      'Orthodox Church in America',
      'Romanian Orthodox',
      'Russian Orthodox',
      'Serbian Orthodox',
      'Syriac Orthodox',
    ],
  },
];

export function ChurchesScreen({ onBack, onChurchPress }: ChurchesScreenProps) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedChurchType, setSelectedChurchType] = useState<string | null>(null);
  const [selectedDenomination, setSelectedDenomination] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [userLocation, setUserLocation] = useState<{ city: string; state: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  // Invite form state
  const [inviteForm, setInviteForm] = useState({
    churchName: '',
    churchEmail: '',
    churchCity: '',
    churchState: '',
    churchWebsite: '',
  });

  // Get user's location on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          const [place] = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          if (place?.city && place?.region) {
            setUserLocation({ city: place.city, state: place.region });
            // Auto-filter to user's state if no filter selected
            if (!selectedState) {
              // Get state abbreviation
              const stateAbbrev = getStateAbbreviation(place.region);
              if (stateAbbrev) {
                setSelectedState(stateAbbrev);
              }
            }
          }
        }
      } catch (error) {
      } finally {
        setLocationLoading(false);
      }
    })();
  }, []);

  // Debounce search
  useEffect(() => {
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

  // Get selected tradition's denominations
  const selectedTradition = selectedChurchType
    ? CHURCH_TRADITIONS.find(t => t.id === selectedChurchType)
    : null;

  // Get denominations for selected church type
  const getFilterDenomination = () => {
    if (selectedDenomination) return selectedDenomination;
    // If a tradition is selected but no specific denomination, filter by all denominations in that tradition
    if (selectedTradition) {
      return selectedTradition.denominations.join(',');
    }
    return undefined;
  };

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
    queryKey: ['churches', 'directory', debouncedQuery, selectedChurchType, selectedDenomination, selectedState],
    queryFn: async ({ pageParam }) => {
      return churchesAPI.getDirectory({
        limit: 20,
        cursor: pageParam,
        q: debouncedQuery || undefined,
        denomination: getFilterDenomination(),
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
  const hasActiveFilters = !!(selectedChurchType || selectedDenomination || (selectedState && selectedState !== getStateAbbreviation(userLocation?.state || '')));

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderChurchCard = ({ item }: { item: ChurchListItem }) => {
    const isNearby = userLocation && item.city?.toLowerCase() === userLocation.city.toLowerCase();

    return (
      <Pressable
        style={[styles.churchCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
        onPress={() => onChurchPress(item)}
      >
        {/* Logo and main info */}
        <View style={styles.churchCardTop}>
          {item.logoUrl ? (
            <Image source={{ uri: item.logoUrl }} style={styles.churchLogo} />
          ) : (
            <View style={[styles.churchLogoPlaceholder, { backgroundColor: colors.primary + '15' }]}>
              <Image
                source={require('../../assets/church-icon.png')}
                style={{ width: 28, height: 28, tintColor: colors.primary }}
              />
            </View>
          )}
          <View style={styles.churchMainInfo}>
            <Text style={[styles.churchName, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.churchMeta}>
              {(item.city || item.state) && (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {[item.city, item.state].filter(Boolean).join(', ')}
                  </Text>
                </View>
              )}
              {item.denomination && (
                <View style={styles.metaItem}>
                  <Ionicons name="bookmark-outline" size={13} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {item.denomination}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Description if available */}
        {item.description && (
          <Text style={[styles.churchDescription, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {/* Community indicators */}
        <View style={styles.churchCardBottom}>
          <View style={styles.communityIndicators}>
            {item.congregationSize != null && item.congregationSize > 0 && (
              <View style={[styles.indicator, { backgroundColor: colors.surfaceMuted }]}>
                <Ionicons name="people-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.indicatorText, { color: colors.textSecondary }]}>
                  {item.congregationSize < 100 ? 'Small' : item.congregationSize < 500 ? 'Medium' : 'Large'} community
                </Text>
              </View>
            )}
            {isNearby && (
              <View style={[styles.indicator, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="navigate" size={12} color={colors.primary} />
                <Text style={[styles.indicatorText, { color: colors.primary }]}>Near you</Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>
      </Pressable>
    );
  };

  const clearFilters = () => {
    setSelectedChurchType(null);
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
    const hasFilters = debouncedQuery || selectedDenomination || selectedState;

    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceMuted }]}>
          <Image
            source={require('../../assets/church-icon.png')}
            style={{ width: 40, height: 40, tintColor: colors.textMuted }}
          />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
          {hasFilters ? 'No churches found' : 'Discover local churches'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {hasFilters
            ? 'Try adjusting your search or expanding your area'
            : 'Connect with faith communities in your area'}
        </Text>
        {hasFilters ? (
          <Pressable style={[styles.emptyButton, { backgroundColor: colors.primary }]} onPress={clearFilters}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Clear filters</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.emptyButton, { backgroundColor: colors.primary }]} onPress={() => setShowInviteModal(true)}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Invite your church</Text>
          </Pressable>
        )}
      </View>
    );
  };

  const renderFooter = () => {
    return (
      <View style={styles.footer}>
        {isFetchingNextPage && (
          <View style={styles.footerLoader}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
        {/* Invite CTA - only show if we have results */}
        {churches.length > 0 && (
          <Pressable
            style={[styles.inviteCTA, { borderColor: colors.borderSubtle }]}
            onPress={() => setShowInviteModal(true)}
          >
            <View style={[styles.inviteIconCircle, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="add" size={20} color={colors.primary} />
            </View>
            <View style={styles.inviteCTAText}>
              <Text style={[styles.inviteCTATitle, { color: colors.textPrimary }]}>
                Don't see your church?
              </Text>
              <Text style={[styles.inviteCTASubtitle, { color: colors.textSecondary }]}>
                Invite them to join The Connection
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        )}
        <View style={{ height: 20 }} />
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
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Find a Church</Text>
          {userLocation && !locationLoading && (
            <View style={styles.locationIndicator}>
              <Ionicons name="location" size={12} color={colors.primary} />
              <Text style={[styles.locationText, { color: colors.primary }]}>
                {userLocation.city}, {userLocation.state}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search by name or city..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
        <Pressable
          style={[
            styles.filterToggle,
            { backgroundColor: colors.surface, borderColor: hasActiveFilters ? colors.primary : colors.borderSubtle },
          ]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="options-outline" size={20} color={hasActiveFilters ? colors.primary : colors.textSecondary} />
        </Pressable>
      </View>

      {/* Filter Panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          {/* Church Traditions - Primary filter row */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionLabel, { color: colors.textMuted }]}>Tradition</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
              <Pressable
                style={[
                  styles.typeChip,
                  { backgroundColor: !selectedChurchType ? colors.primary : colors.surface, borderColor: colors.borderSubtle },
                ]}
                onPress={() => { setSelectedChurchType(null); setSelectedDenomination(null); }}
              >
                <Text style={{ color: !selectedChurchType ? '#fff' : colors.textSecondary, fontSize: 13, fontWeight: '500' }}>All</Text>
              </Pressable>
              {CHURCH_TRADITIONS.map((tradition) => (
                <Pressable
                  key={tradition.id}
                  style={[
                    styles.typeChip,
                    { backgroundColor: selectedChurchType === tradition.id ? colors.primary : colors.surface, borderColor: colors.borderSubtle },
                  ]}
                  onPress={() => {
                    setSelectedChurchType(selectedChurchType === tradition.id ? null : tradition.id);
                    setSelectedDenomination(null);
                  }}
                >
                  <Text style={{ color: selectedChurchType === tradition.id ? '#fff' : colors.textSecondary, fontSize: 13, fontWeight: '500' }}>
                    {tradition.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Denominations - Show when tradition is selected */}
          {selectedTradition && (
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionLabel, { color: colors.textMuted }]}>
                {selectedTradition.label} Denominations
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
                <Pressable
                  style={[
                    styles.denomChip,
                    { borderColor: !selectedDenomination ? colors.primary : colors.borderSubtle },
                    !selectedDenomination && { backgroundColor: colors.primary + '15' },
                  ]}
                  onPress={() => setSelectedDenomination(null)}
                >
                  <Text style={{ color: !selectedDenomination ? colors.primary : colors.textSecondary, fontSize: 12 }}>
                    All {selectedTradition.label}
                  </Text>
                </Pressable>
                {selectedTradition.denominations.map((denom) => (
                  <Pressable
                    key={denom}
                    style={[
                      styles.denomChip,
                      { borderColor: selectedDenomination === denom ? colors.primary : colors.borderSubtle },
                      selectedDenomination === denom && { backgroundColor: colors.primary + '15' },
                    ]}
                    onPress={() => setSelectedDenomination(selectedDenomination === denom ? null : denom)}
                  >
                    <Text style={{ color: selectedDenomination === denom ? colors.primary : colors.textSecondary, fontSize: 12 }}>
                      {denom}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Location filter row */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionLabel, { color: colors.textMuted }]}>Location</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
              {userLocation && (
                <Pressable
                  style={[
                    styles.locationChip,
                    { borderColor: selectedState === getStateAbbreviation(userLocation.state) ? colors.primary : colors.borderSubtle },
                    selectedState === getStateAbbreviation(userLocation.state) && { backgroundColor: colors.primary + '15' },
                  ]}
                  onPress={() => {
                    const abbrev = getStateAbbreviation(userLocation.state);
                    setSelectedState(selectedState === abbrev ? null : abbrev);
                  }}
                >
                  <Ionicons name="navigate" size={14} color={selectedState === getStateAbbreviation(userLocation.state) ? colors.primary : colors.textSecondary} />
                  <Text style={{ color: selectedState === getStateAbbreviation(userLocation.state) ? colors.primary : colors.textSecondary, fontSize: 13 }}>
                    Near me
                  </Text>
                </Pressable>
              )}
              <Pressable
                style={[
                  styles.locationChip,
                  { borderColor: !selectedState ? colors.primary : colors.borderSubtle },
                  !selectedState && { backgroundColor: colors.primary + '15' },
                ]}
                onPress={() => setSelectedState(null)}
              >
                <Text style={{ color: !selectedState ? colors.primary : colors.textSecondary, fontSize: 13 }}>Anywhere</Text>
              </Pressable>
            </ScrollView>
          </View>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Pressable style={styles.clearFiltersRow} onPress={clearFilters}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>Clear all filters</Text>
            </Pressable>
          )}
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  locationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerSpacer: {
    width: 40,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 2,
  },
  filterToggle: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  churchCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  churchCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  churchLogo: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  churchLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  churchMainInfo: {
    flex: 1,
    marginLeft: 12,
  },
  churchName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  churchMeta: {
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
  },
  churchDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
  churchCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  communityIndicators: {
    flexDirection: 'row',
    gap: 8,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  indicatorText: {
    fontSize: 11,
    fontWeight: '500',
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
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  footer: {
    paddingTop: 8,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  filterPanel: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterSectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  filterChips: {
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  denomChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  clearFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 4,
  },
  inviteCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 12,
  },
  inviteIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteCTAText: {
    flex: 1,
  },
  inviteCTATitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  inviteCTASubtitle: {
    fontSize: 12,
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
