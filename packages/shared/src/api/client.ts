/**
 * Shared API Client
 * Used by both mobile and web apps to ensure consistent API communication
 */

import type {
  MeResponse,
  QaArea,
  QaTag,
  Domain,
  LibraryPost,
  LibraryPostsListResponse,
  CreateLibraryPostRequest,
  UpdateLibraryPostRequest,
  ListLibraryPostsParams,
} from './types';

export interface ApiClientConfig {
  baseUrl: string;
  getToken: () => Promise<string | null> | string | null;
}

export interface ApiError extends Error {
  status?: number;
  data?: any;
}

function createApiError(message: string, status?: number, data?: any): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.data = data;
  return error;
}

export function createApiClient(config: ApiClientConfig) {
  const { baseUrl, getToken } = config;

  async function request<T>(
    method: string,
    path: string,
    body?: any,
    options?: RequestInit
  ): Promise<T> {
    const token = await getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${baseUrl}${path}`;

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        ...options,
      });

      let data: any;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw createApiError(
          data?.error || data?.message || `HTTP ${response.status}`,
          response.status,
          data
        );
      }

      return data as T;
    } catch (error: any) {
      if (error.status) throw error;
      throw createApiError(error.message || 'Network error');
    }
  }

  async function get<T>(path: string, options?: RequestInit): Promise<T> {
    return request<T>('GET', path, undefined, options);
  }

  async function post<T>(path: string, body?: any, options?: RequestInit): Promise<T> {
    return request<T>('POST', path, body, options);
  }

  async function patch<T>(path: string, body?: any, options?: RequestInit): Promise<T> {
    return request<T>('PATCH', path, body, options);
  }

  async function del<T>(path: string, options?: RequestInit): Promise<T> {
    return request<T>('DELETE', path, undefined, options);
  }

  // Build query string from params
  function buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    return qs ? `?${qs}` : '';
  }

  return {
    // Core HTTP methods
    get,
    post,
    patch,
    delete: del,
    request,

    // Auth & User
    async getMe(): Promise<MeResponse> {
      return get<MeResponse>('/api/me');
    },

    // QA Areas & Tags
    async listQaAreas(domain?: Domain): Promise<QaArea[]> {
      const qs = domain ? buildQueryString({ domain }) : '';
      return get<QaArea[]>(`/api/qa-areas${qs}`);
    },

    async listQaTags(areaId?: number): Promise<QaTag[]> {
      const qs = areaId ? buildQueryString({ areaId }) : '';
      return get<QaTag[]>(`/api/qa-tags${qs}`);
    },

    // Library Posts
    async listLibraryPosts(params: ListLibraryPostsParams = {}): Promise<LibraryPostsListResponse> {
      const qs = buildQueryString(params);
      return get<LibraryPostsListResponse>(`/api/library/posts${qs}`);
    },

    async getLibraryPost(id: number): Promise<LibraryPost> {
      return get<LibraryPost>(`/api/library/posts/${id}`);
    },

    async createLibraryPost(body: CreateLibraryPostRequest): Promise<LibraryPost> {
      return post<LibraryPost>('/api/library/posts', body);
    },

    async updateLibraryPost(id: number, body: UpdateLibraryPostRequest): Promise<LibraryPost> {
      return patch<LibraryPost>(`/api/library/posts/${id}`, body);
    },

    async publishLibraryPost(id: number): Promise<LibraryPost> {
      return post<LibraryPost>(`/api/library/posts/${id}/publish`);
    },

    async deleteLibraryPost(id: number): Promise<void> {
      return del<void>(`/api/library/posts/${id}`);
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
