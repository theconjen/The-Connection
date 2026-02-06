/**
 * My Churches Screen
 * Lists user's affiliated churches (soft affiliations)
 * Allows searching and adding new churches
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Text } from '../../src/theme';
import { Ionicons } from '@expo/vector-icons';
import {
  useMyChurches,
  useRemoveChurch,
  useOrgSearch,
  useAddChurch,
  ChurchAffiliation,
  PublicOrganization,
} from '../../src/queries/churches';

export default function MyChurchesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, colorScheme } = useTheme();
  const styles = getStyles(colors, colorScheme);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Fetch user's churches
  const {
    data: churches = [],
    isLoading,
    refetch,
    isRefetching,
  } = useMyChurches();

  // Search for churches to add
  const { data: searchResults = [], isLoading: isSearching } = useOrgSearch(searchQuery);

  // Mutations
  const removeChurchMutation = useRemoveChurch();
  const addChurchMutation = useAddChurch();

  const handleRemoveChurch = (affiliation: ChurchAffiliation) => {
    const name = affiliation.organization?.name || affiliation.freeTextName || 'this church';
    Alert.alert(
      'Remove Church',
      `Remove ${name} from your churches?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeChurchMutation.mutateAsync(affiliation.id);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to remove');
            }
          },
        },
      ]
    );
  };

  const handleAddChurch = async (org: PublicOrganization) => {
    try {
      await addChurchMutation.mutateAsync({ organizationId: org.id });
      setSearchQuery('');
      setShowSearch(false);
      Alert.alert('Success', `Added ${org.name} to your churches`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add church');
    }
  };

  const handleViewChurch = (slug: string) => {
    router.push(`/orgs/${slug}`);
  };

  // Filter out already added churches from search results
  const filteredResults = searchResults.filter(
    (org: PublicOrganization) =>
      !churches.some((c) => c.organizationId === org.id)
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>My Churches</Text>
        <Pressable
          onPress={() => setShowSearch(!showSearch)}
          style={styles.addButton}
        >
          <Ionicons
            name={showSearch ? 'close' : 'add'}
            size={24}
            color={colors.primary}
          />
        </Pressable>
      </View>

      {/* Search Bar (when adding) */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search churches to add..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      )}

      {/* Search Results */}
      {showSearch && searchQuery.length >= 2 && (
        <View style={styles.searchResults}>
          {isSearching ? (
            <View style={styles.searchLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.searchLoadingText}>Searching...</Text>
            </View>
          ) : filteredResults.length === 0 ? (
            <View style={styles.searchEmpty}>
              <Text style={styles.searchEmptyText}>
                {searchResults.length === 0
                  ? 'No churches found'
                  : 'All results already in your list'}
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.searchList}>
              {filteredResults.map((org: PublicOrganization) => (
                <Pressable
                  key={org.id}
                  style={styles.searchItem}
                  onPress={() => handleAddChurch(org)}
                >
                  {org.logoUrl ? (
                    <Image source={{ uri: org.logoUrl }} style={styles.searchAvatar} />
                  ) : (
                    <View style={[styles.searchAvatar, styles.avatarPlaceholder]}>
                      <Ionicons name="business" size={20} color={colors.textMuted} />
                    </View>
                  )}
                  <View style={styles.searchItemInfo}>
                    <Text style={styles.searchItemName}>{org.name}</Text>
                    {(org.city || org.state) && (
                      <Text style={styles.searchItemLocation}>
                        {[org.city, org.state].filter(Boolean).join(', ')}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="add-circle" size={24} color={colors.primary} />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Church List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : churches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="home-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Churches Yet</Text>
          <Text style={styles.emptyText}>
            Add churches you attend or are connected with.
          </Text>
          <Pressable
            style={styles.emptyButton}
            onPress={() => setShowSearch(true)}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.emptyButtonText}>Add a Church</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          <View style={styles.listContainer}>
            {churches.map((affiliation) => (
              <View key={affiliation.id} style={styles.churchCard}>
                <Pressable
                  style={styles.churchContent}
                  onPress={() =>
                    affiliation.organization?.slug &&
                    handleViewChurch(affiliation.organization.slug)
                  }
                >
                  {affiliation.organization?.logoUrl ? (
                    <Image
                      source={{ uri: affiliation.organization.logoUrl }}
                      style={styles.churchAvatar}
                    />
                  ) : (
                    <View style={[styles.churchAvatar, styles.avatarPlaceholder]}>
                      <Ionicons name="business" size={24} color={colors.textMuted} />
                    </View>
                  )}
                  <View style={styles.churchInfo}>
                    <Text style={styles.churchName}>
                      {affiliation.organization?.name || affiliation.freeTextName}
                    </Text>
                    {affiliation.organization && (
                      <>
                        {(affiliation.organization.city || affiliation.organization.state) && (
                          <Text style={styles.churchLocation}>
                            {[affiliation.organization.city, affiliation.organization.state]
                              .filter(Boolean)
                              .join(', ')}
                          </Text>
                        )}
                        {affiliation.organization.denomination && (
                          <Text style={styles.churchDenomination}>
                            {affiliation.organization.denomination}
                          </Text>
                        )}
                      </>
                    )}
                    {affiliation.roleLabel && (
                      <View style={styles.roleContainer}>
                        <Text style={styles.roleText}>{affiliation.roleLabel}</Text>
                      </View>
                    )}
                  </View>
                  {affiliation.organization?.slug && (
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                  )}
                </Pressable>
                <Pressable
                  style={styles.removeButton}
                  onPress={() => handleRemoveChurch(affiliation)}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                </Pressable>
              </View>
            ))}
          </View>
          <View style={{ height: insets.bottom + 20 }} />
        </ScrollView>
      )}
    </View>
  );
}

const getStyles = (colors: any, colorScheme: string) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    addButton: {
      padding: 8,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginVertical: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: colors.input,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      gap: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.textPrimary,
      paddingVertical: 4,
    },
    searchResults: {
      maxHeight: 300,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    searchLoading: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      gap: 10,
    },
    searchLoadingText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    searchEmpty: {
      padding: 20,
      alignItems: 'center',
    },
    searchEmptyText: {
      fontSize: 14,
      color: colors.textMuted,
    },
    searchList: {
      paddingHorizontal: 16,
    },
    searchItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      gap: 12,
    },
    searchAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    avatarPlaceholder: {
      backgroundColor: colors.surfaceMuted,
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchItemInfo: {
      flex: 1,
    },
    searchItemName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    searchItemLocation: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.textPrimary,
      marginTop: 16,
    },
    emptyText: {
      fontSize: 15,
      color: colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
    emptyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 24,
      paddingVertical: 12,
      paddingHorizontal: 20,
      backgroundColor: colors.primary,
      borderRadius: 8,
      gap: 8,
    },
    emptyButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    scrollView: {
      flex: 1,
    },
    listContainer: {
      padding: 16,
      gap: 12,
    },
    churchCard: {
      flexDirection: 'row',
      backgroundColor: colorScheme === 'dark' ? colors.surfaceMuted : '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      overflow: 'hidden',
    },
    churchContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 12,
    },
    churchAvatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
    },
    churchInfo: {
      flex: 1,
    },
    churchName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    churchLocation: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    churchDenomination: {
      fontSize: 12,
      color: colors.accent,
      marginTop: 2,
    },
    roleContainer: {
      marginTop: 6,
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 3,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 10,
    },
    roleText: {
      fontSize: 11,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    removeButton: {
      paddingHorizontal: 16,
      justifyContent: 'center',
      borderLeftWidth: 1,
      borderLeftColor: colors.borderSubtle,
    },
  });
