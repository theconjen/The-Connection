import crypto from "crypto";
import { storage } from "./storage-optimized.js";
import { sendPasswordResetEmail } from "./email.js";
const TOKEN_EXPIRY = 60 * 60 * 1e3;
const passwordResetTokens = /* @__PURE__ */ new Map();
function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}
async function createPasswordResetToken(email) {
  try {
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return true;
    }
    const token = generateResetToken();
    const expires = Date.now() + TOKEN_EXPIRY;
    passwordResetTokens.set(token, {
      userId: user.id,
      email: user.email,
      expires
    });
    await sendPasswordResetEmail(user.email, user.username, token);
    return true;
  } catch (error) {
    console.error("Error creating password reset token:", error);
    return false;
  }
}
function verifyResetToken(token) {
  const tokenData = passwordResetTokens.get(token);
  if (!tokenData) {
    return false;
  }
  if (tokenData.expires < Date.now()) {
    passwordResetTokens.delete(token);
    return false;
  }
  return true;
}
async function resetPassword(token, newPassword) {
  try {
    const tokenData = passwordResetTokens.get(token);
    if (!tokenData || tokenData.expires < Date.now()) {
      return false;
    }
    const user = await storage.getUser(tokenData.userId);
    if (!user) {
      return false;
    }
    console.log(`Would update password for user ${user.id}`);
    passwordResetTokens.delete(token);
    return true;
  } catch (error) {
    console.error("Error resetting password:", error);
    return false;
  }
}
export {
  createPasswordResetToken,
  generateResetToken,
  resetPassword,
  verifyResetToken
};
