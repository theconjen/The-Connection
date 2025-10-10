import { eq } from 'drizzle-orm';

// Generic soft delete helper for Drizzle-based DB access
// db: the Drizzle DB instance
// table: the pgTable object (e.g., posts, communities)
// idCol: the column reference for the id column on the table (e.g., posts.id)
// id: the id value to soft-delete
export async function softDelete(db: any, table: any, idCol: any, id: number) {
  return db.update(table).set({ deletedAt: new Date() }).where(eq(idCol, id));
}

export default softDelete;
