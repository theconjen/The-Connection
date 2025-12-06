import argon2 from 'argon2';
import bcrypt from 'bcryptjs';

const BCRYPT_PREFIXES = ['$2a$', '$2b$', '$2y$'];

export type PasswordAlgorithm = 'argon2' | 'bcrypt';

export interface PasswordVerificationResult {
  valid: boolean;
  algorithm?: PasswordAlgorithm;
  upgradedHash?: string;
}

export function isBcryptHash(hash: string | null | undefined): boolean {
  if (!hash) return false;
  return BCRYPT_PREFIXES.some(prefix => hash.startsWith(prefix));
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456, // 19 MiB
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyPassword(
  password: string,
  storedHash: string | null | undefined,
): Promise<PasswordVerificationResult> {
  if (!storedHash) {
    return { valid: false };
  }

  try {
    if (isBcryptHash(storedHash)) {
      const valid = await bcrypt.compare(password, storedHash);
      if (!valid) {
        return { valid: false, algorithm: 'bcrypt' };
      }

      const upgradedHash = await hashPassword(password);
      return { valid: true, algorithm: 'bcrypt', upgradedHash };
    }

    const valid = await argon2.verify(storedHash, password);
    return { valid, algorithm: 'argon2' };
  } catch (error) {
    console.error('Password verification error', error);
    return { valid: false };
  }
}
