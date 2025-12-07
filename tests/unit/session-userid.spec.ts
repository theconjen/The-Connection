import { describe, expect, it, vi } from 'vitest';
import type { Request } from 'express';
import {
  getSessionUserId,
  normalizeSessionUserId,
  setSessionUserId,
} from '../../server/utils/session';

type MockRequest = Partial<Request> & { session: Record<string, unknown> };

function createRequest(session: Record<string, unknown> = {}): MockRequest {
  return {
    session: { ...session },
  };
}

describe('session user id helpers', () => {
  it('stores userId as a number even when provided as a string', () => {
    const req = createRequest();

    const stored = setSessionUserId(req as Request, '42');

    expect(stored).toBe(42);
    expect(typeof req.session.userId).toBe('number');
    expect(req.session.userId).toBe(42);
  });

  it('normalizes existing session userId values for downstream handlers', () => {
    const req = createRequest({ userId: '17' });
    const next = vi.fn(() => {
      const downstreamUserId = getSessionUserId(req as Request);
      expect(downstreamUserId).toBe(17);
    });

    normalizeSessionUserId(req as Request, {} as any, next);

    expect(req.session.userId).toBe(17);
    expect(typeof req.session.userId).toBe('number');
    expect(next).toHaveBeenCalledOnce();
  });

  it('clears invalid session userId values', () => {
    const req = createRequest({ userId: 'abc' });
    const next = vi.fn();

    normalizeSessionUserId(req as Request, {} as any, next);

    expect(req.session.userId).toBeUndefined();
    expect(getSessionUserId(req as Request)).toBeUndefined();
    expect(next).toHaveBeenCalledOnce();
  });
});
