import { Request, Response, NextFunction } from 'express';
import { User } from '@shared/schema';

// Custom interface to avoid Express type conflicts
interface AuthenticatedRequest extends Request {
  currentUser?: User;
}

/**
 * Middleware to ensure user is authenticated
 * Adds user data to req.currentUser for compatibility with recommendation routes
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Check if user is authenticated via session
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Add user data to req.currentUser for compatibility
  // Note: This is a simplified user object - for full user data, query the database
  req.currentUser = {
    id: Number(req.session.userId),
    username: req.session.username || '',
    email: req.session.email || '',
    password: '', // Not stored in session for security
    displayName: req.session.username || '',
    bio: null,
    avatarUrl: null,
    city: null,
    state: null,
    zipCode: null,
    latitude: null,
    longitude: null,
    onboardingCompleted: false,
    isVerifiedApologeticsAnswerer: false,
    isAdmin: req.session.isAdmin || false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;
  
  next();
}

/**
 * Alias for compatibility with existing code
 */
export const isAuthenticated = requireAuth;