import type { ParsedQs } from 'qs';

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
}

export function getPaginationParams(query: ParsedQs, options: PaginationOptions = {}): PaginationParams {
  const defaultLimit = options.defaultLimit ?? 20;
  const maxLimit = options.maxLimit ?? 100;

  const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const parsedPage = rawPage !== undefined ? parseInt(String(rawPage), 10) : 1;
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const rawLimit = Array.isArray(query.limit) ? query.limit[0] : query.limit;
  const parsedLimit = rawLimit !== undefined ? parseInt(String(rawLimit), 10) : defaultLimit;
  const limit = Math.max(1, Math.min(maxLimit, Number.isFinite(parsedLimit) ? parsedLimit : defaultLimit));

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
}

export function attachPaginationHeaders(res: { setHeader: (name: string, value: string) => void }, total: number, params: PaginationParams) {
  res.setHeader('X-Total-Count', String(total));
  res.setHeader('X-Page', String(params.page));
  res.setHeader('X-Limit', String(params.limit));
}
