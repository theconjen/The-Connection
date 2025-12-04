import crypto from 'crypto';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { sendEmail } from '../email';
import { EMAIL_FROM } from '../config/domain';
import { generateVerificationEmail } from '../email-templates/verification-email';

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createAndSendVerification(userId: number, email: string, apiBaseUrl: string) {
  const token = generateVerificationToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  const now = new Date();

  await db.update(users).set({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpiresAt: expiresAt,
    emailVerificationLastSentAt: now
  } as any).where(eq(users.id, userId));

  const verificationLink = `${apiBaseUrl.replace(/\/$/, '')}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  const { html, text } = generateVerificationEmail(verificationLink);

  try {
    await sendEmail({
      from: EMAIL_FROM,
      to: email,
      subject: 'Verify your email - The Connection',
      text,
      html
    });
  } catch (e) {
    console.warn('Failed to send verification email', e);
  }

  return { expiresAt };
}
