/**
 * Join Requests Management Screen
 * Allows community admins/moderators to approve or deny join requests
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  Text,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { communitiesAPI } from '../../../src/lib/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';

interface JoinRequest {
  id: number;
  userId: number;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: string;
}

export default function JoinRequestsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams() as { id: string };
  const { colors, colorScheme } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const communityId = parseInt(id || '0');
  const styles = getStyles(colors, colorScheme);

  // Fetch community details
  const { data: community } = useQuery({
    queryKey: ['community', communityId],
    queryFn: () => communitiesAPI.getById(communityId),
    enabled: !!communityId,
  });

  // Fetch join requests
  const {
    data: joinRequests = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['join-requests', communityId],
    queryFn: () => communitiesAPI.getJoinRequests(communityId),
    enabled: !!communityId,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (requestId: number) => communitiesAPI.approveJoinRequest(communityId, requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['join-requests', communityId] });
      queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to approve request');
    },
  });

  // Deny mutation
  const denyMutation = useMutation({
    mutationFn: (requestId: number) => communitiesAPI.denyJoinRequest(communityId, requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['join-requests', communityId] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to deny request');
    },
  });

  const handleApprove = (request: JoinRequest) => {
    Alert.alert(
      'Approve Request',
      `Allow ${request.displayName || request.username} to join ${community?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => approveMutation.mutate(request.id),
        },
      ]
    );
  };

  const handleDeny = (request: JoinRequest) => {
    Alert.alert(
      'Deny Request',
      `Deny ${request.displayName || request.username}'s request to join?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deny',
          style: 'destructive',
          onPress: () => denyMutation.mutate(request.id),
        },
      ]
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderRequest = ({ item }: { item: JoinRequest }) => {
    const isProcessing = approveMutation.isPending || denyMutation.isPending;

    return (
      <View style={styles.requestCard}>
        <TouchableOpacity
          style={styles.userSection}
          onPress={() => router.push(`/profile/${item.userId}`)}
        >
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.placeholderAvatar]}>
              <Text style={styles.placeholderLetter}>
                {(item.displayName || item.username).charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.displayName || item.username}</Text>
            <Text style={styles.userHandle}>@{item.username}</Text>
            <Text style={styles.requestTime}>{formatTimeAgo(item.createdAt)}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(item)}
            disabled={isProcessing}
          >
            {approveMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.approveButtonText}>Approve</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.denyButton]}
            onPress={() => handleDeny(item)}
            disabled={isProcessing}
          >
            <Ionicons name="close" size={18} color={colors.error} />
            <Text style={styles.denyButtonText}>Deny</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Join Requests</Text>
          {community && <Text style={styles.headerSubtitle}>{community.name}</Text>}
        </View>
        {joinRequests.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{joinRequests.length}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : joinRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Pending Requests</Text>
          <Text style={styles.emptySubtext}>
            Join requests from users will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={joinRequests}
          renderItem={renderRequest}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
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
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitleContainer: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    badge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 15,
      color: colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
    listContent: {
      padding: 16,
    },
    requestCard: {
      backgroundColor: colorScheme === 'dark' ? colors.surface : '#fff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    userSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    placeholderAvatar: {
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderLetter: {
      color: '#fff',
      fontSize: 20,
      fontWeight: '600',
    },
    userInfo: {
      flex: 1,
      marginLeft: 12,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    userHandle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    requestTime: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 8,
      gap: 6,
    },
    approveButton: {
      backgroundColor: colors.primary,
    },
    approveButtonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 14,
    },
    denyButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.error,
    },
    denyButtonText: {
      color: colors.error,
      fontWeight: '600',
      fontSize: 14,
    },
  });
