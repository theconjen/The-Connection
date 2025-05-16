import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to ensure user is an admin
 */
export function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized - Please login" });
  }
  
  // Check if user is an admin
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }
  
  // User is authenticated and an admin, proceed
  next();
}