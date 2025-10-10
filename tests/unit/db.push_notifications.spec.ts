import { describe, it, expect, beforeAll } from 'vitest';
import { DbStorage } from '../../server/storage';
import { db } from '../../server/db';
import { pushTokens, notifications, users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Skip tests if no DATABASE_URL is configured
if (!process.env.DATABASE_URL) {
  // eslint-disable-next-line no-console
  console.warn('Skipping DB-backed tests because DATABASE_URL is not set');
}

describe('DbStorage push tokens and notifications (requires DATABASE_URL)', () => {
  let storage: any;

  beforeAll(() => {
    if (!process.env.DATABASE_URL) return;
    storage = new DbStorage();
  });

  it('saves, retrieves, and deletes push tokens', async () => {
    if (!process.env.DATABASE_URL) return;

    // create a temporary user for the test
    const username = `test_user_${Date.now()}`;
    const email = `${username}@example.test`;
    const [u] = await db.insert(users).values({ username, email, password: 'test' } as any).returning();
    const userId = (u as any).id;
    const token = `test-token-${Date.now()}`;

    try {
      const saved = await storage.savePushToken({ userId, token, platform: 'test' });
      expect(saved).toHaveProperty('id');

      const tokens = await storage.getUserPushTokens(userId);
      expect(Array.isArray(tokens)).toBe(true);
      expect(tokens.find((t: any) => t.token === token)).toBeTruthy();

      const del = await storage.deletePushToken(token, userId);
      expect(del).toBe('deleted');

      const del2 = await storage.deletePushToken(token, userId);
      expect(del2).toBe('notfound');
    } finally {
      // cleanup created user
      await db.delete(users).where(eq(users.id, userId));
    }
  });

  it('creates, reads, and marks notifications as read', async () => {
    if (!process.env.DATABASE_URL) return;

    // create a temporary user for the notification test
    const username = `test_user2_${Date.now()}`;
    const email = `${username}@example.test`;
    const [u] = await db.insert(users).values({ username, email, password: 'test' } as any).returning();
    const userId = (u as any).id;

    try {
      const notif = await db.insert(notifications).values({ userId, title: 't', body: 'b' } as any).returning();
      const n = notif[0];

      const list = await storage.getUserNotifications(userId);
      expect(list.find((x: any) => x.id === n.id)).toBeTruthy();

      const ok = await storage.markNotificationAsRead(n.id, userId);
      expect(ok).toBe(true);
    } finally {
      await db.delete(notifications).where(eq(notifications.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    }
  });
});
