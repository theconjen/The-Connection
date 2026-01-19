import crypto from 'crypto';
import { storage } from './storage-optimized';
import { sendPasswordResetEmail } from './email';
import { APP_DOMAIN, BASE_URL, APP_URLS } from './config/domain';

// Token expiration time (1 hour)
const TOKEN_EXPIRY = 60 * 60 * 1000;

// In-memory storage for reset tokens (in production this would be in database)
const passwordResetTokens = new Map<string, {
  userId: number;
  email: string;
  expires: number;
}>();

/**
 * Generate a secure reset token
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a password reset token for a user
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

    // Generate a token
    const token = generateResetToken();
    const expires = Date.now() + TOKEN_EXPIRY;

    // Store the token
    passwordResetTokens.set(token, {
      userId: user.id,
      email: user.email,
      expires
    });

    console.info('[PASSWORD_RESET] Token generated, attempting to send email...');

    // Send email with reset link
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
 * 
 * @param token Token to verify
 */
export function verifyResetToken(token: string): boolean {
  const tokenData = passwordResetTokens.get(token);
  
  // Token doesn't exist
  if (!tokenData) {
    return false;
  }
  
  // Token is expired
  if (tokenData.expires < Date.now()) {
    // Remove expired token
    passwordResetTokens.delete(token);
    return false;
  }
  
  return true;
}

/**
 * Reset password using token
 * 
 * @param token Reset token
 * @param newPassword New password
 */
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  try {
    const tokenData = passwordResetTokens.get(token);
    
    // Invalid token
    if (!tokenData || tokenData.expires < Date.now()) {
      return false;
    }
    
    // Get user
    const user = await storage.getUser(tokenData.userId);
    if (!user) {
      return false;
    }
    
    // Hash and update password
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const updatedUser = await storage.updateUserPassword(user.id, hashedPassword);

    if (!updatedUser) {
      return false;
    }

    // Remove used token
    passwordResetTokens.delete(token);
    
    return true;
  } catch (error) {
    console.error('Error resetting password:', error);
    return false;
  }
}