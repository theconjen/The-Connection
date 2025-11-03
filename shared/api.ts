// Cross-platform API utilities
// Resolves API base URL for Expo (EXPO_PUBLIC_API_BASE), Vite (VITE_API_BASE), Next (NEXT_PUBLIC_API_BASE),
// and falls back to same-origin "/api" on web or http://localhost:5000/api in dev.

export function getApiBase(): string {
  // Try common env vars first
  const env = typeof process !== 'undefined' ? (process as any).env ?? {} : {};
  const candidates = [
    env.EXPO_PUBLIC_API_BASE,
    env.VITE_API_BASE,
    env.NEXT_PUBLIC_API_BASE,
    env.API_BASE_URL,
  ].filter(Boolean) as string[];

  if (candidates.length > 0) return candidates[0]!;

  // If in a browser context, default to same-origin /api
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return '/api';
  }

  // Fallback for native dev or Node contexts
  return 'http://localhost:5000/api';
}

export const API_BASE = getApiBase();

export type ApiError = Error & { status?: number; data?: any };

export async function apiFetch<T = any>(path: string, init?: RequestInit): Promise<T> {
  const url = /^(http|https):/i.test(path) ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  const contentType = res.headers.get('content-type') || '';
  const isJSON = contentType.includes('application/json');
  const body = isJSON ? await res.json().catch(() => undefined) : await res.text().catch(() => undefined);

  if (!res.ok) {
    const err: ApiError = new Error(`HTTP ${res.status}`) as ApiError;
    err.status = res.status;
    err.data = body;
    throw err;
  }

  return body as T;
}

export const apiGet = <T = any>(path: string, init?: RequestInit) => apiFetch<T>(path, { method: 'GET', ...(init || {}) });
export const apiPost = <T = any>(path: string, body?: any, init?: RequestInit) =>
  apiFetch<T>(path, { method: 'POST', body: body != null ? JSON.stringify(body) : undefined, ...(init || {}) });
export const apiPut = <T = any>(path: string, body?: any, init?: RequestInit) =>
  apiFetch<T>(path, { method: 'PUT', body: body != null ? JSON.stringify(body) : undefined, ...(init || {}) });
export const apiDelete = <T = any>(path: string, init?: RequestInit) => apiFetch<T>(path, { method: 'DELETE', ...(init || {}) });
