import express from "express";
import { db } from "../db";
import {
  clergyVerificationRequests,
  organizations,
  organizationUsers,
  users
} from "@shared/schema";
import { eq, and, or, inArray } from "drizzle-orm";
import { z } from "zod";
import { buildErrorResponse } from "../utils/errors";
import { requireSessionUserId } from "../utils/session";
import { requireAuth } from "../middleware/auth";

const router = express.Router();

router.use(requireAuth);

// Request clergy verification from an organization
router.post("/request", async (req, res) => {
  try {
    const currentUserId = requireSessionUserId(req);
    const { organizationId } = z.object({
      organizationId: z.number()
    }).parse(req.body);

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
      return res.status(403).json({
        message: "You must be a member of this organization to request clergy verification"
      });
    }

    // Check if user already has a pending request for this organization
    const existingRequest = await db
      .select()
      .from(clergyVerificationRequests)
      .where(and(
        eq(clergyVerificationRequests.userId, currentUserId),
        eq(clergyVerificationRequests.organizationId, organizationId),
        eq(clergyVerificationRequests.status, "pending")
      ))
      .limit(1);

    if (existingRequest.length > 0) {
      return res.status(400).json({
        message: "You already have a pending verification request for this organization"
      });
    }

    // Check if user is already verified
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, currentUserId))
      .limit(1);

    if (user && (user as any).isVerifiedClergy) {
      return res.status(400).json({
        message: "You are already a verified clergy member"
      });
    }

    // Create the verification request
    const [request] = await db.insert(clergyVerificationRequests)
      .values({
        userId: currentUserId,
        organizationId,
        status: "pending"
      })
      .returning();

    res.status(201).json(request);
  } catch (error) {
    console.error("Error creating clergy verification request:", error);
    res.status(500).json(buildErrorResponse("Failed to create verification request", error));
  }
});

// Get current user's verification requests
router.get("/my-requests", async (req, res) => {
  try {
    const currentUserId = requireSessionUserId(req);

    const requests = await db
      .select({
        id: clergyVerificationRequests.id,
        organizationId: clergyVerificationRequests.organizationId,
        organizationName: organizations.name,
        status: clergyVerificationRequests.status,
        requestedAt: clergyVerificationRequests.requestedAt,
        reviewedAt: clergyVerificationRequests.reviewedAt,
        notes: clergyVerificationRequests.notes
      })
      .from(clergyVerificationRequests)
      .innerJoin(organizations, eq(organizations.id, clergyVerificationRequests.organizationId))
      .where(eq(clergyVerificationRequests.userId, currentUserId))
      .orderBy(clergyVerificationRequests.requestedAt);

    res.json(requests);
  } catch (error) {
    console.error("Error fetching clergy verification requests:", error);
    res.status(500).json(buildErrorResponse("Failed to fetch verification requests", error));
  }
});

// Get pending clergy verification requests for an organization (admin/pastor only)
router.get("/organizations/:orgId/requests", async (req, res) => {
  try {
    const currentUserId = requireSessionUserId(req);
    const organizationId = parseInt(req.params.orgId);

    // Check if current user is admin or pastor of the organization
    const adminCheck = await db
      .select()
      .from(organizationUsers)
      .where(and(
        eq(organizationUsers.organizationId, organizationId),
        eq(organizationUsers.userId, currentUserId),
        or(
          eq(organizationUsers.role, "admin"),
          eq(organizationUsers.role, "pastor")
        )
      ))
      .limit(1);

    if (adminCheck.length === 0) {
      return res.status(403).json({
        message: "Admin or pastor privileges required to view verification requests"
      });
    }

    const requests = await db
      .select({
        id: clergyVerificationRequests.id,
        userId: clergyVerificationRequests.userId,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        status: clergyVerificationRequests.status,
        requestedAt: clergyVerificationRequests.requestedAt,
        reviewedAt: clergyVerificationRequests.reviewedAt,
        notes: clergyVerificationRequests.notes
      })
      .from(clergyVerificationRequests)
      .innerJoin(users, eq(users.id, clergyVerificationRequests.userId))
      .where(eq(clergyVerificationRequests.organizationId, organizationId))
      .orderBy(clergyVerificationRequests.requestedAt);

    res.json(requests);
  } catch (error) {
    console.error("Error fetching organization clergy verification requests:", error);
    res.status(500).json(buildErrorResponse("Failed to fetch verification requests", error));
  }
});

// Approve a clergy verification request
router.post("/organizations/:orgId/requests/:requestId/approve", async (req, res) => {
  try {
    const currentUserId = requireSessionUserId(req);
    const organizationId = parseInt(req.params.orgId);
    const requestId = parseInt(req.params.requestId);
    const { notes } = z.object({
      notes: z.string().optional()
    }).parse(req.body);

    // Check if current user is admin or pastor of the organization
    const adminCheck = await db
      .select()
      .from(organizationUsers)
      .where(and(
        eq(organizationUsers.organizationId, organizationId),
        eq(organizationUsers.userId, currentUserId),
        or(
          eq(organizationUsers.role, "admin"),
          eq(organizationUsers.role, "pastor")
        )
      ))
      .limit(1);

    if (adminCheck.length === 0) {
      return res.status(403).json({
        message: "Admin or pastor privileges required to approve verification requests"
      });
    }

    // Get the request
    const [request] = await db
      .select()
      .from(clergyVerificationRequests)
      .where(and(
        eq(clergyVerificationRequests.id, requestId),
        eq(clergyVerificationRequests.organizationId, organizationId)
      ))
      .limit(1);

    if (!request) {
      return res.status(404).json({ message: "Verification request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "This request has already been processed" });
    }

    // Update the request status
    const [updatedRequest] = await db
      .update(clergyVerificationRequests)
      .set({
        status: "approved",
        reviewedAt: new Date(),
        reviewedByUserId: currentUserId,
        notes: notes || null
      })
      .where(eq(clergyVerificationRequests.id, requestId))
      .returning();

    // Update the user's clergy verification status
    await db
      .update(users)
      .set({
        isVerifiedClergy: true,
        clergyVerifiedAt: new Date(),
        clergyVerifiedByOrgId: organizationId
      } as any)
      .where(eq(users.id, request.userId));

    res.json({
      ...updatedRequest,
      message: "Clergy verification approved successfully"
    });
  } catch (error) {
    console.error("Error approving clergy verification request:", error);
    res.status(500).json(buildErrorResponse("Failed to approve verification request", error));
  }
});

// Reject a clergy verification request
router.post("/organizations/:orgId/requests/:requestId/reject", async (req, res) => {
  try {
    const currentUserId = requireSessionUserId(req);
    const organizationId = parseInt(req.params.orgId);
    const requestId = parseInt(req.params.requestId);
    const { notes } = z.object({
      notes: z.string().optional()
    }).parse(req.body);

    // Check if current user is admin or pastor of the organization
    const adminCheck = await db
      .select()
      .from(organizationUsers)
      .where(and(
        eq(organizationUsers.organizationId, organizationId),
        eq(organizationUsers.userId, currentUserId),
        or(
          eq(organizationUsers.role, "admin"),
          eq(organizationUsers.role, "pastor")
        )
      ))
      .limit(1);

    if (adminCheck.length === 0) {
      return res.status(403).json({
        message: "Admin or pastor privileges required to reject verification requests"
      });
    }

    // Get the request
    const [request] = await db
      .select()
      .from(clergyVerificationRequests)
      .where(and(
        eq(clergyVerificationRequests.id, requestId),
        eq(clergyVerificationRequests.organizationId, organizationId)
      ))
      .limit(1);

    if (!request) {
      return res.status(404).json({ message: "Verification request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "This request has already been processed" });
    }

    // Update the request status
    const [updatedRequest] = await db
      .update(clergyVerificationRequests)
      .set({
        status: "rejected",
        reviewedAt: new Date(),
        reviewedByUserId: currentUserId,
        notes: notes || null
      })
      .where(eq(clergyVerificationRequests.id, requestId))
      .returning();

    res.json({
      ...updatedRequest,
      message: "Clergy verification request rejected"
    });
  } catch (error) {
    console.error("Error rejecting clergy verification request:", error);
    res.status(500).json(buildErrorResponse("Failed to reject verification request", error));
  }
});

// Admin revoke clergy verification (platform admin only)
router.delete("/:userId/revoke", async (req, res) => {
  try {
    const currentUserId = requireSessionUserId(req);
    const targetUserId = parseInt(req.params.userId);

    // Check if current user is platform admin
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, currentUserId))
      .limit(1);

    if (!currentUser || !currentUser.isAdmin) {
      return res.status(403).json({
        message: "Platform admin privileges required to revoke clergy verification"
      });
    }

    // Revoke the user's clergy status
    await db
      .update(users)
      .set({
        isVerifiedClergy: false,
        clergyVerifiedAt: null,
        clergyVerifiedByOrgId: null
      } as any)
      .where(eq(users.id, targetUserId));

    res.json({ message: "Clergy verification revoked successfully" });
  } catch (error) {
    console.error("Error revoking clergy verification:", error);
    res.status(500).json(buildErrorResponse("Failed to revoke clergy verification", error));
  }
});

// Get user's clergy verification status
router.get("/status", async (req, res) => {
  try {
    const currentUserId = requireSessionUserId(req);

    const [user] = await db
      .select({
        isVerifiedClergy: users.isVerifiedClergy,
        clergyVerifiedAt: users.clergyVerifiedAt,
        clergyVerifiedByOrgId: users.clergyVerifiedByOrgId
      } as any)
      .from(users)
      .where(eq(users.id, currentUserId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If verified, also get the organization name
    let organizationName = null;
    if ((user as any).clergyVerifiedByOrgId) {
      const [org] = await db
        .select({ name: organizations.name })
        .from(organizations)
        .where(eq(organizations.id, (user as any).clergyVerifiedByOrgId))
        .limit(1);
      organizationName = org?.name || null;
    }

    res.json({
      isVerifiedClergy: (user as any).isVerifiedClergy || false,
      clergyVerifiedAt: (user as any).clergyVerifiedAt,
      verifyingOrganization: organizationName
    });
  } catch (error) {
    console.error("Error fetching clergy verification status:", error);
    res.status(500).json(buildErrorResponse("Failed to fetch verification status", error));
  }
});

export default router;
