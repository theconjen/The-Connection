import { API_BASE } from 'shared-env';

export type HttpInit = Omit<RequestInit, 'body' | 'credentials'> & {
  body?: unknown;
  expectJson?: boolean;
};

function sanitizeApiBase(raw: string | undefined | null): string {
  if (!raw) return '';

  const trimmed = raw.trim();
  if (!trimmed) return '';

  const withoutWhitespace = trimmed.replace(/\s+/g, '');
  const normalizedProtocol = withoutWhitespace
    .replace(/^(https?):(?=[^/])/i, (_, protocol: string) => `${protocol.toLowerCase()}://`)
    .replace(/^(https?):\/(?!\/)/i, (_, protocol: string) => `${protocol.toLowerCase()}://`);

  return normalizedProtocol;
}

function composeUrl(path: string): string {
  const isAbsoluteHttp = /^https?:\/\//i.test(path);
  if (isAbsoluteHttp) return path;

  const sanitizedBase = sanitizeApiBase(API_BASE);
  const hadRawBase = Boolean(API_BASE && API_BASE.trim().length > 0);

  if (sanitizedBase) {
    if (/^https?:\/\//i.test(sanitizedBase) || sanitizedBase.startsWith('/')) {
      const base = sanitizedBase.replace(/\/+$/, '');
      return `${base}${path.startsWith('/') ? path : `/${path}`}`;
    }

    throw new Error(
      `Invalid API_BASE value "${API_BASE}". Expected an HTTPS URL (e.g. https://api.example.com) or a relative "/api" path.`
    );
  }

  if (hadRawBase) {
    throw new Error(
      `Invalid API_BASE value "${API_BASE}". Expected an HTTPS URL (e.g. https://api.example.com) or a relative "/api" path.`
    );
  }

  if (path.startsWith('/')) return path; // allow same-origin absolute paths in web dev/tests

  throw new Error(
    'API_BASE is not set. Use an absolute "/api/..." path in web dev/tests or configure API_BASE.'
  );
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

export async function http<T>(path: string, init: HttpInit = {}): Promise<T> {
  const url = composeUrl(path);
  const { body, expectJson = true, headers, ...rest } = init;

  const requestHeaders = new Headers(headers ?? undefined);
  if (!requestHeaders.has('Accept')) {
    requestHeaders.set('Accept', 'application/json');
  }
  if (body !== undefined && !isFormData(body) && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...rest,
    credentials: 'include',
    headers: requestHeaders,
    body:
      body === undefined
        ? undefined
        : isFormData(body)
        ? body
        : JSON.stringify(body),
  });

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = /application\/json/i.test(contentType);
  const preview = await response
    .clone()
    .text()
    .catch(() => '');

  if (!response.ok) {
    const errorMessage = `HTTP ${response.status} for ${url}\nContent-Type: ${contentType}\nFirst 120 chars: ${preview.slice(
      0,
      120,
    )}`;
    const error = new Error(errorMessage) as Error & { status?: number; data?: unknown };
    error.status = response.status;
    if (isJson) {
      try {
        error.data = JSON.parse(preview || 'null');
      } catch {
        error.data = preview;
      }
    } else {
      error.data = preview;
    }
    throw error;
  }

  if (!expectJson) {
    return response as unknown as T;
  }

  if (!isJson) {
    throw new Error(
      `Expected JSON from ${url} but received ${contentType || 'unknown content-type'}. First chars: ${preview.slice(
        0,
        80,
      )}`,
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(
      `Failed to parse JSON from ${url}. First chars: ${preview.slice(0, 120)}`,
    );
  }
}
