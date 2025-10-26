const RAW_API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

function normalizeBase(input: string): string {
  const trimmed = (input || '').trim();
  if (!trimmed) return '/api';
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

export const API_BASE = normalizeBase(RAW_API_BASE);

export function apiUrl(path: string): string {
  if (!path) return API_BASE;
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const leading = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${leading}`;
}
