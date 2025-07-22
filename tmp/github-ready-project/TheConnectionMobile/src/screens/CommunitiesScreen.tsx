import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import MobileCard from '../components/MobileCard';
import TouchFeedback from '../components/TouchFeedback';
import { apiService } from '../services/api';
import { Community } from '../types';

export const CommunitiesScreen = () => {
  const queryClient = useQueryClient();
  
  const { data: communities = [], isLoading, error } = useQuery({
    queryKey: ['communities'],
    queryFn: () => apiService.getCommunities(),
    retry: 2,
  });

  const joinCommunityMutation = useMutation({
    mutationFn: (communityId: number) => apiService.joinCommunity(communityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      Alert.alert('Success', 'Joined community successfully!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to join community');
    },
  });

  const renderCommunityItem = ({ item }: { item: Community }) => (
    <MobileCard style={styles.communityCard}>
      <View style={styles.communityHeader}>
        <View style={styles.communityInfo}>
          <Text style={styles.communityName}>{item.name}</Text>
          <Text style={styles.memberCount}>{item.memberCount} members</Text>
        </View>
        <View style={styles.privacyBadge}>
          <Text style={styles.privacyText}>
            {item.isPrivate ? 'Private' : 'Public'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.communityDescription}>
        {item.description}
      </Text>
      
      <TouchFeedback
        style={styles.joinButton}
        onPress={() => joinCommunityMutation.mutate(item.id)}
        disabled={joinCommunityMutation.isPending}
        hapticType="medium"
      >
        <Text style={styles.joinButtonText}>
          {joinCommunityMutation.isPending ? 'Joining...' : 'Join Community'}
        </Text>
      </TouchFeedback>
    </MobileCard>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E91E63" />
          <Text style={styles.loadingText}>Loading communities...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load communities</Text>
          <TouchFeedback
            style={styles.retryButton}
            onPress={() => queryClient.invalidateQueries({ queryKey: ['communities'] })}
            hapticType="light"
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchFeedback>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Communities</Text>
        <Text style={styles.headerSubtitle}>
          Join groups and connect with believers
        </Text>
      </View>

      <FlatList
        data={communities}
        renderItem={renderCommunityItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['communities'] })}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1D29',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  communityCard: {
    marginBottom: 16,
  },
  communityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1D29',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  privacyBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  privacyText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  communityDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  joinButton: {
    backgroundColor: '#E91E63',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#E91E63',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});