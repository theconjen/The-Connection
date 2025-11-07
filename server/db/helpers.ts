import { eq, and, sql } from 'drizzle-orm';

// Generic helper: returns a condition checking deleted_at IS NULL for the given table
// Use SQL IS NULL because `col = NULL` evaluates to NULL (no rows). Drizzle's
// `eq(col, null)` would generate `col = NULL` which is incorrect for SQL null checks.
export function whereNotDeleted(table: any) {
  // Drizzle column reference is table.deletedAt; use a raw SQL fragment `col IS NULL`.
  return sql`${(table as any).deletedAt} IS NULL`;
}

// Helper to combine an existing where clause with not-deleted
export function andNotDeleted(existingCond: any, table: any) {
  return and(existingCond, whereNotDeleted(table));
}

export default whereNotDeleted;
