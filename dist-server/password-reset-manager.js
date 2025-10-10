import crypto from "crypto";
const TOKEN_EXPIRY = 60 * 60 * 1e3;
class PasswordResetManager {
  tokens;
  constructor() {
    this.tokens = /* @__PURE__ */ new Map();
  }
  /**
   * Generate a secure reset token
   */
  generateToken() {
    return crypto.randomBytes(32).toString("hex");
  }
  /**
   * Store a token for a user
   */
  storeToken(userId, email, token) {
    const expires = Date.now() + TOKEN_EXPIRY;
    this.tokens.set(token, { userId, email, expires });
    setTimeout(() => {
      this.tokens.delete(token);
    }, TOKEN_EXPIRY);
  }
  /**
   * Verify a token and return user data if valid
   */
  verifyToken(token) {
    const tokenData = this.tokens.get(token);
    if (!tokenData) {
      return null;
    }
    if (tokenData.expires < Date.now()) {
      this.tokens.delete(token);
      return null;
    }
    return tokenData;
  }
  /**
   * Use a token (verify and remove)
   */
  useToken(token) {
    const tokenData = this.verifyToken(token);
    if (tokenData) {
      this.tokens.delete(token);
    }
    return tokenData;
  }
  /**
   * Clean up expired tokens
   */
  cleanupExpiredTokens() {
    const now = Date.now();
    Array.from(this.tokens.entries()).forEach(([token, data]) => {
      if (data.expires < now) {
        this.tokens.delete(token);
      }
    });
  }
}
const passwordResetManager = new PasswordResetManager();
export {
  passwordResetManager
};
