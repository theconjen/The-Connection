import type { ParsedQs } from 'qs';
import { z } from 'zod/v4';

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
}

export type PaginationParseResult =
  | { success: true; data: PaginationParams }
  | { success: false; error: z.ZodError<any> };

function buildPaginationSchema(defaultLimit: number, maxLimit: number) {
  return z.object({
    page: z
      .preprocess(val => (val === undefined ? 1 : val), z.coerce.number().int().min(1))
      .default(1),
    limit: z
      .preprocess(val => (val === undefined ? defaultLimit : val), z.coerce.number().int().min(1).max(maxLimit))
      .default(defaultLimit),
  });
}

export function parsePaginationParams(query: ParsedQs, options: PaginationOptions = {}): PaginationParseResult {
  const defaultLimit = options.defaultLimit ?? 20;
  const maxLimit = options.maxLimit ?? 100;

  const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const rawLimit = Array.isArray(query.limit) ? query.limit[0] : query.limit;

  const schema = buildPaginationSchema(defaultLimit, maxLimit);
  const result = schema.safeParse({ page: rawPage, limit: rawLimit });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const { page, limit } = result.data;

  return {
    success: true,
    data: {
      page,
      limit,
      offset: (page - 1) * limit,
    },
  };
}

export function getPaginationParams(query: ParsedQs, options: PaginationOptions = {}): PaginationParams {
  const result = parsePaginationParams(query, options);
  if (!result.success) {
    return {
      page: 1,
      limit: options.defaultLimit ?? 20,
      offset: 0,
    };
  }

  return result.data;
}

export function attachPaginationHeaders(res: { setHeader: (name: string, value: string) => void }, total: number, params: PaginationParams) {
  res.setHeader('X-Total-Count', String(total));
  res.setHeader('X-Page', String(params.page));
  res.setHeader('X-Limit', String(params.limit));
}
