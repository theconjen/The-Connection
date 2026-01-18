/**
 * Shared React Query Keys
 * Used by both mobile and web apps to ensure cache consistency
 */

import type { Domain, ListLibraryPostsParams } from './types';

export const queryKeys = {
  // Auth & User
  me: () => ['me'] as const,

  // QA Areas
  qaAreas: {
    all: () => ['qa-areas'] as const,
    byDomain: (domain?: Domain) => ['qa-areas', { domain }] as const,
  },

  // QA Tags
  qaTags: {
    all: () => ['qa-tags'] as const,
    byArea: (areaId?: number) => ['qa-tags', { areaId }] as const,
  },

  // Library Posts
  libraryPosts: {
    all: () => ['library-posts'] as const,
    lists: () => ['library-posts', 'list'] as const,
    list: (params: ListLibraryPostsParams) => ['library-posts', 'list', params] as const,
    detail: (id: number) => ['library-posts', 'detail', id] as const,
  },

  // Apologetics Inbox (for reference)
  apologeticsInbox: {
    all: () => ['apologetics-inbox'] as const,
    questions: () => ['apologetics-inbox', 'questions'] as const,
    question: (id: number) => ['apologetics-inbox', 'questions', id] as const,
    messages: (questionId: number) => ['apologetics-inbox', 'messages', questionId] as const,
  },
} as const;
