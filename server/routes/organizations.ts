import express from "express";
import { db } from "../db";
import { organizations, organizationUsers, users } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { insertOrganizationSchema, insertOrganizationUserSchema } from "@shared/schema";

const router = express.Router();

// Middleware to check authentication
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

// Create a new organization (church)
router.post("/", requireAuth, async (req, res) => {
  try {
    const data = insertOrganizationSchema.parse({
      ...req.body,
      adminUserId: req.user!.id
    });

    const [organization] = await db.insert(organizations)
      .values(data)
      .returning();

    // Add the creator as admin member
    await db.insert(organizationUsers)
      .values({
        organizationId: organization.id,
        userId: req.user!.id,
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
    
    // Check if user is a member of the organization
    const membership = await db
      .select()
      .from(organizationUsers)
      .where(and(
        eq(organizationUsers.organizationId, organizationId),
        eq(organizationUsers.userId, req.user!.id)
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
    res.status(500).json({ message: "Failed to fetch organization" });
  }
});

// Get organizations for current user
router.get("/", requireAuth, async (req, res) => {
  try {
    const userOrganizations = await db
      .select({
        organization: organizations,
        role: organizationUsers.role,
        joinedAt: organizationUsers.joinedAt
      })
      .from(organizationUsers)
      .innerJoin(organizations, eq(organizations.id, organizationUsers.organizationId))
      .where(eq(organizationUsers.userId, req.user!.id));

    res.json(userOrganizations);
  } catch (error) {
    console.error("Error fetching user organizations:", error);
    res.status(500).json({ message: "Failed to fetch organizations" });
  }
});

// Invite user to organization
router.post("/:id/invite", requireAuth, async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    const { userId, role = "member" } = req.body;

    // Check if current user is admin of the organization
    const adminCheck = await db
      .select()
      .from(organizationUsers)
      .where(and(
        eq(organizationUsers.organizationId, organizationId),
        eq(organizationUsers.userId, req.user!.id),
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
    res.status(500).json({ message: "Failed to invite user" });
  }
});

// Get organization members
router.get("/:id/members", requireAuth, async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    
    // Check if user is a member of the organization
    const membership = await db
      .select()
      .from(organizationUsers)
      .where(and(
        eq(organizationUsers.organizationId, organizationId),
        eq(organizationUsers.userId, req.user!.id)
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
    res.status(500).json({ message: "Failed to fetch members" });
  }
});

// Update organization plan (for Stripe integration)
router.patch("/:id/plan", requireAuth, async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    const { plan, stripeCustomerId, stripeSubscriptionId } = req.body;

    // Check if current user is admin of the organization
    const adminCheck = await db
      .select()
      .from(organizationUsers)
      .where(and(
        eq(organizationUsers.organizationId, organizationId),
        eq(organizationUsers.userId, req.user!.id),
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
        stripeCustomerId,
        stripeSubscriptionId,
        updatedAt: new Date()
      })
      .where(eq(organizations.id, organizationId))
      .returning();

    res.json(updatedOrg);
  } catch (error) {
    console.error("Error updating organization plan:", error);
    res.status(500).json({ message: "Failed to update plan" });
  }
});

// Remove member from organization
router.delete("/:id/members/:userId", requireAuth, async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    const memberUserId = parseInt(req.params.userId);

    // Check if current user is admin of the organization
    const adminCheck = await db
      .select()
      .from(organizationUsers)
      .where(and(
        eq(organizationUsers.organizationId, organizationId),
        eq(organizationUsers.userId, req.user!.id),
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
    res.status(500).json({ message: "Failed to remove member" });
  }
});

export default router;