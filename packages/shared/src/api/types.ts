/**
 * Shared API Contract Types
 * Used by both mobile and web apps to ensure type safety and prevent drift
 */

// Domain types
export type Domain = 'apologetics' | 'polemics';
export type LibraryPostStatus = 'draft' | 'published' | 'archived';

// QA Area and Tag types
export interface QaArea {
  id: number;
  domain: Domain;
  name: string;
  description: string | null;
  slug: string;
  createdAt: string;
}

export interface QaTag {
  id: number;
  areaId: number;
  name: string;
  slug: string;
  createdAt: string;
}

// User capabilities and permissions
export interface MeResponse {
  user: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    profileImageUrl: string | null;
    isVerifiedApologeticsAnswerer: boolean;
  };
  permissions: string[];
  capabilities: {
    inboxAccess: boolean;
    canAuthorApologeticsPosts: boolean;
  };
}

// Library Post Source
export interface LibraryPostSource {
  author: string;
  title: string;
  publisher?: string;
  year?: number;
  url?: string;
}

// Library Post (full detail)
export interface LibraryPost {
  id: number;
  domain: Domain;
  areaId: number | null;
  tagId: number | null;
  title: string;
  summary: string | null;
  bodyMarkdown: string;
  perspectives: string[];
  sources: LibraryPostSource[];
  authorUserId: number;
  authorDisplayName: string;
  status: LibraryPostStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  // Relations (populated in responses)
  area?: QaArea;
  tag?: QaTag;
}

// Library Post list item (lighter weight)
export interface LibraryPostListItem {
  id: number;
  domain: Domain;
  areaId: number | null;
  tagId: number | null;
  title: string;
  summary: string | null;
  perspectives: string[];
  authorDisplayName: string;
  status: LibraryPostStatus;
  publishedAt: string | null;
  createdAt: string;
  area?: Pick<QaArea, 'id' | 'name' | 'slug'>;
  tag?: Pick<QaTag, 'id' | 'name' | 'slug'>;
}

// List response with pagination
export interface LibraryPostsListResponse {
  posts: LibraryPostListItem[];
  total: number;
  limit: number;
  offset: number;
}

// Create/Update library post request
export interface CreateLibraryPostRequest {
  domain: Domain;
  areaId: number | null;
  tagId: number | null;
  title: string;
  summary?: string;
  bodyMarkdown: string;
  perspectives: string[];
  sources: LibraryPostSource[];
}

export interface UpdateLibraryPostRequest {
  areaId?: number | null;
  tagId?: number | null;
  title?: string;
  summary?: string;
  bodyMarkdown?: string;
  perspectives?: string[];
  sources?: LibraryPostSource[];
}

// List query parameters
export interface ListLibraryPostsParams {
  domain?: Domain;
  areaId?: number;
  tagId?: number;
  q?: string;
  status?: LibraryPostStatus;
  limit?: number;
  offset?: number;
}

// Apologetics inbox types (for reference)
export interface ApologeticsQuestion {
  id: number;
  userId: number;
  domain: Domain;
  areaId: number | null;
  tagId: number | null;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApologeticsMessage {
  id: number;
  questionId: number;
  senderId: number;
  content: string;
  createdAt: string;
}
