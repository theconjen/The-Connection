/**
 * Apologetics Resources Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../src/lib/apiClient';
import { Colors } from '../../src/shared/colors';

interface Resource {
  id: number;
  title: string;
  description: string;
  type: string;
  iconName: string;
  url?: string;
  createdAt?: string;
}

export default function ApologeticsScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string>('all');

  const { data: resources = [], isLoading, refetch } = useQuery<Resource[]>({
    queryKey: ['apologetics-resources'],
    queryFn: async () => {
      const response = await apiClient.get('/apologetics');
      return response.data;
    },
  });

  // Top Header Component
  const TopHeader = () => (
    <View style={styles.topHeader}>
      <TouchableOpacity onPress={() => router.push('/menu')}>
        <Text style={styles.headerIcon}>☰</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>The Connection</Text>
      <View style={styles.headerRight}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/messages')} style={styles.headerButton}>
          <Text style={styles.headerIcon}>💬</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.headerButton}>
          <Text style={styles.headerIcon}>👤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const filteredResources = selectedType === 'all'
    ? resources
    : resources.filter(r => r.type === selectedType);

  const handleOpenResource = (url?: string) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <TopHeader />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color=Colors.primary />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopHeader />
      
      <View style={styles.header}>
        <Text style={styles.title}>Apologetics Resources</Text>
        <Text style={styles.subtitle}>Strengthen your faith with these resources</Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'book', 'podcast', 'video', 'article'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterButton, selectedType === type && styles.filterButtonActive]}
              onPress={() => setSelectedType(type)}
            >
              <Text style={[styles.filterText, selectedType === type && styles.filterTextActive]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {filteredResources.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No resources found</Text>
            <Text style={styles.emptyStateSubtext}>Check back later for new content</Text>
          </View>
        ) : (
          filteredResources.map((resource) => (
            <TouchableOpacity
              key={resource.id}
              style={styles.resourceCard}
              onPress={() => handleOpenResource(resource.url)}
            >
              <View style={styles.resourceImagePlaceholder}>
                <Text style={styles.resourceTypeIcon}>
                  {resource.type === 'book' ? '📖' :
                   resource.type === 'podcast' ? '🎙️' :
                   resource.type === 'video' ? '📹' : '📄'}
                </Text>
              </View>
              <View style={styles.resourceInfo}>
                <View style={styles.resourceHeader}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{resource.type.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.resourceTitle}>{resource.title}</Text>
                <Text style={styles.resourceDescription} numberOfLines={3}>
                  {resource.description}
                </Text>
                {resource.url && (
                  <Text style={styles.viewLink}>View Resource →</Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerIcon: { fontSize: 24 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  headerRight: { flexDirection: 'row' },
  headerButton: { marginLeft: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  filterContainer: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8 },
  filterButtonActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  filterTextActive: { color: '#fff' },
  content: { flex: 1 },
  resourceCard: { flexDirection: 'row', backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  resourceImage: { width: 80, height: 120, borderRadius: 8 },
  resourceImagePlaceholder: { width: 80, height: 120, borderRadius: 8, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  resourceTypeIcon: { fontSize: 32 },
  resourceInfo: { flex: 1, marginLeft: 12 },
  resourceHeader: { flexDirection: 'row', marginBottom: 8 },
  typeBadge: { backgroundColor: '#ddd6fe', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginRight: 8 },
  typeBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#7c3aed' },
  categoryBadge: { backgroundColor: '#e0f2fe', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  categoryBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#0284c7' },
  resourceTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 8 },
  resourceDescription: { fontSize: 13, color: '#6b7280', lineHeight: 18, marginBottom: 8 },
  viewLink: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyStateText: { fontSize: 16, fontWeight: '600', color: '#6b7280', marginBottom: 4 },
  emptyStateSubtext: { fontSize: 14, color: '#9ca3af' },
});
