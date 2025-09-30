import { eq, and } from 'drizzle-orm';

// Generic helper: returns a condition checking deleted_at IS NULL for the given table
export function whereNotDeleted(table: any) {
  // Drizzle column name is expected as table.deletedAt
  return eq((table as any).deletedAt, null);
}

// Helper to combine an existing where clause with not-deleted
export function andNotDeleted(existingCond: any, table: any) {
  return and(existingCond, whereNotDeleted(table));
}

export default whereNotDeleted;
