import createHttpError from 'http-errors'
import type { Request } from 'express'

export function normalizeId(id: string | number | undefined): number {
  const n = Number(id)
  if (!Number.isFinite(n)) {
    throw new Error("Invalid ID")
  }
  return n
}
export function getUserId(raw: string | number | undefined): number {
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("Invalid or missing user ID in session")
  }
  return n
}