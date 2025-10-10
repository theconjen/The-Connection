import { getUserId } from "./utils/session.js";
import { Server as SocketIOServer } from "socket.io";
import { setupAuth, isAuthenticated, isAdmin } from "./auth.js";
import { storage as storageReal } from "./storage-optimized.js";
const storage = storageReal;
import { insertCommunitySchema, insertPostSchema, insertCommentSchema, insertMicroblogSchema, insertPrayerRequestSchema, insertEventSchema, insertLivestreamerApplicationSchema, insertApologistScholarApplicationSchema } from "./shared/schema.js";
import { BASE_URL, EMAIL_FROM } from "./config/domain.js";
import { sendCommunityInvitationEmail } from "./email.js";
import { sendLivestreamerApplicationNotificationEmail, sendApplicationStatusUpdateEmail, sendApologistScholarApplicationNotificationEmail } from "./email-notifications.js";
import crypto from "crypto";
import path from "path";
import fs from "fs";
const generateToken = () => crypto.randomBytes(32).toString("hex");
import adminRoutes from "./routes/api/admin.js";
import userRoutes from "./routes/api/user.js";
import userSettingsRoutes from "./routes/userSettingsRoutes.js";
import dmRoutes from "./routes/dmRoutes.js";
import pushTokenRoutes from "./routes/pushTokens.js";
import mvpRoutes from "./routes/mvp.js";
import supportRoutes from "./routes/api/support.js";
import accountRoutes from "./routes/account.js";
import { FEATURES } from "./config/features.js";
import authRoutes from "./routes/auth.js";
import feedRoutes from "./routes/feed.js";
import postsRoutes from "./routes/posts.js";
import communitiesRoutes from "./routes/communities.js";
import eventsRoutes from "./routes/events.js";
import apologeticsRoutes from "./routes/apologetics.js";
import moderationRoutes from "./routes/moderation.js";
import safetyRoutes from "./routes/safety.js";
function registerRoutes(app, httpServer) {
  setupAuth(app);
  app.use((req, _res, next) => {
    const raw = req.session.userId;
    if (typeof raw === "string") {
      const n = Number(raw);
      if (Number.isFinite(n) && n > 0) {
        req.session.userId = n;
      } else {
        delete req.session.userId;
      }
    }
    next();
  });
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    socket.on("join_user_room", (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined room user_${userId}`);
    });
    socket.on("join_room", (roomId) => {
      socket.join(`room_${roomId}`);
      console.log(`User joined room ${roomId}`);
    });
    socket.on("leave_room", (roomId) => {
      socket.leave(`room_${roomId}`);
      console.log(`User left room ${roomId}`);
    });
    socket.on("new_message", async (data) => {
      try {
        const { roomId, content, senderId } = data;
        const newMessage = await storage.createChatMessage({
          chatRoomId: parseInt(roomId),
          senderId: parseInt(senderId),
          content
        });
        const sender = await storage.getUser(parseInt(senderId));
        const messageWithSender = { ...newMessage, sender };
        io.to(`room_${roomId}`).emit("message_received", messageWithSender);
      } catch (error) {
        console.error("Error handling chat message:", error);
      }
    });
    socket.on("send_dm", async (data) => {
      try {
        const { senderId, receiverId, content } = data;
        const newMessage = {
          senderId: parseInt(senderId),
          receiverId: parseInt(receiverId),
          content,
          createdAt: /* @__PURE__ */ new Date()
        };
        io.to(`user_${senderId}`).emit("new_message", newMessage);
        io.to(`user_${receiverId}`).emit("new_message", newMessage);
      } catch (error) {
        console.error("Error handling DM:", error);
      }
    });
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
  if (FEATURES.AUTH) {
    app.use("/api", authRoutes);
    app.use("/api", accountRoutes);
    app.use("/api", safetyRoutes);
    app.use("/api", moderationRoutes);
  }
  if (FEATURES.ORGS) {
    app.use("/api/admin", adminRoutes);
  }
  if (FEATURES.NOTIFICATIONS || FEATURES.COMMUNITIES || FEATURES.POSTS || FEATURES.FEED) {
    app.use("/api/support", supportRoutes);
  }
  app.use("/api/mvp", mvpRoutes);
  if (FEATURES.FEED) {
    app.use("/api", feedRoutes);
  }
  if (FEATURES.POSTS) {
    app.use("/api", postsRoutes);
  }
  if (FEATURES.COMMUNITIES) {
    app.use("/api", communitiesRoutes);
  }
  if (FEATURES.EVENTS) {
    app.use("/api", eventsRoutes);
  }
  if (FEATURES.APOLOGETICS) {
    app.use("/api", apologeticsRoutes);
  }
  function getSessionUserId(req) {
    const raw = req.session?.userId;
    if (raw === void 0 || raw === null) return void 0;
    if (typeof raw === "number") return raw;
    const n = parseInt(String(raw));
    return Number.isFinite(n) ? n : void 0;
  }
  app.get("/api/user", async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      if (userId === void 0) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userData } = user;
      res.json(userData);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "Error fetching user" });
    }
  });
  if (FEATURES.AUTH) {
    app.use("/api/user", userRoutes);
    app.use("/api/user", userSettingsRoutes);
    app.use("/api/dms", dmRoutes);
    app.use("/api/push-tokens", pushTokenRoutes);
  }
  if (FEATURES.AUTH) {
    app.get("/api/users", async (req, res) => {
      try {
        if (req.query.search) {
          const searchTerm = req.query.search;
          const users2 = await storage.searchUsers(searchTerm);
          const sanitizedUsers2 = users2.map((user) => {
            const { password, ...userData } = user;
            return userData;
          });
          return res.json(sanitizedUsers2);
        }
        const users = await storage.getAllUsers();
        const sanitizedUsers = users.map((user) => {
          const { password, ...userData } = user;
          return userData;
        });
        res.json(sanitizedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Error fetching users" });
      }
    });
    app.get("/api/users/:id", async (req, res) => {
      try {
        const userId = parseInt(req.params.id);
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        const { password, ...userData } = user;
        res.json(userData);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Error fetching user" });
      }
    });
    app.get("/users/:id/liked-microblogs", async (req, res) => {
      try {
        const userId = parseInt(req.params.id);
        const likedMicroblogs = await storage.getUserLikedMicroblogs(userId);
        res.json(likedMicroblogs);
      } catch (error) {
        console.error("Error fetching liked microblogs:", error);
        res.status(500).json({ message: "Error fetching liked microblogs" });
      }
    });
  }
  if (FEATURES.COMMUNITIES) {
    app.get("/api/communities", async (req, res) => {
      try {
        const userId = getSessionUserId(req);
        const searchQuery = req.query.search;
        let communities = await storage.getPublicCommunitiesAndUserCommunities(userId, searchQuery);
        if (userId) {
          const blockedIds = await storage.getBlockedUserIdsFor(userId);
          if (blockedIds && blockedIds.length > 0) {
            communities = communities.filter((c) => !blockedIds.includes(c.createdBy));
          }
        }
        res.json(communities);
      } catch (error) {
        console.error("Error fetching communities:", error);
        res.status(500).json({ message: "Error fetching communities" });
      }
    });
    app.get("/api/communities/:idOrSlug", async (req, res) => {
      try {
        const { idOrSlug } = req.params;
        const isNumeric = /^\d+$/.test(idOrSlug);
        let community;
        if (isNumeric) {
          const communityId = parseInt(idOrSlug);
          community = await storage.getCommunity(communityId);
        } else {
          community = await storage.getCommunityBySlug(idOrSlug);
        }
        if (!community) {
          return res.status(404).json({ message: "Community not found" });
        }
        res.json(community);
      } catch (error) {
        console.error("Error fetching community:", error);
        res.status(500).json({ message: "Error fetching community" });
      }
    });
    app.post("/api/communities", isAuthenticated, async (req, res) => {
      try {
        const userId = getSessionUserId(req);
        const validatedData = insertCommunitySchema.parse({
          ...req.body,
          createdBy: userId
        });
        const community = await storage.createCommunity(validatedData);
        await storage.addCommunityMember({
          communityId: community.id,
          userId,
          role: "owner"
        });
        res.status(201).json(community);
      } catch (error) {
        console.error("Error creating community:", error);
        res.status(500).json({ message: "Error creating community" });
      }
    });
    app.post("/api/communities/:idOrSlug/join", isAuthenticated, async (req, res) => {
      try {
        const { idOrSlug } = req.params;
        let communityId;
        if (/^\d+$/.test(idOrSlug)) {
          communityId = parseInt(idOrSlug);
        } else {
          const community = await storage.getCommunityBySlug(idOrSlug);
          if (!community) {
            return res.status(404).json({ message: "Community not found" });
          }
          communityId = community.id;
        }
        const userId = getSessionUserId(req);
        const isMember = await storage.isCommunityMember(communityId, userId);
        if (isMember) {
          return res.status(400).json({ message: "Already a member of this community" });
        }
        await storage.addCommunityMember({
          communityId,
          userId,
          role: "member"
        });
        res.json({ message: "Successfully joined community" });
      } catch (error) {
        console.error("Error joining community:", error);
        res.status(500).json({ message: "Error joining community" });
      }
    });
    app.post("/api/communities/:idOrSlug/leave", isAuthenticated, async (req, res) => {
      try {
        const { idOrSlug } = req.params;
        let communityId;
        if (/^\d+$/.test(idOrSlug)) {
          communityId = parseInt(idOrSlug);
        } else {
          const community = await storage.getCommunityBySlug(idOrSlug);
          if (!community) {
            return res.status(404).json({ message: "Community not found" });
          }
          communityId = community.id;
        }
        const userId = getSessionUserId(req);
        await storage.removeCommunityMember(communityId, userId);
        res.json({ message: "Successfully left community" });
      } catch (error) {
        console.error("Error leaving community:", error);
        res.status(500).json({ message: "Error leaving community" });
      }
    });
    app.get("/api/communities/:idOrSlug/members", async (req, res) => {
      try {
        const { idOrSlug } = req.params;
        let communityId;
        if (/^\d+$/.test(idOrSlug)) {
          communityId = parseInt(idOrSlug);
        } else {
          const community = await storage.getCommunityBySlug(idOrSlug);
          if (!community) {
            return res.status(404).json({ message: "Community not found" });
          }
          communityId = community.id;
        }
        const members = await storage.getCommunityMembers(communityId);
        res.json(members);
      } catch (error) {
        console.error("Error fetching community members:", error);
        res.status(500).json({ message: "Error fetching community members" });
      }
    });
    app.post("/api/communities/:idOrSlug/invite", isAuthenticated, async (req, res) => {
      try {
        const { idOrSlug } = req.params;
        let communityId;
        if (/^\d+$/.test(idOrSlug)) {
          communityId = parseInt(idOrSlug);
        } else {
          const community2 = await storage.getCommunityBySlug(idOrSlug);
          if (!community2) {
            return res.status(404).json({ message: "Community not found" });
          }
          communityId = community2.id;
        }
        const userId = getSessionUserId(req);
        const { email } = req.body;
        const isModerator = await storage.isCommunityModerator(communityId, userId);
        const isOwner = await storage.isCommunityOwner(communityId, userId);
        if (!isModerator && !isOwner) {
          return res.status(403).json({ message: "Only moderators and owners can invite members" });
        }
        const existingInvitation = await storage.getCommunityInvitationByEmailAndCommunity(email, communityId);
        if (existingInvitation) {
          return res.status(400).json({ message: "Invitation already sent to this email" });
        }
        const token = generateToken();
        const invitation = await storage.createCommunityInvitation({
          communityId,
          inviterUserId: userId,
          inviteeEmail: email,
          token,
          status: "pending",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)
        });
        const community = await storage.getCommunity(communityId);
        const inviter = await storage.getUser(userId);
        try {
          await sendCommunityInvitationEmail(
            email,
            community.name,
            inviter.displayName || inviter.username,
            token
          );
          console.log(`Community invitation email sent to ${email}`);
        } catch (emailError) {
          console.error("Failed to send invitation email:", emailError);
        }
        res.status(201).json(invitation);
      } catch (error) {
        console.error("Error creating community invitation:", error);
        res.status(500).json({ message: "Error creating community invitation" });
      }
    });
    app.delete("/api/communities/:idOrSlug/members/:userId", isAuthenticated, async (req, res) => {
      try {
        const { idOrSlug } = req.params;
        let communityId;
        if (/^\d+$/.test(idOrSlug)) {
          communityId = parseInt(idOrSlug);
        } else {
          const community = await storage.getCommunityBySlug(idOrSlug);
          if (!community) {
            return res.status(404).json({ message: "Community not found" });
          }
          communityId = community.id;
        }
        const targetUserId = parseInt(req.params.userId);
        const currentUserId = getSessionUserId(req);
        const isModerator = await storage.isCommunityModerator(communityId, currentUserId);
        const isOwner = await storage.isCommunityOwner(communityId, currentUserId);
        if (!isModerator && !isOwner) {
          return res.status(403).json({ message: "Only moderators and owners can remove members" });
        }
        await storage.removeCommunityMember(communityId, targetUserId);
        res.json({ message: "Member removed successfully" });
      } catch (error) {
        console.error("Error removing community member:", error);
        res.status(500).json({ message: "Error removing community member" });
      }
    });
    app.get("/api/invitations/:token", async (req, res) => {
      try {
        const token = req.params.token;
        const invitation = await storage.getCommunityInvitationByToken(token);
        if (!invitation) {
          return res.status(404).json({ message: "Invitation not found or expired" });
        }
        if (invitation.status !== "pending") {
          return res.status(400).json({ message: "Invitation already processed" });
        }
        res.json(invitation);
      } catch (error) {
        console.error("Error fetching invitation:", error);
        res.status(500).json({ message: "Error fetching invitation" });
      }
    });
    app.post("/api/invitations/:token/accept", isAuthenticated, async (req, res) => {
      try {
        const token = req.params.token;
        const userId = getSessionUserId(req);
        const invitation = await storage.getCommunityInvitationByToken(token);
        if (!invitation) {
          return res.status(404).json({ message: "Invitation not found or expired" });
        }
        if (invitation.status !== "pending") {
          return res.status(400).json({ message: "Invitation already processed" });
        }
        const isMember = await storage.isCommunityMember(invitation.communityId, userId);
        if (isMember) {
          await storage.updateCommunityInvitationStatus(invitation.id, "accepted");
          return res.status(400).json({ message: "Already a member of this community" });
        }
        await storage.addCommunityMember({
          communityId: invitation.communityId,
          userId,
          role: "member"
        });
        await storage.updateCommunityInvitationStatus(invitation.id, "accepted");
        res.json({ message: "Successfully joined community" });
      } catch (error) {
        console.error("Error accepting invitation:", error);
        res.status(500).json({ message: "Error accepting invitation" });
      }
    });
    app.get("/api/communities/:idOrSlug/chat-rooms", async (req, res) => {
      try {
        const { idOrSlug } = req.params;
        let communityId;
        if (/^\d+$/.test(idOrSlug)) {
          communityId = parseInt(idOrSlug);
        } else {
          const community = await storage.getCommunityBySlug(idOrSlug);
          if (!community) {
            return res.status(404).json({ message: "Community not found" });
          }
          communityId = community.id;
        }
        const userId = getSessionUserId(req);
        if (userId && await storage.isCommunityMember(communityId, userId)) {
          const rooms = await storage.getCommunityRooms(communityId);
          res.json(rooms);
        } else {
          const publicRooms = await storage.getPublicCommunityRooms(communityId);
          res.json(publicRooms);
        }
      } catch (error) {
        console.error("Error fetching chat rooms:", error);
        res.status(500).json({ message: "Error fetching chat rooms" });
      }
    });
    app.post("/api/communities/:idOrSlug/chat-rooms", isAuthenticated, async (req, res) => {
      try {
        const { idOrSlug } = req.params;
        let communityId;
        if (/^\d+$/.test(idOrSlug)) {
          communityId = parseInt(idOrSlug);
        } else {
          const community = await storage.getCommunityBySlug(idOrSlug);
          if (!community) {
            return res.status(404).json({ message: "Community not found" });
          }
          communityId = community.id;
        }
        const userId = getSessionUserId(req);
        const { name, description, isPrivate } = req.body;
        const isModerator = await storage.isCommunityModerator(communityId, userId);
        const isOwner = await storage.isCommunityOwner(communityId, userId);
        if (!isModerator && !isOwner) {
          return res.status(403).json({ message: "Only moderators and owners can create chat rooms" });
        }
        const room = await storage.createCommunityRoom({
          communityId,
          name,
          description,
          isPrivate: isPrivate || false,
          createdBy: userId
        });
        await storage.createChatMessage({
          roomId: room.id,
          senderId: userId,
          content: `${req.session.username || "A user"} created this chat room`
        });
        res.status(201).json(room);
      } catch (error) {
        console.error("Error creating chat room:", error);
        res.status(500).json({ message: "Error creating chat room" });
      }
    });
    app.put("/api/chat-rooms/:roomId", isAuthenticated, async (req, res) => {
      try {
        const roomId = parseInt(req.params.roomId);
        const userId = getSessionUserId(req);
        const { name, description, isPrivate } = req.body;
        const room = await storage.getCommunityRoom(roomId);
        if (!room) {
          return res.status(404).json({ message: "Chat room not found" });
        }
        const isModerator = await storage.isCommunityModerator(room.communityId, userId);
        const isOwner = await storage.isCommunityOwner(room.communityId, userId);
        if (!isModerator && !isOwner) {
          return res.status(403).json({ message: "Only moderators and owners can edit chat rooms" });
        }
        const updatedRoom = await storage.updateCommunityRoom(roomId, {
          name,
          description,
          isPrivate
        });
        res.json(updatedRoom);
      } catch (error) {
        console.error("Error updating chat room:", error);
        res.status(500).json({ message: "Error updating chat room" });
      }
    });
    app.delete("/api/chat-rooms/:roomId", isAuthenticated, async (req, res) => {
      try {
        const roomId = parseInt(req.params.roomId);
        const userId = getSessionUserId(req);
        const room = await storage.getCommunityRoom(roomId);
        if (!room) {
          return res.status(404).json({ message: "Chat room not found" });
        }
        const isModerator = await storage.isCommunityModerator(room.communityId, userId);
        const isOwner = await storage.isCommunityOwner(room.communityId, userId);
        if (!isModerator && !isOwner) {
          return res.status(403).json({ message: "Only moderators and owners can delete chat rooms" });
        }
        await storage.deleteCommunityRoom(roomId);
        res.json({ message: "Chat room deleted successfully" });
      } catch (error) {
        console.error("Error deleting chat room:", error);
        res.status(500).json({ message: "Error deleting chat room" });
      }
    });
    app.get("/api/chat-rooms/:roomId/messages", async (req, res) => {
      try {
        const roomId = parseInt(req.params.roomId);
        const limit = parseInt(req.query.limit) || 50;
        const after = req.query.after ? parseInt(req.query.after) : void 0;
        let messages;
        if (after) {
          messages = await storage.getChatMessagesAfter(roomId, after);
        } else {
          messages = await storage.getChatMessages(roomId, limit);
        }
        res.json(messages);
      } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: "Error fetching messages" });
      }
    });
    app.post("/api/chat-rooms/:roomId/messages", isAuthenticated, async (req, res) => {
      try {
        const roomId = parseInt(req.params.roomId);
        const userId = getSessionUserId(req);
        const { content } = req.body;
        if (!content || content.trim().length === 0) {
          return res.status(400).json({ message: "Message content is required" });
        }
        const message = await storage.createChatMessage({
          roomId,
          senderId: userId,
          content: content.trim()
        });
        const sender = await storage.getUser(userId);
        const messageWithSender = { ...message, sender };
        io.to(`room_${roomId}`).emit("message_received", messageWithSender);
        res.status(201).json(messageWithSender);
      } catch (error) {
        console.error("Error creating message:", error);
        res.status(500).json({ message: "Error creating message" });
      }
    });
    app.get("/api/communities/:idOrSlug/wall", async (req, res) => {
      try {
        const { idOrSlug } = req.params;
        let communityId;
        if (/^\d+$/.test(idOrSlug)) {
          communityId = parseInt(idOrSlug);
        } else {
          const community = await storage.getCommunityBySlug(idOrSlug);
          if (!community) {
            return res.status(404).json({ message: "Community not found" });
          }
          communityId = community.id;
        }
        const posts = await storage.getCommunityWallPosts(communityId);
        res.json(posts);
      } catch (error) {
        console.error("Error fetching wall posts:", error);
        res.status(500).json({ message: "Error fetching wall posts" });
      }
    });
    app.post("/api/communities/:idOrSlug/wall", isAuthenticated, async (req, res) => {
      try {
        const { idOrSlug } = req.params;
        let communityId;
        if (/^\d+$/.test(idOrSlug)) {
          communityId = parseInt(idOrSlug);
        } else {
          const community = await storage.getCommunityBySlug(idOrSlug);
          if (!community) {
            return res.status(404).json({ message: "Community not found" });
          }
          communityId = community.id;
        }
        const userId = getSessionUserId(req);
        const { content, isPrivate } = req.body;
        const isMember = await storage.isCommunityMember(communityId, userId);
        if (!isMember) {
          return res.status(403).json({ message: "Must be a member to post on community wall" });
        }
        const post = await storage.createCommunityWallPost({
          communityId,
          authorId: userId,
          content,
          isPrivate: isPrivate || false
        });
        res.status(201).json(post);
      } catch (error) {
        console.error("Error creating wall post:", error);
        res.status(500).json({ message: "Error creating wall post" });
      }
    });
  }
  if (FEATURES.POSTS) {
    app.get("/api/posts", async (req, res) => {
      try {
        const filter = req.query.filter;
        const userId = getSessionUserId(req);
        let posts = await storage.getAllPosts(filter);
        if (userId) {
          const blockedIds = await storage.getBlockedUserIdsFor(userId);
          if (blockedIds && blockedIds.length > 0) {
            posts = posts.filter((p) => !blockedIds.includes(p.authorId));
          }
        }
        res.json(posts);
      } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ message: "Error fetching posts" });
      }
    });
    app.get("/api/posts/:id", async (req, res) => {
      try {
        const postId = parseInt(req.params.id);
        const post = await storage.getPost(postId);
        if (!post) {
          return res.status(404).json({ message: "Post not found" });
        }
        res.json(post);
      } catch (error) {
        console.error("Error fetching post:", error);
        res.status(500).json({ message: "Error fetching post" });
      }
    });
    app.post("/api/posts", isAuthenticated, async (req, res) => {
      try {
        const userId = getSessionUserId(req);
        const validatedData = insertPostSchema.parse({
          ...req.body,
          authorId: userId
        });
        const post = await storage.createPost(validatedData);
        res.status(201).json(post);
      } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ message: "Error creating post" });
      }
    });
    app.post("/api/posts/:id/upvote", isAuthenticated, async (req, res) => {
      try {
        const postId = parseInt(req.params.id);
        const post = await storage.upvotePost(postId);
        res.json(post);
      } catch (error) {
        console.error("Error upvoting post:", error);
        res.status(500).json({ message: "Error upvoting post" });
      }
    });
    app.get("/api/posts/:id/comments", async (req, res) => {
      try {
        const postId = parseInt(req.params.id);
        const comments = await storage.getCommentsByPostId(postId);
        res.json(comments);
      } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ message: "Error fetching comments" });
      }
    });
    app.post("/api/comments", isAuthenticated, async (req, res) => {
      try {
        const userId = getSessionUserId(req);
        const validatedData = insertCommentSchema.parse({
          ...req.body,
          authorId: userId
        });
        const comment = await storage.createComment(validatedData);
        res.status(201).json(comment);
      } catch (error) {
        console.error("Error creating comment:", error);
        res.status(500).json({ message: "Error creating comment" });
      }
    });
    app.post("/api/comments/:id/upvote", isAuthenticated, async (req, res) => {
      try {
        const commentId = parseInt(req.params.id);
        const comment = await storage.upvoteComment(commentId);
        res.json(comment);
      } catch (error) {
        console.error("Error upvoting comment:", error);
        res.status(500).json({ message: "Error upvoting comment" });
      }
    });
  }
  app.get("/api/microblogs", async (req, res) => {
    try {
      const filter = req.query.filter;
      const microblogs = await storage.getAllMicroblogs();
      res.json(microblogs);
    } catch (error) {
      console.error("Error fetching microblogs:", error);
      res.status(500).json({ message: "Error fetching microblogs" });
    }
  });
  app.get("/api/microblogs/:id", async (req, res) => {
    try {
      const microblogId = parseInt(req.params.id);
      const microblog = await storage.getMicroblog(microblogId);
      if (!microblog) {
        return res.status(404).json({ message: "Microblog not found" });
      }
      res.json(microblog);
    } catch (error) {
      console.error("Error fetching microblog:", error);
      res.status(500).json({ message: "Error fetching microblog" });
    }
  });
  app.post("/api/microblogs", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const validatedData = insertMicroblogSchema.parse({
        ...req.body,
        authorId: userId
      });
      const microblog = await storage.createMicroblog(validatedData);
      res.status(201).json(microblog);
    } catch (error) {
      console.error("Error creating microblog:", error);
      res.status(500).json({ message: "Error creating microblog" });
    }
  });
  app.post("/api/microblogs/:id/like", isAuthenticated, async (req, res) => {
    try {
      const microblogId = parseInt(req.params.id);
      const userId = getSessionUserId(req);
      const like = await storage.likeMicroblog(microblogId, userId);
      res.status(201).json(like);
    } catch (error) {
      console.error("Error liking microblog:", error);
      res.status(500).json({ message: "Error liking microblog" });
    }
  });
  app.delete("/api/microblogs/:id/like", isAuthenticated, async (req, res) => {
    try {
      const microblogId = parseInt(req.params.id);
      const userId = getSessionUserId(req);
      await storage.unlikeMicroblog(microblogId, userId);
      res.json({ message: "Microblog unliked successfully" });
    } catch (error) {
      console.error("Error unliking microblog:", error);
      res.status(500).json({ message: "Error unliking microblog" });
    }
  });
  app.get("/api/events", async (req, res) => {
    try {
      const filter = req.query.filter;
      const userId = getSessionUserId(req);
      let events = await storage.getAllEvents();
      if (userId) {
        const blockedIds = await storage.getBlockedUserIdsFor(userId);
        if (blockedIds && blockedIds.length > 0) {
          events = events.filter((e) => !blockedIds.includes(e.creatorId));
        }
      }
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Error fetching events" });
    }
  });
  app.get("/api/events/public", async (req, res) => {
    try {
      const allEvents = await storage.getAllEvents();
      const events = allEvents.filter((event) => event.isPublic);
      res.json(events);
    } catch (error) {
      console.error("Error fetching public events:", error);
      res.status(500).json({ message: "Error fetching public events" });
    }
  });
  app.get("/api/events/nearby", async (req, res) => {
    try {
      const { latitude, longitude, radius } = req.query;
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching nearby events:", error);
      res.status(500).json({ message: "Error fetching nearby events" });
    }
  });
  app.get("/api/events/:id", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Error fetching event" });
    }
  });
  app.post("/api/events", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const validatedData = insertEventSchema.parse({
        ...req.body,
        organizerId: userId
      });
      const event = await storage.createEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Error creating event" });
    }
  });
  app.patch("/api/events/:id/rsvp", isAuthenticated, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = getSessionUserId(req);
      const { status } = req.body;
      const rsvp = await storage.updateEventRSVP(eventId, status);
      res.json(rsvp);
    } catch (error) {
      console.error("Error updating RSVP:", error);
      res.status(500).json({ message: "Error updating RSVP" });
    }
  });
  app.delete("/api/events/:id", isAuthenticated, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = getSessionUserId(req);
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      if (event.organizerId !== userId && !req.session.isAdmin) {
        return res.status(403).json({ message: "Only the organizer or admin can delete this event" });
      }
      await storage.deleteEvent(eventId);
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Error deleting event" });
    }
  });
  app.get("/api/prayer-requests", async (req, res) => {
    try {
      const prayerRequests = await storage.getAllPrayerRequests();
      res.json(prayerRequests);
    } catch (error) {
      console.error("Error fetching prayer requests:", error);
      res.status(500).json({ message: "Error fetching prayer requests" });
    }
  });
  app.post("/api/prayer-requests", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const validatedData = insertPrayerRequestSchema.parse({
        ...req.body,
        userId
      });
      const prayerRequest = await storage.createPrayerRequest(validatedData);
      res.status(201).json(prayerRequest);
    } catch (error) {
      console.error("Error creating prayer request:", error);
      res.status(500).json({ message: "Error creating prayer request" });
    }
  });
  app.post("/api/prayer-requests/:id/pray", isAuthenticated, async (req, res) => {
    try {
      const prayerRequestId = parseInt(req.params.id);
      const userId = getSessionUserId(req);
      const prayer = await storage.createPrayer({
        prayerRequestId,
        userId
      });
      res.status(201).json(prayer);
    } catch (error) {
      console.error("Error recording prayer:", error);
      res.status(500).json({ message: "Error recording prayer" });
    }
  });
  app.get("/api/apologetics", async (req, res) => {
    try {
      const resources = await storage.getAllApologeticsResources();
      res.json(resources);
    } catch (error) {
      console.error("Error fetching apologetics resources:", error);
      res.status(500).json({ message: "Error fetching apologetics resources" });
    }
  });
  app.get("/api/apologetics/topics", async (req, res) => {
    try {
      const topics = await storage.getAllApologeticsTopics();
      res.json(topics);
    } catch (error) {
      console.error("Error fetching apologetics topics:", error);
      res.status(500).json({ message: "Error fetching apologetics topics" });
    }
  });
  app.get("/api/apologetics/questions", async (req, res) => {
    try {
      const questions = await storage.getAllApologeticsQuestions();
      res.json(questions);
    } catch (error) {
      console.error("Error fetching apologetics questions:", error);
      res.status(500).json({ message: "Error fetching apologetics questions" });
    }
  });
  app.post("/api/apologetics/questions", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const { topicId, title, content } = req.body;
      const question = await storage.createApologeticsQuestion({
        topicId,
        title,
        content,
        askedBy: userId
      });
      res.status(201).json(question);
    } catch (error) {
      console.error("Error creating apologetics question:", error);
      res.status(500).json({ message: "Error creating apologetics question" });
    }
  });
  app.post("/api/apologetics/answers", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const { questionId, content } = req.body;
      const user = await storage.getUser(userId);
      if (!user?.isVerifiedApologeticsAnswerer && !user?.isAdmin) {
        return res.status(403).json({ message: "Only verified apologetics answerers can submit answers" });
      }
      const answer = await storage.createApologeticsAnswer({
        questionId,
        content,
        answeredBy: userId
      });
      res.status(201).json(answer);
    } catch (error) {
      console.error("Error creating apologetics answer:", error);
      res.status(500).json({ message: "Error creating apologetics answer" });
    }
  });
  app.get("/api/groups", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const groups = await storage.getGroupsByUserId(userId);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ message: "Error fetching groups" });
    }
  });
  app.post("/api/groups", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const { name, description, isPrivate } = req.body;
      const group = await storage.createGroup({
        name,
        description,
        createdBy: userId,
        isPrivate: isPrivate || false
      });
      await storage.addGroupMember({
        groupId: group.id,
        userId,
        role: "admin"
      });
      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(500).json({ message: "Error creating group" });
    }
  });
  app.get("/api/livestreams", async (req, res) => {
    try {
      const livestreams = await storage.getAllLivestreams();
      res.json(livestreams);
    } catch (error) {
      console.error("Error fetching livestreams:", error);
      res.status(500).json({ message: "Error fetching livestreams" });
    }
  });
  app.post("/api/livestreams", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const { title, description, streamUrl, scheduledFor } = req.body;
      const livestream = await storage.createLivestream({
        title,
        description,
        streamerId: userId,
        streamUrl,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        isLive: false
      });
      res.status(201).json(livestream);
    } catch (error) {
      console.error("Error creating livestream:", error);
      res.status(500).json({ message: "Error creating livestream" });
    }
  });
  app.post("/api/applications/livestreamer", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const validatedData = insertLivestreamerApplicationSchema.parse({
        ...req.body,
        userId
      });
      const application = await storage.createLivestreamerApplication(validatedData);
      try {
        const user = await storage.getUser(userId);
        const applicantName = user && (user.displayName || user.username) || "Applicant";
        const applicantEmail = user && user.email || EMAIL_FROM;
        const adminDest = process.env.ADMIN_NOTIFICATION_EMAIL || EMAIL_FROM;
        await sendLivestreamerApplicationNotificationEmail({
          email: adminDest,
          applicantName,
          applicantEmail,
          ministryName: validatedData.ministryName || "Not specified",
          applicationId: application.id,
          applicationDate: (/* @__PURE__ */ new Date()).toISOString(),
          reviewLink: `${BASE_URL}/admin/livestreamer-applications/${application.id}`
        }, applicantName, application.id);
      } catch (emailError) {
        console.error("Failed to send application notification email:", emailError);
      }
      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating livestreamer application:", error);
      res.status(500).json({ message: "Error creating livestreamer application" });
    }
  });
  app.post("/api/applications/apologist-scholar", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req.session.userId);
      const validatedData = insertApologistScholarApplicationSchema.parse({
        ...req.body,
        userId
      });
      const application = await storage.createApologistScholarApplication(validatedData);
      try {
        const user = await storage.getUser(userId);
        const applicantName = validatedData.fullName || user && (user.displayName || user.username) || "Applicant";
        const applicantEmail = user && user.email || EMAIL_FROM;
        const adminDest = process.env.ADMIN_NOTIFICATION_EMAIL || EMAIL_FROM;
        await sendApologistScholarApplicationNotificationEmail({
          email: adminDest,
          applicantName,
          applicantEmail,
          ministryName: "",
          applicationId: application.id,
          applicationDate: (/* @__PURE__ */ new Date()).toISOString(),
          reviewLink: `${BASE_URL}/admin/apologist-scholar-applications/${application.id}`
        }, applicantName, application.id);
      } catch (emailError) {
        console.error("Failed to send application notification email:", emailError);
      }
      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating apologist scholar application:", error);
      res.status(500).json({ message: "Error creating apologist scholar application" });
    }
  });
  app.post("/api/admin/apologist-scholar-applications/:id/review", isAdmin, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { status, reviewNotes } = req.body;
      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const reviewerId = getSessionUserId(req);
      const application = await storage.updateApologistScholarApplication(
        applicationId,
        status,
        reviewNotes,
        reviewerId
      );
      if (status === "approved") {
        await storage.setVerifiedApologeticsAnswerer(application.userId, true);
      }
      try {
        const emailMessage = status === "approved" ? "We're pleased to inform you that your application to become an apologetics scholar has been approved. You can now answer apologetics questions on our platform." : `Your apologetics scholar application has been reviewed. Status: ${status.toUpperCase()}. ${reviewNotes ? `Reviewer notes: ${reviewNotes}` : ""}`;
        await sendApplicationStatusUpdateEmail({
          email: application.email,
          applicantName: application.fullName || application.applicantName || "Applicant",
          status,
          ministryName: application.ministryName || "",
          reviewNotes: reviewNotes || void 0,
          platformLink: `${BASE_URL}/apologetics/questions`
        });
      } catch (emailError) {
        console.error("Failed to send status update email:", emailError);
      }
      res.json(application);
    } catch (error) {
      console.error("Error reviewing application:", error);
      res.status(500).json({ message: "Error reviewing application" });
    }
  });
  app.put("/api/admin/livestreamer-applications/:id", isAdmin, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { status, reviewNotes } = req.body;
      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const reviewerId = getSessionUserId(req);
      const application = await storage.updateLivestreamerApplication(
        applicationId,
        status,
        reviewNotes,
        reviewerId
      );
      try {
        const emailMessage = status === "approved" ? "We're pleased to inform you that your application to become a livestreamer has been approved. You can now start creating livestreams on our platform." : `Your livestreamer application has been reviewed. Status: ${status.toUpperCase()}. ${reviewNotes ? `Reviewer notes: ${reviewNotes}` : ""}`;
        await sendApplicationStatusUpdateEmail({
          email: application.email,
          applicantName: application.applicantName || application.fullName || "Applicant",
          status,
          ministryName: application.ministryName || "",
          reviewNotes: reviewNotes || void 0,
          platformLink: status === "approved" ? `${BASE_URL}/livestreams/create` : `${BASE_URL}/livestreamer-application`
        });
      } catch (emailError) {
        console.error("Failed to send status update email:", emailError);
      }
      res.json(application);
    } catch (error) {
      console.error("Error updating application status:", error);
      res.status(500).json({ message: "Error updating application status" });
    }
  });
  app.get("/api/search/communities", async (req, res) => {
    try {
      const query = req.query.q;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const communities = await storage.searchCommunities(query);
      res.json(communities);
    } catch (error) {
      console.error("Error searching communities:", error);
      res.status(500).json({ message: "Error searching communities" });
    }
  });
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const { fileName, fileType } = req.body;
      const uploadParams = {
        url: `/api/objects/upload/${fileName}`,
        fields: {
          key: fileName,
          "Content-Type": fileType
        }
      };
      res.json(uploadParams);
    } catch (error) {
      console.error("Error generating upload parameters:", error);
      res.status(500).json({ message: "Error generating upload parameters" });
    }
  });
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const notifications = [];
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Error fetching notifications" });
    }
  });
  app.put("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const userId = getSessionUserId(req);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Error marking notification as read" });
    }
  });
  app.get("/api/user/preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const preferences = await storage.getUserPreferences(userId);
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({ message: "Error fetching user preferences" });
    }
  });
  app.put("/api/user/preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const preferences = await storage.updateUserPreferences(userId, req.body);
      res.json(preferences);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ message: "Error updating user preferences" });
    }
  });
  app.post("/api/recommendations/interaction", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req.session.userId);
      const { contentId, contentType, interactionType } = req.body;
      console.log(`Interaction recorded: User ${userId} -> ${interactionType} on ${contentType} ${contentId}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error recording interaction:", error);
      res.status(500).json({ message: "Error recording interaction" });
    }
  });
  app.get("/api/recommendations/feed", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req.session.userId);
      const limit = parseInt(req.query.limit) || 20;
      const feed = await storage.getAllMicroblogs();
      res.json(feed.slice(0, limit));
    } catch (error) {
      console.error("Error generating personalized feed:", error);
      res.status(500).json({ message: "Error generating personalized feed" });
    }
  });
  app.get("/api/recommendations/friends-activity", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req.session.userId);
      const activity = [];
      res.json(activity);
    } catch (error) {
      console.error("Error fetching friends activity:", error);
      res.status(500).json({ message: "Error fetching friends activity" });
    }
  });
  app.post("/api/test-email", isAdmin, async (req, res) => {
    try {
      const { email, type } = req.body;
      if (type === "welcome") {
        await sendCommunityInvitationEmail(email, "Test Community", "Admin", "test-token");
      }
      res.json({ message: `Test email sent to ${email}` });
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ message: "Error sending test email" });
    }
  });
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      version: "1.0.0"
    });
  });
  app.get("/privacy", (_req, res) => {
    const env = app.get("env");
    const candidate = env === "development" ? path.resolve(process.cwd(), "public", "privacy.html") : path.resolve(process.cwd(), "dist", "public", "privacy.html");
    if (fs.existsSync(candidate)) return res.sendFile(candidate);
    return res.status(404).send("Not found");
  });
  app.get("/terms", (_req, res) => {
    const env = app.get("env");
    const candidate = env === "development" ? path.resolve(process.cwd(), "public", "terms.html") : path.resolve(process.cwd(), "dist", "public", "terms.html");
    if (fs.existsSync(candidate)) return res.sendFile(candidate);
    return res.status(404).send("Not found");
  });
  app.get("/community-guidelines", (_req, res) => {
    const env = app.get("env");
    const candidate = env === "development" ? path.resolve(process.cwd(), "public", "community-guidelines.html") : path.resolve(process.cwd(), "dist", "public", "community-guidelines.html");
    if (fs.existsSync(candidate)) return res.sendFile(candidate);
    return res.status(404).send("Not found");
  });
  app.use((error, req, res, next) => {
    console.error("API Error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors
      });
    }
    res.status(500).json({
      message: "Internal server error",
      ...process.env.NODE_ENV === "development" && { stack: error.stack }
    });
  });
  return httpServer;
}
export {
  registerRoutes
};
