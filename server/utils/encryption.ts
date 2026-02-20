/**
 * Message Encryption at Rest (AES-256-GCM)
 *
 * Encrypts chat and DM messages before storing in the database.
 * Backward-compatible: plaintext messages (without the `enc:` prefix) are
 * returned as-is by decryptMessage(), so old data remains readable.
 *
 * To enable, set the MESSAGE_ENCRYPTION_KEY environment variable to a
 * 64-character hex string (32 bytes):
 *   node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))"
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag
const PREFIX = 'enc:';

let encryptionKey: Buffer | null = null;

function getKey(): Buffer | null {
  if (encryptionKey) return encryptionKey;

  const keyHex = process.env.MESSAGE_ENCRYPTION_KEY;
  if (!keyHex) return null;

  if (keyHex.length !== 64 || !/^[0-9a-fA-F]+$/.test(keyHex)) {
    console.error('[ENCRYPTION] MESSAGE_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)');
    return null;
  }

  encryptionKey = Buffer.from(keyHex, 'hex');
  return encryptionKey;
}

/**
 * Check whether encryption is enabled (key is configured).
 */
export function isEncryptionEnabled(): boolean {
  return getKey() !== null;
}

/**
 * Encrypt a plaintext message.
 * Returns `enc:<iv>:<authTag>:<ciphertext>` (all hex-encoded).
 * If the encryption key is not set, returns plaintext unchanged (opt-in).
 */
export function encryptMessage(plaintext: string): string {
  const key = getKey();
  if (!key) return plaintext;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt a message.
 * If the value does not start with `enc:`, it is treated as legacy plaintext.
 * If decryption fails (wrong key, corrupted data), returns '[encrypted message]'.
 */
export function decryptMessage(ciphertext: string): string {
  if (!ciphertext || !ciphertext.startsWith(PREFIX)) {
    return ciphertext; // Legacy plaintext — return as-is
  }

  const key = getKey();
  if (!key) {
    // Key not configured but message is encrypted — cannot decrypt
    return '[encrypted message]';
  }

  try {
    const parts = ciphertext.slice(PREFIX.length).split(':');
    if (parts.length !== 3) return '[encrypted message]';

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return '[encrypted message]';
  }
}
