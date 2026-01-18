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
  tldr: string | null; // Quick answer (2-3 sentences) - GotQuestions UX
  keyPoints: string[]; // 3-5 bullet points
  scriptureRefs: string[]; // Scripture references
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
  author?: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    profileImageUrl: string | null;
  };
  // Contributions (populated when viewing post)
  contributions?: LibraryContribution[];
}

// Library Post list item (lighter weight)
export interface LibraryPostListItem {
  id: number;
  domain: Domain;
  areaId: number | null;
  tagId: number | null;
  title: string;
  summary: string | null;
  tldr: string | null; // Preview for list view
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
  tldr: string; // Required for GotQuestions UX
  keyPoints: string[];
  scriptureRefs: string[];
  bodyMarkdown: string;
  perspectives: string[];
  sources: LibraryPostSource[];
}

export interface UpdateLibraryPostRequest {
  areaId?: number | null;
  tagId?: number | null;
  title?: string;
  summary?: string;
  tldr?: string;
  keyPoints?: string[];
  scriptureRefs?: string[];
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

// Library Contributions - Multi-apologist collaboration
export type ContributionType =
  | 'edit_suggestion'
  | 'additional_perspective'
  | 'add_sources'
  | 'clarification';

export type ContributionStatus = 'pending' | 'approved' | 'rejected';

// Contribution payloads (type-specific)
export interface AdditionalPerspectivePayload {
  label: string; // e.g., "Catholic View", "Reformed Response"
  bodyMarkdown: string;
  scriptureRefs?: string[];
}

export interface AddSourcesPayload {
  sources: LibraryPostSource[];
}

export interface EditSuggestionPayload {
  proposedBodyMarkdown?: string;
  patchDescription?: string;
}

export interface ClarificationPayload {
  section: string; // Which section needs clarification
  clarificationText: string;
}

export type ContributionPayload =
  | AdditionalPerspectivePayload
  | AddSourcesPayload
  | EditSuggestionPayload
  | ClarificationPayload;

// Library Contribution (full detail)
export interface LibraryContribution {
  id: number;
  postId: number;
  contributorUserId: number;
  type: ContributionType;
  payload: ContributionPayload;
  status: ContributionStatus;
  createdAt: string;
  reviewedAt: string | null;
  reviewedByUserId: number | null;
  // Relations
  contributor?: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  reviewer?: {
    id: number;
    username: string;
    displayName: string | null;
  };
}

// Create contribution request
export interface CreateContributionRequest {
  type: ContributionType;
  payload: ContributionPayload;
}

// Contribution list response
export interface ContributionsListResponse {
  contributions: LibraryContribution[];
  total: number;
}
