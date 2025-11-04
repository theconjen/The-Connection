import { QueryClient, QueryFunction } from "@tanstack/react-query";

const RAW_API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

function normalizeBase(input: string): string {
  const trimmed = (input || '').trim();
  if (!trimmed) return '/api';
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

export const API_BASE = normalizeBase(RAW_API_BASE);

function stripDuplicateApiPrefix(base: string, leadingPath: string): string {
  const normalizedBase = base.replace(/\/+$/, '').toLowerCase();
  const normalizedPath = leadingPath.toLowerCase();

  const baseEndsWithApi = normalizedBase.endsWith('/api');
  if (!baseEndsWithApi) return leadingPath;

  if (normalizedPath === '/api') {
    return '';
  }

  if (normalizedPath.startsWith('/api/')) {
    return leadingPath.slice(4);
  }

  return leadingPath;
}

export function apiUrl(path: string): string {
  if (!path) return API_BASE;
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const leading = path.startsWith('/') ? path : `/${path}`;
  const deduped = stripDuplicateApiPrefix(API_BASE, leading);

  return `${API_BASE}${deduped}`;
}
