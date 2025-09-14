import { Express } from 'express';
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { setupAuth, isAuthenticated, isAdmin } from './auth';
import { storage } from './storage';
import { z } from 'zod';
import { insertUserSchema, insertCommunitySchema, insertPostSchema, insertCommentSchema, insertMicroblogSchema, insertPrayerRequestSchema, insertEventSchema, insertLivestreamerApplicationSchema, insertApologistScholarApplicationSchema } from '@shared/schema';
import { APP_DOMAIN, BASE_URL, APP_URLS } from './config/domain';
import { sendCommunityInvitationEmail, sendNotificationEmail } from './email';
import { sendLivestreamerApplicationNotificationEmail, sendApplicationStatusUpdateEmail } from './email-notifications';
import crypto from 'crypto';

// Utility function for generating tokens
const generateToken = () => crypto.randomBytes(32).toString('hex');

// Import modular route files
import authRoutes from './routes/api/auth';
import adminRoutes from './routes/api/admin';
import userRoutes from './routes/api/user';
import userSettingsRoutes from './routes/userSettingsRoutes';
import dmRoutes from './routes/dmRoutes';
import organizationRoutes from './routes/organizations';
import stripeRoutes from './routes/stripe';
import { recommendationRouter } from './routes/recommendation';
import { registerOnboardingRoutes } from './routes/api/user-onboarding';
import registerLocationSearchRoutes from './routes/api/location-search';

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    isAdmin?: boolean;
    isVerifiedApologeticsAnswerer?: boolean;
    email?: string;
    username?: string;
  }
}

export function registerRoutes(app: Express, httpServer: HTTPServer) {
  // Set up authentication
  setupAuth(app);

  // Session userId conversion middleware - ensure userId is always a number
  app.use((req, _res, next) => {
    const raw = (req.session as any)?.userId;
    if (typeof raw === 'string') {
      const n = Number(raw);
      if (Number.isFinite(n) && n > 0) {
        (req.session as any).userId = n;
      }
    }
    next();
  });

  // Set up Socket.IO for real-time chat
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join user to their own room for private messages
    socket.on('join_user_room', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined room user_${userId}`);
    });

    // Join community chat room
    socket.on('join_room', (roomId) => {
      socket.join(`room_${roomId}`);
      console.log(`User joined room ${roomId}`);
    });

    // Leave community chat room
    socket.on('leave_room', (roomId) => {
      socket.leave(`room_${roomId}`);
      console.log(`User left room ${roomId}`);
    });

    // Handle new chat message
    socket.on('new_message', async (data) => {
      try {
        const { roomId, content, senderId } = data;
        
        // Create message in database
        const newMessage = await storage.createChatMessage({
          roomId: parseInt(roomId),
          senderId: parseInt(senderId),
          content: content,
        });

        // Get sender info
        const sender = await storage.getUser(parseInt(senderId));
        const messageWithSender = { ...newMessage, sender };

        // Broadcast to room
        io.to(`room_${roomId}`).emit('message_received', messageWithSender);
      } catch (error) {
        console.error('Error handling chat message:', error);
      }
    });

    // Handle private/direct messages
    socket.on('send_dm', async (data) => {
      try {
        const { senderId, receiverId, content } = data;
        
        // Create message in database (assuming you have a DM message table)
        const newMessage = {
          senderId: parseInt(senderId),
          receiverId: parseInt(receiverId),
          content: content,
          createdAt: new Date()
        };

        // Emit to both sender and receiver
        io.to(`user_${senderId}`).emit("new_message", newMessage);
        io.to(`user_${receiverId}`).emit("new_message", newMessage);
      } catch (error) {
        console.error('Error handling DM:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  // Use modular route files
  app.use('/api', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/user', userSettingsRoutes);
  app.use('/api/dms', dmRoutes);
  app.use('/api/organizations', organizationRoutes);
  app.use('/api/stripe', stripeRoutes);
  app.use('/api/recommendations', recommendationRouter);
  
  // Register additional routes
  registerOnboardingRoutes(app);
  registerLocationSearchRoutes(app);

  // User endpoints
  app.get('/api/users', async (req, res) => {
    try {
      if (req.query.search) {
        const searchTerm = req.query.search as string;
        const users = await storage.searchUsers(searchTerm);
        return res.json(users);
      }
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Error fetching users' });
    }
  });

  app.get('/api/users/:id', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      // Remove password from response
      const { password, ...userData } = user;
      res.json(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Error fetching user' });
    }
  });

  app.get('/users/:id/liked-microblogs', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const likedMicroblogs = await storage.getUserLikedMicroblogs(userId);
      res.json(likedMicroblogs);
    } catch (error) {
      console.error('Error fetching liked microblogs:', error);
      res.status(500).json({ message: 'Error fetching liked microblogs' });
    }
  });

  // Community endpoints
  app.get('/api/communities', async (req, res) => {
    try {
      const userId = req.session?.userId;
      const searchQuery = req.query.search as string;
      const communities = await storage.getPublicCommunitiesAndUserCommunities(userId, searchQuery);
      res.json(communities);
    } catch (error) {
      console.error('Error fetching communities:', error);
      res.status(500).json({ message: 'Error fetching communities' });
    }
  });

  app.get('/api/communities/:id', async (req, res) => {
    try {
      const communityId = parseInt(req.params.id);
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: 'Community not found' });
      }
      res.json(community);
    } catch (error) {
      console.error('Error fetching community:', error);
      res.status(500).json({ message: 'Error fetching community' });
    }
  });

  app.get('/api/communities/:slug', async (req, res) => {
    try {
      const slug = req.params.slug;
      const community = await storage.getCommunityBySlug(slug);
      if (!community) {
        return res.status(404).json({ message: 'Community not found' });
      }
      res.json(community);
    } catch (error) {
      console.error('Error fetching community:', error);
      res.status(500).json({ message: 'Error fetching community' });
    }
  });

  app.post('/api/communities', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const validatedData = insertCommunitySchema.parse({
        ...req.body,
        createdBy: userId
      });

      const community = await storage.createCommunity(validatedData);
      
      // Add creator as owner
      await storage.addCommunityMember({
        communityId: community.id,
        userId: userId,
        role: 'owner'
      });

      res.status(201).json(community);
    } catch (error) {
      console.error('Error creating community:', error);
      res.status(500).json({ message: 'Error creating community' });
    }
  });

  app.post('/api/communities/:id/join', isAuthenticated, async (req, res) => {
    try {
      const communityId = parseInt(req.params.id);
      const userId = req.session!.userId!;

      // Check if user is already a member
      const isMember = await storage.isCommunityMember(communityId, userId);
      if (isMember) {
        return res.status(400).json({ message: 'Already a member of this community' });
      }

      await storage.addCommunityMember({
        communityId: communityId,
        userId: userId,
        role: 'member'
      });

      res.json({ message: 'Successfully joined community' });
    } catch (error) {
      console.error('Error joining community:', error);
      res.status(500).json({ message: 'Error joining community' });
    }
  });

  app.post('/api/communities/:id/leave', isAuthenticated, async (req, res) => {
    try {
      const communityId = parseInt(req.params.id);
      const userId = req.session!.userId!;

      await storage.removeCommunityMember(communityId, userId);
      res.json({ message: 'Successfully left community' });
    } catch (error) {
      console.error('Error leaving community:', error);
      res.status(500).json({ message: 'Error leaving community' });
    }
  });

  app.get('/api/communities/:id/members', async (req, res) => {
    try {
      const communityId = parseInt(req.params.id);
      const members = await storage.getCommunityMembers(communityId);
      res.json(members);
    } catch (error) {
      console.error('Error fetching community members:', error);
      res.status(500).json({ message: 'Error fetching community members' });
    }
  });

  app.post('/api/communities/:id/invite', isAuthenticated, async (req, res) => {
    try {
      const communityId = parseInt(req.params.id);
      const userId = req.session!.userId!;
      const { email } = req.body;

      // Check if user is a moderator or owner of the community
      const isModerator = await storage.isCommunityModerator(communityId, userId);
      const isOwner = await storage.isCommunityOwner(communityId, userId);
      
      if (!isModerator && !isOwner) {
        return res.status(403).json({ message: 'Only moderators and owners can invite members' });
      }

      // Check if invitation already exists
      const existingInvitation = await storage.getCommunityInvitationByEmailAndCommunity(email, communityId);
      if (existingInvitation) {
        return res.status(400).json({ message: 'Invitation already sent to this email' });
      }

      // Generate invitation token
      const token = generateToken();

      // Create invitation
      const invitation = await storage.createCommunityInvitation({
        communityId: communityId,
        inviterId: userId,
        email: email,
        token: token,
        status: 'pending'
      });

      // Send invitation email
      const community = await storage.getCommunity(communityId);
      const inviter = await storage.getUser(userId);
      
      try {
        await sendCommunityInvitationEmail(
          email, 
          community!.name, 
          inviter!.displayName || inviter!.username, 
          token
        );
        console.log(`Community invitation email sent to ${email}`);
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Don't fail the request if email fails
      }

      res.status(201).json(invitation);
    } catch (error) {
      console.error('Error creating community invitation:', error);
      res.status(500).json({ message: 'Error creating community invitation' });
    }
  });

  app.delete('/api/communities/:id/members/:userId', isAuthenticated, async (req, res) => {
    try {
      const communityId = parseInt(req.params.id);
      const targetUserId = parseInt(req.params.userId);
      const currentUserId = req.session!.userId!;

      // Check if current user is a moderator or owner
      const isModerator = await storage.isCommunityModerator(communityId, currentUserId);
      const isOwner = await storage.isCommunityOwner(communityId, currentUserId);
      
      if (!isModerator && !isOwner) {
        return res.status(403).json({ message: 'Only moderators and owners can remove members' });
      }

      await storage.removeCommunityMember(communityId, targetUserId);
      res.json({ message: 'Member removed successfully' });
    } catch (error) {
      console.error('Error removing community member:', error);
      res.status(500).json({ message: 'Error removing community member' });
    }
  });

  // Community invitation acceptance
  app.get('/api/invitations/:token', async (req, res) => {
    try {
      const token = req.params.token;
      const invitation = await storage.getCommunityInvitationByToken(token);
      
      if (!invitation) {
        return res.status(404).json({ message: 'Invitation not found or expired' });
      }

      if (invitation.status !== 'pending') {
        return res.status(400).json({ message: 'Invitation already processed' });
      }

      res.json(invitation);
    } catch (error) {
      console.error('Error fetching invitation:', error);
      res.status(500).json({ message: 'Error fetching invitation' });
    }
  });

  app.post('/api/invitations/:token/accept', isAuthenticated, async (req, res) => {
    try {
      const token = req.params.token;
      const userId = req.session!.userId!;
      
      const invitation = await storage.getCommunityInvitationByToken(token);
      
      if (!invitation) {
        return res.status(404).json({ message: 'Invitation not found or expired' });
      }

      if (invitation.status !== 'pending') {
        return res.status(400).json({ message: 'Invitation already processed' });
      }

      // Check if user is already a member
      const isMember = await storage.isCommunityMember(invitation.communityId, userId);
      if (isMember) {
        await storage.updateCommunityInvitationStatus(invitation.id, 'accepted');
        return res.status(400).json({ message: 'Already a member of this community' });
      }

      // Add user to community
      await storage.addCommunityMember({
        communityId: invitation.communityId,
        userId: userId,
        role: 'member'
      });

      // Update invitation status
      await storage.updateCommunityInvitationStatus(invitation.id, 'accepted');

      res.json({ message: 'Successfully joined community' });
    } catch (error) {
      console.error('Error accepting invitation:', error);
      res.status(500).json({ message: 'Error accepting invitation' });
    }
  });

  // Community chat rooms
  app.get('/api/communities/:id/chat-rooms', async (req, res) => {
    try {
      const communityId = parseInt(req.params.id);
      const userId = req.session?.userId;

      // Check if user is a member of the community or get public rooms
      if (userId && await storage.isCommunityMember(communityId, userId)) {
        const rooms = await storage.getCommunityRooms(communityId);
        res.json(rooms);
      } else {
        const publicRooms = await storage.getPublicCommunityRooms(communityId);
        res.json(publicRooms);
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      res.status(500).json({ message: 'Error fetching chat rooms' });
    }
  });

  app.post('/api/communities/:id/chat-rooms', isAuthenticated, async (req, res) => {
    try {
      const communityId = parseInt(req.params.id);
      const userId = req.session!.userId!;
      const { name, description, isPrivate } = req.body;

      // Check if user is a moderator or owner
      const isModerator = await storage.isCommunityModerator(communityId, userId);
      const isOwner = await storage.isCommunityOwner(communityId, userId);
      
      if (!isModerator && !isOwner) {
        return res.status(403).json({ message: 'Only moderators and owners can create chat rooms' });
      }

      const room = await storage.createCommunityRoom({
        communityId: communityId,
        name: name,
        description: description,
        isPrivate: isPrivate || false,
        createdBy: userId
      });

      // Create initial system message
      await storage.createChatMessage({
        roomId: room.id,
        senderId: userId,
        content: `${req.session.username || "A user"} created this chat room`,
      });

      res.status(201).json(room);
    } catch (error) {
      console.error('Error creating chat room:', error);
      res.status(500).json({ message: 'Error creating chat room' });
    }
  });

  app.put('/api/chat-rooms/:roomId', isAuthenticated, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const userId = req.session!.userId!;
      const { name, description, isPrivate } = req.body;

      const room = await storage.getCommunityRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: 'Chat room not found' });
      }

      // Check if user is a moderator or owner of the community
      const isModerator = await storage.isCommunityModerator(room.communityId, userId);
      const isOwner = await storage.isCommunityOwner(room.communityId, userId);
      
      if (!isModerator && !isOwner) {
        return res.status(403).json({ message: 'Only moderators and owners can edit chat rooms' });
      }

      const updatedRoom = await storage.updateCommunityRoom(roomId, {
        name,
        description,
        isPrivate
      });

      res.json(updatedRoom);
    } catch (error) {
      console.error('Error updating chat room:', error);
      res.status(500).json({ message: 'Error updating chat room' });
    }
  });

  app.delete('/api/chat-rooms/:roomId', isAuthenticated, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const userId = req.session!.userId!;

      const room = await storage.getCommunityRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: 'Chat room not found' });
      }

      // Check if user is a moderator or owner of the community
      const isModerator = await storage.isCommunityModerator(room.communityId, userId);
      const isOwner = await storage.isCommunityOwner(room.communityId, userId);
      
      if (!isModerator && !isOwner) {
        return res.status(403).json({ message: 'Only moderators and owners can delete chat rooms' });
      }

      await storage.deleteCommunityRoom(roomId);
      res.json({ message: 'Chat room deleted successfully' });
    } catch (error) {
      console.error('Error deleting chat room:', error);
      res.status(500).json({ message: 'Error deleting chat room' });
    }
  });

  app.get('/api/chat-rooms/:roomId/messages', async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const limit = parseInt(req.query.limit as string) || 50;
      const after = req.query.after ? parseInt(req.query.after as string) : undefined;

      let messages;
      if (after) {
        messages = await storage.getChatMessagesAfter(roomId, after);
      } else {
        messages = await storage.getChatMessages(roomId, limit);
      }

      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Error fetching messages' });
    }
  });

  app.post('/api/chat-rooms/:roomId/messages', isAuthenticated, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const userId = req.session!.userId!;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: 'Message content is required' });
      }

      const message = await storage.createChatMessage({
        roomId: roomId,
        senderId: userId,
        content: content.trim()
      });

      // Get sender info for the response
      const sender = await storage.getUser(userId);
      const messageWithSender = { ...message, sender };

      // Broadcast to all connected clients in the room
      io.to(`room_${roomId}`).emit('message_received', messageWithSender);

      res.status(201).json(messageWithSender);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({ message: 'Error creating message' });
    }
  });

  // Community wall posts
  app.get('/api/communities/:id/wall', async (req, res) => {
    try {
      const communityId = parseInt(req.params.id);
      const posts = await storage.getCommunityWallPosts(communityId);
      res.json(posts);
    } catch (error) {
      console.error('Error fetching wall posts:', error);
      res.status(500).json({ message: 'Error fetching wall posts' });
    }
  });

  app.post('/api/communities/:id/wall', isAuthenticated, async (req, res) => {
    try {
      const communityId = parseInt(req.params.id);
      const userId = req.session!.userId!;
      const { content, isPrivate } = req.body;

      // Check if user is a member of the community
      const isMember = await storage.isCommunityMember(communityId, userId);
      if (!isMember) {
        return res.status(403).json({ message: 'Must be a member to post on community wall' });
      }

      const post = await storage.createCommunityWallPost({
        communityId: communityId,
        authorId: userId,
        content: content,
        isPrivate: isPrivate || false
      });

      res.status(201).json(post);
    } catch (error) {
      console.error('Error creating wall post:', error);
      res.status(500).json({ message: 'Error creating wall post' });
    }
  });

  // Posts endpoints
  app.get('/api/posts', async (req, res) => {
    try {
      const filter = req.query.filter as string;
      const posts = await storage.getAllPosts(filter);
      res.json(posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ message: 'Error fetching posts' });
    }
  });

  app.get('/api/posts/:id', async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      res.json(post);
    } catch (error) {
      console.error('Error fetching post:', error);
      res.status(500).json({ message: 'Error fetching post' });
    }
  });

  app.post('/api/posts', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const validatedData = insertPostSchema.parse({
        ...req.body,
        authorId: userId
      });

      const post = await storage.createPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ message: 'Error creating post' });
    }
  });

  app.post('/api/posts/:id/upvote', isAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.upvotePost(postId);
      res.json(post);
    } catch (error) {
      console.error('Error upvoting post:', error);
      res.status(500).json({ message: 'Error upvoting post' });
    }
  });

  // Comments endpoints
  app.get('/api/posts/:id/comments', async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const comments = await storage.getCommentsByPostId(postId);
      res.json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: 'Error fetching comments' });
    }
  });

  app.post('/api/comments', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const validatedData = insertCommentSchema.parse({
        ...req.body,
        authorId: userId
      });

      const comment = await storage.createComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ message: 'Error creating comment' });
    }
  });

  app.post('/api/comments/:id/upvote', isAuthenticated, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const comment = await storage.upvoteComment(commentId);
      res.json(comment);
    } catch (error) {
      console.error('Error upvoting comment:', error);
      res.status(500).json({ message: 'Error upvoting comment' });
    }
  });

  // Microblogs endpoints
  app.get('/api/microblogs', async (req, res) => {
    try {
      const filter = req.query.filter as string;
      const microblogs = await storage.getAllMicroblogs(filter);
      res.json(microblogs);
    } catch (error) {
      console.error('Error fetching microblogs:', error);
      res.status(500).json({ message: 'Error fetching microblogs' });
    }
  });

  app.get('/api/microblogs/:id', async (req, res) => {
    try {
      const microblogId = parseInt(req.params.id);
      const microblog = await storage.getMicroblog(microblogId);
      if (!microblog) {
        return res.status(404).json({ message: 'Microblog not found' });
      }
      res.json(microblog);
    } catch (error) {
      console.error('Error fetching microblog:', error);
      res.status(500).json({ message: 'Error fetching microblog' });
    }
  });

  app.post('/api/microblogs', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const validatedData = insertMicroblogSchema.parse({
        ...req.body,
        authorId: userId
      });

      const microblog = await storage.createMicroblog(validatedData);
      res.status(201).json(microblog);
    } catch (error) {
      console.error('Error creating microblog:', error);
      res.status(500).json({ message: 'Error creating microblog' });
    }
  });

  app.post('/api/microblogs/:id/like', isAuthenticated, async (req, res) => {
    try {
      const microblogId = parseInt(req.params.id);
      const userId = req.session!.userId!;

      const like = await storage.likeMicroblog(microblogId, userId);
      res.status(201).json(like);
    } catch (error) {
      console.error('Error liking microblog:', error);
      res.status(500).json({ message: 'Error liking microblog' });
    }
  });

  app.delete('/api/microblogs/:id/like', isAuthenticated, async (req, res) => {
    try {
      const microblogId = parseInt(req.params.id);
      const userId = req.session!.userId!;

      await storage.unlikeMicroblog(microblogId, userId);
      res.json({ message: 'Microblog unliked successfully' });
    } catch (error) {
      console.error('Error unliking microblog:', error);
      res.status(500).json({ message: 'Error unliking microblog' });
    }
  });

  // Events endpoints
  app.get('/api/events', async (req, res) => {
    try {
      const filter = req.query.filter as string;
      const events = await storage.getAllEvents(filter);
      res.json(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ message: 'Error fetching events' });
    }
  });

  app.get('/api/events/public', async (req, res) => {
    try {
      const events = await storage.getPublicEvents();
      res.json(events);
    } catch (error) {
      console.error('Error fetching public events:', error);
      res.status(500).json({ message: 'Error fetching public events' });
    }
  });

  app.get('/api/events/nearby', async (req, res) => {
    try {
      const { latitude, longitude, radius } = req.query;
      const events = await storage.getNearbyEvents(
        parseFloat(latitude as string),
        parseFloat(longitude as string),
        parseInt(radius as string) || 50
      );
      res.json(events);
    } catch (error) {
      console.error('Error fetching nearby events:', error);
      res.status(500).json({ message: 'Error fetching nearby events' });
    }
  });

  app.get('/api/events/:id', async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      res.json(event);
    } catch (error) {
      console.error('Error fetching event:', error);
      res.status(500).json({ message: 'Error fetching event' });
    }
  });

  app.post('/api/events', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const validatedData = insertEventSchema.parse({
        ...req.body,
        organizerId: userId
      });

      const event = await storage.createEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ message: 'Error creating event' });
    }
  });

  app.patch('/api/events/:id/rsvp', isAuthenticated, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.session!.userId!;
      const { status } = req.body;

      const rsvp = await storage.updateEventRSVP(eventId, userId, status);
      res.json(rsvp);
    } catch (error) {
      console.error('Error updating RSVP:', error);
      res.status(500).json({ message: 'Error updating RSVP' });
    }
  });

  app.delete('/api/events/:id', isAuthenticated, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.session!.userId!;

      // Check if user is the organizer or admin
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      if (event.organizerId !== userId && !req.session.isAdmin) {
        return res.status(403).json({ message: 'Only the organizer or admin can delete this event' });
      }

      await storage.deleteEvent(eventId);
      res.json({ message: 'Event deleted successfully' });
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({ message: 'Error deleting event' });
    }
  });

  // Prayer requests endpoints
  app.get('/api/prayer-requests', async (req, res) => {
    try {
      const prayerRequests = await storage.getAllPrayerRequests();
      res.json(prayerRequests);
    } catch (error) {
      console.error('Error fetching prayer requests:', error);
      res.status(500).json({ message: 'Error fetching prayer requests' });
    }
  });

  app.post('/api/prayer-requests', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const validatedData = insertPrayerRequestSchema.parse({
        ...req.body,
        userId: userId
      });

      const prayerRequest = await storage.createPrayerRequest(validatedData);
      res.status(201).json(prayerRequest);
    } catch (error) {
      console.error('Error creating prayer request:', error);
      res.status(500).json({ message: 'Error creating prayer request' });
    }
  });

  app.post('/api/prayer-requests/:id/pray', isAuthenticated, async (req, res) => {
    try {
      const prayerRequestId = parseInt(req.params.id);
      const userId = req.session!.userId!;

      const prayer = await storage.createPrayer({
        prayerRequestId: prayerRequestId,
        userId: userId
      });

      res.status(201).json(prayer);
    } catch (error) {
      console.error('Error recording prayer:', error);
      res.status(500).json({ message: 'Error recording prayer' });
    }
  });

  // Apologetics endpoints
  app.get('/api/apologetics', async (req, res) => {
    try {
      const resources = await storage.getAllApologeticsResources();
      res.json(resources);
    } catch (error) {
      console.error('Error fetching apologetics resources:', error);
      res.status(500).json({ message: 'Error fetching apologetics resources' });
    }
  });

  app.get('/api/apologetics/topics', async (req, res) => {
    try {
      const topics = await storage.getAllApologeticsTopics();
      res.json(topics);
    } catch (error) {
      console.error('Error fetching apologetics topics:', error);
      res.status(500).json({ message: 'Error fetching apologetics topics' });
    }
  });

  app.get('/api/apologetics/questions', async (req, res) => {
    try {
      const questions = await storage.getAllApologeticsQuestions();
      res.json(questions);
    } catch (error) {
      console.error('Error fetching apologetics questions:', error);
      res.status(500).json({ message: 'Error fetching apologetics questions' });
    }
  });

  app.post('/api/apologetics/questions', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { topicId, title, content } = req.body;

      const question = await storage.createApologeticsQuestion({
        topicId: topicId,
        title: title,
        content: content,
        askedBy: userId
      });

      res.status(201).json(question);
    } catch (error) {
      console.error('Error creating apologetics question:', error);
      res.status(500).json({ message: 'Error creating apologetics question' });
    }
  });

  app.post('/api/apologetics/answers', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { questionId, content } = req.body;

      // Check if user is verified to answer apologetics questions
      const user = await storage.getUser(userId);
      if (!user?.isVerifiedApologeticsAnswerer && !user?.isAdmin) {
        return res.status(403).json({ message: 'Only verified apologetics answerers can submit answers' });
      }

      const answer = await storage.createApologeticsAnswer({
        questionId: questionId,
        content: content,
        answeredBy: userId
      });

      res.status(201).json(answer);
    } catch (error) {
      console.error('Error creating apologetics answer:', error);
      res.status(500).json({ message: 'Error creating apologetics answer' });
    }
  });

  // Groups endpoints
  app.get('/api/groups', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const groups = await storage.getGroupsByUserId(userId);
      res.json(groups);
    } catch (error) {
      console.error('Error fetching groups:', error);
      res.status(500).json({ message: 'Error fetching groups' });
    }
  });

  app.post('/api/groups', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { name, description, isPrivate } = req.body;

      const group = await storage.createGroup({
        name: name,
        description: description,
        createdBy: userId,
        isPrivate: isPrivate || false
      });

      // Add creator as admin member
      await storage.addGroupMember({
        groupId: group.id,
        userId: userId,
        role: 'admin'
      });

      res.status(201).json(group);
    } catch (error) {
      console.error('Error creating group:', error);
      res.status(500).json({ message: 'Error creating group' });
    }
  });

  // Livestreams endpoints
  app.get('/api/livestreams', async (req, res) => {
    try {
      const livestreams = await storage.getAllLivestreams();
      res.json(livestreams);
    } catch (error) {
      console.error('Error fetching livestreams:', error);
      res.status(500).json({ message: 'Error fetching livestreams' });
    }
  });

  app.post('/api/livestreams', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { title, description, streamUrl, scheduledFor } = req.body;

      const livestream = await storage.createLivestream({
        title: title,
        description: description,
        streamerId: userId,
        streamUrl: streamUrl,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        isLive: false
      });

      res.status(201).json(livestream);
    } catch (error) {
      console.error('Error creating livestream:', error);
      res.status(500).json({ message: 'Error creating livestream' });
    }
  });

  // Application endpoints
  app.post('/api/applications/livestreamer', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const validatedData = insertLivestreamerApplicationSchema.parse({
        ...req.body,
        userId: userId
      });

      const application = await storage.createLivestreamerApplication(validatedData);
      
      // Send notification email to admins
      try {
        await sendLivestreamerApplicationEmail(
          validatedData.email,
          validatedData.fullName,
          application.id
        );
      } catch (emailError) {
        console.error('Failed to send application notification email:', emailError);
      }

      res.status(201).json(application);
    } catch (error) {
      console.error('Error creating livestreamer application:', error);
      res.status(500).json({ message: 'Error creating livestreamer application' });
    }
  });

  app.post('/api/applications/apologist-scholar', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const validatedData = insertApologistScholarApplicationSchema.parse({
        ...req.body,
        userId: userId
      });

      const application = await storage.createApologistScholarApplication(validatedData);
      
      // Send notification email to admins
      try {
        await sendApologistScholarApplicationEmail(
          validatedData.email,
          validatedData.fullName,
          application.id
        );
      } catch (emailError) {
        console.error('Failed to send application notification email:', emailError);
      }

      res.status(201).json(application);
    } catch (error) {
      console.error('Error creating apologist scholar application:', error);
      res.status(500).json({ message: 'Error creating apologist scholar application' });
    }
  });

  // Admin review of applications
  app.post('/api/admin/apologist-scholar-applications/:id/review', isAdmin, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { status, reviewNotes } = req.body;

      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const application = await storage.updateApologistScholarApplicationStatus(
        applicationId,
        status,
        reviewNotes
      );

      // If approved, set user as verified apologetics answerer
      if (status === 'approved') {
        await storage.setVerifiedApologeticsAnswerer(application.userId, true);
      }

      // Send status update email
      try {
        const emailMessage = status === "approved"
          ? "We're pleased to inform you that your application to become an apologetics scholar has been approved. You can now answer apologetics questions on our platform."
          : `Your apologetics scholar application has been reviewed. Status: ${status.toUpperCase()}. ${reviewNotes ? `Reviewer notes: ${reviewNotes}` : ''}`;

        await sendApplicationStatusEmail({
          to: application.email,
          subject: `Apologetics Scholar Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: emailMessage,
          platformLink: `https://${process.env.REPLIT_DOMAIN || "theconnection.app"}/apologetics/questions`,
          actionText: status === "approved" ? "Start Answering Questions" : "View Platform",
          actionUrl: status === "approved" 
            ? `https://${process.env.REPLIT_DOMAIN || "theconnection.app"}/apologetics/questions`
            : `https://${process.env.REPLIT_DOMAIN || "theconnection.app"}/apologist-scholar-application`
        });
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
      }

      res.json(application);
    } catch (error) {
      console.error('Error reviewing application:', error);
      res.status(500).json({ message: 'Error reviewing application' });
    }
  });

  // Admin update livestreamer application
  app.put('/api/admin/livestreamer-applications/:id', isAdmin, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { status, reviewNotes } = req.body;

      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const application = await storage.updateLivestreamerApplicationStatus(
        applicationId,
        status,
        reviewNotes
      );

      // Send status update email
      try {
        const emailMessage = status === "approved"
          ? "We're pleased to inform you that your application to become a livestreamer has been approved. You can now start creating livestreams on our platform."
          : `Your livestreamer application has been reviewed. Status: ${status.toUpperCase()}. ${reviewNotes ? `Reviewer notes: ${reviewNotes}` : ''}`;

        await sendApplicationStatusEmail({
          to: application.email,
          subject: `Livestreamer Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: emailMessage,
          reviewLink: `https://theconnection.app/admin/livestreamer-applications/${application.id}`,
          actionText: status === "approved" ? "Start Livestreaming" : "View Application",
          actionUrl: status === "approved" 
            ? `https://${process.env.REPLIT_DOMAIN || "theconnection.app"}/livestreams/create`
            : `https://${process.env.REPLIT_DOMAIN || "theconnection.app"}/livestreamer-application`
        });
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
      }

      res.json(application);
    } catch (error) {
      console.error('Error updating application status:', error);
      res.status(500).json({ message: 'Error updating application status' });
    }
  });

  // Search endpoints
  app.get('/api/search/communities', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
      }

      const communities = await storage.searchCommunities(query);
      res.json(communities);
    } catch (error) {
      console.error('Error searching communities:', error);
      res.status(500).json({ message: 'Error searching communities' });
    }
  });

  // Object storage endpoints
  app.post('/api/objects/upload', isAuthenticated, async (req, res) => {
    try {
      const { fileName, fileType } = req.body;
      
      // Generate upload parameters (would implement actual cloud storage integration)
      const uploadParams = {
        url: `/api/objects/upload/${fileName}`,
        fields: {
          key: fileName,
          'Content-Type': fileType
        }
      };

      res.json(uploadParams);
    } catch (error) {
      console.error('Error generating upload parameters:', error);
      res.status(500).json({ message: 'Error generating upload parameters' });
    }
  });

  // Notifications endpoints
  app.get('/api/notifications', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      // This would need to be implemented in storage
      const notifications = []; // await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Error fetching notifications' });
    }
  });

  app.put('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const userId = req.session!.userId!;
      
      // This would need to be implemented in storage
      // await storage.markNotificationAsRead(notificationId, userId);
      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Error marking notification as read' });
    }
  });

  // User preferences endpoints
  app.get('/api/user/preferences', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const preferences = await storage.getUserPreferences(userId);
      res.json(preferences);
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      res.status(500).json({ message: 'Error fetching user preferences' });
    }
  });

  app.put('/api/user/preferences', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const preferences = await storage.updateUserPreferences(userId, req.body);
      res.json(preferences);
    } catch (error) {
      console.error('Error updating user preferences:', error);
      res.status(500).json({ message: 'Error updating user preferences' });
    }
  });

  // Record user interactions for recommendation engine
  app.post('/api/recommendations/interaction', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { contentId, contentType, interactionType } = req.body;

      console.log(`Interaction recorded: User ${userId} -> ${interactionType} on ${contentType} ${contentId}`);

      // Store in recommendation system (this would be implemented in storage)
      // await storage.recordUserInteraction(userId, contentId, contentType, interactionType);

      res.json({ success: true });
    } catch (error) {
      console.error('Error recording interaction:', error);
      res.status(500).json({ message: 'Error recording interaction' });
    }
  });

  // Get personalized feed
  app.get('/api/recommendations/feed', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const limit = parseInt(req.query.limit as string) || 20;
      
      // This would use the recommendation engine
      // const feed = await storage.getPersonalizedFeed(userId, limit);
      const feed = await storage.getAllMicroblogs(); // Fallback for now
      
      res.json(feed.slice(0, limit));
    } catch (error) {
      console.error('Error generating personalized feed:', error);
      res.status(500).json({ message: 'Error generating personalized feed' });
    }
  });

  // Get friends activity
  app.get('/api/recommendations/friends-activity', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      
      // This would get activity from user's friends/connections
      // const activity = await storage.getFriendsActivity(userId);
      const activity = []; // Placeholder
      
      res.json(activity);
    } catch (error) {
      console.error('Error fetching friends activity:', error);
      res.status(500).json({ message: 'Error fetching friends activity' });
    }
  });

  // Test email endpoint (admin only)
  app.post('/api/test-email', isAdmin, async (req, res) => {
    try {
      const { email, type } = req.body;
      
      if (type === 'welcome') {
        await sendCommunityInvitationEmail(email, 'Test Community', 'Admin', 'test-token');
      }
      
      res.json({ message: `Test email sent to ${email}` });
    } catch (error) {
      console.error('Error sending test email:', error);
      res.status(500).json({ message: 'Error sending test email' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // Error handling middleware
  app.use((error: any, req: any, res: any, next: any) => {
    console.error('API Error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ 
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  });

  return httpServer;
}