import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertCommunitySchema, 
  insertPostSchema, 
  insertCommentSchema,
  insertGroupSchema,
  insertGroupMemberSchema,
  insertApologeticsResourceSchema
} from "@shared/schema";
import { ZodError } from "zod";

// Type guard for authenticated requests
function ensureAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
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

  const httpServer = createServer(app);

  return httpServer;
}
