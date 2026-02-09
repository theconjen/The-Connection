/**
 * Organization About Screen
 *
 * Displays leadership team for an organization
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { Text } from '../../../src/theme';
import { useOrgProfile, PublicLeader } from '../../../src/queries/churches';

// Get initials from name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default function OrgAboutScreen() {
  const params = useLocalSearchParams();
  const slug = params.slug as string;
  const insets = useSafeAreaInsets();
  const { colors, colorScheme } = useTheme();
  const styles = getStyles(colors, colorScheme);

  const [selectedLeader, setSelectedLeader] = useState<PublicLeader | null>(null);

  const { data, isLoading, error, refetch, isRefetching } = useOrgProfile(slug);

  const renderLeaderCard = ({ item: leader }: { item: PublicLeader }) => (
    <Pressable
      style={styles.leaderCard}
      onPress={() => setSelectedLeader(leader)}
    >
      {leader.photoUrl ? (
        <Image source={{ uri: leader.photoUrl }} style={styles.leaderPhoto} />
      ) : (
        <View style={[styles.leaderPhoto, styles.photoPlaceholder]}>
          <Text style={styles.photoInitials}>{getInitials(leader.name)}</Text>
        </View>
      )}
      <View style={styles.leaderInfo}>
        <Text style={styles.leaderName}>{leader.name}</Text>
        {leader.title && (
          <Text style={styles.leaderTitle} numberOfLines={1}>{leader.title}</Text>
        )}
        {leader.bio && (
          <Text style={styles.leaderBioPreview} numberOfLines={2}>{leader.bio}</Text>
        )}
      </View>
    </Pressable>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ title: 'About', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ title: 'About', headerShown: true }} />
        <View style={styles.errorContainer}>
          <Ionicons name="people-outline" size={64} color={colors.textMuted} />
          <Text style={styles.errorTitle}>Unable to Load</Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const leaders = [...(data.leaders || [])].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id - b.id
  );
  const org = data.organization;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          title: `About ${org.name}`,
          headerShown: true,
        }}
      />

      <FlatList
        data={leaders}
        renderItem={renderLeaderCard}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={leaders.length > 1 ? styles.columnWrapper : undefined}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListHeaderComponent={
          org.mission ? (
            <View style={styles.missionSection}>
              <Text style={styles.sectionTitle}>Our Mission</Text>
              <Text style={styles.missionText}>{org.mission}</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Leadership Info</Text>
            <Text style={styles.emptyText}>
              Leadership information is not yet available.
            </Text>
          </View>
        }
      />

      {/* Leader Detail Modal */}
      <Modal
        visible={!!selectedLeader}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedLeader(null)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderSpacer} />
            <Text style={styles.modalTitle}>Leader Details</Text>
            <Pressable
              style={styles.closeButton}
              onPress={() => setSelectedLeader(null)}
            >
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>

          {selectedLeader && (
            <ScrollView
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {selectedLeader.photoUrl ? (
                <Image
                  source={{ uri: selectedLeader.photoUrl }}
                  style={styles.modalPhoto}
                />
              ) : (
                <View style={[styles.modalPhoto, styles.photoPlaceholder]}>
                  <Text style={styles.modalPhotoInitials}>
                    {getInitials(selectedLeader.name)}
                  </Text>
                </View>
              )}

              <Text style={styles.modalName}>{selectedLeader.name}</Text>
              {selectedLeader.title && (
                <Text style={styles.modalLeaderTitle}>{selectedLeader.title}</Text>
              )}

              {selectedLeader.bio && (
                <View style={styles.bioSection}>
                  <Text style={styles.modalBio}>{selectedLeader.bio}</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
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
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      marginTop: 16,
    },
    retryButton: {
      marginTop: 20,
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: colors.primary,
      borderRadius: 8,
    },
    retryButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      marginTop: 60,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      marginTop: 16,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
    listContent: {
      padding: 16,
    },
    columnWrapper: {
      justifyContent: 'space-between',
      gap: 12,
    },
    missionSection: {
      marginBottom: 20,
      padding: 16,
      backgroundColor: colorScheme === 'dark' ? colors.surfaceMuted : '#F8F9FA',
      borderRadius: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    missionText: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    leaderCard: {
      flex: 1,
      maxWidth: '48%',
      backgroundColor: colorScheme === 'dark' ? colors.surfaceMuted : '#FFFFFF',
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      marginBottom: 12,
      alignItems: 'center',
      padding: 16,
    },
    leaderPhoto: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginBottom: 12,
    },
    photoPlaceholder: {
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    photoInitials: {
      fontSize: 24,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    leaderInfo: {
      alignItems: 'center',
    },
    leaderName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    leaderTitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
      textAlign: 'center',
    },
    leaderBioPreview: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 8,
      textAlign: 'center',
      lineHeight: 16,
    },
    // Modal styles
    modalContainer: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    modalHeaderSpacer: {
      width: 40,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    closeButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalContent: {
      alignItems: 'center',
      padding: 24,
    },
    modalPhoto: {
      width: 120,
      height: 120,
      borderRadius: 60,
      marginBottom: 16,
    },
    modalPhotoInitials: {
      fontSize: 36,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    modalName: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    modalLeaderTitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 4,
      textAlign: 'center',
    },
    bioSection: {
      marginTop: 24,
      width: '100%',
    },
    modalBio: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 24,
    },
  });
