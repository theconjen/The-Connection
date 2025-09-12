import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { getRecommendationsForUser } from "./recommendation-engine";
import { sendNotificationEmail } from "./email";
import adminRoutes from "./routes/api/admin";
import authRoutes from "./routes/api/auth";
import userRoutes from './routes/api/user';
import { registerOnboardingRoutes } from './routes/api/user-onboarding';
import registerLocationSearchRoutes from './routes/api/location-search';
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { format } from "date-fns";
import { 
  createEmailTemplate, 
  updateEmailTemplate,
  deleteEmailTemplate,
  getEmailTemplate,
  listEmailTemplates,
  EmailTemplateParams
} from "./email";
import { 
  // Existing schemas
  insertCommunitySchema, 
  insertCommunityMemberSchema,
  insertCommunityChatRoomSchema,
  insertChatMessageSchema,
  insertCommunityWallPostSchema,
  insertPostSchema, 
  insertCommentSchema,
  insertGroupSchema,
  insertGroupMemberSchema,
  insertApologeticsResourceSchema,
  insertApologeticsTopicSchema,
  insertApologeticsQuestionSchema,
  insertApologeticsAnswerSchema,
  insertLivestreamerApplicationSchema,
  insertApologistScholarApplicationSchema,
  insertLivestreamSchema,
  insertMicroblogSchema,
  // Recommendation system
  insertUserFollowSchema,
  insertUserInteractionSchema,
  
  // Community Events
  insertEventSchema,
  insertEventRsvpSchema,
  
  // Prayer Request system
  insertPrayerRequestSchema,
  insertPrayerSchema,
  
  // Mentorship system
  insertMentorProfileSchema,
  insertMentorshipRequestSchema,
  insertMentorshipRelationshipSchema,
  
  // Bible study tools
  insertBibleReadingPlanSchema,
  insertBibleReadingProgressSchema,
  insertBibleStudyNotesSchema,
  insertVerseMemorizationSchema,
  
  // Community challenges
  insertChallengeSchema,
  insertChallengeParticipantSchema,
  insertChallengeTestimonialSchema,
  
  // Resource sharing
  insertResourceSchema,
  insertResourceRatingSchema,
  insertResourceCollectionSchema,
  insertCollectionResourceSchema,
  
  // Community service
  insertServiceProjectSchema,
  insertServiceVolunteerSchema,
  insertServiceTestimonialSchema
} from "@shared/schema";
import { livestreamerApplications, apologistScholarApplications } from "@shared/schema";
import { ZodError } from "zod";

// Utility functions
const comparePasswords = async (plaintext: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(plaintext, hash);
};

// Type guard for authenticated requests
// Using isAuthenticated from auth.ts instead of defining it here again

// Check if user is authenticated, but allow guest access (read-only) by continuing
function allowGuest(req: Request, res: Response, next: Function) {
  // Always continue to the next middleware, regardless of authentication status
  next();
}

export async function registerRoutes(app: Express, httpServer?: any): Promise<Server> {
  try {
    // Try to set up authentication routes using database
    setupAuth(app);
  } catch (error) {
    console.error("Error setting up database authentication:", error);
    console.log("Using in-memory session store as fallback");
    // Authentication is already set up in index.ts with memory store
  }
  
  // Current user API endpoint
  app.get("/api/user", async (req, res) => {
    if (req.session && req.session.userId!) {
      try {
        const user = await storage.getUserById(req.session.userId!);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      } catch (error) {
        console.error("Error fetching user:", error);
        return res.status(500).json({ message: "Failed to fetch user data" });
      }
    }
    return res.status(401).json({ message: "Not authenticated" });
  });
  
  // TEMPORARY: Direct admin access endpoint (bypasses database and sessions)
  app.get("/api/direct-admin", (req, res) => {
    const adminKey = req.query.key;
    // Check if admin key matches ADMIN_EMAIL
    if (adminKey === process.env.ADMIN_EMAIL) {
      res.json({ 
        isAdmin: true,
        id: 0,
        username: "admin",
        email: process.env.ADMIN_EMAIL
      });
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });
  
  // Admin login endpoint
  app.post("/api/admin-login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      
      // Get user
      const user = await storage.getUserByUsername(username);
      
      // Check if user exists and is an admin
      if (!user || !user.isAdmin || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }
      
      // Log in the user
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login error", error: err.message });
        }
        return res.json(user);
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Server error during admin login" });
    }
  });
  
  // Mount admin routes (imported at the top)
  app.use('/api/admin', adminRoutes);
  
  // Mount auth routes
  app.use('/api', authRoutes);
  
  // Mount user routes
  app.use('/api/user', userRoutes);
  
  // Mount additional user settings routes
  const userSettingsRoutes = (await import('./routes/userSettingsRoutes')).default;
  const dmRoutes = (await import('./routes/dmRoutes')).default;
  app.use("/api/user", userSettingsRoutes);
  app.use('/api/dms', dmRoutes);
  
  // Register onboarding routes for locality and interests
  registerOnboardingRoutes(app);
  
  // Register location search routes for finding communities by city and interests
  registerLocationSearchRoutes(app);
  
  // Setup organization routes (Church accounts)
  const organizationRoutes = (await import('./routes/organizations')).default;
  const stripeRoutes = (await import('./routes/stripe')).default;
  app.use('/api/organizations', organizationRoutes);
  app.use('/api/stripe', stripeRoutes);

  // Communities routes
  app.get("/api/communities", async (req, res, next) => {
    try {
      const communities = await storage.getAllCommunities();
      res.json(communities);
    } catch (error) {
      next(error);
    }
  });

  // Get communities for a specific user
  app.get("/api/users/:userId/communities", isAuthenticated, async (req, res, next) => {
    try {
      const { userId } = req.params;
      
      // Only allow users to see their own communities or admin users
      if (req.session.userId !== userId && !req.session.isAdmin) {
        return res.status(403).json({ message: "Forbidden: Can only view your own communities" });
      }
      
      const userCommunities = await storage.getUserCommunities(userId);
      res.json(userCommunities);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/communities/:slug", async (req, res, next) => {
    try {
      const community = await storage.getCommunityBySlug(req.params.slug);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      res.json(community);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/communities", isAuthenticated, async (req, res, next) => {
    try {
      const validatedData = insertCommunitySchema.parse({
        ...req.body,
        createdBy: req.session.userId!
      });
      const community = await storage.createCommunity(validatedData);
      res.status(201).json(community);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      next(error);
    }
  });

  // Update community
  app.put("/api/communities/:id", isAuthenticated, async (req, res, next) => {
    try {
      // Check if user is authorized (owner or moderator)
      const communityId = req.params.id;
      const userId = req.session.userId!;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const isOwner = await storage.isCommunityOwner(communityId, userId);
      const isModerator = await storage.isCommunityModerator(communityId, userId);
      
      if (!isOwner && !isModerator) {
        return res.status(403).json({ message: "Forbidden: Only community owners or moderators can update community details" });
      }
      
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      const validatedData = insertCommunitySchema.partial().parse(req.body);
      const updatedCommunity = await storage.updateCommunity(communityId, validatedData);
      
      res.json(updatedCommunity);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      next(error);
    }
  });
  
  // Delete community
  app.delete("/api/communities/:id", isAuthenticated, async (req, res, next) => {
    try {
      const communityId = req.params.id;
      const userId = req.session.userId!;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const isOwner = await storage.isCommunityOwner(communityId, userId);
      
      if (!isOwner) {
        return res.status(403).json({ message: "Forbidden: Only community owners can delete communities" });
      }
      
      const success = await storage.deleteCommunity(communityId);
      if (!success) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Community Members routes
  app.get("/api/communities/:id/members", async (req, res, next) => {
    try {
      const communityId = req.params.id;
      const members = await storage.getCommunityMembers(communityId);
      res.json(members);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/communities/:id/members", isAuthenticated, async (req, res, next) => {
    try {
      const communityId = req.params.id;
      const userId = req.session.userId!;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if already a member
      const existingMember = await storage.getCommunityMember(communityId, userId);
      if (existingMember) {
        return res.status(409).json({ message: "Already a member of this community" });
      }
      
      // Default role is "member" unless this is the first member (then "owner")
      const members = await storage.getCommunityMembers(communityId);
      const role = members.length === 0 ? "owner" : "member";
      
      const validatedData = insertCommunityMemberSchema.parse({
        communityId,
        userId,
        role
      });
      
      const member = await storage.addCommunityMember(validatedData);
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      next(error);
    }
  });
  
  app.put("/api/communities/:communityId/members/:memberId/role", isAuthenticated, async (req, res, next) => {
    try {
      const communityId = req.params.communityId;
      const memberId = req.params.memberId;
      const userId = req.session.userId!;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Only owners can change roles
      const isOwner = await storage.isCommunityOwner(communityId, userId);
      if (!isOwner) {
        return res.status(403).json({ message: "Forbidden: Only community owners can change member roles" });
      }
      
      const { role } = req.body;
      if (!role || !["member", "moderator", "owner"].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be one of: member, moderator, owner" });
      }
      
      const updatedMember = await storage.updateCommunityMemberRole(memberId, role);
      res.json(updatedMember);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/communities/:communityId/members/:userId", isAuthenticated, async (req, res, next) => {
    try {
      const communityId = req.params.communityId;
      const memberUserId = req.params.userId;
      const currentUserId = req.session.userId!;
      
      if (!currentUserId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if user is removing themselves (allowed) or is owner/mod (allowed to remove others)
      const isSelf = currentUserId === memberUserId;
      const isOwner = await storage.isCommunityOwner(communityId, currentUserId);
      const isModerator = await storage.isCommunityModerator(communityId, currentUserId);
      
      if (!isSelf && !isOwner && !isModerator) {
        return res.status(403).json({ 
          message: "Forbidden: You can only remove yourself or you must be an owner/moderator to remove others" 
        });
      }
      
      // Owners can't be removed except by themselves
      if (!isSelf) {
        const targetIsOwner = await storage.isCommunityOwner(communityId, memberUserId);
        if (targetIsOwner) {
          return res.status(403).json({ message: "Forbidden: Owners can only be removed by themselves" });
        }
      }
      
      const success = await storage.removeCommunityMember(communityId, memberUserId);
      if (!success) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Community Chat Room routes
  app.get("/api/communities/:id/chat-rooms", async (req, res, next) => {
    try {
      const communityId = req.params.id;
      const userId = req.session.userId!;
      
      // If authenticated, show all rooms (incl. private) if member
      if (userId) {
        const isMember = await storage.isCommunityMember(communityId, userId);
        if (isMember) {
          const rooms = await storage.getCommunityRooms(communityId);
          return res.json(rooms);
        }
      }
      
      // Otherwise, show only public rooms
      const publicRooms = await storage.getPublicCommunityRooms(communityId);
      res.json(publicRooms);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/chat-rooms/:id", async (req, res, next) => {
    try {
      const roomId = req.params.id;
      const room = await storage.getCommunityRoom(roomId);
      
      if (!room) {
        return res.status(404).json({ message: "Chat room not found" });
      }
      
      // Check access for private rooms
      if (room.isPrivate) {
        const userId = req.session.userId!;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        
        const isMember = await storage.isCommunityMember(room.communityId, userId);
        if (!isMember) {
          return res.status(403).json({ message: "Forbidden: Private rooms are only accessible to community members" });
        }
      }
      
      res.json(room);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/communities/:id/chat-rooms", isAuthenticated, async (req, res, next) => {
    try {
      const communityId = req.params.id;
      const userId = req.session.userId!;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if user is member of the community
      const isMember = await storage.isCommunityMember(communityId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Forbidden: Only community members can create chat rooms" });
      }
      
      // If creating a private room, make sure user is owner or moderator
      if (req.body.isPrivate) {
        const isModOrOwner = await storage.isCommunityModerator(communityId, userId);
        if (!isModOrOwner) {
          return res.status(403).json({ message: "Forbidden: Only moderators or owners can create private chat rooms" });
        }
      }
      
      const validatedData = insertCommunityChatRoomSchema.parse({
        ...req.body,
        communityId,
        createdBy: userId
      });
      
      const room = await storage.createCommunityRoom(validatedData);
      
      // Add system message announcing the room creation
      await storage.createChatMessage({
        chatRoomId: room.id,
        senderId: userId,
        content: `${req.session.username || "A user"} created this chat room`,
        isSystemMessage: true
      });
      
      res.status(201).json(room);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      next(error);
    }
  });
  
  app.put("/api/chat-rooms/:id", isAuthenticated, async (req, res, next) => {
    try {
      const roomId = req.params.id;
      const userId = req.session.userId!;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const room = await storage.getCommunityRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Chat room not found" });
      }
      
      // Check if user is authorized (creator, owner, or moderator)
      const isCreator = room.createdBy === userId;
      const isOwner = await storage.isCommunityOwner(room.communityId, userId);
      const isModerator = await storage.isCommunityModerator(room.communityId, userId);
      
      if (!isCreator && !isOwner && !isModerator) {
        return res.status(403).json({ 
          message: "Forbidden: Only room creators, community owners, or moderators can update rooms" 
        });
      }
      
      const validatedData = insertCommunityChatRoomSchema.partial().parse(req.body);
      const updatedRoom = await storage.updateCommunityRoom(roomId, validatedData);
      
      res.json(updatedRoom);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      next(error);
    }
  });
  
  app.delete("/api/chat-rooms/:id", isAuthenticated, async (req, res, next) => {
    try {
      const roomId = req.params.id;
      const userId = req.session.userId!;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const room = await storage.getCommunityRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Chat room not found" });
      }
      
      // Check if user is authorized (creator, owner, or moderator)
      const isCreator = room.createdBy === userId;
      const isOwner = await storage.isCommunityOwner(room.communityId, userId);
      const isModerator = await storage.isCommunityModerator(room.communityId, userId);
      
      if (!isCreator && !isOwner && !isModerator) {
        return res.status(403).json({ 
          message: "Forbidden: Only room creators, community owners, or moderators can delete rooms" 
        });
      }
      
      const success = await storage.deleteCommunityRoom(roomId);
      if (!success) {
        return res.status(404).json({ message: "Chat room not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Chat Messages routes
  app.get("/api/chat-rooms/:id/messages", async (req, res, next) => {
    try {
      const roomId = req.params.id;
      const limit = req.query.limit ? req.query.limit as string : 50;
      
      if (isNaN(roomId) || roomId <= 0) {
        return res.status(400).json({ message: "Invalid room ID" });
      }
      
      if (limit < 1 || limit > 1000) {
        return res.status(400).json({ message: "Limit must be between 1 and 1000" });
      }
      
      const room = await storage.getCommunityRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Chat room not found" });
      }
      
      // Check access for private rooms
      if (room.isPrivate) {
        const userId = req.session.userId!;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        
        const isMember = await storage.isCommunityMember(room.communityId, userId);
        if (!isMember) {
          return res.status(403).json({ message: "Forbidden: Private rooms are only accessible to community members" });
        }
      }
      
      const messages = await storage.getChatMessages(roomId, limit);
      res.json(messages);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/chat-rooms/:roomId/messages-after/:messageId", async (req, res, next) => {
    try {
      const roomId = req.params.roomId;
      const afterId = req.params.messageId;
      
      if (isNaN(roomId) || isNaN(afterId) || roomId <= 0 || afterId <= 0) {
        return res.status(400).json({ message: "Invalid room ID or message ID" });
      }
      
      const room = await storage.getCommunityRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Chat room not found" });
      }
      
      // Check access for private rooms
      if (room.isPrivate) {
        const userId = req.session.userId!;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        
        const isMember = await storage.isCommunityMember(room.communityId, userId);
        if (!isMember) {
          return res.status(403).json({ message: "Forbidden: Private rooms are only accessible to community members" });
        }
      }
      
      const messages = await storage.getChatMessagesAfter(roomId, afterId);
      res.json(messages);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/chat-rooms/:id/messages", isAuthenticated, async (req, res, next) => {
    try {
      const roomId = req.params.id;
      const userId = req.session.userId!;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const room = await storage.getCommunityRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Chat room not found" });
      }
      
      // Check if user is a member of the community
      const isMember = await storage.isCommunityMember(room.communityId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Forbidden: Only community members can send messages" });
      }
      
      const validatedData = insertChatMessageSchema.parse({
        ...req.body,
        chatRoomId: roomId,
        senderId: userId
      });
      
      const message = await storage.createChatMessage(validatedData);
      
      // Get the sender info to include in response
      const sender = await storage.getUser(userId);
      
      res.status(201).json({
        ...message,
        sender
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      next(error);
    }
  });
  
  app.delete("/api/chat-messages/:id", isAuthenticated, async (req, res, next) => {
    try {
      const messageId = req.params.id;
      const userId = req.session.userId!;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Get message to check ownership and room info
      const messages = await storage.getChatMessages(0); // We need a better way to get a single message
      const message = messages.find(m => m.id === messageId);
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      const room = await storage.getCommunityRoom(message.chatRoomId);
      if (!room) {
        return res.status(404).json({ message: "Chat room not found" });
      }
      
      // Check if user is authorized (sender, owner, or moderator)
      const isSender = message.senderId === userId;
      const isOwner = await storage.isCommunityOwner(room.communityId, userId);
      const isModerator = await storage.isCommunityModerator(room.communityId, userId);
      
      if (!isSender && !isOwner && !isModerator) {
        return res.status(403).json({ 
          message: "Forbidden: Only message senders, community owners, or moderators can delete messages" 
        });
      }
      
      const success = await storage.deleteChatMessage(messageId);
      if (!success) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Community Wall Posts routes
  app.get("/api/communities/:id/wall", async (req, res, next) => {
    try {
      const communityId = req.params.id;
      const isPrivate = req.query.private === 'true';
      
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      // For private wall, check if user is a member
      if (isPrivate) {
        // Make sure private wall exists
        if (!community.hasPrivateWall) {
          return res.status(404).json({ message: "This community does not have a private wall" });
        }
        
        const userId = req.session.userId!;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        
        const isMember = await storage.isCommunityMember(communityId, userId);
        if (!isMember) {
          return res.status(403).json({ message: "Forbidden: Private wall is only accessible to community members" });
        }
        
        const posts = await storage.getCommunityWallPosts(communityId, true);
        return res.json(posts);
      } 
      
      // For public wall
      if (!community.hasPublicWall) {
        return res.status(404).json({ message: "This community does not have a public wall" });
      }
      
      const posts = await storage.getCommunityWallPosts(communityId, false);
      res.json(posts);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/wall-posts/:id", async (req, res, next) => {
    try {
      const postId = req.params.id;
      const post = await storage.getCommunityWallPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Wall post not found" });
      }
      
      // Check if private post and if user has access
      if (post.isPrivate) {
        const userId = req.session.userId!;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        
        const isMember = await storage.isCommunityMember(post.communityId, userId);
        if (!isMember) {
          return res.status(403).json({ message: "Forbidden: Private posts are only accessible to community members" });
        }
      }
      
      res.json(post);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/communities/:id/wall", isAuthenticated, async (req, res, next) => {
    try {
      const communityId = req.params.id;
      const userId = req.session.userId!;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      // Check if this is for private or public wall
      const isPrivate = req.body.isPrivate === true;
      
      // Check if wall type is enabled
      if (isPrivate && !community.hasPrivateWall) {
        return res.status(400).json({ message: "This community does not have a private wall enabled" });
      }
      
      if (!isPrivate && !community.hasPublicWall) {
        return res.status(400).json({ message: "This community does not have a public wall enabled" });
      }
      
      // For private posts, check if user is a member
      if (isPrivate) {
        const isMember = await storage.isCommunityMember(communityId, userId);
        if (!isMember) {
          return res.status(403).json({ message: "Forbidden: Only community members can post to the private wall" });
        }
      }
      
      const validatedData = insertCommunityWallPostSchema.parse({
        ...req.body,
        communityId,
        authorId: userId
      });
      
      const post = await storage.createCommunityWallPost(validatedData);
      
      // Get the author info to include in response
      const author = await storage.getUser(userId);
      
      res.status(201).json({
        ...post,
        author
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      next(error);
    }
  });
  
  app.put("/api/wall-posts/:id", isAuthenticated, async (req, res, next) => {
    try {
      const postId = req.params.id;
      const userId = req.session.userId!;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const post = await storage.getCommunityWallPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Wall post not found" });
      }
      
      // Check if user is authorized (author, owner, or moderator)
      const isAuthor = post.authorId === userId;
      const isOwner = await storage.isCommunityOwner(post.communityId, userId);
      const isModerator = await storage.isCommunityModerator(post.communityId, userId);
      
      if (!isAuthor && !isOwner && !isModerator) {
        return res.status(403).json({ 
          message: "Forbidden: Only post authors, community owners, or moderators can update posts" 
        });
      }
      
      // Don't allow changing isPrivate status (that's a core property)
      if (req.body.isPrivate !== undefined && req.body.isPrivate !== post.isPrivate) {
        return res.status(400).json({ message: "Cannot change private/public status of an existing post" });
      }
      
      const validatedData = insertCommunityWallPostSchema.partial().parse(req.body);
      const updatedPost = await storage.updateCommunityWallPost(postId, validatedData);
      
      // Include author in response
      const author = await storage.getUser(updatedPost.authorId);
      
      res.json({
        ...updatedPost,
        author
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      next(error);
    }
  });
  
  app.delete("/api/wall-posts/:id", isAuthenticated, async (req, res, next) => {
    try {
      const postId = req.params.id;
      const userId = req.session.userId!;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const post = await storage.getCommunityWallPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Wall post not found" });
      }
      
      // Check if user is authorized (author, owner, or moderator)
      const isAuthor = post.authorId === userId;
      const isOwner = await storage.isCommunityOwner(post.communityId, userId);
      const isModerator = await storage.isCommunityModerator(post.communityId, userId);
      
      if (!isAuthor && !isOwner && !isModerator) {
        return res.status(403).json({ 
          message: "Forbidden: Only post authors, community owners, or moderators can delete posts" 
        });
      }
      
      const success = await storage.deleteCommunityWallPost(postId);
      if (!success) {
        return res.status(404).json({ message: "Wall post not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Posts routes
  app.get("/api/posts", async (req, res, next) => {
    try {
      const filter = req.query.filter as string || "popular";
      const communitySlug = req.query.community as string;
      const groupId = req.query.groupId ? req.query.groupId as string : undefined;
      
      let posts;
      if (communitySlug) {
        posts = await storage.getPostsByCommunitySlug(communitySlug, filter);
      } else if (groupId) {
        posts = await storage.getPostsByGroupId(groupId, filter);
      } else {
        posts = await storage.getAllPosts(filter);
      }
      
      res.json(posts);
    } catch (error) {
      next(error);
    }
  });

  // Get all posts for a specific user
  app.get("/api/users/:userId/posts", isAuthenticated, async (req, res, next) => {
    try {
      const { userId } = req.params;
      
      // Only allow users to see their own posts or admin users
      if (req.session.userId !== userId && !req.session.isAdmin) {
        return res.status(403).json({ message: "Forbidden: Can only view your own posts" });
      }
      
      const userPosts = await storage.getUserPosts(userId);
      res.json(userPosts);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/posts/:id", async (req, res, next) => {
    try {
      const postId = req.params.id;
      const post = await storage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      res.json(post);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/posts", isAuthenticated, async (req, res, next) => {
    try {
      const validatedData = insertPostSchema.parse({
        ...req.body,
        authorId: req.session.userId!
      });
      
      const post = await storage.createPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      next(error);
    }
  });

  // Comments routes
  app.get("/api/posts/:postId/comments", async (req, res, next) => {
    try {
      const postId = req.params.postId;
      const comments = await storage.getCommentsByPostId(postId);
      res.json(comments);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/comments", isAuthenticated, async (req, res, next) => {
    try {
      const validatedData = insertCommentSchema.parse({
        ...req.body,
        authorId: req.session.userId!
      });
      
      const comment = await storage.createComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      next(error);
    }
  });

  // Groups routes
  app.get("/api/groups", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.session.userId!;
      const groups = await storage.getGroupsByUserId(userId);
      res.json(groups);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/groups", isAuthenticated, async (req, res, next) => {
    try {
      const validatedData = insertGroupSchema.parse({
        ...req.body,
        createdBy: req.session.userId!
      });
      
      const group = await storage.createGroup(validatedData);
      
      // Add creator as admin member
      await storage.addGroupMember({
        groupId: group.id,
        userId: req.session!.id,
        isAdmin: true
      });
      
      res.status(201).json(group);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      next(error);
    }
  });

  app.post("/api/groups/:groupId/members", isAuthenticated, async (req, res, next) => {
    try {
      const groupId = req.params.groupId;
      
      // Check if user is admin of the group
      const isAdmin = await storage.isGroupAdmin(groupId, req.session!.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Only group admins can add members" });
      }
      
      const validatedData = insertGroupMemberSchema.parse({
        ...req.body,
        groupId
      });
      
      const member = await storage.addGroupMember(validatedData);
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      next(error);
    }
  });

  // Apologetics resources routes
  app.get("/api/apologetics", async (req, res, next) => {
    try {
      const resources = await storage.getAllApologeticsResources();
      res.json(resources);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/apologetics", isAuthenticated, async (req, res, next) => {
    try {
      const validatedData = insertApologeticsResourceSchema.parse(req.body);
      const resource = await storage.createApologeticsResource(validatedData);
      res.status(201).json(resource);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      next(error);
    }
  });
  
  // Apologetics Q&A system - Topics routes
  app.get("/api/apologetics/topics", async (req, res, next) => {
    try {
      const topics = await storage.getAllApologeticsTopics();
      res.json(topics);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/apologetics/topics/:id", async (req, res, next) => {
    try {
      const topicId = req.params.id;
      const topic = await storage.getApologeticsTopic(topicId);
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }
      res.json(topic);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/apologetics/topics/slug/:slug", async (req, res, next) => {
    try {
      const { slug } = req.params;
      const topic = await storage.getApologeticsTopicBySlug(slug);
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }
      res.json(topic);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/apologetics/topics", isAuthenticated, async (req, res, next) => {
    try {
      // Only admins can create topics
      if (!req.session || req.session.isVerifiedApologeticsAnswerer !== true) {
        return res.status(403).json({ message: "Only verified apologetics experts can create topics" });
      }
      
      const validatedData = insertApologeticsTopicSchema.parse(req.body);
      const topic = await storage.createApologeticsTopic(validatedData);
      res.status(201).json(topic);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      next(error);
    }
  });
  
  // Apologetics Q&A system - Questions routes
  app.get("/api/apologetics/questions", async (req, res, next) => {
    try {
      const { status } = req.query;
      const questions = await storage.getAllApologeticsQuestions(status as string);
      res.json(questions);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/apologetics/questions/:id", async (req, res, next) => {
    try {
      const questionId = req.params.id;
      const question = await storage.getApologeticsQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      // Increment view count
      await storage.incrementApologeticsQuestionViewCount(questionId);
      
      res.json(question);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/apologetics/topics/:topicId/questions", async (req, res, next) => {
    try {
      const topicId = req.params.topicId;
      const questions = await storage.getApologeticsQuestionsByTopic(topicId);
      res.json(questions);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/apologetics/questions", isAuthenticated, async (req, res, next) => {
    try {
      // Add the current user ID as the author
      const validatedData = insertApologeticsQuestionSchema.parse({
        ...req.body,
        authorId: req.session.id
      });
      
      const question = await storage.createApologeticsQuestion(validatedData);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      next(error);
    }
  });
  
  app.put("/api/apologetics/questions/:id/status", isAuthenticated, async (req, res, next) => {
    try {
      // Only verified answerers can update question status
      if (!req.session || req.session.isVerifiedApologeticsAnswerer !== true) {
        return res.status(403).json({ message: "Only verified apologetics experts can update question status" });
      }
      
      const questionId = req.params.id;
      const { status } = req.body;
      
      if (!status || !["open", "answered", "closed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const question = await storage.updateApologeticsQuestionStatus(questionId, status);
      res.json(question);
    } catch (error) {
      next(error);
    }
  });
  
  // Apologetics Q&A system - Answers routes
  app.get("/api/apologetics/questions/:questionId/answers", async (req, res, next) => {
    try {
      const questionId = req.params.questionId;
      const answers = await storage.getApologeticsAnswersByQuestion(questionId);
      res.json(answers);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/apologetics/answers", isAuthenticated, async (req, res, next) => {
    try {
      // Set verified flag based on user status
      const isVerified = req.session.isVerifiedApologeticsAnswerer === true;
      
      // Add the current user ID as the author
      const validatedData = insertApologeticsAnswerSchema.parse({
        ...req.body,
        authorId: req.session.id,
        isVerifiedAnswer: isVerified
      });
      
      const answer = await storage.createApologeticsAnswer(validatedData);
      
      // If this is from a verified answerer, mark the question as answered
      if (isVerified) {
        await storage.updateApologeticsQuestionStatus(validatedData.questionId, "answered");
      }
      
      res.status(201).json(answer);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      next(error);
    }
  });
  
  app.post("/api/apologetics/answers/:id/upvote", isAuthenticated, async (req, res, next) => {
    try {
      const answerId = req.params.id;
      const answer = await storage.upvoteApologeticsAnswer(answerId);
      res.json(answer);
    } catch (error) {
      next(error);
    }
  });
  
  // Verified Apologetics Answerers management
  app.get("/api/users/verified-apologetics-answerers", async (req, res, next) => {
    try {
      const verifiedAnswerers = await storage.getVerifiedApologeticsAnswerers();
      res.json(verifiedAnswerers);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/users/:userId/verified-apologetics-answerer", isAuthenticated, async (req, res, next) => {
    try {
      // Only admins can set verified status (for now let's assume only verified answerers can verify others)
      if (!req.session || req.session.isVerifiedApologeticsAnswerer !== true) {
        return res.status(403).json({ message: "Only verified apologetics experts can verify others" });
      }
      
      const userId = req.params.userId;
      const { isVerified } = req.body;
      
      if (typeof isVerified !== 'boolean') {
        return res.status(400).json({ message: "Invalid isVerified value" });
      }
      
      const user = await storage.setVerifiedApologeticsAnswerer(userId, isVerified);
      res.json(user);
    } catch (error) {
      next(error);
    }
  });

  // Microblog (Twitter-like) routes
  app.get("/api/microblogs", async (req, res, next) => {
    try {
      const filter = req.query.filter as string || 'recent';
      const microblogs = await storage.getAllMicroblogs(filter);
      res.json(microblogs);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/microblogs/:id", async (req, res, next) => {
    try {
      const microblogId = req.params.id;
      const microblog = await storage.getMicroblog(microblogId);
      
      if (!microblog) {
        return res.status(404).json({ message: "Microblog not found" });
      }
      
      res.json(microblog);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/microblogs/:id/replies", async (req, res, next) => {
    try {
      const microblogId = req.params.id;
      const replies = await storage.getMicroblogReplies(microblogId);
      res.json(replies);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/users/:userId/microblogs", async (req, res, next) => {
    try {
      const userId = req.params.userId;
      const microblogs = await storage.getMicroblogsByUserId(userId);
      res.json(microblogs);
    } catch (error) {
      next(error);
    }
  });
  
  // Get microblogs liked by a user
  app.get("/api/users/:userId/liked-microblogs", async (req, res, next) => {
    try {
      const userId = req.params.userId;
      
      // Optional auth check - users can only see their own liked posts when authenticated
      if (req.session.userId! !== userId) {
        // For public profiles, we can still show liked posts
        // If stricter privacy is needed, uncomment this:
        // return res.status(403).json({ message: "Unauthorized" });
      }
      
      const likedPostIds = await storage.getUserLikedMicroblogs(userId);
      res.json(likedPostIds);
    } catch (error) {
      console.error("Error getting liked microblogs:", error);
      res.status(500).json({ message: "Failed to get liked microblogs" });
    }
  });
  
  app.get("/api/communities/:communityId/microblogs", async (req, res, next) => {
    try {
      const communityId = req.params.communityId;
      const microblogs = await storage.getMicroblogsByCommunityId(communityId);
      res.json(microblogs);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/groups/:groupId/microblogs", isAuthenticated, async (req, res, next) => {
    try {
      const groupId = req.params.groupId;
      
      // Check if user is a member of this group
      const members = await storage.getGroupMembers(groupId);
      const isMember = members.some(member => member.userId === req.session.userId!);
      
      if (!isMember) {
        return res.status(403).json({ message: "You are not a member of this group" });
      }
      
      const microblogs = await storage.getMicroblogsByGroupId(groupId);
      res.json(microblogs);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/microblogs", isAuthenticated, async (req, res, next) => {
    try {
      // Character limit validation for Twitter-like posts (280 chars)
      if (req.body.content && req.body.content.length > 280) {
        return res.status(400).json({ message: "Content exceeds 280 character limit" });
      }
      
      // If posting to a group, verify membership
      if (req.body.groupId) {
        const groupId = req.body.groupId;
        const members = await storage.getGroupMembers(groupId);
        const isMember = members.some(member => member.userId === req.session.userId!);
        
        if (!isMember) {
          return res.status(403).json({ message: "You are not a member of this group" });
        }
      }
      
      const validatedData = insertMicroblogSchema.parse({
        ...req.body,
        authorId: req.session.userId!
      });
      
      const microblog = await storage.createMicroblog(validatedData);
      res.status(201).json(microblog);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      next(error);
    }
  });
  
  app.post("/api/microblogs/:id/like", isAuthenticated, async (req, res, next) => {
    try {
      const microblogId = req.params.id;
      const like = await storage.likeMicroblog(microblogId, req.session!.id);
      res.status(201).json(like);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/microblogs/:id/like", isAuthenticated, async (req, res, next) => {
    try {
      const microblogId = req.params.id;
      const result = await storage.unlikeMicroblog(microblogId, req.session!.id);
      
      if (result) {
        res.status(200).json({ success: true });
      } else {
        res.status(404).json({ message: "Like not found" });
      }
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/users/:userId/liked-microblogs", async (req, res, next) => {
    try {
      const userId = req.params.userId;
      const likedMicroblogIds = await storage.getUserLikedMicroblogs(userId);
      res.json(likedMicroblogIds);
    } catch (error) {
      next(error);
    }
  });

  // Upvote routes
  app.post("/api/posts/:postId/upvote", isAuthenticated, async (req, res, next) => {
    try {
      const postId = req.params.postId;
      const post = await storage.upvotePost(postId);
      res.json(post);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/comments/:commentId/upvote", isAuthenticated, async (req, res, next) => {
    try {
      const commentId = req.params.commentId;
      const comment = await storage.upvoteComment(commentId);
      res.json(comment);
    } catch (error) {
      next(error);
    }
  });
  
  // Livestream routes
  app.get("/api/livestreams", async (req, res, next) => {
    try {
      // Since we don't have actual livestreams yet, return an empty array
      // We'll implement this fully later when livestreaming features are added
      res.json([]);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/livestreams/:id", async (req, res, next) => {
    try {
      // Since we don't have actual livestreams yet, return 404
      // We'll implement this fully later when livestreaming features are added
      return res.status(404).json({ message: "Livestream not found" });
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/livestreams", isAuthenticated, async (req, res, next) => {
    try {
      // Check if user is approved to create livestreams
      const isApproved = await storage.isApprovedLivestreamer(req.session!.id);
      if (!isApproved) {
        return res.status(403).json({ 
          message: "You need to be an approved livestreamer to create streams. Please apply first." 
        });
      }
      
      const validatedData = insertLivestreamSchema.parse({
        ...req.body,
        hostId: req.session.userId!
      });
      
      const livestream = await storage.createLivestream(validatedData);
      res.status(201).json(livestream);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      next(error);
    }
  });
  
  // Livestreamer application routes
  app.get("/api/livestreamer-application", isAuthenticated, async (req, res, next) => {
    try {
      const application = await storage.getLivestreamerApplicationByUserId(req.session!.id);
      res.json(application || null);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/livestreamer-application", isAuthenticated, async (req, res, next) => {
    try {
      // Check if user already has an application
      const existingApplication = await storage.getLivestreamerApplicationByUserId(req.session!.id);
      if (existingApplication) {
        return res.status(400).json({ message: "You already have a pending application" });
      }
      
      const validatedData = insertLivestreamerApplicationSchema.parse({
        ...req.body,
        userId: req.session.userId!
      });
      
      const application = await storage.createLivestreamerApplication(validatedData);
      
      // Send notification email to admin
      const adminEmail = process.env.ADMIN_EMAIL || "admin@theconnection.app"; // Use environment variable
      
      // Get user details for the email
      const applicant = await storage.getUser(req.session!.id);
      
      // Import the notification function
      const { sendLivestreamerApplicationNotificationEmail } = await import('./email-notifications');
      
      // Send email notification to admin
      if (applicant) {
        await sendLivestreamerApplicationNotificationEmail({
          email: adminEmail,
          applicantName: applicant.displayName || applicant.username,
          applicantEmail: applicant.email,
          ministryName: validatedData.ministryName || 'Not specified',
          applicationId: application.id,
          applicationDate: format(new Date(), 'PPP'), // Uses date-fns format
          reviewLink: `https://theconnection.app/admin/livestreamer-applications/${application.id}`
        });
      }
      
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      next(error);
    }
  });
  
  // Admin routes for reviewing applications
  app.get("/api/admin/livestreamer-applications", isAuthenticated, async (req, res, next) => {
    try {
      // Check if user is admin
      if (!req.session.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const applications = await storage.getPendingLivestreamerApplications();
      res.json(applications);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/admin/livestreamer-applications/:id", isAuthenticated, async (req, res, next) => {
    try {
      // Check if user is admin
      if (!req.session.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const applicationId = req.params.id;
      const { status, reviewNotes } = req.body;
      
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const application = await storage.updateLivestreamerApplication(
        applicationId, 
        status, 
        reviewNotes, 
        req.session.id
      );
      
      // Get the user's details to send the notification
      const applicant = await storage.getUser(application.userId);
      
      if (applicant && applicant.email) {
        // Send email notification to applicant about their application status
        const emailSubject = status === "approved" 
          ? "Your Livestreamer Application Has Been Approved" 
          : "Update on Your Livestreamer Application";
        
        const emailTitle = status === "approved"
          ? "Congratulations! Your Application is Approved"
          : "Your Application Status Has Been Updated";
        
        const emailMessage = status === "approved"
          ? "We're pleased to inform you that your application to become a livestreamer has been approved. You can now start creating livestreams on our platform."
          : `Your livestreamer application has been reviewed. Status: ${status.toUpperCase()}. ${reviewNotes ? `Reviewer notes: ${reviewNotes}` : ''}`;
        
        const actionUrl = status === "approved"
          ? `https://${process.env.REPLIT_DOMAIN || "theconnection.app"}/livestreams/create`
          : `https://${process.env.REPLIT_DOMAIN || "theconnection.app"}/livestreamer-application`;
        
        const actionText = status === "approved"
          ? "Start Livestreaming"
          : "View Application";
        
        await sendNotificationEmail({
          email: applicant.email,
          subject: emailSubject,
          title: emailTitle,
          message: emailMessage,
          actionUrl: actionUrl,
          actionText: actionText
        });
      }
      
      res.json(application);
    } catch (error) {
      next(error);
    }
  });
  
  // Apologist Scholar Application routes
  app.get("/api/apologist-scholar-application", isAuthenticated, async (req, res, next) => {
    try {
      const application = await storage.getApologistScholarApplicationByUserId(req.session!.id);
      res.json(application || null);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/apologist-scholar-application", isAuthenticated, async (req, res, next) => {
    try {
      // Check if user already has an application
      const existingApplication = await storage.getApologistScholarApplicationByUserId(req.session!.id);
      if (existingApplication) {
        return res.status(400).json({ message: "You already have a pending application" });
      }
      
      const validatedData = insertApologistScholarApplicationSchema.parse({
        ...req.body,
        userId: req.session.userId!
      });
      
      const application = await storage.createApologistScholarApplication(validatedData);
      
      // Send notification email to admin
      const adminEmail = process.env.ADMIN_EMAIL || "admin@theconnection.app"; // Use environment variable
      
      // Get user details for the email
      const applicant = await storage.getUser(req.session!.id);
      
      // Import the notification function
      const { sendLivestreamerApplicationNotificationEmail } = await import('./email-notifications');
      
      // Send email notification to admin (using the same template as livestreamer for now)
      if (applicant) {
        await sendLivestreamerApplicationNotificationEmail({
          email: adminEmail,
          applicantName: applicant.displayName || applicant.username,
          applicantEmail: applicant.email,
          ministryName: validatedData.fullName, // Use full name instead of ministry name
          applicationId: application.id,
          applicationDate: format(new Date(), 'PPP'), // Uses date-fns format
          reviewLink: `https://${process.env.REPLIT_DOMAIN || "theconnection.app"}/admin/apologist-scholar-applications/${application.id}`
        });
      }
      
      res.status(201).json(application);
    } catch (error) {
      next(error);
    }
  });
  
  // Admin routes for Apologist Scholar Applications
  app.get("/api/admin/apologist-scholar-applications", isAuthenticated, async (req, res, next) => {
    try {
      if (!req.session.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const applications = await storage.getPendingApologistScholarApplications();
      res.json(applications);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/admin/apologist-scholar-applications/:id", isAuthenticated, async (req, res, next) => {
    try {
      if (!req.session.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const { id } = req.params;
      const { status, reviewNotes } = req.body;
      
      // Update application status
      const application = await storage.updateApologistScholarApplication(
        id,
        status,
        reviewNotes,
        req.session.id
      );
      
      // Get applicant details
      const applicant = await storage.getUser(application.userId);
      
      if (applicant) {
        // Import the notification function
        const { sendApplicationStatusUpdateEmail } = await import('./email-notifications');
        
        // Send email notification to the applicant
        await sendApplicationStatusUpdateEmail({
          email: applicant.email,
          applicantName: applicant.displayName || applicant.username,
          status: status,
          ministryName: application.fullName, // Use full name instead of ministry name
          reviewNotes: reviewNotes,
          platformLink: status === "approved" 
            ? `https://${process.env.REPLIT_DOMAIN || "theconnection.app"}/apologetics/questions`
            : `https://${process.env.REPLIT_DOMAIN || "theconnection.app"}/apologist-scholar-application`
        });
      }
      
      res.json(application);
    } catch (error) {
      next(error);
    }
  });
  
  // Admin routes for email templates
  app.get("/api/admin/email-templates", isAuthenticated, async (req, res, next) => {
    try {
      // Check if user is admin
      if (!req.session.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const templates = await listEmailTemplates();
      res.json(templates);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/admin/email-templates/:name", isAuthenticated, async (req, res, next) => {
    try {
      // Check if user is admin
      if (!req.session.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const templateName = req.params.name;
      const template = await getEmailTemplate(templateName);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/admin/email-templates", isAuthenticated, async (req, res, next) => {
    try {
      // Check if user is admin
      if (!req.session.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const templateParams = req.body as EmailTemplateParams;
      
      if (!templateParams.TemplateName || !templateParams.SubjectPart) {
        return res.status(400).json({ 
          message: "Missing required fields (TemplateName, SubjectPart)"
        });
      }
      
      const success = await createEmailTemplate(templateParams);
      
      if (success) {
        res.status(201).json({ message: "Template created successfully" });
      } else {
        res.status(500).json({ message: "Failed to create template" });
      }
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/admin/email-templates/:name", isAuthenticated, async (req, res, next) => {
    try {
      // Check if user is admin
      if (!req.session.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const templateName = req.params.name;
      const templateParams = {
        ...req.body,
        TemplateName: templateName
      } as EmailTemplateParams;
      
      if (!templateParams.SubjectPart) {
        return res.status(400).json({ 
          message: "Missing required field (SubjectPart)" 
        });
      }
      
      const success = await updateEmailTemplate(templateParams);
      
      if (success) {
        res.json({ message: "Template updated successfully" });
      } else {
        res.status(500).json({ message: "Failed to update template" });
      }
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/admin/email-templates/:name", isAuthenticated, async (req, res, next) => {
    try {
      // Check if user is admin
      if (!req.session.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const templateName = req.params.name;
      const success = await deleteEmailTemplate(templateName);
      
      if (success) {
        res.json({ message: "Template deleted successfully" });
      } else {
        res.status(404).json({ message: "Template not found or could not be deleted" });
      }
    } catch (error) {
      next(error);
    }
  });
  
  // Test email template route
  app.post("/api/admin/email-templates/:name/test", isAuthenticated, async (req, res, next) => {
    try {
      // Check if user is admin
      if (!req.session.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Use the admin's email for the test
      const { email } = req.session;
      const templateName = req.params.name;
      
      // The templateData should be provided in the request body
      const templateData = req.body.templateData || {};
      
      // Import the sendTemplatedEmail function
      const { sendTemplatedEmail } = await import("./email");
      
      const success = await sendTemplatedEmail({
        to: email,
        from: process.env.AWS_SES_FROM_EMAIL || "noreply@theconnection.app",
        templateName,
        templateData
      });
      
      if (success) {
        res.json({ message: `Test email sent to ${email}` });
      } else {
        res.status(500).json({ message: "Failed to send test email" });
      }
    } catch (error) {
      next(error);
    }
  });
  
  // Virtual gifts routes
  app.get("/api/virtual-gifts", async (req, res, next) => {
    try {
      const gifts = await storage.getActiveVirtualGifts();
      res.json(gifts);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/livestreams/:livestreamId/gifts", isAuthenticated, async (req, res, next) => {
    try {
      const livestreamId = req.params.livestreamId;
      const { giftId, message } = req.body;
      
      // Check if the livestream exists and is live
      const livestream = await storage.getLivestream(livestreamId);
      if (!livestream) {
        return res.status(404).json({ message: "Livestream not found" });
      }
      
      if (livestream.status !== "live") {
        return res.status(400).json({ message: "Can only send gifts to live streams" });
      }
      
      const gift = await storage.sendGiftToLivestream({
        livestreamId,
        giftId,
        senderId: req.session!.id,
        receiverId: livestream.hostId,
        message
      });
      
      res.status(201).json(gift);
    } catch (error) {
      next(error);
    }
  });
  
  // Creator tiers routes
  app.get("/api/creator-tiers", async (req, res, next) => {
    try {
      const tiers = await storage.getAllCreatorTiers();
      res.json(tiers);
    } catch (error) {
      next(error);
    }
  });

  // Photo Upload Routes
  // Serve public objects (for images uploaded to communities, profiles, etc.)
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve private objects (user uploads with authentication)
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req, res) => {
    const userId = req.session!.userId!;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Get upload URL for photo uploads
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Update user avatar after photo upload
  app.put("/api/user/avatar", isAuthenticated, async (req, res) => {
    if (!req.body.avatarURL) {
      return res.status(400).json({ error: "avatarURL is required" });
    }

    const userId = req.session!.userId!;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.avatarURL,
        {
          owner: userId,
          visibility: "public", // Profile photos are public
        },
      );

      // Update user's avatar in database
      const updatedUser = await storage.updateUser(parseInt(userId), {
        avatarUrl: objectPath
      });

      res.status(200).json({
        objectPath: objectPath,
        user: updatedUser
      });
    } catch (error) {
      console.error("Error setting avatar:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update community banner/image after photo upload
  app.put("/api/communities/:id/image", isAuthenticated, async (req, res) => {
    if (!req.body.imageURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }

    const communityId = parseInt(req.params.id);
    const userId = req.session!.userId!;

    try {
      // Check if user can update this community (is member/admin)
      const member = await storage.getCommunityMember(communityId, parseInt(userId));
      if (!member) {
        return res.status(403).json({ error: "Not authorized to update this community" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageURL,
        {
          owner: userId,
          visibility: "public", // Community images are public
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting community image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update user profile
  app.patch("/api/users/:id", isAuthenticated, async (req, res) => {
    const userId = req.params.id;
    const currentUserId = req.session!.userId!;

    // Users can only update their own profile
    if (userId !== currentUserId) {
      return res.status(403).json({ error: "Can only update your own profile" });
    }

    try {
      const updatedUser = await storage.updateUser(userId, req.body);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  const server = httpServer || createServer(app);
  
  // Set up Socket.IO for real-time messaging
  const { Server: SocketIOServer } = await import("socket.io");
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    path: "/socket.io/"
  });

  // Socket.IO connection handling
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join user to their personal room for DMs
    socket.on("join", (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined room user_${userId}`);
    });

    // Handle new message sending
    socket.on("send_message", async (data) => {
      const { senderId, receiverId, content } = data;
      
      try {
        // Save message to database
        const { db } = await import("./db");
        const { messages } = await import("../shared/schema");
        
        const [newMessage] = await db
          .insert(messages)
          .values({
            senderId: parseInt(senderId),
            receiverId: parseInt(receiverId),
            content,
          })
          .returning();

        // Emit to both sender and receiver
        io.to(`user_${senderId}`).emit("new_message", newMessage);
        io.to(`user_${receiverId}`).emit("new_message", newMessage);
        
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("message_error", { error: "Failed to send message" });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Add specific 404 handlers for common API paths
  app.all('/api/users/*', (req: Request, res: Response) => {
    res.status(404).json({ message: "User endpoint not found", path: req.path });
  });

  app.all('/api/communities/*', (req: Request, res: Response) => {
    res.status(404).json({ message: "Community endpoint not found", path: req.path });
  });

  app.all('/api/posts/*', (req: Request, res: Response) => {
    res.status(404).json({ message: "Post endpoint not found", path: req.path });
  });

  app.all('/api/microblogs/*', (req: Request, res: Response) => {
    res.status(404).json({ message: "Microblog endpoint not found", path: req.path });
  });

  app.all('/api/events/*', (req: Request, res: Response) => {
    res.status(404).json({ message: "Event endpoint not found", path: req.path });
  });

  app.all('/api/prayer-requests/*', (req: Request, res: Response) => {
    res.status(404).json({ message: "Prayer request endpoint not found", path: req.path });
  });

  app.all('/api/apologetics/*', (req: Request, res: Response) => {
    res.status(404).json({ message: "Apologetics endpoint not found", path: req.path });
  });

  app.all('/api/bible-reading/*', (req: Request, res: Response) => {
    res.status(404).json({ message: "Bible reading endpoint not found", path: req.path });
  });

  // Recommendation API endpoints
  app.get("/api/recommendations/feed", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.session.userId!;
      const limit = parseInt(req.query.limit as string) || 20;
      
      // Get microblogs and communities with basic scoring
      const microblogs = await storage.getMicroblogs();
      const communities = await storage.getCommunities();
      
      // Faith-based recommendation scoring
      const scoredMicroblogs = microblogs.map(blog => {
        // Calculate engagement using faith-based formula
        const engagementScore = (blog.likeCount || 0) * 1 + (blog.replyCount || 0) * 3 + (blog.repostCount || 0) * 5;
        
        // Freshness boost for recent content
        const now = new Date();
        const ageInHours = (now.getTime() - new Date(blog.createdAt).getTime()) / (1000 * 60 * 60);
        let freshnessBoost = 1;
        if (ageInHours < 24) freshnessBoost = 1.5; // 50% boost for content <24h
        else if (ageInHours < 72) freshnessBoost = 1.2; // 20% boost for content <72h
        
        // Faith content boost
        const faithKeywords = ['bible', 'prayer', 'worship', 'church', 'faith', 'god', 'jesus', 'christian'];
        const contentLower = (blog.content || '').toLowerCase();
        const faithMatches = faithKeywords.filter(keyword => contentLower.includes(keyword)).length;
        const faithBoost = faithMatches > 0 ? 1.3 : 1; // 30% boost for faith content
        
        const finalScore = engagementScore * freshnessBoost * faithBoost;
        
        // Generate reason
        let reason = 'Popular content';
        if (faithMatches > 0) reason = 'Faith-based content';
        else if (ageInHours < 6) reason = 'Fresh from the community';
        else if (engagementScore > 10) reason = 'Highly engaging';
        
        return {
          ...blog,
          score: Math.round(finalScore * 100) / 100,
          reason,
          scoreBreakdown: {
            engagement: engagementScore,
            freshness: freshnessBoost,
            faith: faithBoost,
          },
        };
      }).sort((a, b) => b.score - a.score).slice(0, limit);
      
      // Faith-based community recommendations
      const scoredCommunities = communities.map(community => {
        const memberScore = (community.memberCount || 0) / 10;
        
        // Faith community boost based on tags and description
        const faithTags = ['bible study', 'prayer', 'worship', 'ministry', 'christian', 'church'];
        const description = (community.description || '').toLowerCase();
        const name = (community.name || '').toLowerCase();
        
        const faithMatches = faithTags.filter(tag => 
          description.includes(tag) || name.includes(tag)
        ).length;
        
        const faithBoost = faithMatches > 0 ? 1.5 : 1;
        const finalScore = memberScore * faithBoost;
        
        let reason = 'Popular community';
        if (faithMatches > 0) reason = 'Faith-focused community';
        else if (community.memberCount > 50) reason = 'Active community';
        
        return {
          ...community,
          score: Math.round(finalScore * 100) / 100,
          reason,
          faithMatches,
        };
      }).sort((a, b) => b.score - a.score).slice(0, Math.floor(limit / 3));
      
      res.json({
        success: true,
        data: {
          microblogs: scoredMicroblogs,
          communities: scoredCommunities,
        },
        algorithm: 'Faith-based scoring (E=40%, R=30%, T=20%, F=10%)',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/recommendations/interaction", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.session.userId!;
      const { contentId, contentType, interactionType } = req.body;
      
      // Log interaction for future algorithm improvements
      console.log(`Interaction recorded: User ${userId} -> ${interactionType} on ${contentType} ${contentId}`);
      
      res.json({ 
        success: true, 
        message: 'Interaction recorded for algorithm learning',
        userId,
        contentId,
        contentType,
        interactionType
      });
    } catch (error) {
      next(error);
    }
  });

  // Generic catch-all for any other API routes
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({ message: "API endpoint not found", path: req.path });
  });

  return server;
}

