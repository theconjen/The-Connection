import crypto from 'crypto';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { sendEmail } from '../email';

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createAndSendVerification(userId: number, email: string, frontendUrl: string) {
  const token = generateVerificationToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  const now = new Date();

  await db.update(users).set({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpiresAt: expiresAt,
    emailVerificationLastSentAt: now
  } as any).where(eq(users.id, userId));

  const link = `${frontendUrl.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(token)}`;
  try {
    await sendEmail({
      to: email,
      subject: 'Verify your email',
      text: `Please verify your email by visiting: ${link}`,
      html: `<p>Please verify your email by clicking <a href="${link}">this link</a>. It expires in 24 hours.</p>`
    });
  } catch (e) {
    console.warn('Failed to send verification email', e);
  }

  return { expiresAt };
}
