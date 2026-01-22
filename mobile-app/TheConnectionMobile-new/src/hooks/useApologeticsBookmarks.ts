/**
 * Hook for managing apologetics bookmarks with offline AsyncStorage caching
 * Provides synced bookmarks across devices with offline fallback
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../lib/apiClient';

const BOOKMARKS_STORAGE_KEY = '@apologetics_bookmarks';

export function useApologeticsBookmarks() {
  const queryClient = useQueryClient();
  const [cachedBookmarks, setCachedBookmarks] = useState<Set<string>>(new Set());

  // Load cached bookmarks from AsyncStorage on mount
  useEffect(() => {
    loadCachedBookmarks();
  }, []);

  const loadCachedBookmarks = async () => {
    try {
      const cached = await AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (cached) {
        const bookmarks = JSON.parse(cached) as string[];
        setCachedBookmarks(new Set(bookmarks));
      }
    } catch (error) {
      console.error('Error loading cached bookmarks:', error);
    }
  };

  // Fetch bookmarks from backend
  const bookmarksQuery = useQuery({
    queryKey: ['apologetics-bookmarks'],
    queryFn: async () => {
      const response = await apiClient.get<string[]>('/api/apologetics/bookmarks');
      const bookmarkSet = new Set(response.data);

      // Cache to AsyncStorage for offline access
      await AsyncStorage.setItem(
        BOOKMARKS_STORAGE_KEY,
        JSON.stringify(Array.from(bookmarkSet))
      );

      return bookmarkSet;
    },
    staleTime: 60_000,
    // Use cached data while fetching
    placeholderData: cachedBookmarks,
  });

  // Mutation for adding bookmark
  const addBookmarkMutation = useMutation({
    mutationFn: async (questionId: string) => {
      await apiClient.post('/api/apologetics/bookmarks', { questionId });
    },
    onMutate: async (questionId) => {
      // Optimistically update cache
      await queryClient.cancelQueries({ queryKey: ['apologetics-bookmarks'] });

      const previousBookmarks = queryClient.getQueryData<Set<string>>(['apologetics-bookmarks']);

      // Update query cache optimistically
      queryClient.setQueryData<Set<string>>(['apologetics-bookmarks'], (old) => {
        const updated = new Set(old || []);
        updated.add(questionId);
        return updated;
      });

      // Update AsyncStorage optimistically
      const updated = new Set(previousBookmarks || []);
      updated.add(questionId);
      await AsyncStorage.setItem(
        BOOKMARKS_STORAGE_KEY,
        JSON.stringify(Array.from(updated))
      );

      return { previousBookmarks };
    },
    onError: (err, questionId, context) => {
      // Rollback on error
      if (context?.previousBookmarks) {
        queryClient.setQueryData(['apologetics-bookmarks'], context.previousBookmarks);
        AsyncStorage.setItem(
          BOOKMARKS_STORAGE_KEY,
          JSON.stringify(Array.from(context.previousBookmarks))
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['apologetics-bookmarks'] });
    },
  });

  // Mutation for removing bookmark
  const removeBookmarkMutation = useMutation({
    mutationFn: async (questionId: string) => {
      await apiClient.delete(`/api/apologetics/bookmarks/${questionId}`);
    },
    onMutate: async (questionId) => {
      // Optimistically update cache
      await queryClient.cancelQueries({ queryKey: ['apologetics-bookmarks'] });

      const previousBookmarks = queryClient.getQueryData<Set<string>>(['apologetics-bookmarks']);

      // Update query cache optimistically
      queryClient.setQueryData<Set<string>>(['apologetics-bookmarks'], (old) => {
        const updated = new Set(old || []);
        updated.delete(questionId);
        return updated;
      });

      // Update AsyncStorage optimistically
      const updated = new Set(previousBookmarks || []);
      updated.delete(questionId);
      await AsyncStorage.setItem(
        BOOKMARKS_STORAGE_KEY,
        JSON.stringify(Array.from(updated))
      );

      return { previousBookmarks };
    },
    onError: (err, questionId, context) => {
      // Rollback on error
      if (context?.previousBookmarks) {
        queryClient.setQueryData(['apologetics-bookmarks'], context.previousBookmarks);
        AsyncStorage.setItem(
          BOOKMARKS_STORAGE_KEY,
          JSON.stringify(Array.from(context.previousBookmarks))
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['apologetics-bookmarks'] });
    },
  });

  const bookmarkedIds = bookmarksQuery.data || cachedBookmarks;

  return {
    bookmarkedIds,
    isLoading: bookmarksQuery.isLoading,
    addBookmark: addBookmarkMutation.mutateAsync,
    removeBookmark: removeBookmarkMutation.mutateAsync,
    isAddingBookmark: addBookmarkMutation.isPending,
    isRemovingBookmark: removeBookmarkMutation.isPending,
  };
}
