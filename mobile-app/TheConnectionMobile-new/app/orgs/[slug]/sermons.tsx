/**
 * Organization Sermons List Screen
 *
 * Displays all sermons for an organization in a grid layout
 */

import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { Text } from '../../../src/theme';
import { useOrgProfile, PublicSermon } from '../../../src/queries/churches';

// Format video duration (seconds to MM:SS or HH:MM:SS)
const formatDuration = (seconds: number): string => {
  if (!seconds || seconds < 0) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

// Format sermon date
const formatSermonDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

export default function OrgSermonsScreen() {
  const params = useLocalSearchParams();
  const slug = params.slug as string;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, colorScheme } = useTheme();
  const styles = getStyles(colors, colorScheme);

  const { data, isLoading, error, refetch, isRefetching } = useOrgProfile(slug);

  const renderSermonCard = ({ item: sermon }: { item: PublicSermon }) => (
    <Pressable
      style={styles.sermonCard}
      onPress={() => router.push(`/sermons/${sermon.id}`)}
    >
      <View style={styles.thumbnailContainer}>
        {sermon.thumbnailUrl ? (
          <Image source={{ uri: sermon.thumbnailUrl }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <Ionicons name="videocam" size={32} color={colors.textMuted} />
          </View>
        )}
        {sermon.duration && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatDuration(sermon.duration)}</Text>
          </View>
        )}
      </View>
      <View style={styles.sermonInfo}>
        <Text style={styles.sermonTitle} numberOfLines={2}>{sermon.title}</Text>
        {sermon.speaker && (
          <Text style={styles.sermonSpeaker} numberOfLines={1}>{sermon.speaker}</Text>
        )}
        {sermon.sermonDate && (
          <Text style={styles.sermonDate}>{formatSermonDate(sermon.sermonDate)}</Text>
        )}
        {sermon.series && (
          <View style={styles.seriesBadge}>
            <Ionicons name="bookmark-outline" size={12} color={colors.primary} />
            <Text style={styles.seriesText} numberOfLines={1}>{sermon.series}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ title: 'Sermons', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading sermons...</Text>
        </View>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ title: 'Sermons', headerShown: true }} />
        <View style={styles.errorContainer}>
          <Ionicons name="videocam-off-outline" size={64} color={colors.textMuted} />
          <Text style={styles.errorTitle}>Unable to Load Sermons</Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const sermons = data.sermons || [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          title: `${data.organization.name} - Sermons`,
          headerShown: true,
        }}
      />

      {sermons.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="videocam-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Sermons Yet</Text>
          <Text style={styles.emptyText}>
            This church hasn't uploaded any sermons yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sermons}
          renderItem={renderSermonCard}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        />
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
      padding: 12,
    },
    columnWrapper: {
      justifyContent: 'space-between',
      gap: 12,
    },
    sermonCard: {
      flex: 1,
      maxWidth: '48%',
      backgroundColor: colorScheme === 'dark' ? colors.surfaceMuted : '#FFFFFF',
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      marginBottom: 12,
    },
    thumbnailContainer: {
      position: 'relative',
      aspectRatio: 16 / 9,
    },
    thumbnail: {
      width: '100%',
      height: '100%',
    },
    thumbnailPlaceholder: {
      backgroundColor: colors.surfaceMuted,
      justifyContent: 'center',
      alignItems: 'center',
    },
    durationBadge: {
      position: 'absolute',
      bottom: 6,
      right: 6,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    durationText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    sermonInfo: {
      padding: 12,
    },
    sermonTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
      lineHeight: 18,
    },
    sermonSpeaker: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
    },
    sermonDate: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    seriesBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
      gap: 4,
    },
    seriesText: {
      fontSize: 11,
      color: colors.primary,
      fontWeight: '500',
    },
  });
