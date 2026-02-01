/**
 * Community Members Management Screen
 * Allows owners to view, promote, demote, and remove members
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { communitiesAPI } from '../../../src/lib/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useAuth } from '../../../src/contexts/AuthContext';

interface Member {
  id: number;
  userId: number;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  role: 'owner' | 'moderator' | 'member';
  joinedAt: string;
}

export default function CommunityMembersScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams() as { id: string };
  const { colors, colorScheme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const communityId = parseInt(id || '0');
  const styles = getStyles(colors, colorScheme);

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);

  // Fetch community details
  const { data: community } = useQuery({
    queryKey: ['community', communityId],
    queryFn: () => communitiesAPI.getById(communityId),
    enabled: !!communityId,
  });

  // Fetch members
  const {
    data: members = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['community-members', communityId],
    queryFn: () => communitiesAPI.getMembers(communityId),
    enabled: !!communityId,
  });

  // Check if current user is owner
  const currentUserMember = members.find((m: Member) => m.userId === user?.id);
  const isOwner = currentUserMember?.role === 'owner';

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      communitiesAPI.updateMemberRole(communityId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      setShowActionSheet(false);
      setSelectedMember(null);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update role');
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => communitiesAPI.removeMember(communityId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      setShowActionSheet(false);
      setSelectedMember(null);
      Alert.alert('Success', 'Member removed from community');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to remove member');
    },
  });

  const handleMemberPress = (member: Member) => {
    if (!isOwner) return;
    if (member.role === 'owner') return; // Can't modify owner
    setSelectedMember(member);
    setShowActionSheet(true);
  };

  const handlePromoteToModerator = () => {
    if (!selectedMember) return;
    Alert.alert(
      'Promote to Moderator',
      `Make ${selectedMember.displayName || selectedMember.username} a moderator? They will be able to approve/deny join requests.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Promote',
          onPress: () => updateRoleMutation.mutate({ userId: selectedMember.userId, role: 'moderator' }),
        },
      ]
    );
  };

  const handleDemoteToMember = () => {
    if (!selectedMember) return;
    Alert.alert(
      'Demote to Member',
      `Remove moderator privileges from ${selectedMember.displayName || selectedMember.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Demote',
          onPress: () => updateRoleMutation.mutate({ userId: selectedMember.userId, role: 'member' }),
        },
      ]
    );
  };

  const handleRemoveMember = () => {
    if (!selectedMember) return;
    Alert.alert(
      'Remove Member',
      `Remove ${selectedMember.displayName || selectedMember.username} from this community?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeMemberMutation.mutate(selectedMember.userId),
        },
      ]
    );
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return { label: 'Owner', color: '#8B5CF6', bgColor: '#EDE9FE' };
      case 'moderator':
        return { label: 'Moderator', color: '#3B82F6', bgColor: '#DBEAFE' };
      default:
        return null;
    }
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const renderMember = ({ item }: { item: Member }) => {
    const badge = getRoleBadge(item.role);
    const isCurrentUser = item.userId === user?.id;
    const canManage = isOwner && item.role !== 'owner';

    return (
      <TouchableOpacity
        style={styles.memberCard}
        onPress={() => canManage ? handleMemberPress(item) : router.push(`/profile/${item.userId}`)}
        activeOpacity={canManage ? 0.7 : 1}
      >
        <TouchableOpacity
          style={styles.avatarContainer}
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
        </TouchableOpacity>

        <View style={styles.memberInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.memberName}>
              {item.displayName || item.username}
              {isCurrentUser && <Text style={styles.youLabel}> (You)</Text>}
            </Text>
            {badge && (
              <View style={[styles.roleBadge, { backgroundColor: badge.bgColor }]}>
                <Text style={[styles.roleBadgeText, { color: badge.color }]}>{badge.label}</Text>
              </View>
            )}
          </View>
          <Text style={styles.memberHandle}>@{item.username}</Text>
          <Text style={styles.joinDate}>Joined {formatJoinDate(item.joinedAt)}</Text>
        </View>

        {canManage && (
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
        )}
      </TouchableOpacity>
    );
  };

  // Sort members: owner first, then moderators, then members
  const sortedMembers = [...members].sort((a: Member, b: Member) => {
    const roleOrder = { owner: 0, moderator: 1, member: 2 };
    return roleOrder[a.role] - roleOrder[b.role];
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Members</Text>
          {community && <Text style={styles.headerSubtitle}>{community.name}</Text>}
        </View>
        <View style={styles.memberCount}>
          <Text style={styles.memberCountText}>{members.length}</Text>
        </View>
      </View>

      {/* Owner Info Banner */}
      {isOwner && (
        <View style={styles.ownerBanner}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={styles.ownerBannerText}>
            Tap on a member to manage their role or remove them
          </Text>
        </View>
      )}

      {/* Members List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : members.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Members Yet</Text>
          <Text style={styles.emptySubtext}>
            Be the first to join this community
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedMembers}
          renderItem={renderMember}
          keyExtractor={item => item.userId.toString()}
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

      {/* Action Sheet Modal */}
      {showActionSheet && selectedMember && (
        <TouchableOpacity
          style={styles.actionSheetOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowActionSheet(false);
            setSelectedMember(null);
          }}
        >
          <View style={styles.actionSheet}>
            <View style={styles.actionSheetHeader}>
              <Text style={styles.actionSheetTitle}>
                {selectedMember.displayName || selectedMember.username}
              </Text>
              <Text style={styles.actionSheetSubtitle}>
                Current role: {selectedMember.role.charAt(0).toUpperCase() + selectedMember.role.slice(1)}
              </Text>
            </View>

            {selectedMember.role === 'member' && (
              <TouchableOpacity
                style={styles.actionSheetButton}
                onPress={handlePromoteToModerator}
                disabled={updateRoleMutation.isPending}
              >
                <Ionicons name="shield-checkmark" size={22} color="#3B82F6" />
                <Text style={[styles.actionSheetButtonText, { color: '#3B82F6' }]}>
                  Promote to Moderator
                </Text>
              </TouchableOpacity>
            )}

            {selectedMember.role === 'moderator' && (
              <TouchableOpacity
                style={styles.actionSheetButton}
                onPress={handleDemoteToMember}
                disabled={updateRoleMutation.isPending}
              >
                <Ionicons name="person" size={22} color={colors.textPrimary} />
                <Text style={styles.actionSheetButtonText}>Demote to Member</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.actionSheetButton}
              onPress={handleRemoveMember}
              disabled={removeMemberMutation.isPending}
            >
              <Ionicons name="person-remove" size={22} color="#EF4444" />
              <Text style={[styles.actionSheetButtonText, { color: '#EF4444' }]}>
                Remove from Community
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionSheetButton, styles.cancelButton]}
              onPress={() => {
                setShowActionSheet(false);
                setSelectedMember(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
    memberCount: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    memberCountText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    ownerBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colorScheme === 'dark' ? colors.primaryMuted : '#EBF5FF',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 10,
    },
    ownerBannerText: {
      flex: 1,
      fontSize: 14,
      color: colors.primary,
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
    memberCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colorScheme === 'dark' ? colors.surface : '#fff',
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    avatarContainer: {
      marginRight: 12,
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
    memberInfo: {
      flex: 1,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    memberName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    youLabel: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.textSecondary,
    },
    roleBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    roleBadgeText: {
      fontSize: 11,
      fontWeight: '600',
    },
    memberHandle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    joinDate: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    actionSheetOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    actionSheet: {
      backgroundColor: colorScheme === 'dark' ? colors.surface : '#fff',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 8,
      paddingBottom: 34,
    },
    actionSheetHeader: {
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 8,
    },
    actionSheetTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    actionSheetSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    actionSheetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
      gap: 14,
    },
    actionSheetButtonText: {
      fontSize: 17,
      color: colors.text,
    },
    cancelButton: {
      justifyContent: 'center',
      marginTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 20,
    },
    cancelButtonText: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.textSecondary,
    },
  });
