import { describe, expect, it } from 'vitest';

import { ensureSafeBinaryUpload, ModerationError } from '../../server/utils/moderation';

const pngHeader = Buffer.from('89504e4701020304', 'hex');

describe('ensureSafeBinaryUpload', () => {
  it('allows matching declared and inferred mime types', () => {
    expect(() => ensureSafeBinaryUpload(pngHeader, 'image/png', 'test upload')).not.toThrow();
  });

  it('rejects when declared mime does not match signature', () => {
    expect(() => ensureSafeBinaryUpload(pngHeader, 'image/jpeg', 'test upload')).toThrow(
      ModerationError
    );
  });

  it('rejects when no known signature is present', () => {
    const unknownBuffer = Buffer.from('000000000000', 'hex');

    expect(() => ensureSafeBinaryUpload(unknownBuffer, 'image/png', 'test upload')).toThrow(
      ModerationError
    );
  });
});
