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
    // Find user by email
    const user = await storage.getUserByEmail(email);
    
    if (!user) {
      // We don't want to reveal if an email exists in the database
      // So we'll still return success but won't actually send an email
      return true;
    }
    
    // Generate a token
    const token = generateResetToken();
  const expires = Date.now() + TOKEN_EXPIRY;
    
    // Store the token
    passwordResetTokens.set(token, {
      userId: user.id,
      email: user.email,
      expires
    });
    
    // Send email with reset link
    await sendPasswordResetEmail(user.email, user.username, token);
    
    return true;
  } catch (error) {
    console.error('Error creating password reset token:', error);
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
    
    // Update password
    // In a real application, we'd use the storage method to update the password
    // This is just a placeholder for now
    console.log(`Would update password for user ${user.id}`);
    // await storage.updateUserPassword(user.id, newPassword);
    
    // Remove used token
    passwordResetTokens.delete(token);
    
    return true;
  } catch (error) {
    console.error('Error resetting password:', error);
    return false;
  }
}