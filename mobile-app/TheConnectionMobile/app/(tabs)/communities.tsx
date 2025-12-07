/**
 * Communities Screen
 * Lists all communities with search, join/leave functionality
 */

import React, { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communitiesAPI } from '../../src/lib/apiClient';
import { useAuth } from '../../src/contexts/AuthContext';
import { Colors } from '../../src/shared/colors';
import {
  LocationPermissionState,
  defaultPermissionState,
  formatPermissionStatus,
  hasBackgroundPermission,
  hasForegroundPermission,
  loadLocationPermissionState,
  openAppSettings,
  requestBackgroundPermission,
  requestForegroundPermission,
} from '../../src/lib/locationPermissions';

interface Community {
  id: number;
  name: string;
  description: string;
  memberCount?: number;
  isPrivate?: boolean;
  isMember?: boolean;
}

export default function CommunitiesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [permissionState, setPermissionState] = useState<LocationPermissionState>(defaultPermissionState);
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);

  useEffect(() => {
    (async () => {
      const state = await loadLocationPermissionState();
      setPermissionState(state);
    })();
  }, []);

  const requestForeground = useCallback(async () => {
    setIsRequestingPermissions(true);
    try {
      const status = await requestForegroundPermission();
      setPermissionState((prev) => ({ ...prev, foreground: status }));
    } finally {
      setIsRequestingPermissions(false);
    }
  }, []);

  const requestBackground = useCallback(async () => {
    setIsRequestingPermissions(true);
    try {
      if (!hasForegroundPermission(permissionState)) {
        const foregroundStatus = await requestForegroundPermission();
        setPermissionState((prev) => ({ ...prev, foreground: foregroundStatus }));

        if (foregroundStatus !== Location.PermissionStatus.GRANTED) {
          return;
        }
      }

      const status = await requestBackgroundPermission();
      setPermissionState((prev) => ({ ...prev, background: status }));
    } finally {
      setIsRequestingPermissions(false);
    }
  }, [permissionState]);

  const openSettings = useCallback(async () => {
    setIsRequestingPermissions(true);
    try {
      await openAppSettings();
    } finally {
      setIsRequestingPermissions(false);
    }
  }, []);

  // Fetch communities
  const { data: communities = [], isLoading, error, refetch } = useQuery({
    queryKey: ['communities'],
    queryFn: communitiesAPI.getAll,
  });

  // Join community mutation
  const joinMutation = useMutation({
    mutationFn: (communityId: number) => communitiesAPI.join(communityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      Alert.alert('Success', 'You have joined the community!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to join community');
    },
  });

  // Leave community mutation
  const leaveMutation = useMutation({
    mutationFn: (communityId: number) => communitiesAPI.leave(communityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      Alert.alert('Success', 'You have left the community');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to leave community');
    },
  });

  // Filter communities based on search
  const filteredCommunities = communities.filter((community: Community) =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleJoinLeave = (community: Community) => {
    if (community.isMember) {
      Alert.alert(
        'Leave Community',
        `Are you sure you want to leave ${community.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => leaveMutation.mutate(community.id)
          },
        ]
      );
    } else {
      joinMutation.mutate(community.id);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading communities...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load communities</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Communities</Text>
        <Text style={styles.subtitle}>Discover and join communities</Text>
      </View>

      <View style={styles.permissionCard}>
        <View style={styles.permissionHeader}>
          <Text style={styles.permissionTitle}>Location & background refresh</Text>
          <Text style={styles.permissionSubtitle}>
            Enable location so we can recommend nearby communities and keep them refreshed in the
            background.
          </Text>
        </View>

        <View style={styles.permissionStatusRow}>
          <Text style={styles.permissionLabel}>Foreground</Text>
          <Text style={styles.permissionValue}>{formatPermissionStatus(permissionState.foreground)}</Text>
        </View>
        <View style={styles.permissionStatusRow}>
          <Text style={styles.permissionLabel}>Background</Text>
          <Text style={styles.permissionValue}>{formatPermissionStatus(permissionState.background)}</Text>
        </View>

        <View style={styles.permissionActions}>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestForeground}
            disabled={isRequestingPermissions}
          >
            <Text style={styles.permissionButtonText}>Allow location</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.permissionButton, styles.permissionSecondaryButton]}
            onPress={requestBackground}
            disabled={isRequestingPermissions}
          >
            <Text style={[styles.permissionButtonText, styles.permissionSecondaryButtonText]}>
              Enable background
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.permissionButton, styles.permissionSettingsButton]}
            onPress={openSettings}
            disabled={isRequestingPermissions}
          >
            <Text style={[styles.permissionButtonText, styles.permissionSettingsButtonText]}>Open settings</Text>
          </TouchableOpacity>
        </View>

        {!hasBackgroundPermission(permissionState) && (
          <Text style={styles.permissionHint}>
            Background location lets us refresh nearby recommendations even when the app is not open.
          </Text>
        )}
        {(permissionState.background === Location.PermissionStatus.DENIED ||
          permissionState.foreground === Location.PermissionStatus.DENIED) && (
          <Text style={styles.permissionHint}>
            If permissions are blocked, use the settings button above to enable location access from your
            device settings.
          </Text>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search communities..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Create Community Button */}
      <View style={styles.createButtonContainer}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/communities/create')}
        >
          <Text style={styles.createButtonText}>+ Create Community</Text>
        </TouchableOpacity>
      </View>

      {/* Communities List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {filteredCommunities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'No communities found' : 'No communities available'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? 'Try a different search' : 'Be the first to create one!'}
            </Text>
          </View>
        ) : (
          filteredCommunities.map((community: Community) => (
            <TouchableOpacity
              key={community.id}
              style={styles.communityCard}
              onPress={() => router.push(`/communities/${community.id}`)}
            >
              <View style={styles.communityInfo}>
                <View style={styles.communityHeader}>
                  <Text style={styles.communityName}>{community.name}</Text>
                  {community.isPrivate && (
                    <View style={styles.privateBadge}>
                      <Text style={styles.privateBadgeText}>Private</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.communityDescription} numberOfLines={2}>
                  {community.description || 'No description'}
                </Text>
                <Text style={styles.memberCount}>
                  {community.memberCount || 0} members
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  community.isMember && styles.actionButtonJoined,
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleJoinLeave(community);
                }}
                disabled={joinMutation.isPending || leaveMutation.isPending}
              >
                {joinMutation.isPending || leaveMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.actionButtonText}>
                    {community.isMember ? 'Joined' : 'Join'}
                  </Text>
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  permissionCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  permissionHeader: {
    marginBottom: 8,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  permissionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    lineHeight: 18,
  },
  permissionStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  permissionLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  permissionValue: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
  },
  permissionActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  permissionButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  permissionSecondaryButton: {
    marginLeft: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  permissionSettingsButton: {
    marginLeft: 10,
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  permissionSecondaryButtonText: {
    color: Colors.primary,
  },
  permissionSettingsButtonText: {
    color: '#b91c1c',
  },
  permissionHint: {
    marginTop: 10,
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  createButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  communityCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  communityInfo: {
    flex: 1,
    marginRight: 12,
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  communityName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 8,
  },
  privateBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  privateBadgeText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
  },
  communityDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  memberCount: {
    fontSize: 12,
    color: '#9ca3af',
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  actionButtonJoined: {
    backgroundColor: '#10b981',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
