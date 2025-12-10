import type { Response } from 'express';

const bannedKeywords = [
  'porn',
  'porno',
  'xxx',
  'sex',
  'nude',
  'naked',
  'anus',
  'cock',
  'dick',
  'pussy',
  'fuck',
  'shit',
  'cum',
];

const allowedUploadMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

export class ModerationError extends Error {
  constructor(message: string, public matches: string[] = []) {
    super(message);
    this.name = 'ModerationError';
  }
}

function findKeywordMatches(text?: string | null) {
  if (!text) return [] as string[];
  const normalized = text.toLowerCase();
  return bannedKeywords.filter((word) => normalized.includes(word));
}

export function ensureCleanText(value: string | undefined | null, context: string) {
  const matches = findKeywordMatches(value);
  if (matches.length > 0) {
    throw new ModerationError(
      `Content rejected by moderation (${context}).`,
      matches
    );
  }
}

function sniffImageMime(buffer: Buffer): string | undefined {
  if (!buffer || buffer.length < 4) return undefined;
  const hex = buffer.slice(0, 4).toString('hex');
  switch (hex) {
    case '89504e47':
      return 'image/png';
    case 'ffd8ffe0':
    case 'ffd8ffe1':
    case 'ffd8ffe2':
    case 'ffd8ffe3':
    case 'ffd8ffe8':
      return 'image/jpeg';
    case '47494638':
      return 'image/gif';
    case '52494646':
      return 'image/webp';
    default:
      return undefined;
  }
}

export function ensureSafeBinaryUpload(
  buffer: Buffer,
  declaredMime?: string,
  context = 'file upload'
) {
  if (!buffer || buffer.length === 0) {
    throw new ModerationError(`Empty payload rejected (${context}).`);
  }

  if (buffer.length > 5 * 1024 * 1024) {
    throw new ModerationError(`Files larger than 5MB are not allowed (${context}).`);
  }

  const normalizedDeclared = declaredMime?.split(';')[0].trim().toLowerCase();
  const inferred = sniffImageMime(buffer);

  if (normalizedDeclared && inferred && normalizedDeclared !== inferred) {
    throw new ModerationError(
      `Declared content type does not match file signature (${context}).`,
      [normalizedDeclared, inferred]
    );
  }

  if (!inferred) {
    throw new ModerationError(
      `Unsupported or potentially unsafe file type (${context}).`,
      [normalizedDeclared || 'unknown']
    );
  }

  if (!allowedUploadMimeTypes.has(inferred)) {
    throw new ModerationError(
      `Unsupported or potentially unsafe file type (${context}).`,
      [inferred]
    );
  }
}

export function ensureAllowedMimeType(contentType?: string, context = 'file upload request') {
  if (!contentType) return;
  const normalized = contentType.split(';')[0].trim().toLowerCase();
  if (!allowedUploadMimeTypes.has(normalized)) {
    throw new ModerationError(
      `Unsupported file type (${context}). Only ${Array.from(allowedUploadMimeTypes).join(', ')} are allowed.`,
      [normalized]
    );
  }
}

export function handleModerationError(res: Response, error: unknown) {
  if (error instanceof ModerationError) {
    res.status(422).json({
      message: error.message,
      rejectedTerms: error.matches,
    });
    return true;
  }
  return false;
}
