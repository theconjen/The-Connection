import { db } from '../db';
import { users } from '@shared/schema';
import { sql } from 'drizzle-orm';

/**
 * Periodic cleanup for expired email verification tokens.
 * - Runs immediately on start and then on the configured interval.
 */
export function startVerificationCleanup(opts?: { intervalMs?: number; retentionDays?: number }) {
  const intervalMs = opts?.intervalMs ?? 24 * 60 * 60 * 1000; // once per day
  const retentionDays = opts?.retentionDays ?? 30; // remove tokens that expired > 30 days ago

  async function cleanupOnce() {
    try {
      if (!db) return;
      const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      // Null out verification fields for accounts whose verification expired before the cutoff
      await db.update(users).set({
        emailVerificationToken: null as any,
        emailVerificationTokenHash: null as any,
        emailVerificationExpiresAt: null as any,
        emailVerificationLastSentAt: null as any,
      } as any).where(sql`${users.emailVerificationExpiresAt} < ${cutoff}`);

    } catch (err) {
      console.warn('Verification cleanup failed:', err);
    }
  }

  // Run immediately
  void cleanupOnce();

  // Schedule
  const timer = setInterval(() => void cleanupOnce(), intervalMs);

  return {
    stop: () => clearInterval(timer),
  };
}

export async function runVerificationCleanupOnce(retentionDays?: number) {
  const cutoff = new Date(Date.now() - (retentionDays ?? 30) * 24 * 60 * 60 * 1000);
  try {
    if (!db) return;
    await db.update(users).set({
      emailVerificationToken: null as any,
      emailVerificationTokenHash: null as any,
      emailVerificationExpiresAt: null as any,
      emailVerificationLastSentAt: null as any,
    } as any).where(sql`${users.emailVerificationExpiresAt} < ${cutoff}`);
    console.info(`Verification cleanup: cleared tokens expired before ${cutoff.toISOString()}`);
  } catch (err) {
    console.warn('Verification cleanup (on-demand) failed:', err);
    throw err;
  }
}

export default startVerificationCleanup;
