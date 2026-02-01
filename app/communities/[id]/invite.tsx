/**
 * Community Invite Screen
 * Allows members to invite other users to join a community
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Text,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { communitiesAPI, searchAPI } from '../../../src/lib/apiClient';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useDebouncedValue } from '../../../src/hooks/useDebouncedValue';

interface SearchUser {
  id: number;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

export default function CommunityInviteScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams() as { id: string };
  const { user } = useAuth();
  const { colors, colorScheme } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<SearchUser[]>([]);
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const communityId = parseInt(id || '0');
  const styles = getStyles(colors, colorScheme);

  // Fetch community details
  const { data: community } = useQuery({
    queryKey: ['community', communityId],
    queryFn: () => communitiesAPI.getById(communityId),
    enabled: !!communityId,
  });

  // Fetch existing members to exclude
  const { data: members = [] } = useQuery({
    queryKey: ['community-members', communityId],
    queryFn: () => communitiesAPI.getMembers(communityId),
    enabled: !!communityId,
  });

  // Search users
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['search-users', debouncedSearch],
    queryFn: () => searchAPI.searchUsers(debouncedSearch),
    enabled: debouncedSearch.length >= 2,
  });

  // Filter out existing members and already selected users
  const memberIds = members.map((m: any) => m.userId);
  const selectedIds = selectedUsers.map(u => u.id);
  const filteredResults = searchResults.filter((resultUser: SearchUser) =>
    !memberIds.includes(resultUser.id) &&
    !selectedIds.includes(resultUser.id) &&
    resultUser.id !== user?.id
  );

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: async (userIds: number[]) => {
      const results = await Promise.allSettled(
        userIds.map(inviteeId => communitiesAPI.inviteUser(communityId, inviteeId, true))
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      Alert.alert(
        'Invitations Sent',
        `${selectedUsers.length} invitation(s) sent successfully`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to send invitations');
    },
  });

  const toggleUserSelection = useCallback((selectedUser: SearchUser) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === selectedUser.id);
      if (isSelected) {
        return prev.filter(u => u.id !== selectedUser.id);
      } else {
        return [...prev, selectedUser];
      }
    });
  }, []);

  const removeSelectedUser = useCallback((userId: number) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
  }, []);

  const handleSendInvites = () => {
    if (selectedUsers.length === 0) {
      Alert.alert('No Users Selected', 'Please select at least one user to invite');
      return;
    }
    inviteMutation.mutate(selectedUsers.map(u => u.id));
  };

  const renderSelectedUser = ({ item }: { item: SearchUser }) => (
    <TouchableOpacity
      style={styles.selectedChip}
      onPress={() => removeSelectedUser(item.id)}
    >
      {item.avatarUrl ? (
        <Image source={{ uri: item.avatarUrl }} style={styles.chipAvatar} />
      ) : (
        <View style={[styles.chipAvatar, styles.placeholderAvatar]}>
          <Text style={styles.placeholderText}>
            {(item.displayName || item.username).charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <Text style={styles.chipText}>{item.displayName || item.username}</Text>
      <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderSearchResult = ({ item }: { item: SearchUser }) => {
    const isSelected = selectedUsers.some(u => u.id === item.id);

    return (
      <TouchableOpacity
        style={[styles.userRow, isSelected && styles.userRowSelected]}
        onPress={() => toggleUserSelection(item)}
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
        </View>
        <Ionicons
          name={isSelected ? 'checkmark-circle' : 'add-circle-outline'}
          size={24}
          color={isSelected ? colors.primary : colors.textSecondary}
        />
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Invite to Community</Text>
          {community && <Text style={styles.headerSubtitle}>{community.name}</Text>}
        </View>
        <TouchableOpacity
          onPress={handleSendInvites}
          disabled={selectedUsers.length === 0 || inviteMutation.isPending}
          style={[
            styles.sendButton,
            (selectedUsers.length === 0 || inviteMutation.isPending) && styles.sendButtonDisabled,
          ]}
        >
          {inviteMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>
              Send{selectedUsers.length > 0 ? ` (${selectedUsers.length})` : ''}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <View style={styles.selectedContainer}>
          <FlatList
            data={selectedUsers}
            renderItem={renderSelectedUser}
            keyExtractor={item => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectedList}
          />
        </View>
      )}

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Results */}
      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : debouncedSearch.length < 2 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Search for users to invite</Text>
          <Text style={styles.emptySubtext}>Enter at least 2 characters</Text>
        </View>
      ) : filteredResults.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No users found</Text>
          <Text style={styles.emptySubtext}>Try a different search term</Text>
        </View>
      ) : (
        <FlatList
          data={filteredResults}
          renderItem={renderSearchResult}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </KeyboardAvoidingView>
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
    sendButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      minWidth: 70,
      alignItems: 'center',
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
    sendButtonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 14,
    },
    selectedContainer: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: 8,
    },
    selectedList: {
      paddingHorizontal: 16,
      gap: 8,
    },
    selectedChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colorScheme === 'dark' ? colors.surface : '#f0f0f0',
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 20,
      marginRight: 8,
    },
    chipAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      marginRight: 6,
    },
    chipText: {
      fontSize: 14,
      color: colors.text,
      marginRight: 4,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      margin: 16,
      padding: 12,
      backgroundColor: colorScheme === 'dark' ? colors.surface : '#f5f5f5',
      borderRadius: 12,
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: 16,
      color: colors.text,
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
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
    },
    resultsList: {
      paddingHorizontal: 16,
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 12,
      marginBottom: 8,
      backgroundColor: colorScheme === 'dark' ? colors.surface : '#fff',
    },
    userRowSelected: {
      backgroundColor: colorScheme === 'dark' ? colors.primaryMuted : '#e6f0ff',
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    placeholderAvatar: {
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '600',
    },
    placeholderLetter: {
      color: '#fff',
      fontSize: 18,
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
  });
