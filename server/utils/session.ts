import createHttpError from 'http-errors'
import type { Request } from 'express'

export function normalizeId(id: string | number | undefined): number {
  const n = Number(id)
  if (!Number.isFinite(n)) {
    throw new Error("Invalid ID")
  }
  return n
}
