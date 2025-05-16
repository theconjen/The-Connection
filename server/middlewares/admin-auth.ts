import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

// Middleware to check if the user is an admin
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Make sure the user is authenticated first
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if the user is an admin
    const userId = req.user.id;
    const isAdmin = await storage.checkUserIsAdmin(userId);
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to access this resource' });
    }
    
    // User is an admin, proceed to the next middleware/route handler
    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};