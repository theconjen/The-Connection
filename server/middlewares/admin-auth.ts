import { Request, Response, NextFunction } from 'express';
import { User } from '@shared/schema';

// Custom interface to avoid Express type conflicts
interface AuthenticatedRequest extends Request {
  currentUser?: User;
}

/**
 * Middleware to ensure user is an admin
 * Uses session data for admin verification
 */
export function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  // Check if user is authenticated via session
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Unauthorized - Please login" });
  }
  
  // Check if user is an admin
  if (!req.session.isAdmin) {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }
  
  // User is authenticated and an admin, proceed
  next();
}