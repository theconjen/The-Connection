import createHttpError from 'http-errors'
import type { Request } from 'express'

export function getUserId(req: Request): number {
  // sessions often serialize to strings; normalize at the boundary
  const raw = (req.session as any)?.userId
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n) || n <= 0) {
    throw createHttpError(401, 'Invalid or missing session userId')
  }
  return n
}
