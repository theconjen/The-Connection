import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  createEmailTemplate, 
  updateEmailTemplate,
  deleteEmailTemplate,
  getEmailTemplate,
  listEmailTemplates,
  EmailTemplateParams
} from "./email";
import { 
  insertCommunitySchema, 
  insertPostSchema, 
  insertCommentSchema,
  insertGroupSchema,
  insertGroupMemberSchema,
  insertApologeticsResourceSchema,
  insertLivestreamerApplicationSchema,
  insertLivestreamSchema,
  insertMicroblogSchema
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
      const topicId = parseInt(req.params.id);
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
  
  app.post("/api/apologetics/topics", ensureAuthenticated, async (req, res, next) => {
    try {
      // Only admins can create topics
      if (!req.user || req.user.isVerifiedApologeticsAnswerer !== true) {
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
      const questionId = parseInt(req.params.id);
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
      const topicId = parseInt(req.params.topicId);
      const questions = await storage.getApologeticsQuestionsByTopic(topicId);
      res.json(questions);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/apologetics/questions", ensureAuthenticated, async (req, res, next) => {
    try {
      // Add the current user ID as the author
      const validatedData = insertApologeticsQuestionSchema.parse({
        ...req.body,
        authorId: req.user.id
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
  
  app.put("/api/apologetics/questions/:id/status", ensureAuthenticated, async (req, res, next) => {
    try {
      // Only verified answerers can update question status
      if (!req.user || req.user.isVerifiedApologeticsAnswerer !== true) {
        return res.status(403).json({ message: "Only verified apologetics experts can update question status" });
      }
      
      const questionId = parseInt(req.params.id);
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
      const questionId = parseInt(req.params.questionId);
      const answers = await storage.getApologeticsAnswersByQuestion(questionId);
      res.json(answers);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/apologetics/answers", ensureAuthenticated, async (req, res, next) => {
    try {
      // Set verified flag based on user status
      const isVerified = req.user.isVerifiedApologeticsAnswerer === true;
      
      // Add the current user ID as the author
      const validatedData = insertApologeticsAnswerSchema.parse({
        ...req.body,
        authorId: req.user.id,
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
  
  app.post("/api/apologetics/answers/:id/upvote", ensureAuthenticated, async (req, res, next) => {
    try {
      const answerId = parseInt(req.params.id);
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
  
  app.put("/api/users/:userId/verified-apologetics-answerer", ensureAuthenticated, async (req, res, next) => {
    try {
      // Only admins can set verified status (for now let's assume only verified answerers can verify others)
      if (!req.user || req.user.isVerifiedApologeticsAnswerer !== true) {
        return res.status(403).json({ message: "Only verified apologetics experts can verify others" });
      }
      
      const userId = parseInt(req.params.userId);
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
      const microblogId = parseInt(req.params.id);
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
      const microblogId = parseInt(req.params.id);
      const replies = await storage.getMicroblogReplies(microblogId);
      res.json(replies);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/users/:userId/microblogs", async (req, res, next) => {
    try {
      const userId = parseInt(req.params.userId);
      const microblogs = await storage.getMicroblogsByUserId(userId);
      res.json(microblogs);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/communities/:communityId/microblogs", async (req, res, next) => {
    try {
      const communityId = parseInt(req.params.communityId);
      const microblogs = await storage.getMicroblogsByCommunityId(communityId);
      res.json(microblogs);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/groups/:groupId/microblogs", ensureAuthenticated, async (req, res, next) => {
    try {
      const groupId = parseInt(req.params.groupId);
      
      // Check if user is a member of this group
      const members = await storage.getGroupMembers(groupId);
      const isMember = members.some(member => member.userId === req.user?.id);
      
      if (!isMember) {
        return res.status(403).json({ message: "You are not a member of this group" });
      }
      
      const microblogs = await storage.getMicroblogsByGroupId(groupId);
      res.json(microblogs);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/microblogs", ensureAuthenticated, async (req, res, next) => {
    try {
      // Character limit validation for Twitter-like posts (280 chars)
      if (req.body.content && req.body.content.length > 280) {
        return res.status(400).json({ message: "Content exceeds 280 character limit" });
      }
      
      // If posting to a group, verify membership
      if (req.body.groupId) {
        const groupId = parseInt(req.body.groupId);
        const members = await storage.getGroupMembers(groupId);
        const isMember = members.some(member => member.userId === req.user?.id);
        
        if (!isMember) {
          return res.status(403).json({ message: "You are not a member of this group" });
        }
      }
      
      const validatedData = insertMicroblogSchema.parse({
        ...req.body,
        authorId: req.user?.id
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
  
  app.post("/api/microblogs/:id/like", ensureAuthenticated, async (req, res, next) => {
    try {
      const microblogId = parseInt(req.params.id);
      const like = await storage.likeMicroblog(microblogId, req.user!.id);
      res.status(201).json(like);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/microblogs/:id/like", ensureAuthenticated, async (req, res, next) => {
    try {
      const microblogId = parseInt(req.params.id);
      const result = await storage.unlikeMicroblog(microblogId, req.user!.id);
      
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
      const userId = parseInt(req.params.userId);
      const likedMicroblogIds = await storage.getUserLikedMicroblogs(userId);
      res.json(likedMicroblogIds);
    } catch (error) {
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
  
  // Admin routes for email templates
  app.get("/api/admin/email-templates", ensureAuthenticated, async (req, res, next) => {
    try {
      // Check if user is admin
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const templates = await listEmailTemplates();
      res.json(templates);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/admin/email-templates/:name", ensureAuthenticated, async (req, res, next) => {
    try {
      // Check if user is admin
      if (!req.user?.isAdmin) {
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
  
  app.post("/api/admin/email-templates", ensureAuthenticated, async (req, res, next) => {
    try {
      // Check if user is admin
      if (!req.user?.isAdmin) {
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
  
  app.put("/api/admin/email-templates/:name", ensureAuthenticated, async (req, res, next) => {
    try {
      // Check if user is admin
      if (!req.user?.isAdmin) {
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
  
  app.delete("/api/admin/email-templates/:name", ensureAuthenticated, async (req, res, next) => {
    try {
      // Check if user is admin
      if (!req.user?.isAdmin) {
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
  app.post("/api/admin/email-templates/:name/test", ensureAuthenticated, async (req, res, next) => {
    try {
      // Check if user is admin
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Use the admin's email for the test
      const { email } = req.user;
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
