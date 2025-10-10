import { getApiBase } from '../config';

type FetchOptions = RequestInit & {
  json?: any;
};

async function request<T = any>(path: string, opts: FetchOptions = {}): Promise<T> {
  const base = getApiBase();
  if (!base) throw new Error('API base URL is not set. Define EXPO_PUBLIC_API_BASE or extra.apiBase.');
  const url = `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers = new Headers(opts.headers || {});
  if (opts.json !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(url, {
    ...opts,
    headers,
    credentials: 'include',
    body: opts.json !== undefined ? JSON.stringify(opts.json) : opts.body,
  });
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const message = isJson && data && (data.message || data.error) ? (data.message || data.error) : `HTTP ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

export const api = {
  get: <T = any>(path: string, opts?: FetchOptions) => request<T>(path, { ...opts, method: 'GET' }),
  post: <T = any>(path: string, json?: any, opts?: FetchOptions) => request<T>(path, { ...opts, method: 'POST', json }),
  del: <T = any>(path: string, opts?: FetchOptions) => request<T>(path, { ...opts, method: 'DELETE' }),
};

export type ApiUser = {
  id: number | string;
  username: string;
  email?: string;
  displayName?: string;
  isAdmin?: boolean;
};
