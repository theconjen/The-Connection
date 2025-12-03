import { describe, it, expect } from 'vitest';
import { MemStorage } from '../../server/storage';
import { generateVerificationToken, hashToken } from '../../server/lib/emailVerification';

describe('email verification (mem storage)', () => {
  it('stores and finds a user by token hash, then verifies', async () => {
    const store = new MemStorage();

    const user = await store.createUser({ username: 'testuser', email: 'test@example.com', password: 'x' });

    const token = generateVerificationToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await store.updateUser(user.id, {
      emailVerificationTokenHash: tokenHash as any,
      emailVerificationExpiresAt: expiresAt as any,
      emailVerificationLastSentAt: new Date() as any,
    } as any);

    const found = await store.getUserByEmailVerificationToken(token);
    expect(found).toBeDefined();
    expect(found!.id).toBe(user.id);

    // Simulate verification
    await store.updateUser(user.id, {
      emailVerified: true,
      emailVerifiedAt: new Date() as any,
      emailVerificationTokenHash: null as any,
      emailVerificationExpiresAt: null as any,
      emailVerificationLastSentAt: null as any,
    } as any);

    const verified = await store.getUser(user.id);
    expect(verified?.emailVerified).toBe(true);
  });
});
