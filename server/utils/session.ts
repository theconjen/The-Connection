import createHttpError from 'http-errors';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

function normalizeSessionValue(raw: string | number | undefined): number | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const parsed = parseInt(String(raw), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function getSessionUserId(req: Request): number | undefined {
  // First, try session-based auth
  const normalized = normalizeSessionValue(req.session?.userId as any);
  if (normalized && normalized > 0) {
    return normalized;
  }

  // Then, try JWT token from Authorization header (for mobile apps)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return undefined;
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as { sub?: number; id?: number };
      const userId = decoded.sub || decoded.id;
      if (userId && userId > 0) {
        return userId;
      }
    } catch (error) {
      // Invalid token, continue
    }
  }

  return undefined;
}

export function requireSessionUserId(req: Request): number {
  const userId = getSessionUserId(req);
  if (!userId) {
    throw createHttpError(401, 'Not authenticated');
  }
  return userId;
}

export function setSessionUserId(req: Request, value: number | string): number {
  if (!req.session) {
    throw createHttpError(500, 'Session is not initialized');
  }

  const normalized = normalizeSessionValue(value as any);
  if (!normalized || normalized <= 0) {
    throw createHttpError(500, 'Invalid user id for session');
  }

  req.session.userId = normalized;
  return normalized;
}

export function normalizeSessionUserId(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.session) {
    return next();
  }

  const normalized = getSessionUserId(req);

  if (normalized) {
    req.session.userId = normalized;
  } else if ('userId' in req.session) {
    delete req.session.userId;
  }

  next();
}

function ensureSession(req: Request) {
  if (!req.session) {
    throw createHttpError(500, 'Session is not initialized');
  }
  return req.session;
}

export async function regenerateSession(req: Request): Promise<void> {
  const session = ensureSession(req);
  return new Promise((resolve, reject) => {
    session.regenerate((err) => {
      if (err) {
        return reject(createHttpError(500, 'Failed to regenerate session', { cause: err }));
      }
      resolve();
    });
  });
}

export async function saveSession(req: Request): Promise<void> {
  const session = ensureSession(req);
  return new Promise((resolve, reject) => {
    session.save((err) => {
      if (err) {
        return reject(createHttpError(500, 'Failed to persist session', { cause: err }));
      }
      resolve();
    });
  });
}
