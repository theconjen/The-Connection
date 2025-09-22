import crypto from 'crypto';

// Token expiration time (1 hour)
const TOKEN_EXPIRY = 60 * 60 * 1000;

// In-memory storage for reset tokens (in production this would be in database)
interface ResetTokenData {
  userId: number;
  email: string;
  expires: string;
}

class PasswordResetManager {
  private tokens: Map<string, ResetTokenData>;
  
  constructor() {
    this.tokens = new Map();
  }
  
  /**
   * Generate a secure reset token
   */
  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
  
  /**
   * Store a token for a user
   */
  storeToken(userId: number, email: string, token: string): void {
    const expires = Date.now() + TOKEN_EXPIRY;
    this.tokens.set(token, { userId, email, expires });
    
    // Set a timeout to automatically clean up expired tokens
    setTimeout(() => {
      this.tokens.delete(token);
    }, TOKEN_EXPIRY);
  }
  
  /**
   * Verify a token and return user data if valid
   */
  verifyToken(token: string): ResetTokenData | null {
    const tokenData = this.tokens.get(token);
    
    // Token doesn't exist
    if (!tokenData) {
      return null;
    }
    
    // Token is expired
    if (tokenData.expires < Date.now()) {
      this.tokens.delete(token);
      return null;
    }
    
    return tokenData;
  }
  
  /**
   * Use a token (verify and remove)
   */
  useToken(token: string): ResetTokenData | null {
    const tokenData = this.verifyToken(token);
    
    if (tokenData) {
      this.tokens.delete(token);
    }
    
    return tokenData;
  }
  
  /**
   * Clean up expired tokens
   */
  cleanupExpiredTokens(): void {
    const now = Date.now();
    // Convert to array before iteration to avoid TypeScript issues
    Array.from(this.tokens.entries()).forEach(([token, data]) => {
      if (data.expires < now) {
        this.tokens.delete(token);
      }
    });
  }
}

// Create and export a singleton instance
export const passwordResetManager = new PasswordResetManager();