import { Request, Response, NextFunction } from 'express';
import { User } from '@shared/schema';
import { getSessionUserId } from '../utils/session';
import { storage } from '../storage-optimized';
import jwt from 'jsonwebtoken';

// Custom interface to avoid Express type conflicts
interface AuthenticatedRequest extends Request {
  currentUser?: User;
}

/**
 * Extract user ID from JWT token or session
 */
function getUserIdFromAuth(req: AuthenticatedRequest): number | undefined {
  // First, try session-based auth
  const sessionUserId = getSessionUserId(req);
  if (sessionUserId) {
    return sessionUserId;
  }

  // Then, try JWT token from Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error('JWT_SECRET not configured');
      return undefined;
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as { sub?: number; id?: number };
      return decoded.sub || decoded.id;
    } catch (error) {
      // Invalid token, return undefined
      console.error('JWT verification failed:', error);
      return undefined;
    }
  }

  return undefined;
}

/**
 * Middleware to ensure user is authenticated
 * Supports both session cookies and JWT Bearer tokens
 * Adds user data to req.currentUser for compatibility with recommendation routes
 * Also checks if user is suspended
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const userId = getUserIdFromAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Check if user is suspended
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if ((user as any).isSuspended) {
      return res.status(403).json({
        error: 'Account suspended',
        message: 'Your account has been suspended. Please contact support for more information.',
        reason: (user as any).suspensionReason || 'Account suspended for violating community guidelines'
      });
    }

    // Add user data to req.currentUser for compatibility
    req.currentUser = user as User;
  } catch (error) {
    console.error('Error checking user suspension status:', error);
    // Continue with simplified user object on error
    req.currentUser = {
      id: userId,
      username: req.session?.username || '',
      email: req.session?.email || '',
      password: '', // Not stored in session for security
      displayName: req.session?.username || '',
      bio: null,
      avatarUrl: null,
      city: null,
      state: null,
      zipCode: null,
      latitude: null,
      longitude: null,
      onboardingCompleted: false,
      isVerifiedApologeticsAnswerer: false,
      isAdmin: req.session?.isAdmin || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;
  }

  next();
}

/**
 * Alias for compatibility with existing code
 */
export const isAuthenticated = requireAuth;
