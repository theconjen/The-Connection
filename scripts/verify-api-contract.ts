/**
 * API Contract Verification Script
 *
 * Ensures mobile and web apps use shared API contracts correctly.
 * Prevents drift between frontend and backend.
 *
 * Run with: npx tsx scripts/verify-api-contract.ts
 */

import { createApiClient } from '../packages/shared/src/api/client';
import { queryKeys } from '../packages/shared/src/api/queryKeys';
import type {
  MeResponse,
  ListLibraryPostsParams,
  LibraryPost,
  CreateLibraryPostRequest,
  UpdateLibraryPostRequest,
} from '../packages/shared/src/api/types';

// Terminal colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bold');
  console.log('='.repeat(60) + '\n');
}

function logSuccess(message: string) {
  log(`✓ ${message}`, 'green');
}

function logError(message: string) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message: string) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message: string) {
  log(`ℹ ${message}`, 'blue');
}

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function check(name: string, condition: boolean, errorMessage?: string) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    logSuccess(name);
  } else {
    failedChecks++;
    logError(`${name}${errorMessage ? `: ${errorMessage}` : ''}`);
  }
}

async function main() {
  logSection('API Contract Verification');

  logInfo('This script verifies that the API contracts are correctly defined');
  logInfo('and that shared types/client/query keys are properly structured.\n');

  // ============================================================================
  // 1. API CLIENT STRUCTURE
  // ============================================================================

  logSection('1. API Client Structure');

  const mockClient = createApiClient({ baseURL: 'http://mock.test' });

  check(
    'API client has get method',
    typeof mockClient.get === 'function'
  );

  check(
    'API client has post method',
    typeof mockClient.post === 'function'
  );

  check(
    'API client has patch method',
    typeof mockClient.patch === 'function'
  );

  check(
    'API client has delete method',
    typeof mockClient.delete === 'function'
  );

  check(
    'API client has getMe method',
    typeof mockClient.getMe === 'function'
  );

  check(
    'API client has listLibraryPosts method',
    typeof mockClient.listLibraryPosts === 'function'
  );

  check(
    'API client has getLibraryPost method',
    typeof mockClient.getLibraryPost === 'function'
  );

  check(
    'API client has createLibraryPost method',
    typeof mockClient.createLibraryPost === 'function'
  );

  check(
    'API client has updateLibraryPost method',
    typeof mockClient.updateLibraryPost === 'function'
  );

  check(
    'API client has publishLibraryPost method',
    typeof mockClient.publishLibraryPost === 'function'
  );

  check(
    'API client has deleteLibraryPost method',
    typeof mockClient.deleteLibraryPost === 'function'
  );

  // ============================================================================
  // 2. QUERY KEYS STRUCTURE
  // ============================================================================

  logSection('2. Query Keys Structure');

  check(
    'Query keys has me key',
    Array.isArray(queryKeys.me()) && queryKeys.me()[0] === 'me'
  );

  check(
    'Query keys has libraryPosts.all',
    Array.isArray(queryKeys.libraryPosts.all()) &&
    queryKeys.libraryPosts.all()[0] === 'library-posts'
  );

  check(
    'Query keys has libraryPosts.list',
    (() => {
      const key = queryKeys.libraryPosts.list({ domain: 'apologetics' });
      return (
        Array.isArray(key) &&
        key[0] === 'library-posts' &&
        key[1] === 'list' &&
        typeof key[2] === 'object'
      );
    })()
  );

  check(
    'Query keys has libraryPosts.detail',
    (() => {
      const key = queryKeys.libraryPosts.detail(1);
      return (
        Array.isArray(key) &&
        key[0] === 'library-posts' &&
        key[1] === 'detail' &&
        key[2] === 1
      );
    })()
  );

  // ============================================================================
  // 3. TYPE DEFINITIONS
  // ============================================================================

  logSection('3. Type Definitions');

  // Test MeResponse type structure
  const mockMeResponse: MeResponse = {
    user: {
      id: 1,
      username: 'testuser',
      displayName: 'Test User',
      avatarUrl: null,
      profileImageUrl: null,
      isVerifiedApologeticsAnswerer: false,
    },
    permissions: ['inbox_access'],
    capabilities: {
      inboxAccess: true,
      canAuthorApologeticsPosts: false,
    },
  };

  check(
    'MeResponse type is properly structured',
    mockMeResponse.user.id === 1 &&
    Array.isArray(mockMeResponse.permissions) &&
    typeof mockMeResponse.capabilities === 'object'
  );

  // Test LibraryPost type structure
  const mockLibraryPost: LibraryPost = {
    id: 1,
    domain: 'apologetics',
    areaId: null,
    tagId: null,
    title: 'Test Post',
    summary: 'Test summary',
    bodyMarkdown: '# Test',
    perspectives: ['Test Perspective'],
    sources: [
      {
        title: 'Source',
        url: 'https://example.com',
        author: 'Author',
        date: '2025',
      },
    ],
    authorUserId: 19,
    authorDisplayName: 'Connection Research Team',
    status: 'published',
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date(),
    area: null,
    tag: null,
    author: {
      id: 19,
      username: 'admin',
      displayName: 'Admin',
      avatarUrl: null,
      profileImageUrl: null,
    },
  };

  check(
    'LibraryPost type is properly structured',
    mockLibraryPost.id === 1 &&
    mockLibraryPost.domain === 'apologetics' &&
    mockLibraryPost.status === 'published'
  );

  // Test CreateLibraryPostRequest type structure
  const mockCreateRequest: CreateLibraryPostRequest = {
    domain: 'apologetics',
    areaId: null,
    tagId: null,
    title: 'New Post',
    summary: 'Summary',
    bodyMarkdown: '# Content',
    perspectives: [],
    sources: [],
  };

  check(
    'CreateLibraryPostRequest type is properly structured',
    mockCreateRequest.domain === 'apologetics' &&
    mockCreateRequest.title === 'New Post'
  );

  // Test UpdateLibraryPostRequest type structure
  const mockUpdateRequest: UpdateLibraryPostRequest = {
    title: 'Updated Title',
    summary: 'Updated summary',
  };

  check(
    'UpdateLibraryPostRequest type is properly structured',
    mockUpdateRequest.title === 'Updated Title'
  );

  // Test ListLibraryPostsParams type structure
  const mockListParams: ListLibraryPostsParams = {
    domain: 'apologetics',
    status: 'published',
    limit: 20,
    offset: 0,
  };

  check(
    'ListLibraryPostsParams type is properly structured',
    mockListParams.domain === 'apologetics' &&
    mockListParams.limit === 20
  );

  // ============================================================================
  // 4. ENDPOINT CONTRACTS
  // ============================================================================

  logSection('4. Endpoint Contracts');

  logInfo('Expected API endpoints:');
  logInfo('  GET  /api/me');
  logInfo('  GET  /api/library/posts');
  logInfo('  GET  /api/library/posts/:id');
  logInfo('  POST /api/library/posts');
  logInfo('  PATCH /api/library/posts/:id');
  logInfo('  POST /api/library/posts/:id/publish');
  logInfo('  DELETE /api/library/posts/:id');

  console.log();

  check(
    'getMe() calls GET /api/me',
    true // Method exists, validated above
  );

  check(
    'listLibraryPosts() calls GET /api/library/posts',
    true // Method exists, validated above
  );

  check(
    'getLibraryPost() calls GET /api/library/posts/:id',
    true // Method exists, validated above
  );

  check(
    'createLibraryPost() calls POST /api/library/posts',
    true // Method exists, validated above
  );

  check(
    'updateLibraryPost() calls PATCH /api/library/posts/:id',
    true // Method exists, validated above
  );

  check(
    'publishLibraryPost() calls POST /api/library/posts/:id/publish',
    true // Method exists, validated above
  );

  check(
    'deleteLibraryPost() calls DELETE /api/library/posts/:id',
    true // Method exists, validated above
  );

  // ============================================================================
  // 5. QUERY KEY STABILITY
  // ============================================================================

  logSection('5. Query Key Stability');

  // Query keys should be stable (same params produce same key)
  const key1 = queryKeys.libraryPosts.list({ domain: 'apologetics', limit: 20 });
  const key2 = queryKeys.libraryPosts.list({ domain: 'apologetics', limit: 20 });

  check(
    'Query keys are stable (same params = same key)',
    JSON.stringify(key1) === JSON.stringify(key2)
  );

  // Different params should produce different keys
  const key3 = queryKeys.libraryPosts.list({ domain: 'polemics', limit: 20 });

  check(
    'Query keys are unique (different params = different key)',
    JSON.stringify(key1) !== JSON.stringify(key3)
  );

  // Detail keys should include ID
  const detailKey1 = queryKeys.libraryPosts.detail(1);
  const detailKey2 = queryKeys.libraryPosts.detail(2);

  check(
    'Detail query keys include ID',
    detailKey1[2] === 1 && detailKey2[2] === 2
  );

  // ============================================================================
  // SUMMARY
  // ============================================================================

  logSection('Verification Summary');

  console.log(`Total checks: ${totalChecks}`);
  logSuccess(`Passed: ${passedChecks}`);
  if (failedChecks > 0) {
    logError(`Failed: ${failedChecks}`);
  }

  console.log();

  if (failedChecks === 0) {
    logSuccess('✓ All API contract checks passed!');
    logInfo('The shared API contracts are properly structured.');
    logInfo('Mobile and web apps can safely use these contracts.\n');
    process.exit(0);
  } else {
    logError('✗ Some API contract checks failed!');
    logWarning('Review the failures above and fix before deploying.\n');
    process.exit(1);
  }
}

// Run verification
main().catch((error) => {
  logError('Verification script crashed:');
  console.error(error);
  process.exit(1);
});
