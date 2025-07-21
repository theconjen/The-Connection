import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Community } from '../types';
import { apiService } from '../services/api';

const CommunityCard: React.FC<{ community: Community }> = ({ community }) => (
  <TouchableOpacity style={styles.communityCard}>
    <Text style={styles.communityName}>{community.name}</Text>
    <Text style={styles.communityDescription} numberOfLines={2}>
      {community.description}
    </Text>
    <Text style={styles.memberCount}>{community.memberCount} members</Text>
  </TouchableOpacity>
);

export const CommunitiesScreen: React.FC = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const data = await apiService.getCommunities();
        setCommunities(data);
      } catch (error) {
        console.error('Failed to fetch communities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommunities();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E73AA4" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Communities</Text>
      <FlatList
        data={communities}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <CommunityCard community={item} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1D29',
    textAlign: 'center',
    marginVertical: 24,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  communityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  communityName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1D29',
    marginBottom: 8,
  },
  communityDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 8,
  },
  memberCount: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
  },
});