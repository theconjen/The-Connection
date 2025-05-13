import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertCommunitySchema, 
  insertPostSchema, 
  insertCommentSchema,
  insertGroupSchema,
  insertGroupMemberSchema,
  insertApologeticsResourceSchema,
  insertLivestreamerApplicationSchema,
  insertLivestreamSchema
} from "@shared/schema";
import { ZodError } from "zod";

// Type guard for authenticated requests
function ensureAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Check if user is authenticated, but allow guest access (read-only) by continuing
function allowGuest(req: Request, res: Response, next: Function) {
  // Always continue to the next middleware, regardless of authentication status
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Communities routes
  app.get("/api/communities", async (req, res, next) => {
    try {
      const communities = await storage.getAllCommunities();
      res.json(communities);
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

  app.post("/api/communities", ensureAuthenticated, async (req, res, next) => {
    try {
      const validatedData = insertCommunitySchema.parse({
        ...req.body,
        createdBy: req.user?.id
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

  // Posts routes
  app.get("/api/posts", async (req, res, next) => {
    try {
      const filter = req.query.filter as string || "popular";
      const communitySlug = req.query.community as string;
      const groupId = req.query.groupId ? parseInt(req.query.groupId as string) : undefined;
      
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

  app.get("/api/posts/:id", async (req, res, next) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      res.json(post);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/posts", ensureAuthenticated, async (req, res, next) => {
    try {
      const validatedData = insertPostSchema.parse({
        ...req.body,
        authorId: req.user?.id
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
      const postId = parseInt(req.params.postId);
      const comments = await storage.getCommentsByPostId(postId);
      res.json(comments);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/comments", ensureAuthenticated, async (req, res, next) => {
    try {
      const validatedData = insertCommentSchema.parse({
        ...req.body,
        authorId: req.user?.id
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
  app.get("/api/groups", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const groups = await storage.getGroupsByUserId(userId);
      res.json(groups);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/groups", ensureAuthenticated, async (req, res, next) => {
    try {
      const validatedData = insertGroupSchema.parse({
        ...req.body,
        createdBy: req.user?.id
      });
      
      const group = await storage.createGroup(validatedData);
      
      // Add creator as admin member
      await storage.addGroupMember({
        groupId: group.id,
        userId: req.user!.id,
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

  app.post("/api/groups/:groupId/members", ensureAuthenticated, async (req, res, next) => {
    try {
      const groupId = parseInt(req.params.groupId);
      
      // Check if user is admin of the group
      const isAdmin = await storage.isGroupAdmin(groupId, req.user!.id);
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

  app.post("/api/apologetics", ensureAuthenticated, async (req, res, next) => {
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

  // Upvote routes
  app.post("/api/posts/:postId/upvote", ensureAuthenticated, async (req, res, next) => {
    try {
      const postId = parseInt(req.params.postId);
      const post = await storage.upvotePost(postId);
      res.json(post);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/comments/:commentId/upvote", ensureAuthenticated, async (req, res, next) => {
    try {
      const commentId = parseInt(req.params.commentId);
      const comment = await storage.upvoteComment(commentId);
      res.json(comment);
    } catch (error) {
      next(error);
    }
  });
  
  // Livestream routes
  app.get("/api/livestreams", async (req, res, next) => {
    try {
      const status = req.query.status as string;
      const livestreams = await storage.getLivestreams(status);
      res.json(livestreams);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/livestreams/:id", async (req, res, next) => {
    try {
      const livestreamId = parseInt(req.params.id);
      const livestream = await storage.getLivestream(livestreamId);
      
      if (!livestream) {
        return res.status(404).json({ message: "Livestream not found" });
      }
      
      res.json(livestream);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/livestreams", ensureAuthenticated, async (req, res, next) => {
    try {
      // Check if user is approved to create livestreams
      const isApproved = await storage.isApprovedLivestreamer(req.user!.id);
      if (!isApproved) {
        return res.status(403).json({ 
          message: "You need to be an approved livestreamer to create streams. Please apply first." 
        });
      }
      
      const validatedData = insertLivestreamSchema.parse({
        ...req.body,
        hostId: req.user?.id
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
  app.get("/api/livestreamer-application", ensureAuthenticated, async (req, res, next) => {
    try {
      const application = await storage.getLivestreamerApplicationByUserId(req.user!.id);
      res.json(application || null);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/livestreamer-application", ensureAuthenticated, async (req, res, next) => {
    try {
      // Check if user already has an application
      const existingApplication = await storage.getLivestreamerApplicationByUserId(req.user!.id);
      if (existingApplication) {
        return res.status(400).json({ message: "You already have a pending application" });
      }
      
      const validatedData = insertLivestreamerApplicationSchema.parse({
        ...req.body,
        userId: req.user?.id
      });
      
      const application = await storage.createLivestreamerApplication(validatedData);
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      next(error);
    }
  });
  
  // Admin routes for reviewing applications
  app.get("/api/admin/livestreamer-applications", ensureAuthenticated, async (req, res, next) => {
    try {
      // Check if user is admin
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const applications = await storage.getPendingLivestreamerApplications();
      res.json(applications);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/admin/livestreamer-applications/:id", ensureAuthenticated, async (req, res, next) => {
    try {
      // Check if user is admin
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const applicationId = parseInt(req.params.id);
      const { status, reviewNotes } = req.body;
      
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const application = await storage.updateLivestreamerApplication(
        applicationId, 
        status, 
        reviewNotes, 
        req.user.id
      );
      
      res.json(application);
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
  
  app.post("/api/livestreams/:livestreamId/gifts", ensureAuthenticated, async (req, res, next) => {
    try {
      const livestreamId = parseInt(req.params.livestreamId);
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
        senderId: req.user!.id,
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

  const httpServer = createServer(app);
  
  // Set up WebSocket server for livestreams
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Broadcast to all connected clients
        wss.clients.forEach((client) => {
          if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  return httpServer;
}
