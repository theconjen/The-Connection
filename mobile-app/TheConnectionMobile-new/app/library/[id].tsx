/**
 * Library Post Detail Screen
 * View full content of a library post with markdown rendering
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { apiClient } from '../../src/lib/apiClient';
import { queryKeys } from '../../../../../packages/shared/src/api/queryKeys';
import type { LibraryPost } from '../../../../../packages/shared/src/api/types';

export default function LibraryPostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = parseInt(id, 10);

  // Fetch current user capabilities
  const { data: meData } = useQuery({
    queryKey: queryKeys.me(),
    queryFn: () => apiClient.getMe(),
  });

  // Fetch library post
  const { data: post, isLoading } = useQuery<LibraryPost>({
    queryKey: queryKeys.libraryPosts.detail(postId),
    queryFn: async () => {
      return await apiClient.getLibraryPost(postId);
    },
    enabled: !isNaN(postId),
  });

  const canEdit =
    meData?.capabilities.canAuthorApologeticsPosts &&
    post?.authorUserId === meData?.user.id;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading post...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Post not found</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        {canEdit && (
          <Pressable
            style={styles.editButton}
            onPress={() => router.push(`/library/create?id=${post.id}` as any)}
          >
            <Ionicons name="pencil" size={20} color="#3B82F6" />
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Meta */}
        <View style={styles.metaContainer}>
          <View style={styles.domainBadge}>
            <Ionicons
              name={post.domain === 'apologetics' ? 'shield-checkmark' : 'flame'}
              size={14}
              color="#fff"
            />
            <Text style={styles.domainText}>{post.domain}</Text>
          </View>
          {post.area && <Text style={styles.areaText}>{post.area.name}</Text>}
          {post.tag && <Text style={styles.tagText}>#{post.tag.name}</Text>}
        </View>

        {/* Title */}
        <Text style={styles.title}>{post.title}</Text>

        {/* Summary */}
        {post.summary && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summary}>{post.summary}</Text>
          </View>
        )}

        {/* Author & Date */}
        <View style={styles.authorContainer}>
          <Text style={styles.author}>{post.authorDisplayName}</Text>
          {post.publishedAt && (
            <Text style={styles.date}>
              Published {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          )}
        </View>

        {/* Body */}
        <View style={styles.bodyContainer}>
          <Markdown style={markdownStyles}>{post.bodyMarkdown}</Markdown>
        </View>

        {/* Perspectives */}
        {post.perspectives && post.perspectives.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Perspectives Considered</Text>
            <View style={styles.perspectivesContainer}>
              {post.perspectives.map((perspective, index) => (
                <View key={index} style={styles.perspectiveBadge}>
                  <Text style={styles.perspectiveText}>{perspective}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Sources */}
        {post.sources && post.sources.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sources & References</Text>
            {post.sources.map((source, index) => (
              <Pressable
                key={index}
                style={styles.sourceCard}
                onPress={() => Linking.openURL(source.url)}
              >
                <View style={styles.sourceHeader}>
                  <Ionicons name="link" size={18} color="#3B82F6" />
                  <Text style={styles.sourceTitle}>{source.title}</Text>
                </View>
                {source.author && (
                  <Text style={styles.sourceAuthor}>By {source.author}</Text>
                )}
                {source.date && (
                  <Text style={styles.sourceDate}>{source.date}</Text>
                )}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  domainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
  },
  domainText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  areaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 36,
    marginBottom: 16,
  },
  summaryContainer: {
    backgroundColor: '#F9FAFB',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  summary: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  authorContainer: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  author: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: '#6B7280',
  },
  bodyContainer: {
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  perspectivesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  perspectiveBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  perspectiveText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  sourceCard: {
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sourceTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  sourceAuthor: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  sourceDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 24,
  },
});

// Markdown styles
const markdownStyles = {
  body: {
    fontSize: 16,
    lineHeight: 26,
    color: '#374151',
  },
  heading1: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 24,
    marginBottom: 12,
  },
  heading2: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 20,
    marginBottom: 10,
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    marginBottom: 16,
  },
  list_item: {
    marginBottom: 8,
  },
  bullet_list: {
    marginBottom: 16,
  },
  ordered_list: {
    marginBottom: 16,
  },
  link: {
    color: '#3B82F6',
    textDecorationLine: 'underline',
  },
  blockquote: {
    backgroundColor: '#F9FAFB',
    borderLeftWidth: 4,
    borderLeftColor: '#D1D5DB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  code_inline: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  code_block: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  fence: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  strong: {
    fontWeight: '700',
  },
  em: {
    fontStyle: 'italic',
  },
};
