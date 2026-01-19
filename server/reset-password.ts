import crypto from 'crypto';
import { storage } from './storage-optimized';
import { sendPasswordResetEmail } from './email';
import { db } from './db';
import { passwordResetTokens } from '@shared/schema';
import { eq, and, gt, isNull } from 'drizzle-orm';

// Token expiration time (1 hour)
const TOKEN_EXPIRY_MS = 60 * 60 * 1000;

/**
 * Generate a secure reset token
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a token for secure storage
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Create a password reset token for a user
 * Stores hashed token in database for security
 *
 * @param email User's email
 */
export async function createPasswordResetToken(email: string): Promise<boolean> {
  try {
    // Normalize email for consistent lookup
    const normalizedEmail = email.trim().toLowerCase();
    console.info('[PASSWORD_RESET] Request received for email:', normalizedEmail);

    // Find user by email
    console.info('[PASSWORD_RESET] Calling storage.getUserByEmail...');
    const user = await storage.getUserByEmail(normalizedEmail);

    if (!user) {
      // We don't want to reveal if an email exists in the database
      // So we'll still return success but won't actually send an email
      console.info('[PASSWORD_RESET] ⚠️ No user found for email:', normalizedEmail);
      console.info('[PASSWORD_RESET] (This means the email is not registered in the database)');
      return true;
    }

    console.info('[PASSWORD_RESET] ✅ User found:', {
      id: user.id,
      username: user.username,
      email: user.email,
      emailVerified: (user as any).emailVerified
    });

    // Invalidate any existing unused tokens for this user (optional: security measure)
    await db.update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(and(
        eq(passwordResetTokens.userId, user.id),
        isNull(passwordResetTokens.usedAt)
      ));

    // Generate a token (this is what we send to the user)
    const token = generateResetToken();
    // Hash the token for storage (we never store the plain token)
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

    // Store the hashed token in the database
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      email: user.email,
      expiresAt,
    });

    console.info('[PASSWORD_RESET] Token generated and stored in DB, attempting to send email...');

    // Send email with reset link (using the plain token, not the hash)
    const emailSent = await sendPasswordResetEmail(user.email, user.username, token);

    console.info('[PASSWORD_RESET] Email send result:', emailSent ? '✅ SUCCESS' : '❌ FAILED');

    if (!emailSent) {
      console.error('[PASSWORD_RESET] Email failed to send! Check email provider configuration.');
    }

    return true;
  } catch (error) {
    console.error('[PASSWORD_RESET] ❌ Error creating password reset token:', error);
    return false;
  }
}

/**
 * Verify a password reset token
 * Checks if token exists, is not expired, and has not been used
 *
 * @param token Token to verify (plain text from email)
 */
export async function verifyResetToken(token: string): Promise<boolean> {
  try {
    const tokenHash = hashToken(token);

    // Find valid token in database
    const [tokenRecord] = await db
      .select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        gt(passwordResetTokens.expiresAt, new Date()),
        isNull(passwordResetTokens.usedAt)
      ))
      .limit(1);

    if (!tokenRecord) {
      console.info('[PASSWORD_RESET] Token verification failed: not found, expired, or already used');
      return false;
    }

    console.info('[PASSWORD_RESET] Token verified successfully for user:', tokenRecord.userId);
    return true;
  } catch (error) {
    console.error('[PASSWORD_RESET] Error verifying token:', error);
    return false;
  }
}

/**
 * Reset password using token
 * Validates token, updates password, and marks token as used (single-use)
 *
 * @param token Reset token (plain text from email)
 * @param newPassword New password
 */
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  try {
    const tokenHash = hashToken(token);

    // Find valid token in database
    const [tokenRecord] = await db
      .select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        gt(passwordResetTokens.expiresAt, new Date()),
        isNull(passwordResetTokens.usedAt)
      ))
      .limit(1);

    if (!tokenRecord) {
      console.info('[PASSWORD_RESET] Reset failed: token not found, expired, or already used');
      return false;
    }

    // Get user
    const user = await storage.getUser(tokenRecord.userId);
    if (!user) {
      console.info('[PASSWORD_RESET] Reset failed: user not found');
      return false;
    }

    // Hash and update password
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const updatedUser = await storage.updateUserPassword(user.id, hashedPassword);

    if (!updatedUser) {
      console.info('[PASSWORD_RESET] Reset failed: could not update password');
      return false;
    }

    // Mark token as used (single-use enforcement)
    await db.update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, tokenRecord.id));

    console.info('[PASSWORD_RESET] ✅ Password reset successful for user:', user.id);

    return true;
  } catch (error) {
    console.error('[PASSWORD_RESET] ❌ Error resetting password:', error);
    return false;
  }
}

/**
 * Clean up expired tokens (can be called periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const result = await db.delete(passwordResetTokens)
      .where(gt(new Date(), passwordResetTokens.expiresAt));

    // Note: Drizzle doesn't return count directly, but the query runs successfully
    console.info('[PASSWORD_RESET] Expired tokens cleaned up');
    return 0;
  } catch (error) {
    console.error('[PASSWORD_RESET] Error cleaning up expired tokens:', error);
    return 0;
  }
}
