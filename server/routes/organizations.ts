import express from "express";
import { db } from "../db";
import { organizations, organizationUsers, users } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod/v4";
import { insertOrganizationSchema, insertOrganizationUserSchema } from "@shared/schema";
import { buildErrorResponse } from "../utils/errors";
import { getSessionUserId } from "../utils/session";

const router = express.Router();

// Middleware to check authentication (use session userId)
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!getSessionUserId(req)) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

const requireUserId = (req: express.Request, res: express.Response): number | undefined => {
  const userId = getSessionUserId(req);
  if (!userId) {
    res.status(401).json({ message: "Authentication required" });
    return undefined;
  }
  return userId;
};

// Create a new organization (church)
router.post("/", requireAuth, async (req, res) => {
  try {
    const currentUserId = requireUserId(req, res);
    if (!currentUserId) {
      return;
    }
    const data = insertOrganizationSchema.parse({
      ...req.body,
      adminUserId: currentUserId
    });

    const [organization] = await db.insert(organizations)
      .values(data)
      .returning();

    // Add the creator as admin member
    await db.insert(organizationUsers)
      .values({
        organizationId: organization.id,
        userId: currentUserId,
        role: "admin"
      });

    res.json(organization);
  } catch (error) {
    console.error("Error creating organization:", error);
    res.status(400).json({ message: "Failed to create organization" });
  }
});

// Get organization by ID
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    const currentUserId = requireUserId(req, res);
    if (!currentUserId) {
      return;
    }

    // Check if user is a member of the organization
    const membership = await db
      .select()
      .from(organizationUsers)
      .where(and(
        eq(organizationUsers.organizationId, organizationId),
        eq(organizationUsers.userId, currentUserId)
      ))
      .limit(1);

    if (membership.length === 0) {
      return res.status(403).json({ message: "Access denied" });
    }

    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    res.json(organization);
  } catch (error) {
    console.error("Error fetching organization:", error);
    res.status(500).json(buildErrorResponse("Failed to fetch organization", error));
  }
});

// Get organizations for current user
router.get("/", requireAuth, async (req, res) => {
  try {
    const currentUserId = requireUserId(req, res);
    if (!currentUserId) {
      return;
    }

    const userOrganizations = await db
      .select({
        organization: organizations,
        role: organizationUsers.role,
        joinedAt: organizationUsers.joinedAt
      })
      .from(organizationUsers)
      .innerJoin(organizations, eq(organizations.id, organizationUsers.organizationId))
  .where(eq(organizationUsers.userId, currentUserId));

    res.json(userOrganizations);
  } catch (error) {
    console.error("Error fetching user organizations:", error);
    res.status(500).json(buildErrorResponse("Failed to fetch organizations", error));
  }
});

// Invite user to organization
router.post("/:id/invite", requireAuth, async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    const { userId, role = "member" } = req.body;
    const currentUserId = requireUserId(req, res);
    if (!currentUserId) {
      return;
    }

    // Check if current user is admin of the organization
    const adminCheck = await db
      .select()
      .from(organizationUsers)
      .where(and(
        eq(organizationUsers.organizationId, organizationId),
        eq(organizationUsers.userId, currentUserId),
        eq(organizationUsers.role, "admin")
      ))
      .limit(1);

    if (adminCheck.length === 0) {
      return res.status(403).json({ message: "Admin privileges required" });
    }

    // Check if user is already a member
    const existingMember = await db
      .select()
      .from(organizationUsers)
      .where(and(
        eq(organizationUsers.organizationId, organizationId),
        eq(organizationUsers.userId, userId)
      ))
      .limit(1);

    if (existingMember.length > 0) {
      return res.status(400).json({ message: "User is already a member" });
    }

    const [membership] = await db.insert(organizationUsers)
      .values({
        organizationId,
        userId,
        role
      })
      .returning();

    res.json(membership);
  } catch (error) {
    console.error("Error inviting user:", error);
    res.status(500).json(buildErrorResponse("Failed to invite user", error));
  }
});

// Get organization members
router.get("/:id/members", requireAuth, async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    const currentUserId = requireUserId(req, res);
    if (!currentUserId) {
      return;
    }

    // Check if user is a member of the organization
    const membership = await db
      .select()
      .from(organizationUsers)
      .where(and(
        eq(organizationUsers.organizationId, organizationId),
        eq(organizationUsers.userId, currentUserId)
      ))
      .limit(1);

    if (membership.length === 0) {
      return res.status(403).json({ message: "Access denied" });
    }

    const members = await db
      .select({
        membership: organizationUsers,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          email: users.email,
          avatarUrl: users.avatarUrl
        }
      })
      .from(organizationUsers)
      .innerJoin(users, eq(users.id, organizationUsers.userId))
      .where(eq(organizationUsers.organizationId, organizationId));

    res.json(members);
  } catch (error) {
    console.error("Error fetching members:", error);
    res.status(500).json(buildErrorResponse("Failed to fetch members", error));
  }
});

// Update organization details
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    const currentUserId = requireUserId(req, res);
    if (!currentUserId) {
      return;
    }

    // Check if current user is admin of the organization
    const adminCheck = await db
      .select()
      .from(organizationUsers)
      .where(and(
        eq(organizationUsers.organizationId, organizationId),
        eq(organizationUsers.userId, currentUserId),
        eq(organizationUsers.role, "admin")
      ))
      .limit(1);

    if (adminCheck.length === 0) {
      return res.status(403).json({ message: "Admin privileges required" });
    }

    // Filter out undefined values and prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };

    const allowedFields = [
      'name', 'description', 'website', 'email', 'phone',
      'address', 'city', 'state', 'zipCode', 'denomination',
      'mission', 'congregationSize', 'foundedDate'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const [updatedOrg] = await db
      .update(organizations)
      .set(updateData)
      .where(eq(organizations.id, organizationId))
      .returning();

    res.json(updatedOrg);
  } catch (error) {
    console.error("Error updating organization:", error);
    res.status(500).json(buildErrorResponse("Failed to update organization", error));
  }
});

// Update organization plan
router.patch("/:id/plan", requireAuth, async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    const { plan } = req.body;
    const currentUserId = requireUserId(req, res);
    if (!currentUserId) {
      return;
    }

    // Check if current user is admin of the organization
    const adminCheck = await db
      .select()
      .from(organizationUsers)
      .where(and(
        eq(organizationUsers.organizationId, organizationId),
        eq(organizationUsers.userId, currentUserId),
        eq(organizationUsers.role, "admin")
      ))
      .limit(1);

    if (adminCheck.length === 0) {
      return res.status(403).json({ message: "Admin privileges required" });
    }

    const [updatedOrg] = await db
      .update(organizations)
      .set({
        plan,
        updatedAt: new Date()
      })
      .where(eq(organizations.id, organizationId))
      .returning();

    res.json(updatedOrg);
  } catch (error) {
    console.error("Error updating organization plan:", error);
    res.status(500).json(buildErrorResponse("Failed to update plan", error));
  }
});

// Update member role
router.patch("/:id/members/:userId", requireAuth, async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    const memberUserId = parseInt(req.params.userId);
    const { role } = req.body;
    const currentUserId = requireUserId(req, res);
    if (!currentUserId) {
      return;
    }

    // Validate role
    const validRoles = ['admin', 'pastor', 'leader', 'member'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Check if current user is admin of the organization
    const adminCheck = await db
      .select()
      .from(organizationUsers)
      .where(and(
        eq(organizationUsers.organizationId, organizationId),
        eq(organizationUsers.userId, currentUserId),
        eq(organizationUsers.role, "admin")
      ))
      .limit(1);

    if (adminCheck.length === 0) {
      return res.status(403).json({ message: "Admin privileges required" });
    }

    // Don't allow changing your own role
    if (memberUserId === currentUserId) {
      return res.status(400).json({ message: "Cannot change your own role" });
    }

    const [updatedMembership] = await db
      .update(organizationUsers)
      .set({ role })
      .where(and(
        eq(organizationUsers.organizationId, organizationId),
        eq(organizationUsers.userId, memberUserId)
      ))
      .returning();

    if (!updatedMembership) {
      return res.status(404).json({ message: "Member not found" });
    }

    res.json(updatedMembership);
  } catch (error) {
    console.error("Error updating member role:", error);
    res.status(500).json(buildErrorResponse("Failed to update member role", error));
  }
});

// Remove member from organization
router.delete("/:id/members/:userId", requireAuth, async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    const memberUserId = parseInt(req.params.userId);
    const currentUserId = requireUserId(req, res);
    if (!currentUserId) {
      return;
    }

    // Check if current user is admin of the organization
    const adminCheck = await db
      .select()
      .from(organizationUsers)
      .where(and(
        eq(organizationUsers.organizationId, organizationId),
        eq(organizationUsers.userId, currentUserId),
        eq(organizationUsers.role, "admin")
      ))
      .limit(1);

    if (adminCheck.length === 0) {
      return res.status(403).json({ message: "Admin privileges required" });
    }

    // Don't allow removing the organization admin
    const targetMember = await db
      .select()
      .from(organizationUsers)
      .where(and(
        eq(organizationUsers.organizationId, organizationId),
        eq(organizationUsers.userId, memberUserId)
      ))
      .limit(1);

    if (targetMember.length > 0 && targetMember[0].role === "admin") {
      return res.status(400).json({ message: "Cannot remove organization admin" });
    }

    await db
      .delete(organizationUsers)
      .where(and(
        eq(organizationUsers.organizationId, organizationId),
        eq(organizationUsers.userId, memberUserId)
      ));

    res.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    res.status(500).json(buildErrorResponse("Failed to remove member", error));
  }
});

export default router;
