/**
 * Notifications and push token storage methods.
 * Extracted from the monolithic storage.ts.
 */
import { pushTokens, notifications } from '@shared/schema';
import { db, eq } from './base';

export async function savePushToken(token: any): Promise<any> {
  const existing = await db.select().from(pushTokens).where(eq(pushTokens.token, token.token));
  if (existing && existing.length > 0) {
    const [row] = await db.update(pushTokens)
      .set({ userId: token.userId, platform: token.platform || existing[0].platform, lastUsed: new Date() })
      .where(eq(pushTokens.token, token.token))
      .returning();
    return row;
  }
  const [inserted] = await db.insert(pushTokens)
    .values({ userId: token.userId, token: token.token, platform: token.platform || 'unknown', lastUsed: token.lastUsed || new Date() } as any)
    .returning();
  return inserted;
}

export async function getUserPushTokens(userId: number): Promise<any[]> {
  return await db.select().from(pushTokens).where(eq(pushTokens.userId, userId));
}

export async function deletePushToken(token: string, userId: number): Promise<'deleted' | 'notfound' | 'forbidden'> {
  const rows = await db.select().from(pushTokens).where(eq(pushTokens.token, token));
  if (!rows || rows.length === 0) return 'notfound';
  const row = rows[0] as any;
  if (row.userId !== userId) return 'forbidden';
  await db.delete(pushTokens).where(eq(pushTokens.token, token));
  return 'deleted';
}

export async function getUserNotifications(userId: number): Promise<any[]> {
  return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(notifications.createdAt);
}

export async function markNotificationAsRead(id: number, userId: number): Promise<boolean> {
  const rows = await db.select().from(notifications).where(eq(notifications.id, id));
  if (!rows || rows.length === 0) return false;
  const n = rows[0] as any;
  if (n.userId !== userId) return false;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  return true;
}

export async function createNotification(notification: any): Promise<any> {
  const [result] = await db.insert(notifications).values(notification).returning();
  return result;
}
