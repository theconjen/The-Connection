import { API_BASE } from 'shared-env';

// Narrow RequestInit to ensure JSON body + cookie credentials always included
export type HttpInit = Omit<RequestInit, 'body' | 'credentials'> & { body?: unknown };

export async function http<T>(path: string, init: HttpInit = {}): Promise<T> {
  if (!API_BASE) throw new Error('API_BASE is not set');
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = json?.message || json?.error || res.statusText || 'Request failed';
    throw Object.assign(new Error(msg), { status: res.status, data: json });
  }
  return json as T;
}
