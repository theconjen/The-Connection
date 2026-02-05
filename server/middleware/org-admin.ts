/**
 * Organization Admin Middleware
 *
 * Provides middleware for org-admin routes that returns 404 for unauthorized access.
 * This follows the security pattern of not revealing whether an org exists.
 *
 * NEVER returns 403, NEVER uses "upgrade" language
 */

import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

/**
 * Middleware that requires org admin access or returns 404
 *
 * Returns 404 for:
 * - Unauthenticated users
 * - Non-members
 * - Non-admin/owner roles
 *
 * @param orgIdParam - The request parameter name containing the org ID (default: 'orgId')
 */
export function requireOrgAdminOr404(orgIdParam: string = 'orgId') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(404).json({ message: 'Not found' });
      }

      const orgIdStr = req.params[orgIdParam];
      const orgId = parseInt(orgIdStr, 10);

      if (isNaN(orgId)) {
        return res.status(404).json({ message: 'Not found' });
      }

      // Check if org exists
      const org = await storage.getOrganization(orgId);
      if (!org) {
        return res.status(404).json({ message: 'Not found' });
      }

      // Check user's role in org
      const role = await storage.getUserRoleInOrg(orgId, userId);

      // Only owner and admin can access org-admin routes
      if (!role || !['owner', 'admin'].includes(role)) {
        return res.status(404).json({ message: 'Not found' });
      }

      // Attach org to request for downstream handlers
      (req as any).org = org;
      (req as any).orgRole = role;

      next();
    } catch (error) {
      console.error('Error in requireOrgAdminOr404:', error);
      return res.status(404).json({ message: 'Not found' });
    }
  };
}

/**
 * Middleware that requires org moderator or higher access, or returns 404
 *
 * Moderator roles: owner, admin, moderator
 */
export function requireOrgModeratorOr404(orgIdParam: string = 'orgId') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(404).json({ message: 'Not found' });
      }

      const orgIdStr = req.params[orgIdParam];
      const orgId = parseInt(orgIdStr, 10);

      if (isNaN(orgId)) {
        return res.status(404).json({ message: 'Not found' });
      }

      // Check if org exists
      const org = await storage.getOrganization(orgId);
      if (!org) {
        return res.status(404).json({ message: 'Not found' });
      }

      // Check user's role in org
      const role = await storage.getUserRoleInOrg(orgId, userId);

      // Owner, admin, and moderator can access
      if (!role || !['owner', 'admin', 'moderator'].includes(role)) {
        return res.status(404).json({ message: 'Not found' });
      }

      // Attach org to request for downstream handlers
      (req as any).org = org;
      (req as any).orgRole = role;

      next();
    } catch (error) {
      console.error('Error in requireOrgModeratorOr404:', error);
      return res.status(404).json({ message: 'Not found' });
    }
  };
}
