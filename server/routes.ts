import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { getRecommendationsForUser } from "./recommendation-engine";
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
  insertPostSchema, 
  insertCommentSchema,
  insertGroupSchema,
  insertGroupMemberSchema,
  // Recommendation schemas
  insertUserPreferencesSchema,
  insertContentRecommendationSchema,
  insertApologeticsResourceSchema,
  insertApologeticsTopicSchema,
  insertApologeticsQuestionSchema,
  insertApologeticsAnswerSchema,
  insertLivestreamerApplicationSchema,
  insertLivestreamSchema,
  insertMicroblogSchema,
  
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

  // ========================
  // PRAYER REQUEST ROUTES
  // ========================
  
  // Get all prayer requests (with privacy filter)
  app.get("/api/prayer-requests", allowGuest, async (req, res) => {
    try {
      // If user is not authenticated, only return public prayers
      if (!req.isAuthenticated()) {
        const publicPrayers = await storage.getPublicPrayerRequests();
        return res.json(publicPrayers);
      }
      
      // Get filter from query string
      const filter = req.query.filter as string;
      const prayers = await storage.getAllPrayerRequests(filter);
      
      // Filter out non-public prayers that don't belong to the user
      const userId = req.user?.id;
      const filteredPrayers = prayers.filter(prayer => {
        // Public prayers are visible to all authenticated users
        if (prayer.privacyLevel === 'public') return true;
        
        // User's own prayers are always visible to them
        if (prayer.authorId === userId) return true;
        
        // Group-only prayers are only visible to group members
        if (prayer.privacyLevel === 'group-only' && prayer.groupId) {
          // We would need to check if user is in the group, but for simplicity
          // we'll return true here and implement the check in the storage method
          return true;
        }
        
        // Hide all other prayers (e.g., friends-only would need a friends system)
        return false;
      });
      
      res.json(filteredPrayers);
    } catch (error) {
      console.error("Error getting prayer requests:", error);
      res.status(500).json({ message: "Failed to get prayer requests" });
    }
  });
  
  // Get a specific prayer request
  app.get("/api/prayer-requests/:id", allowGuest, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const prayer = await storage.getPrayerRequest(id);
      
      if (!prayer) {
        return res.status(404).json({ message: "Prayer request not found" });
      }
      
      // Check privacy settings
      if (!req.isAuthenticated() && prayer.privacyLevel !== 'public') {
        return res.status(403).json({ message: "Unauthorized to view this prayer request" });
      }
      
      if (req.isAuthenticated() && prayer.privacyLevel === 'group-only' && prayer.groupId) {
        // Check if user is a member of the group
        // For simplicity, we're assuming this check happens in the storage method
      }
      
      res.json(prayer);
    } catch (error) {
      console.error("Error getting prayer request:", error);
      res.status(500).json({ message: "Failed to get prayer request" });
    }
  });
  
  // Get prayer requests for a user
  app.get("/api/users/:userId/prayer-requests", ensureAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Only allow users to see their own prayer requests or admins
      if (req.user?.id !== userId && !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const prayers = await storage.getUserPrayerRequests(userId);
      res.json(prayers);
    } catch (error) {
      console.error("Error getting user prayer requests:", error);
      res.status(500).json({ message: "Failed to get user prayer requests" });
    }
  });
  
  // Get prayer requests for a group
  app.get("/api/groups/:groupId/prayer-requests", ensureAuthenticated, async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      
      // Check if user is a member of the group
      const isGroupMember = await storage.isGroupMember(groupId, req.user?.id);
      if (!isGroupMember) {
        return res.status(403).json({ message: "Unauthorized: Not a group member" });
      }
      
      const prayers = await storage.getGroupPrayerRequests(groupId);
      res.json(prayers);
    } catch (error) {
      console.error("Error getting group prayer requests:", error);
      res.status(500).json({ message: "Failed to get group prayer requests" });
    }
  });
  
  // Create a new prayer request
  app.post("/api/prayer-requests", ensureAuthenticated, async (req, res) => {
    try {
      const prayerData = insertPrayerRequestSchema.parse(req.body);
      
      // If group privacy, verify the user is a member of the group
      if (prayerData.privacyLevel === 'group-only' && prayerData.groupId) {
        const isGroupMember = await storage.isGroupMember(prayerData.groupId, req.user?.id);
        if (!isGroupMember) {
          return res.status(403).json({ message: "Unauthorized: Not a group member" });
        }
      }
      
      // Set the author ID to the current user
      const prayer = await storage.createPrayerRequest({
        ...prayerData,
        authorId: req.user?.id
      });
      
      res.status(201).json(prayer);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid prayer request data", errors: error.errors });
      }
      console.error("Error creating prayer request:", error);
      res.status(500).json({ message: "Failed to create prayer request" });
    }
  });
  
  // Update a prayer request
  app.patch("/api/prayer-requests/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const prayer = await storage.getPrayerRequest(id);
      
      if (!prayer) {
        return res.status(404).json({ message: "Prayer request not found" });
      }
      
      // Only allow the author or an admin to update the prayer
      if (prayer.authorId !== req.user?.id && !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updatedPrayer = await storage.updatePrayerRequest(id, req.body);
      res.json(updatedPrayer);
    } catch (error) {
      console.error("Error updating prayer request:", error);
      res.status(500).json({ message: "Failed to update prayer request" });
    }
  });
  
  // Mark a prayer request as answered
  app.post("/api/prayer-requests/:id/answer", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { description } = req.body;
      
      const prayer = await storage.getPrayerRequest(id);
      
      if (!prayer) {
        return res.status(404).json({ message: "Prayer request not found" });
      }
      
      // Only allow the author to mark as answered
      if (prayer.authorId !== req.user?.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updatedPrayer = await storage.markPrayerRequestAsAnswered(id, description);
      res.json(updatedPrayer);
    } catch (error) {
      console.error("Error marking prayer request as answered:", error);
      res.status(500).json({ message: "Failed to mark prayer request as answered" });
    }
  });
  
  // Delete a prayer request
  app.delete("/api/prayer-requests/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const prayer = await storage.getPrayerRequest(id);
      
      if (!prayer) {
        return res.status(404).json({ message: "Prayer request not found" });
      }
      
      // Only allow the author or an admin to delete the prayer
      if (prayer.authorId !== req.user?.id && !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const result = await storage.deletePrayerRequest(id);
      
      if (result) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete prayer request" });
      }
    } catch (error) {
      console.error("Error deleting prayer request:", error);
      res.status(500).json({ message: "Failed to delete prayer request" });
    }
  });
  
  // Pray for a prayer request
  app.post("/api/prayer-requests/:id/pray", ensureAuthenticated, async (req, res) => {
    try {
      const prayerRequestId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      const prayer = await storage.createPrayer({
        prayerRequestId,
        userId
      });
      
      res.status(201).json(prayer);
    } catch (error) {
      console.error("Error praying for request:", error);
      res.status(500).json({ message: "Failed to record prayer" });
    }
  });
  
  // Get all prayers for a prayer request
  app.get("/api/prayer-requests/:id/prayers", allowGuest, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const prayers = await storage.getPrayersForRequest(id);
      res.json(prayers);
    } catch (error) {
      console.error("Error getting prayers:", error);
      res.status(500).json({ message: "Failed to get prayers" });
    }
  });
  
  // Get all prayer requests a user has prayed for
  app.get("/api/users/:userId/prayed", ensureAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Users can only see their own prayed requests
      if (req.user?.id !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const prayedRequestIds = await storage.getUserPrayedRequests(userId);
      res.json(prayedRequestIds);
    } catch (error) {
      console.error("Error getting user's prayed requests:", error);
      res.status(500).json({ message: "Failed to get user's prayed requests" });
    }
  });

  // Community Events Calendar routes
  app.get("/api/events", allowGuest, async (req, res) => {
    try {
      const filter = req.query.filter as string;
      const events = await storage.getAllEvents(filter);
      res.json(events);
    } catch (error) {
      console.error("Error getting events:", error);
      res.status(500).json({ message: "Failed to get events" });
    }
  });

  app.get("/api/events/public", allowGuest, async (req, res) => {
    try {
      const events = await storage.getPublicEvents();
      res.json(events);
    } catch (error) {
      console.error("Error getting public events:", error);
      res.status(500).json({ message: "Failed to get public events" });
    }
  });
  
  // ========================
  // BIBLE STUDY TOOLS ROUTES
  // ========================
  
  // Bible Reading Plans routes
  app.get("/api/bible/reading-plans/public", allowGuest, async (req, res) => {
    try {
      const plans = await storage.getAllBibleReadingPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error getting public Bible reading plans:", error);
      res.status(500).json({ message: "Failed to get reading plans" });
    }
  });
  
  app.get("/api/bible/reading-plans/user", ensureAuthenticated, async (req, res) => {
    try {
      // @ts-ignore
      const userId = req.user.id;
      const plans = await storage.getUserBibleReadingPlans(userId);
      res.json(plans);
    } catch (error) {
      console.error("Error getting user's Bible reading plans:", error);
      res.status(500).json({ message: "Failed to get user's reading plans" });
    }
  });
  
  app.get("/api/bible/reading-plans/group/:groupId", ensureAuthenticated, async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const plans = await storage.getGroupBibleReadingPlans(groupId);
      res.json(plans);
    } catch (error) {
      console.error("Error getting group Bible reading plans:", error);
      res.status(500).json({ message: "Failed to get group's reading plans" });
    }
  });
  
  app.post("/api/bible/reading-plans", ensureAuthenticated, async (req, res) => {
    try {
      // @ts-ignore
      const creatorId = req.user.id;
      const readingPlan = {
        ...req.body,
        creatorId
      };
      const plan = await storage.createBibleReadingPlan(readingPlan);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating Bible reading plan:", error);
      res.status(500).json({ message: "Failed to create reading plan" });
    }
  });
  
  // Bible Reading Progress routes
  app.get("/api/bible/reading-progress", ensureAuthenticated, async (req, res) => {
    try {
      // @ts-ignore
      const userId = req.user.id;
      const progress = await storage.getUserReadingProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error getting user's reading progress:", error);
      res.status(500).json({ message: "Failed to get reading progress" });
    }
  });
  
  app.post("/api/bible/reading-progress", ensureAuthenticated, async (req, res) => {
    try {
      // @ts-ignore
      const userId = req.user.id;
      const progressData = {
        ...req.body,
        userId
      };
      const progress = await storage.createBibleReadingProgress(progressData);
      res.status(201).json(progress);
    } catch (error) {
      console.error("Error creating reading progress:", error);
      res.status(500).json({ message: "Failed to create reading progress" });
    }
  });
  
  app.patch("/api/bible/reading-progress/:progressId/complete-day/:day", ensureAuthenticated, async (req, res) => {
    try {
      const progressId = parseInt(req.params.progressId);
      const day = parseInt(req.params.day);
      const progress = await storage.markDayCompleted(progressId, day);
      res.json(progress);
    } catch (error) {
      console.error("Error marking day as completed:", error);
      res.status(500).json({ message: "Failed to update reading progress" });
    }
  });
  
  // Bible Study Notes routes
  app.get("/api/bible/study-notes", ensureAuthenticated, async (req, res) => {
    try {
      // @ts-ignore
      const userId = req.user.id;
      const filter = { userId };
      const notes = await storage.getBibleStudyNotes(filter);
      res.json(notes);
    } catch (error) {
      console.error("Error getting Bible study notes:", error);
      res.status(500).json({ message: "Failed to get study notes" });
    }
  });
  
  app.get("/api/bible/study-notes/public", allowGuest, async (req, res) => {
    try {
      const filter = { isPublic: true };
      const notes = await storage.getBibleStudyNotes(filter);
      res.json(notes);
    } catch (error) {
      console.error("Error getting public Bible study notes:", error);
      res.status(500).json({ message: "Failed to get public study notes" });
    }
  });
  
  app.get("/api/bible/study-notes/group/:groupId", ensureAuthenticated, async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const filter = { groupId };
      const notes = await storage.getBibleStudyNotes(filter);
      res.json(notes);
    } catch (error) {
      console.error("Error getting group Bible study notes:", error);
      res.status(500).json({ message: "Failed to get group study notes" });
    }
  });
  
  app.post("/api/bible/study-notes", ensureAuthenticated, async (req, res) => {
    try {
      // @ts-ignore
      const userId = req.user.id;
      const noteData = {
        ...req.body,
        userId
      };
      const note = await storage.createBibleStudyNote(noteData);
      res.status(201).json(note);
    } catch (error) {
      console.error("Error creating Bible study note:", error);
      res.status(500).json({ message: "Failed to create study note" });
    }
  });
  
  // Verse Memorization routes
  app.get("/api/bible/memorization", ensureAuthenticated, async (req, res) => {
    try {
      // @ts-ignore
      const userId = req.user.id;
      const verses = await storage.getUserVerseMemorization(userId);
      res.json(verses);
    } catch (error) {
      console.error("Error getting verse memorization:", error);
      res.status(500).json({ message: "Failed to get memorization verses" });
    }
  });
  
  app.post("/api/bible/memorization", ensureAuthenticated, async (req, res) => {
    try {
      // @ts-ignore
      const userId = req.user.id;
      const verseData = {
        ...req.body,
        userId
      };
      const verse = await storage.createVerseMemorization(verseData);
      res.status(201).json(verse);
    } catch (error) {
      console.error("Error creating verse memorization:", error);
      res.status(500).json({ message: "Failed to create verse memorization" });
    }
  });
  
  app.patch("/api/bible/memorization/:id/mark-mastered", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const verse = await storage.markVerseMastered(id);
      res.json(verse);
    } catch (error) {
      console.error("Error marking verse as mastered:", error);
      res.status(500).json({ message: "Failed to update verse memorization" });
    }
  });
  
  app.patch("/api/bible/memorization/:id/add-review", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const verse = await storage.addVerseReviewDate(id);
      res.json(verse);
    } catch (error) {
      console.error("Error adding verse review date:", error);
      res.status(500).json({ message: "Failed to update verse memorization" });
    }
  });

  app.get("/api/events/nearby", allowGuest, async (req, res) => {
    try {
      const { latitude, longitude, radius } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }
      
      const radiusInKm = radius ? parseInt(radius as string) : 10; // Default to 10km
      const events = await storage.getEventsNearby(
        latitude as string,
        longitude as string,
        radiusInKm
      );
      
      res.json(events);
    } catch (error) {
      console.error("Error getting nearby events:", error);
      res.status(500).json({ message: "Failed to get nearby events" });
    }
  });

  app.get("/api/events/:id", allowGuest, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getEvent(id);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // If event is not public and user is not authenticated, deny access
      if (!event.isPublic && !req.isAuthenticated()) {
        return res.status(403).json({ message: "This event is private" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error getting event:", error);
      res.status(500).json({ message: "Failed to get event" });
    }
  });

  app.get("/api/communities/:communityId/events", allowGuest, async (req, res) => {
    try {
      const communityId = parseInt(req.params.communityId);
      const events = await storage.getEventsByCommunity(communityId);
      res.json(events);
    } catch (error) {
      console.error("Error getting community events:", error);
      res.status(500).json({ message: "Failed to get community events" });
    }
  });

  app.get("/api/groups/:groupId/events", ensureAuthenticated, async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      
      // Check if user is a member of the group
      const isMember = await storage.isGroupMember(req.user.id, groupId);
      if (!isMember) {
        return res.status(403).json({ message: "You must be a member of the group to view its events" });
      }
      
      const events = await storage.getEventsByGroup(groupId);
      res.json(events);
    } catch (error) {
      console.error("Error getting group events:", error);
      res.status(500).json({ message: "Failed to get group events" });
    }
  });

  app.get("/api/user/events", ensureAuthenticated, async (req, res) => {
    try {
      const events = await storage.getEventsByUser(req.user.id);
      res.json(events);
    } catch (error) {
      console.error("Error getting user events:", error);
      res.status(500).json({ message: "Failed to get user events" });
    }
  });

  app.post("/api/events", ensureAuthenticated, async (req, res) => {
    try {
      // Validate the request data
      const eventData = insertEventSchema.parse({
        ...req.body,
        creatorId: req.user.id
      });
      
      // If this is a group event, check if user is a member of the group
      if (eventData.groupId) {
        const isMember = await storage.isGroupMember(req.user.id, eventData.groupId);
        if (!isMember) {
          return res.status(403).json({ message: "You must be a member of the group to create events for it" });
        }
      }
      
      // Create the event
      const event = await storage.createEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.patch("/api/events/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getEvent(id);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Only the creator can update the event
      if (event.creatorId !== req.user.id) {
        return res.status(403).json({ message: "You can only update events you created" });
      }
      
      const updatedEvent = await storage.updateEvent(id, req.body);
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getEvent(id);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Only the creator can delete the event
      if (event.creatorId !== req.user.id) {
        return res.status(403).json({ message: "You can only delete events you created" });
      }
      
      await storage.deleteEvent(id);
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Event RSVP routes
  app.get("/api/events/:eventId/rsvps", allowGuest, async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const rsvps = await storage.getEventRsvps(eventId);
      res.json(rsvps);
    } catch (error) {
      console.error("Error getting event RSVPs:", error);
      res.status(500).json({ message: "Failed to get event RSVPs" });
    }
  });

  app.get("/api/events/:eventId/rsvp", ensureAuthenticated, async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const rsvp = await storage.getUserEventRsvp(eventId, req.user.id);
      
      if (!rsvp) {
        return res.status(404).json({ message: "RSVP not found" });
      }
      
      res.json(rsvp);
    } catch (error) {
      console.error("Error getting user RSVP:", error);
      res.status(500).json({ message: "Failed to get user RSVP" });
    }
  });

  app.post("/api/events/:eventId/rsvp", ensureAuthenticated, async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // If this is a group event, check if user is a member of the group
      if (event.groupId) {
        const isMember = await storage.isGroupMember(req.user.id, event.groupId);
        if (!isMember) {
          return res.status(403).json({ message: "You must be a member of the group to RSVP to its events" });
        }
      }
      
      // Check if user already has an RSVP
      const existingRsvp = await storage.getUserEventRsvp(eventId, req.user.id);
      if (existingRsvp) {
        return res.status(400).json({ message: "You have already RSVP'd to this event" });
      }
      
      // Create the RSVP
      const { status } = req.body;
      if (!status || !["going", "maybe", "not_going"].includes(status)) {
        return res.status(400).json({ message: "Valid status (going, maybe, not_going) is required" });
      }
      
      const rsvpData = insertEventRsvpSchema.parse({
        eventId,
        userId: req.user.id,
        status
      });
      
      const rsvp = await storage.createEventRsvp(rsvpData);
      res.status(201).json(rsvp);
    } catch (error) {
      console.error("Error creating RSVP:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create RSVP" });
    }
  });

  app.patch("/api/events/:eventId/rsvp", ensureAuthenticated, async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const rsvp = await storage.getUserEventRsvp(eventId, req.user.id);
      
      if (!rsvp) {
        return res.status(404).json({ message: "RSVP not found" });
      }
      
      const { status } = req.body;
      if (!status || !["going", "maybe", "not_going"].includes(status)) {
        return res.status(400).json({ message: "Valid status (going, maybe, not_going) is required" });
      }
      
      const updatedRsvp = await storage.updateEventRsvp(rsvp.id, status);
      res.json(updatedRsvp);
    } catch (error) {
      console.error("Error updating RSVP:", error);
      res.status(500).json({ message: "Failed to update RSVP" });
    }
  });

  // ========================
  // BIBLE STUDY TOOLS ROUTES
  // ========================

  // Reading Plans
  app.get("/api/bible-reading-plans", allowGuest, async (req, res) => {
    try {
      let plans;
      const filter = req.query.filter as string;
      
      if (req.isAuthenticated() && req.query.mine === "true") {
        plans = await storage.getUserBibleReadingPlans(req.user.id);
      } else if (req.query.groupId) {
        const groupId = parseInt(req.query.groupId as string);
        plans = await storage.getGroupBibleReadingPlans(groupId);
      } else {
        plans = await storage.getAllBibleReadingPlans(filter);
      }
      
      res.json(plans);
    } catch (error) {
      console.error("Error getting reading plans:", error);
      res.status(500).json({ message: "Failed to get reading plans" });
    }
  });

  app.get("/api/bible-reading-plans/:id", allowGuest, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const plan = await storage.getBibleReadingPlan(id);
      
      if (!plan) {
        return res.status(404).json({ message: "Reading plan not found" });
      }
      
      // If not public and not creator, check if it's a group plan and user is member
      if (!plan.isPublic && (!req.user || plan.creatorId !== req.user.id)) {
        if (plan.groupId) {
          const isMember = req.user && await storage.isGroupMember(req.user.id, plan.groupId);
          if (!isMember) {
            return res.status(403).json({ message: "You don't have access to this reading plan" });
          }
        } else {
          return res.status(403).json({ message: "You don't have access to this reading plan" });
        }
      }
      
      res.json(plan);
    } catch (error) {
      console.error("Error getting reading plan:", error);
      res.status(500).json({ message: "Failed to get reading plan" });
    }
  });

  app.post("/api/bible-reading-plans", ensureAuthenticated, async (req, res) => {
    try {
      const planData = insertBibleReadingPlanSchema.parse({
        ...req.body,
        creatorId: req.user.id
      });
      
      // If it's a group plan, verify the user is a member
      if (planData.groupId) {
        const isMember = await storage.isGroupMember(req.user.id, planData.groupId);
        if (!isMember) {
          return res.status(403).json({ message: "You must be a member of the group to create a reading plan for it" });
        }
      }
      
      const plan = await storage.createBibleReadingPlan(planData);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating reading plan:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create reading plan" });
    }
  });

  app.patch("/api/bible-reading-plans/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const plan = await storage.getBibleReadingPlan(id);
      
      if (!plan) {
        return res.status(404).json({ message: "Reading plan not found" });
      }
      
      // Only creator can update the plan
      if (plan.creatorId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to update this reading plan" });
      }
      
      const updates = {
        ...req.body,
        // Don't allow changing creator
        creatorId: plan.creatorId
      };
      
      const updatedPlan = await storage.updateBibleReadingPlan(id, updates);
      res.json(updatedPlan);
    } catch (error) {
      console.error("Error updating reading plan:", error);
      res.status(500).json({ message: "Failed to update reading plan" });
    }
  });

  app.delete("/api/bible-reading-plans/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const plan = await storage.getBibleReadingPlan(id);
      
      if (!plan) {
        return res.status(404).json({ message: "Reading plan not found" });
      }
      
      // Only creator can delete the plan
      if (plan.creatorId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this reading plan" });
      }
      
      await storage.deleteBibleReadingPlan(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting reading plan:", error);
      res.status(500).json({ message: "Failed to delete reading plan" });
    }
  });

  // Reading Progress
  app.get("/api/bible-reading-progress", ensureAuthenticated, async (req, res) => {
    try {
      const progress = await storage.getUserReadingProgress(req.user.id);
      res.json(progress);
    } catch (error) {
      console.error("Error getting reading progress:", error);
      res.status(500).json({ message: "Failed to get reading progress" });
    }
  });

  app.get("/api/bible-reading-plans/:planId/progress", ensureAuthenticated, async (req, res) => {
    try {
      const planId = parseInt(req.params.planId);
      const progress = await storage.getBibleReadingProgress(req.user.id, planId);
      
      if (!progress) {
        return res.status(404).json({ message: "Reading progress not found" });
      }
      
      res.json(progress);
    } catch (error) {
      console.error("Error getting reading progress:", error);
      res.status(500).json({ message: "Failed to get reading progress" });
    }
  });

  app.post("/api/bible-reading-plans/:planId/progress", ensureAuthenticated, async (req, res) => {
    try {
      const planId = parseInt(req.params.planId);
      const plan = await storage.getBibleReadingPlan(planId);
      
      if (!plan) {
        return res.status(404).json({ message: "Reading plan not found" });
      }
      
      // Check if user can access this plan
      if (!plan.isPublic && plan.creatorId !== req.user.id) {
        if (plan.groupId) {
          const isMember = await storage.isGroupMember(req.user.id, plan.groupId);
          if (!isMember) {
            return res.status(403).json({ message: "You don't have access to this reading plan" });
          }
        } else {
          return res.status(403).json({ message: "You don't have access to this reading plan" });
        }
      }
      
      // Check if progress already exists
      const existingProgress = await storage.getBibleReadingProgress(req.user.id, planId);
      if (existingProgress) {
        return res.status(400).json({ message: "You've already started this reading plan" });
      }
      
      const progressData = insertBibleReadingProgressSchema.parse({
        planId,
        userId: req.user.id
      });
      
      const progress = await storage.createBibleReadingProgress(progressData);
      res.status(201).json(progress);
    } catch (error) {
      console.error("Error starting reading progress:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to start reading progress" });
    }
  });

  app.post("/api/bible-reading-progress/:progressId/complete-day", ensureAuthenticated, async (req, res) => {
    try {
      const progressId = parseInt(req.params.progressId);
      const { day } = req.body;
      
      if (!day || typeof day !== 'number' || day < 1) {
        return res.status(400).json({ message: "Valid day number is required" });
      }
      
      const progress = await storage.markDayCompleted(progressId, day);
      res.json(progress);
    } catch (error) {
      console.error("Error completing reading day:", error);
      res.status(500).json({ message: "Failed to complete reading day" });
    }
  });

  // Bible Study Notes
  app.get("/api/bible-study-notes", allowGuest, async (req, res) => {
    try {
      const filter: { userId?: number, groupId?: number, isPublic?: boolean } = {};
      
      // Only fetch user's private notes when authenticated
      if (req.query.mine === "true") {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ message: "You must be logged in to view your notes" });
        }
        filter.userId = req.user.id;
      }
      
      if (req.query.groupId) {
        filter.groupId = parseInt(req.query.groupId as string);
      }
      
      if (req.query.public === "true") {
        filter.isPublic = true;
      }
      
      const notes = await storage.getBibleStudyNotes(filter);
      res.json(notes);
    } catch (error) {
      console.error("Error getting bible study notes:", error);
      res.status(500).json({ message: "Failed to get bible study notes" });
    }
  });

  app.get("/api/bible-study-notes/:id", allowGuest, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const note = await storage.getBibleStudyNote(id);
      
      if (!note) {
        return res.status(404).json({ message: "Bible study note not found" });
      }
      
      // Check if user can access this note
      if (!note.isPublic && (!req.isAuthenticated() || note.userId !== req.user.id)) {
        if (note.groupId) {
          const isMember = req.isAuthenticated() && await storage.isGroupMember(req.user.id, note.groupId);
          if (!isMember) {
            return res.status(403).json({ message: "You don't have access to this note" });
          }
        } else {
          return res.status(403).json({ message: "You don't have access to this note" });
        }
      }
      
      res.json(note);
    } catch (error) {
      console.error("Error getting bible study note:", error);
      res.status(500).json({ message: "Failed to get bible study note" });
    }
  });

  app.post("/api/bible-study-notes", ensureAuthenticated, async (req, res) => {
    try {
      const noteData = insertBibleStudyNotesSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // If it's a group note, verify the user is a member
      if (noteData.groupId) {
        const isMember = await storage.isGroupMember(req.user.id, noteData.groupId);
        if (!isMember) {
          return res.status(403).json({ message: "You must be a member of the group to create a note for it" });
        }
      }
      
      const note = await storage.createBibleStudyNote(noteData);
      res.status(201).json(note);
    } catch (error) {
      console.error("Error creating bible study note:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create bible study note" });
    }
  });

  app.patch("/api/bible-study-notes/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const note = await storage.getBibleStudyNote(id);
      
      if (!note) {
        return res.status(404).json({ message: "Bible study note not found" });
      }
      
      // Only owner can update the note
      if (note.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to update this note" });
      }
      
      const updates = {
        ...req.body,
        // Don't allow changing owner
        userId: note.userId
      };
      
      const updatedNote = await storage.updateBibleStudyNote(id, updates);
      res.json(updatedNote);
    } catch (error) {
      console.error("Error updating bible study note:", error);
      res.status(500).json({ message: "Failed to update bible study note" });
    }
  });

  app.delete("/api/bible-study-notes/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const note = await storage.getBibleStudyNote(id);
      
      if (!note) {
        return res.status(404).json({ message: "Bible study note not found" });
      }
      
      // Only owner can delete the note
      if (note.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this note" });
      }
      
      await storage.deleteBibleStudyNote(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting bible study note:", error);
      res.status(500).json({ message: "Failed to delete bible study note" });
    }
  });

  // Verse Memorization
  app.get("/api/verse-memorization", ensureAuthenticated, async (req, res) => {
    try {
      const verses = await storage.getUserVerseMemorization(req.user.id);
      res.json(verses);
    } catch (error) {
      console.error("Error getting verse memorization:", error);
      res.status(500).json({ message: "Failed to get verse memorization" });
    }
  });

  app.get("/api/verse-memorization/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const verse = await storage.getVerseMemorization(id);
      
      if (!verse) {
        return res.status(404).json({ message: "Verse memorization not found" });
      }
      
      // Only owner can view their verse memorization
      if (verse.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to view this verse memorization" });
      }
      
      res.json(verse);
    } catch (error) {
      console.error("Error getting verse memorization:", error);
      res.status(500).json({ message: "Failed to get verse memorization" });
    }
  });

  app.post("/api/verse-memorization", ensureAuthenticated, async (req, res) => {
    try {
      const verseData = insertVerseMemorizationSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const verse = await storage.createVerseMemorization(verseData);
      res.status(201).json(verse);
    } catch (error) {
      console.error("Error creating verse memorization:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create verse memorization" });
    }
  });

  app.post("/api/verse-memorization/:id/mastered", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const verse = await storage.getVerseMemorization(id);
      
      if (!verse) {
        return res.status(404).json({ message: "Verse memorization not found" });
      }
      
      // Only owner can update their verse memorization
      if (verse.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to update this verse memorization" });
      }
      
      const updatedVerse = await storage.markVerseMastered(id);
      res.json(updatedVerse);
    } catch (error) {
      console.error("Error marking verse as mastered:", error);
      res.status(500).json({ message: "Failed to mark verse as mastered" });
    }
  });

  app.post("/api/verse-memorization/:id/review", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const verse = await storage.getVerseMemorization(id);
      
      if (!verse) {
        return res.status(404).json({ message: "Verse memorization not found" });
      }
      
      // Only owner can update their verse memorization
      if (verse.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to update this verse memorization" });
      }
      
      const updatedVerse = await storage.addVerseReviewDate(id);
      res.json(updatedVerse);
    } catch (error) {
      console.error("Error adding review date:", error);
      res.status(500).json({ message: "Failed to add review date" });
    }
  });

  app.delete("/api/verse-memorization/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const verse = await storage.getVerseMemorization(id);
      
      if (!verse) {
        return res.status(404).json({ message: "Verse memorization not found" });
      }
      
      // Only owner can delete their verse memorization
      if (verse.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this verse memorization" });
      }
      
      await storage.deleteVerseMemorization(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting verse memorization:", error);
      res.status(500).json({ message: "Failed to delete verse memorization" });
    }
  });

  // ========================
  // CONTENT RECOMMENDATIONS
  // ========================

  // Get personalized recommendations for the current user
  app.get("/api/recommendations", allowGuest, async (req, res) => {
    try {
      const userId = req.user?.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      if (userId) {
        // Get personalized recommendations for logged-in users
        const recommendations = await getRecommendationsForUser(userId, limit);
        res.json(recommendations);
      } else {
        // Get popular content for guests
        const popularContent = await getRecommendationsForUser(0, limit); // 0 as a special case for guest users
        res.json(popularContent);
      }
    } catch (error) {
      console.error("Error getting recommendations:", error);
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  // Get user preferences
  app.get("/api/user-preferences", ensureAuthenticated, async (req, res) => {
    try {
      const preferences = await storage.getUserPreferences(req.user.id);
      
      if (!preferences) {
        return res.status(404).json({ message: "Preferences not found" });
      }
      
      res.json(preferences);
    } catch (error) {
      console.error("Error getting user preferences:", error);
      res.status(500).json({ message: "Failed to get user preferences" });
    }
  });

  // Update user preferences
  app.patch("/api/user-preferences", ensureAuthenticated, async (req, res) => {
    try {
      const updateData = insertUserPreferencesSchema.partial().parse(req.body);
      const preferences = await storage.updateUserPreferences(req.user.id, updateData);
      res.json(preferences);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ message: "Failed to update user preferences" });
    }
  });

  // Track content engagement (view, like, comment, etc.)
  app.post("/api/recommendations/track-engagement", allowGuest, async (req, res) => {
    try {
      const { contentType, contentId, action } = req.body;
      const userId = req.user?.id;
      
      if (!userId) {
        // Just acknowledge for guests, no tracking
        return res.status(200).json({ success: true });
      }
      
      if (!contentType || !contentId || !action) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Get user preferences to update engagement history
      let preferences = await storage.getUserPreferences(userId);
      
      if (!preferences) {
        // Create preferences if they don't exist
        preferences = await storage.updateUserPreferences(userId, {
          userId,
          interests: [],
          favoriteTopics: [],
          engagementHistory: []
        });
      }
      
      // Update engagement history
      const updatedHistory = [
        {
          timestamp: new Date(),
          contentType,
          contentId,
          action
        },
        ...(preferences.engagementHistory || []).slice(0, 99) // Keep last 100 items
      ];
      
      // Save updated engagement history
      await storage.updateUserPreferences(userId, {
        userId,
        engagementHistory: updatedHistory
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking engagement:", error);
      res.status(500).json({ message: "Failed to track engagement" });
    }
  });

  // Mark a recommendation as viewed
  app.patch("/api/recommendations/:id/viewed", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.markRecommendationAsViewed(id);
      
      if (!success) {
        return res.status(404).json({ message: "Recommendation not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking recommendation as viewed:", error);
      res.status(500).json({ message: "Failed to mark recommendation as viewed" });
    }
  });

  return httpServer;
}
