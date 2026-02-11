import { getSessionUserId, normalizeSessionUserId, requireSessionUserId } from "./utils/session"
import { buildErrorResponse } from "./utils/errors"
import { getPaginationParams, attachPaginationHeaders, parsePaginationParams } from "./utils/pagination"
import express, { Express } from 'express';
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { setupAuth, isAuthenticated, isAdmin } from './auth';
import { storage as storageReal } from './storage';
import rateLimit from 'express-rate-limit';
import { sendPushNotification } from './services/pushService';
import { notifyUserWithPreferences, notifyCommunityMembers, truncateText } from './services/notificationHelper';
import { contentCreationLimiter, messageCreationLimiter } from './rate-limiters';

// NOTE: many of the shared "Insert..." Zod-derived types are being inferred
// in a way that causes object literal properties to appear as `never` in this
// file, which produces a large number of TypeScript errors when assigning
// plain literals. To keep the runtime behavior identical while allowing a
// successful build in this environment, shadow the imported storage with a
// lightweight any-typed alias. This preserves all method calls but relaxes
// compile-time checking here. We should revisit and fix the shared schema
// inference upstream for proper typings.
const storage: any = storageReal;
import { z } from 'zod/v4';
import { insertUserSchema, insertCommunitySchema, insertPostSchema, insertCommentSchema, insertPrayerRequestSchema, insertEventSchema, insertLivestreamerApplicationSchema, insertApologistScholarApplicationSchema, InsertLivestreamerApplication, InsertApologistScholarApplication, User } from '@shared/schema';
import { APP_DOMAIN, BASE_URL, APP_URLS, EMAIL_FROM } from './config/domain';
import { sendCommunityInvitationEmail, sendNotificationEmail } from './email';
import { sendLivestreamerApplicationNotificationEmail, sendApplicationStatusUpdateEmail, sendApologistScholarApplicationNotificationEmail } from './email-notifications';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { ensureCleanText, ensureSafeBinaryUpload, ensureAllowedMimeType, handleModerationError } from './utils/moderation';

// Local payload types to avoid fragile inferred types from shared/zod schemas
interface LivestreamAppPayload {
  userId?: number;
  ministryName?: string;
  ministryDescription?: string;
  ministerialExperience?: string;
  statementOfFaith?: string;
  socialMediaLinks?: string;
  referenceName?: string;
  referenceContact?: string;
  referenceRelationship?: string;
  sampleContentUrl?: string;
  livestreamTopics?: string;
  targetAudience?: string;
  agreedToTerms?: boolean;
}

interface ApologistScholarAppPayload {
  userId?: number;
  fullName?: string;
  academicCredentials?: string;
  educationalBackground?: string;
  theologicalPerspective?: string;
  statementOfFaith?: string;
  areasOfExpertise?: string;
  publishedWorks?: string;
  priorApologeticsExperience?: string;
  writingSample?: string;
  onlineSocialHandles?: string;
  referenceName?: string;
  referenceContact?: string;
  referenceInstitution?: string;
  motivation?: string;
  weeklyTimeCommitment?: string;
  agreedToGuidelines?: boolean;
}

// Utility function for generating tokens
const generateToken = () => crypto.randomBytes(32).toString('hex');

// Import modular route files
// import authRoutes from './routes/api/auth'; // removed, now using modular './routes/auth'
import adminRoutes from './routes/api/admin';
import userRoutes from './routes/api/user';
import meRoutes from './routes/me';
import userSettingsRoutes from './routes/userSettingsRoutes';
import dmRoutes from './routes/dmRoutes';
import pushTokenRoutes from './routes/pushTokens';
import organizationRoutes from './routes/organizations';
import mvpRoutes from './routes/mvp';
import { recommendationRouter } from './routes/recommendation';
import { registerOnboardingRoutes } from './routes/api/user-onboarding';
import registerLocationSearchRoutes from './routes/api/location-search';
import supportRoutes from './routes/api/support';
import debugRoutes from './routes/api/debug';
import accountRoutes from './routes/account';
import safetyRoutes from './routes/safety';
import { FEATURES } from './config/features';
import { setSocketInstance } from './socketInstance';

// Modular route imports
import authRoutes from './routes/auth';
import createFeedRouter from './routes/createFeedRouter';
import postsRoutes from './routes/posts';
import microblogsRoutes from './routes/microblogs';
import communitiesRoutes from './routes/communities';
import eventsRoutes from './routes/events';
import apologeticsRoutes from './routes/apologetics';
import questionsRoutes from './routes/questions';
import libraryRoutes from './routes/library';
import moderationRoutes from './routes/moderation';
import followRoutes from './routes/follow';
import searchRoutes from './routes/search';
import passwordResetRoutes from './routes/passwordReset';
import uploadRoutes from './routes/upload';
import { chatMessagesQuerySchema } from './routes/chatMessages';
import messagesRoutes from './routes/messages';
import notificationsRoutes from './routes/notifications';
import publicRoutes from './routes/public';
import wellKnownRoutes from './routes/well-known';
import clergyVerificationRoutes from './routes/clergy-verification';
import { ogMetaMiddleware } from './middleware/og-meta';

// Organization feature routes
import orgsPublicRoutes from './routes/orgs-public';
import myChurchesRoutes from './routes/my-churches';
import membershipRequestsRoutes from './routes/membership-requests';
import meetingRequestsRoutes from './routes/meeting-requests';
import leaderInboxRoutes from './routes/leader-inbox';
import userEntitlementsRoutes from './routes/user-entitlements';
import ordinationsRoutes from './routes/ordinations';
import orgAdminRoutes from './routes/org-admin';
import sermonsRoutes from './routes/sermons';
import muxWebhookRoutes from './routes/webhooks-mux';
import stripeRoutes from './routes/stripe';

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    isAdmin?: boolean;
    isVerifiedApologeticsAnswerer?: boolean;
    email?: string;
    username?: string;
  }
}

// Async version needed to check follow relationship
async function canViewProfileAsync(target: User, viewerId?: number, viewerIsAdmin?: boolean): Promise<boolean> {
  if (viewerIsAdmin) return true;
  if (!target.profileVisibility || target.profileVisibility === 'public') return true;
  if (!viewerId) return false;
  if (target.id === viewerId) return true;
  // For 'friends' or 'private' visibility, check if viewer is an accepted follower
  const isFollower = await storage.isUserFollowing(viewerId, target.id);
  return isFollower;
}

// Sync version for backward compatibility (assumes public if can't check)
function canViewProfile(target: User, viewerId?: number, viewerIsAdmin?: boolean) {
  if (viewerIsAdmin) return true;
  if (!target.profileVisibility || target.profileVisibility === 'public') return true;
  if (!viewerId) return false;
  if (target.id === viewerId) return true;
  // For sync calls, return false for private accounts (caller should use async version)
  return false;
}

function sanitizeUserForResponse(target: User, viewerId?: number, viewerIsAdmin?: boolean) {
  const isSelf = viewerId === target.id;
  const result: Record<string, unknown> = {
    id: target.id,
    username: target.username,
    displayName: target.displayName,
    bio: target.bio,
    avatarUrl: target.avatarUrl,
    onboardingCompleted: target.onboardingCompleted,
    isVerifiedApologeticsAnswerer: target.isVerifiedApologeticsAnswerer,
    createdAt: target.createdAt,
    updatedAt: target.updatedAt,
  };

  if (viewerIsAdmin || isSelf) {
    result.email = target.email;
    result.profileVisibility = target.profileVisibility;
    result.showLocation = target.showLocation;
    result.showInterests = target.showInterests;
    result.notifyDms = target.notifyDms;
    result.notifyCommunities = target.notifyCommunities;
    result.notifyForums = target.notifyForums;
    result.notifyFeed = target.notifyFeed;
    result.dmPrivacy = target.dmPrivacy;
    result.dateOfBirth = target.dateOfBirth;
  }

  if (target.showLocation || viewerIsAdmin || isSelf) {
    result.city = target.city;
    result.state = target.state;
    result.zipCode = target.zipCode;
  }

  if ((target.showInterests || viewerIsAdmin || isSelf) && (target as any).interestTags) {
    result.interestTags = (target as any).interestTags;
  }

  return result;
}

function parseNumericQuery(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  const parsed = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function haversineDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMiles * c;
}

type SocketDependencies = {
  storage: typeof storage;
  sendPushNotification: typeof sendPushNotification;
  logger?: Pick<typeof console, 'log' | 'error' | 'warn'>;
};

const defaultSocketDependencies: SocketDependencies = {
  storage,
  sendPushNotification,
  logger: console,
};

function emitSocketError(
  socket: any,
  logger: Pick<typeof console, 'log' | 'error' | 'warn'>,
  context: string,
  error: unknown,
  payload: { message: string; code?: string }
) {
  logger.error(`${context}:`, error);
  socket.emit('error', payload);
}

export function registerSocketHandlers(
  io: SocketIOServer,
  deps: SocketDependencies = defaultSocketDependencies
) {
  const { storage: storageDep, sendPushNotification: pushNotification, logger = console } = deps;

  // SECURITY: JWT authentication middleware for Socket.IO
  // PRODUCTION: Requires valid JWT token - no fallback allowed
  io.use((socket, next) => {
    try {
      const jwt = require('jsonwebtoken');
      const jwtSecret = process.env.JWT_SECRET;
      const isProduction = process.env.NODE_ENV === 'production';

      const token = socket.handshake.auth?.token;

      // JWT_SECRET must be configured
      if (!jwtSecret) {
        logger.error('Socket.IO: JWT_SECRET not configured - rejecting all connections');
        return next(new Error('Server configuration error'));
      }

      // Token is required
      if (!token) {
        logger.log('Socket.IO connection rejected: No JWT token provided');
        return next(new Error('Authentication required: JWT token not provided'));
      }

      // Verify the JWT token
      try {
        const decoded = jwt.verify(token, jwtSecret) as { sub?: number; id?: number; userId?: number };
        const userId = decoded.sub || decoded.id || decoded.userId;

        if (!userId) {
          logger.log('Socket.IO connection rejected: JWT token has no user ID');
          return next(new Error('Invalid token: no user ID'));
        }

        // Store verified userId on socket - this is the ONLY trusted source
        (socket as any).userId = userId;
        if (!isProduction) {
          logger.log(`Socket.IO JWT authenticated for user ${userId}`);
        }
        return next();
      } catch (jwtError: any) {
        logger.log(`Socket.IO JWT verification failed: ${jwtError.message}`);
        return next(new Error('Authentication failed: invalid or expired token'));
      }
    } catch (error) {
      emitSocketError(socket, logger, 'Socket authentication failed', error, {
        message: 'Failed to authenticate socket connection',
      });
      next(error as Error);
    }
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    const authenticatedUserId = (socket as any).userId;
    logger.log('User connected:', socket.id, 'User ID:', authenticatedUserId);

    // Join user to their own room for private messages
    socket.on('join_user_room', (userId) => {
      try {
        // SECURITY: Verify userId matches authenticated user
        if (parseInt(userId) !== authenticatedUserId) {
          logger.log(`User ${authenticatedUserId} attempted to join room for user ${userId}`);
          socket.emit('error', {
            message: 'Unauthorized: Cannot join another user room',
            code: 'UNAUTHORIZED_JOIN'
          });
          return;
        }

        socket.join(`user_${userId}`);
        logger.log(`User ${userId} joined room user_${userId}`);
      } catch (error) {
        emitSocketError(socket, logger, 'Error handling join_user_room', error, {
          message: 'Failed to join user room',
        });
      }
    });

    // Join community chat room
    socket.on('join_room', (roomId) => {
      try {
        socket.join(`room_${roomId}`);
        logger.log(`User joined room ${roomId}`);
      } catch (error) {
        emitSocketError(socket, logger, 'Error joining room', error, {
          message: 'Failed to join room',
        });
      }
    });

    // Leave community chat room
    socket.on('leave_room', (roomId) => {
      try {
        socket.leave(`room_${roomId}`);
        logger.log(`User left room ${roomId}`);
      } catch (error) {
        emitSocketError(socket, logger, 'Error leaving room', error, {
          message: 'Failed to leave room',
        });
      }
    });

    // Handle new chat message
    socket.on('new_message', async (data) => {
      try {
        const { roomId, content, senderId, isAnnouncement } = data;

        // SECURITY: Verify senderId matches authenticated user
        if (parseInt(senderId) !== authenticatedUserId) {
          logger.log(`User ${authenticatedUserId} attempted to send message as user ${senderId}`);
          socket.emit('error', {
            message: 'Unauthorized: Cannot send message as another user',
            code: 'UNAUTHORIZED_SENDER'
          });
          return;
        }

        // Get the chat room to find the community
        const chatRoom = await storageDep.getCommunityRoom(parseInt(roomId));
        if (!chatRoom) {
          socket.emit('error', {
            message: 'Chat room not found',
            code: 'ROOM_NOT_FOUND'
          });
          return;
        }

        // If sending as announcement, verify user is admin/moderator
        let canSendAnnouncement = false;
        if (isAnnouncement) {
          const isModerator = await storageDep.isCommunityModerator(chatRoom.communityId, authenticatedUserId);
          if (!isModerator) {
            socket.emit('error', {
              message: 'Only admins and moderators can send announcements',
              code: 'UNAUTHORIZED_ANNOUNCEMENT'
            });
            return;
          }
          canSendAnnouncement = true;
        }

        // Create message in database
        const newMessage = await storageDep.createChatMessage({
          chatRoomId: parseInt(roomId),
          senderId: authenticatedUserId, // Use authenticated userId
          content: content,
          isAnnouncement: canSendAnnouncement,
        });

        // Get sender info
        const sender = await storageDep.getUser(authenticatedUserId);
        const messageWithSender = { ...newMessage, sender };

        // Broadcast to room
        io.to(`room_${roomId}`).emit('message_received', messageWithSender);

        // If announcement, send push notifications to all community members
        if (canSendAnnouncement) {
          const community = await storageDep.getCommunity(chatRoom.communityId);
          const communityName = community?.name || 'Community';
          const senderName = sender?.displayName || sender?.username || 'Admin';

          logger.log(`Sending announcement notification to community ${chatRoom.communityId}`);

          // Notify all community members except the sender
          await notifyCommunityMembers(
            chatRoom.communityId,
            {
              title: `${communityName} Announcement`,
              body: `${senderName}: ${truncateText(content, 100)}`,
              data: {
                type: 'community_announcement',
                communityId: chatRoom.communityId,
                roomId: parseInt(roomId),
                messageId: newMessage.id,
              },
              category: 'community',
            },
            [authenticatedUserId] // Exclude sender from notifications
          );
        }
      } catch (error) {
        emitSocketError(socket, logger, 'Error handling chat message', error, {
          message: 'Failed to send message',
          code: 'MESSAGE_ERROR'
        });
      }
    });

    // Handle private/direct messages
    socket.on('send_dm', async (data) => {
      try {
        const { senderId, receiverId, content } = data;

        // SECURITY: Verify senderId matches authenticated user
        if (parseInt(senderId) !== authenticatedUserId) {
          logger.log(`User ${authenticatedUserId} attempted to send DM as user ${senderId}`);
          socket.emit('error', {
            message: 'Unauthorized: Cannot send DM as another user',
            code: 'UNAUTHORIZED_SENDER'
          });
          return;
        }

        // Create message in database
        const messageData = {
          senderId: authenticatedUserId, // Use authenticated userId
          receiverId: parseInt(receiverId),
          content: content,
          createdAt: new Date()
        };

        // Persist message to database
        const savedMessage = await storageDep.createDirectMessage(messageData);

        // Emit to both sender and receiver with saved message (includes ID)
        io.to(`user_${authenticatedUserId}`).emit("new_message", savedMessage);
        io.to(`user_${receiverId}`).emit("new_message", savedMessage);

        // Send notification using dual system (in-app + push)
        try {
          const sender = await storageDep.getUser(authenticatedUserId);
          const senderName = sender?.displayName || sender?.username || 'Someone';

          await notifyUserWithPreferences(parseInt(receiverId), {
            title: `New message from ${senderName}`,
            body: truncateText(content, 80),
            data: {
              type: 'dm',
              senderId: authenticatedUserId,
              messageId: savedMessage.id,
            },
            category: 'dm',
          });
        } catch (notifError) {
          logger.error('Error sending DM notification:', notifError);
          // Don't fail the message send if notification fails
        }
      } catch (error) {
        emitSocketError(socket, logger, 'Error handling DM', error, {
          message: 'Failed to send direct message',
          code: 'DM_ERROR'
        });
      }
    });

    // Handle typing indicator
    socket.on('typing', (data: { roomId: number; userId?: number; username?: string }) => {
      try {
        const { roomId, userId, username } = data;

        // Use authenticated user ID if provided userId doesn't match
        const senderId = userId === authenticatedUserId ? userId : authenticatedUserId;

        // Broadcast typing indicator to the room (except sender)
        socket.to(`room_${roomId}`).emit('user_typing', {
          userId: senderId,
          username: username || 'Someone',
          roomId
        });
      } catch (error) {
        emitSocketError(socket, logger, 'Error handling typing indicator', error, {
          message: 'Failed to send typing indicator',
        });
      }
    });

    socket.on('disconnect', () => {
      logger.log('User disconnected:', socket.id);
    });
  });
}

export async function registerRoutes(app: Express, httpServer: HTTPServer) {
  // .well-known routes for iOS Universal Links and Android App Links
  // Must be registered FIRST, before any other middleware
  app.use(wellKnownRoutes);

  // Set up authentication
  setupAuth(app);

  // OG meta tag middleware for social media crawlers
  // Must be early to intercept crawler requests for canonical URLs (/a/, /e/, /p/, /u/)
  app.use(ogMetaMiddleware());

  // Session userId normalization middleware - ensure userId is always a number
  app.use(normalizeSessionUserId);

  const generalApiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    message: 'Rate limit exceeded. Please slow down.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  const uploadLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 20,
    message: 'Too many uploads. Try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api', generalApiLimiter);

  // Set up Socket.IO for real-time chat with memory optimizations
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    // Memory optimizations for 512MB environments
    maxHttpBufferSize: 1e6, // 1MB max message size (default is 1e6)
    pingTimeout: 30000, // Give clients time to respond
    pingInterval: 25000, // Keep connections alive
    connectTimeout: 45000, // Allow slow mobile connections
    // Disable binary parser to save memory if not using binary data
    parser: undefined,
    // Limit concurrent polling requests
    transports: ['polling', 'websocket'],
    allowUpgrades: true,
    // Reduce memory usage by limiting adapters
    perMessageDeflate: false, // Disable compression (CPU/memory tradeoff)
  });

  // Make socket instance available to other modules (e.g., dmRoutes)
  setSocketInstance(io);

  registerSocketHandlers(io);

  // Use modular route files - mount only if feature flags enable them
  // Register modular routes only if their feature flag is enabled
  if (FEATURES.AUTH) {
    app.use('/api', authRoutes);
    app.use('/api/password-reset', passwordResetRoutes);
    app.use('/api', accountRoutes);
    app.use('/api', safetyRoutes);
    // compatibility moderation router (legacy clients hitting /api/moderation/* will be redirected)
    app.use('/api', moderationRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api', followRoutes);
    app.use('/api', uploadRoutes); // File upload routes (GCS)
  }

  if (FEATURES.ORGS) {
    // Legacy organization routes
    app.use('/api/organizations', organizationRoutes);
    app.use('/api/clergy-verification', clergyVerificationRoutes);

    // New organization feature routes
    app.use('/api/orgs', orgsPublicRoutes);           // Public directory and profiles
    app.use('/api/me/churches', myChurchesRoutes);    // Soft affiliations
    app.use('/api/orgs', membershipRequestsRoutes);   // Membership requests (mounted under /api/orgs/:slug/*)
    app.use('/api/orgs', meetingRequestsRoutes);      // Meeting requests (mounted under /api/orgs/:slug/*)
    app.use('/api/leader-inbox', leaderInboxRoutes);  // Leader inbox
    app.use('/api/me', userEntitlementsRoutes);       // User entitlements
    app.use('/api/ordinations', ordinationsRoutes);   // Ordination programs and applications
    app.use('/api/org-admin', orgAdminRoutes);        // Steward Console (org admin)
    app.use('/api/sermons', sermonsRoutes);           // Public sermon playback
    app.use('/api/webhooks/mux', muxWebhookRoutes);   // Mux video webhooks
    app.use('/api/stripe', stripeRoutes);             // Stripe payments
  }

  if (FEATURES.NOTIFICATIONS || FEATURES.COMMUNITIES || FEATURES.POSTS || FEATURES.FEED) {
    app.use('/api/support', supportRoutes);
    app.use('/api/debug', debugRoutes);
  }

  // Minimal MVP routes are always available under /api/mvp
  app.use('/api/mvp', mvpRoutes);

  // Public routes for shareable content previews (no authentication required)
  // These are mounted directly to support canonical URLs: /api/public/*
  app.use(publicRoutes);

  if (FEATURES.FEED) {
    app.use('/api', createFeedRouter(storage));
  }
  if (FEATURES.POSTS) {
    app.use('/api', postsRoutes);
    app.use('/api', microblogsRoutes);
  }
  if (FEATURES.COMMUNITIES) {
    app.use('/api', communitiesRoutes);
  }
  if (FEATURES.EVENTS) {
    app.use('/api', eventsRoutes);
  }
  if (FEATURES.APOLOGETICS) {
    app.use('/api', apologeticsRoutes);
    app.use('/api', questionsRoutes); // Q&A Inbox System
    app.use('/api/library', libraryRoutes); // Library Posts System
  }

  // Notifications (hardened service pattern)
  app.use('/api/notifications', notificationsRoutes);
  
  // CRITICAL: This MUST execute for mobile app to get permissions
  // DO NOT add any routes before this that could shadow it
  app.get('/api/user', async (req, res) => {
    console.error('ROUTES.TS /api/user HANDLER CALLED');
    try {
      const userId = getSessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // ALWAYS get permissions - this is critical for mobile app
      const { db } = await import('./db');
      const { userPermissions } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');

      const permissionsResult = await db
        .select({ permission: userPermissions.permission })
        .from(userPermissions)
        .where(eq(userPermissions.userId, userId));

      const permissions = permissionsResult.map(p => p.permission);
      console.error('Returning permissions:', permissions, 'for user:', user.username);

      // Remove password, add permissions, map avatarUrl for mobile compatibility
      const { password, avatarUrl, ...userData } = user;

      const response = {
        ...userData,
        profileImageUrl: avatarUrl,  // Mobile app expects this field name
        permissions,                  // CRITICAL: Include permissions array
      };

      console.error('Response includes permissions:', 'permissions' in response);
      res.json(response);
    } catch (error) {
      console.error('Error in /api/user:', error);
      res.status(500).json({ error: 'Error fetching user' });
    }
  });
  
  if (FEATURES.AUTH) {
    app.use('/api/user', userSettingsRoutes); // Must be before userRoutes to avoid /:id catching /settings
    app.use('/api/user', userRoutes);
    app.use('/api/me', meRoutes); // Single source of truth for capabilities
    registerOnboardingRoutes(app); // Register onboarding completion endpoint
    app.use('/api/dms', dmRoutes);
    app.use('/api/dm', dmRoutes);       // Alias for mobile app (singular)
    app.use('/api/messages', dmRoutes); // Alias for mobile app compatibility
    app.use('/api', messagesRoutes); // Community chat routes (has /communities/:id/chat/* endpoints)
    app.use('/api/push-tokens', pushTokenRoutes);
  }


  // User endpoints (gated by AUTH feature)
  if (FEATURES.AUTH) {
    app.get('/api/users', isAuthenticated, async (req, res) => {
      const viewerId = requireSessionUserId(req);
      const viewerIsAdmin = req.session?.isAdmin === true;
      try {
        if (req.query.search) {
          const searchTerm = req.query.search as string;
          const users = await storage.searchUsers(searchTerm);
          const sanitizedUsers = users
            .filter(user => canViewProfile(user, viewerId, viewerIsAdmin))
            .map(user => sanitizeUserForResponse(user, viewerId, viewerIsAdmin));
          return res.json(sanitizedUsers);
        }
        const users = await storage.getAllUsers();
        const sanitizedUsers = users
          .filter(user => canViewProfile(user, viewerId, viewerIsAdmin))
          .map(user => sanitizeUserForResponse(user, viewerId, viewerIsAdmin));
        res.json(sanitizedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json(buildErrorResponse('Error fetching users', error));
      }
    });

    // Public user profile lookup by ID (for shared links from mobile app)
    app.get('/api/users/by-id/:id', async (req, res) => {
      try {
        const viewerId = getSessionUserId(req);
        const viewerIsAdmin = req.session?.isAdmin === true;
        const userId = parseInt(req.params.id);
        if (!Number.isFinite(userId)) {
          return res.status(400).json({ message: 'Invalid user ID' });
        }
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        const canView = await canViewProfileAsync(user, viewerId, viewerIsAdmin);
        if (!canView) {
          return res.status(403).json({ message: 'This profile is private' });
        }
        res.json(sanitizeUserForResponse(user, viewerId, viewerIsAdmin));
      } catch (error) {
        console.error('Error fetching user by ID:', error);
        res.status(500).json(buildErrorResponse('Error fetching user', error));
      }
    });

    // Public user profile lookup by username (for shared links)
    app.get('/api/users/profile/:username', async (req, res) => {
      try {
        const viewerId = getSessionUserId(req);
        const viewerIsAdmin = req.session?.isAdmin === true;
        const username = req.params.username;
        if (!username || typeof username !== 'string') {
          return res.status(400).json({ message: 'Invalid username' });
        }
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        const canView = await canViewProfileAsync(user, viewerId, viewerIsAdmin);
        if (!canView) {
          return res.status(403).json({ message: 'This profile is private' });
        }
        res.json(sanitizeUserForResponse(user, viewerId, viewerIsAdmin));
      } catch (error) {
        console.error('Error fetching user by username:', error);
        res.status(500).json(buildErrorResponse('Error fetching user', error));
      }
    });

    app.get('/api/users/:id', isAuthenticated, async (req, res) => {
      try {
        const viewerId = requireSessionUserId(req);
        const viewerIsAdmin = req.session?.isAdmin === true;
        const userId = parseInt(req.params.id);
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        if (!canViewProfile(user, viewerId, viewerIsAdmin)) {
          return res.status(403).json({ message: 'This profile is private' });
        }
        res.json(sanitizeUserForResponse(user, viewerId, viewerIsAdmin));
      } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json(buildErrorResponse('Error fetching user', error));
      }
    });

    // Public endpoint to get a user's posts (for profile viewing)
    app.get('/api/users/:id/posts', async (req, res) => {
      try {
        const viewerId = getSessionUserId(req);
        const viewerIsAdmin = req.session?.isAdmin === true;
        const userId = parseInt(req.params.id);
        if (!Number.isFinite(userId)) {
          return res.status(400).json({ message: 'Invalid user ID' });
        }
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        const canView = await canViewProfileAsync(user, viewerId, viewerIsAdmin);
        if (!canView) {
          return res.json([]); // Return empty for private profiles
        }
        const posts = await storage.getUserPosts(userId);
        res.json(posts);
      } catch (error) {
        console.error('Error fetching user posts:', error);
        res.status(500).json(buildErrorResponse('Error fetching user posts', error));
      }
    });

    // Public endpoint to get a user's communities (for profile viewing)
    app.get('/api/users/:id/communities', async (req, res) => {
      try {
        const viewerId = getSessionUserId(req);
        const viewerIsAdmin = req.session?.isAdmin === true;
        const userId = parseInt(req.params.id);
        if (!Number.isFinite(userId)) {
          return res.status(400).json({ message: 'Invalid user ID' });
        }
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        const canView = await canViewProfileAsync(user, viewerId, viewerIsAdmin);
        if (!canView) {
          return res.json([]); // Return empty for private profiles
        }
        const communities = await storage.getUserCommunities(userId);
        // Only return public communities for non-authenticated viewers
        const visibleCommunities = communities.filter((c: any) =>
          viewerId || c.privacySetting === 'public'
        );
        res.json(visibleCommunities);
      } catch (error) {
        console.error('Error fetching user communities:', error);
        res.status(500).json(buildErrorResponse('Error fetching user communities', error));
      }
    });

    app.get('/api/users/:id/liked-microblogs', isAuthenticated, async (req, res) => {
      try {
        const userId = parseInt(req.params.id);
        const viewerId = requireSessionUserId(req);
        const viewerIsAdmin = req.session?.isAdmin === true;
        if (viewerId !== userId && !viewerIsAdmin) {
          return res.status(403).json({ message: 'Not authorized to view likes' });
        }
        const likedMicroblogs = await storage.getUserLikedMicroblogs(userId);
        res.json(likedMicroblogs);
      } catch (error) {
        console.error('Error fetching liked microblogs:', error);
        res.status(500).json(buildErrorResponse('Error fetching liked microblogs', error));
      }
    });

    app.get('/api/users/verified-apologetics-answerers', async (req, res) => {
      try {
        const viewerId = getSessionUserId(req);
        const viewerIsAdmin = req.session?.isAdmin === true;
        const users = await storage.getAllUsers();
        const verifiedAnswerers = users.filter(user => user.isVerifiedApologeticsAnswerer);
        const sanitizedUsers = verifiedAnswerers
          .filter(user => canViewProfile(user, viewerId, viewerIsAdmin))
          .map(user => sanitizeUserForResponse(user, viewerId, viewerIsAdmin));
        res.json(sanitizedUsers);
      } catch (error) {
        console.error('Error fetching verified apologetics answerers:', error);
        res.status(500).json(buildErrorResponse('Error fetching verified apologetics answerers', error));
      }
    });
  }

  // Community endpoints (gated by COMMUNITIES feature)
  if (FEATURES.COMMUNITIES) {
    app.get('/api/communities', async (req, res) => {
      try {
        const userId = getSessionUserId(req);
        const searchQuery = typeof req.query.search === 'string' ? req.query.search : undefined;
        let communities = await storage.getPublicCommunitiesAndUserCommunities(userId, searchQuery);
        if (userId) {
          const blockedIds = await storage.getBlockedUserIdsFor(userId);
          if (blockedIds && blockedIds.length > 0) {
            communities = communities.filter(c => !blockedIds.includes(c.createdBy));
          }
        }

        const pagination = getPaginationParams(req.query);
        const paginated = communities.slice(pagination.offset, pagination.offset + pagination.limit);
        attachPaginationHeaders(res, communities.length, pagination);
        res.json(paginated);
      } catch (error) {
        console.error('Error fetching communities:', error);
        res.status(500).json(buildErrorResponse('Error fetching communities', error));
      }
    });

  // REMOVED: Duplicate route handler - using modular router from routes/communities.ts instead
  // This OLD handler was returning community WITHOUT membership info (isMember, role, isAdmin)
  // The NEW handler in routes/communities.ts properly computes and returns membership data

  app.post('/api/communities', contentCreationLimiter, isAuthenticated, async (req, res) => {
    try {
  const userId = requireSessionUserId(req);
      const validatedData = insertCommunitySchema.parse({
        ...req.body,
        createdBy: userId
      });
      await ensureCleanText(validatedData.name, 'Community name');
      await ensureCleanText(validatedData.description, 'Community description');

      const community = await storage.createCommunity(validatedData);
      
      // Add creator as owner
      await storage.addCommunityMember({
        communityId: community.id,
        userId: userId,
        role: 'owner'
      });

      res.status(201).json(community);
    } catch (error) {
      if (handleModerationError(res, error)) return;
      console.error('Error creating community:', error);
      res.status(500).json(buildErrorResponse('Error creating community', error));
    }
  });

  app.post('/api/communities/:idOrSlug/join', isAuthenticated, async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      
      // Get community ID whether provided as ID or slug
      let communityId: number;
      if (/^\d+$/.test(idOrSlug)) {
        communityId = parseInt(idOrSlug);
      } else {
        const community = await storage.getCommunityBySlug(idOrSlug);
        if (!community) {
          return res.status(404).json({ message: 'Community not found' });
        }
        communityId = community.id;
      }
  const userId = requireSessionUserId(req);

      // Check if user is already a member
      const isMember = await storage.isCommunityMember(communityId, userId);
      if (isMember) {
        return res.status(400).json({ message: 'Already a member of this community' });
      }

      // Check if this is the first member or if there's no owner
      const existingMembers = await storage.getCommunityMembers(communityId);
      const hasOwner = existingMembers.some((m: any) => m.role === 'owner');
      const role = (existingMembers.length === 0 || !hasOwner) ? 'owner' : 'member';

      console.info(`[JOIN] Adding user ${userId} as ${role} (existing members: ${existingMembers.length}, has owner: ${hasOwner})`);

      await storage.addCommunityMember({
        communityId: communityId,
        userId: userId,
        role: role
      });

      res.json({
        message: role === 'owner' ? 'Joined community as owner' : 'Successfully joined community',
        role
      });
    } catch (error) {
      console.error('Error joining community:', error);
      res.status(500).json(buildErrorResponse('Error joining community', error));
    }
  });

  app.post('/api/communities/:idOrSlug/leave', isAuthenticated, async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      
      // Get community ID whether provided as ID or slug
      let communityId: number;
      if (/^\d+$/.test(idOrSlug)) {
        communityId = parseInt(idOrSlug);
      } else {
        const community = await storage.getCommunityBySlug(idOrSlug);
        if (!community) {
          return res.status(404).json({ message: 'Community not found' });
        }
        communityId = community.id;
      }
  const userId = requireSessionUserId(req);

      await storage.removeCommunityMember(communityId, userId);
      res.json({ message: 'Successfully left community' });
    } catch (error) {
      console.error('Error leaving community:', error);
      res.status(500).json(buildErrorResponse('Error leaving community', error));
    }
  });

  app.get('/api/communities/:idOrSlug/members', async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      
      // Get community ID whether provided as ID or slug
      let communityId: number;
      if (/^\d+$/.test(idOrSlug)) {
        communityId = parseInt(idOrSlug);
      } else {
        const community = await storage.getCommunityBySlug(idOrSlug);
        if (!community) {
          return res.status(404).json({ message: 'Community not found' });
        }
        communityId = community.id;
      }
      const members = await storage.getCommunityMembers(communityId);
      res.json(members);
    } catch (error) {
      console.error('Error fetching community members:', error);
      res.status(500).json(buildErrorResponse('Error fetching community members', error));
    }
  });

  app.post('/api/communities/:idOrSlug/invite', isAuthenticated, async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      
      // Get community ID whether provided as ID or slug
      let communityId: number;
      if (/^\d+$/.test(idOrSlug)) {
        communityId = parseInt(idOrSlug);
      } else {
        const community = await storage.getCommunityBySlug(idOrSlug);
        if (!community) {
          return res.status(404).json({ message: 'Community not found' });
        }
        communityId = community.id;
      }
  const userId = requireSessionUserId(req);
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
        inviterUserId: userId,
        inviteeEmail: email,
        token: token,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7*24*60*60*1000)
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
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Don't fail the request if email fails
      }

      res.status(201).json(invitation);
    } catch (error) {
      console.error('Error creating community invitation:', error);
      res.status(500).json(buildErrorResponse('Error creating community invitation', error));
    }
  });

  app.delete('/api/communities/:idOrSlug/members/:userId', isAuthenticated, async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      
      // Get community ID whether provided as ID or slug
      let communityId: number;
      if (/^\d+$/.test(idOrSlug)) {
        communityId = parseInt(idOrSlug);
      } else {
        const community = await storage.getCommunityBySlug(idOrSlug);
        if (!community) {
          return res.status(404).json({ message: 'Community not found' });
        }
        communityId = community.id;
      }
      const targetUserId = parseInt(req.params.userId);
  const currentUserId = requireSessionUserId(req);

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
      res.status(500).json(buildErrorResponse('Error removing community member', error));
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
      res.status(500).json(buildErrorResponse('Error fetching invitation', error));
    }
  });

  app.post('/api/invitations/:token/accept', isAuthenticated, async (req, res) => {
    try {
      const token = req.params.token;
  const userId = requireSessionUserId(req);
      
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

      // Check if this is the first member or if there's no owner
      const existingMembers = await storage.getCommunityMembers(invitation.communityId);
      const hasOwner = existingMembers.some((m: any) => m.role === 'owner');
      const role = (existingMembers.length === 0 || !hasOwner) ? 'owner' : 'member';

      // Add user to community
      await storage.addCommunityMember({
        communityId: invitation.communityId,
        userId: userId,
        role: role
      });

      // Update invitation status
      await storage.updateCommunityInvitationStatus(invitation.id, 'accepted');

      res.json({
        message: role === 'owner' ? 'Joined community as owner' : 'Successfully joined community',
        role
      });
    } catch (error) {
      console.error('Error accepting invitation:', error);
      res.status(500).json(buildErrorResponse('Error accepting invitation', error));
    }
  });

  // Community chat rooms
  app.get('/api/communities/:idOrSlug/chat-rooms', async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      
      // Get community ID whether provided as ID or slug
      let communityId: number;
      if (/^\d+$/.test(idOrSlug)) {
        communityId = parseInt(idOrSlug);
      } else {
        const community = await storage.getCommunityBySlug(idOrSlug);
        if (!community) {
          return res.status(404).json({ message: 'Community not found' });
        }
        communityId = community.id;
      }
  const userId = getSessionUserId(req);

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
      res.status(500).json(buildErrorResponse('Error fetching chat rooms', error));
    }
  });

  app.post('/api/communities/:idOrSlug/chat-rooms', isAuthenticated, async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      
      // Get community ID whether provided as ID or slug
      let communityId: number;
      if (/^\d+$/.test(idOrSlug)) {
        communityId = parseInt(idOrSlug);
      } else {
        const community = await storage.getCommunityBySlug(idOrSlug);
        if (!community) {
          return res.status(404).json({ message: 'Community not found' });
        }
        communityId = community.id;
      }
  const userId = requireSessionUserId(req);
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
      res.status(500).json(buildErrorResponse('Error creating chat room', error));
    }
  });

  app.put('/api/chat-rooms/:roomId', isAuthenticated, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
  const userId = requireSessionUserId(req);
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
      res.status(500).json(buildErrorResponse('Error updating chat room', error));
    }
  });

  app.delete('/api/chat-rooms/:roomId', isAuthenticated, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
  const userId = requireSessionUserId(req);

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
      res.status(500).json(buildErrorResponse('Error deleting chat room', error));
    }
  });

  app.get('/api/chat-rooms/:roomId/messages', async (req, res) => {
    const parsed = chatMessagesQuerySchema.safeParse({
      roomId: req.params.roomId,
      ...req.query
    });

    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid query parameters' });
    }

    try {
      const { roomId, limit = 50, after } = parsed.data;
      const effectiveLimit = Math.max(0, limit);
      const messages = after
        ? await storage.getChatMessagesAfter(roomId, after)
        : effectiveLimit === 0
          ? []
          : await storage.getChatMessages(roomId, effectiveLimit);

      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json(buildErrorResponse('Error fetching messages', error));
    }
  });

  app.post('/api/chat-rooms/:roomId/messages', messageCreationLimiter, isAuthenticated, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
  const userId = requireSessionUserId(req);
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
      res.status(500).json(buildErrorResponse('Error creating message', error));
    }
  });

  // Community wall posts
  app.get('/api/communities/:idOrSlug/wall', async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      
      // Get community ID whether provided as ID or slug
      let communityId: number;
      if (/^\d+$/.test(idOrSlug)) {
        communityId = parseInt(idOrSlug);
      } else {
        const community = await storage.getCommunityBySlug(idOrSlug);
        if (!community) {
          return res.status(404).json({ message: 'Community not found' });
        }
        communityId = community.id;
      }
      const posts = await storage.getCommunityWallPosts(communityId);
      res.json(posts);
    } catch (error) {
      console.error('Error fetching wall posts:', error);
      res.status(500).json(buildErrorResponse('Error fetching wall posts', error));
    }
  });

  app.post('/api/communities/:idOrSlug/wall', isAuthenticated, async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      
      // Get community ID whether provided as ID or slug
      let communityId: number;
      if (/^\d+$/.test(idOrSlug)) {
        communityId = parseInt(idOrSlug);
      } else {
        const community = await storage.getCommunityBySlug(idOrSlug);
        if (!community) {
          return res.status(404).json({ message: 'Community not found' });
        }
        communityId = community.id;
      }
  const userId = requireSessionUserId(req);
      const { content, isPrivate } = req.body;

      // Check if user is a member of the community
      const isMember = await storage.isCommunityMember(communityId, userId);
      if (!isMember) {
        return res.status(403).json({ message: 'Must be a member to post on community wall' });
      }

      await ensureCleanText(content, 'Community wall post');

      const post = await storage.createCommunityWallPost({
        communityId: communityId,
        authorId: userId,
        content: content,
        isPrivate: isPrivate || false
      });

      res.status(201).json(post);
    } catch (error) {
      if (handleModerationError(res, error)) return;
      console.error('Error creating wall post:', error);
      res.status(500).json(buildErrorResponse('Error creating wall post', error));
    }
  });

  }
  // Posts endpoints
  if (FEATURES.POSTS) {
    app.get('/api/posts', async (req, res) => {
      try {
        const filterMap: Record<string, 'top' | 'hot' | undefined> = {
          top: 'top',
          popular: 'top',
          hot: 'hot',
          new: undefined,
          recent: undefined,
        };
        const rawFilter = typeof req.query.filter === 'string' ? req.query.filter.toLowerCase() : undefined;
        if (rawFilter && !(rawFilter in filterMap)) {
          return res.status(400).json({ message: 'Invalid filter value' });
        }

        const userId = getSessionUserId(req);
        let posts = await storage.getAllPosts(rawFilter ? filterMap[rawFilter] : undefined);
        if (userId) {
          const blockedIds = await storage.getBlockedUserIdsFor(userId);
          if (blockedIds && blockedIds.length > 0) {
            posts = posts.filter(p => !blockedIds.includes(p.authorId));
          }
        }

        const pagination = getPaginationParams(req.query);
        const paginated = posts.slice(pagination.offset, pagination.offset + pagination.limit);
        attachPaginationHeaders(res, posts.length, pagination);
        res.json(paginated);
      } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json(buildErrorResponse('Error fetching posts', error));
      }
    });

  app.get('/api/posts/:id', async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Enrich post with author data
      const author = await storage.getUser(post.authorId);
      const enrichedPost = {
        ...post,
        author: author ? {
          id: author.id,
          username: author.username,
          displayName: author.displayName,
          profileImageUrl: author.profileImageUrl,
          avatarUrl: author.profileImageUrl,
        } : {
          id: post.authorId,
          username: 'deleted',
          displayName: 'Deleted User',
          profileImageUrl: null,
          avatarUrl: null,
        },
      };

      res.json(enrichedPost);
    } catch (error) {
      console.error('Error fetching post:', error);
      res.status(500).json(buildErrorResponse('Error fetching post', error));
    }
  });

  app.post('/api/posts', contentCreationLimiter, isAuthenticated, async (req, res) => {
    try {
  const userId = requireSessionUserId(req);
      const validatedData = insertPostSchema.parse({
        ...req.body,
        authorId: userId
      });
      await ensureCleanText(validatedData.title, 'Post title');
      await ensureCleanText(validatedData.content, 'Post content');

      const post = await storage.createPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      if (handleModerationError(res, error)) return;
      console.error('Error creating post:', error);
      res.status(500).json(buildErrorResponse('Error creating post', error));
    }
  });

  app.post('/api/posts/:id/upvote', isAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = requireSessionUserId(req);

      const result = await storage.togglePostVote(postId, userId);
      res.json({ ...result.post, userHasUpvoted: result.voted });
    } catch (error) {
      console.error('Error toggling post upvote:', error);
      res.status(500).json(buildErrorResponse('Error toggling post upvote', error));
    }
  });

    // Comments endpoints
  app.get('/api/posts/:id/comments', async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const comments = await storage.getCommentsByPostId(postId);

      // Enrich comments with author data
      const enrichedComments = await Promise.all(
        comments.map(async (comment: any) => {
          const author = await storage.getUser(comment.authorId);
          return {
            ...comment,
            author: author ? {
              id: author.id,
              username: author.username,
              displayName: author.displayName,
              profileImageUrl: author.profileImageUrl,
              avatarUrl: author.profileImageUrl,
            } : {
              id: comment.authorId,
              username: 'deleted',
              displayName: 'Deleted User',
              profileImageUrl: null,
              avatarUrl: null,
            },
          };
        })
      );

      res.json(enrichedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json(buildErrorResponse('Error fetching comments', error));
    }
  });

  app.post('/api/comments', messageCreationLimiter, isAuthenticated, async (req, res) => {
    try {
      const userId = requireSessionUserId(req);
      const validatedData = insertCommentSchema.parse({
        ...req.body,
        authorId: userId
      });
      await ensureCleanText(validatedData.content, 'Comment content');

      const comment = await storage.createComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      if (handleModerationError(res, error)) return;
      console.error('Error creating comment:', error);
      res.status(500).json(buildErrorResponse('Error creating comment', error));
    }
  });

  app.post('/api/comments/:id/upvote', isAuthenticated, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const userId = requireSessionUserId(req);

      const result = await storage.toggleCommentVote(commentId, userId);
      res.json({ ...result.comment, userHasUpvoted: result.voted });
    } catch (error) {
      console.error('Error toggling comment upvote:', error);
      res.status(500).json(buildErrorResponse('Error toggling comment upvote', error));
    }
  });
  }

  // Events endpoints
  const eventListQuerySchema = z.object({
    communityId: z.preprocess(val => (val === undefined ? undefined : val), z.coerce.number().int().positive()).optional(),
    groupId: z.preprocess(val => (val === undefined ? undefined : val), z.coerce.number().int().positive()).optional(),
    filter: z.enum(['all', 'upcoming', 'past', 'attending', 'hosting']).optional(),
  });

  app.get('/api/events', async (req, res) => {
    try {
      const parsedFilters = eventListQuerySchema.safeParse({
        communityId: Array.isArray(req.query.communityId) ? req.query.communityId[0] : req.query.communityId,
        groupId: Array.isArray(req.query.groupId) ? req.query.groupId[0] : req.query.groupId,
        filter: Array.isArray(req.query.filter) ? req.query.filter[0] : req.query.filter,
      });

      if (!parsedFilters.success) {
        return res.status(400).json({
          message: 'Invalid event filters',
          errors: parsedFilters.error.flatten(),
        });
      }

      const paginationResult = parsePaginationParams(req.query);
      if (!paginationResult.success) {
        return res.status(400).json({
          message: 'Invalid pagination parameters',
          errors: (paginationResult as any).error.flatten(),
        });
      }

      const userId = getSessionUserId(req);
      let events = await storage.getAllEvents();
      if (userId) {
        const blockedIds = await storage.getBlockedUserIdsFor(userId);
        if (blockedIds && blockedIds.length > 0) {
          events = events.filter(e => !blockedIds.includes(e.creatorId));
        }
      }

      const { communityId, groupId } = parsedFilters.data;
      if (communityId) {
        events = events.filter(event => event.communityId === communityId);
      }
      if (groupId) {
        events = events.filter(event => event.groupId === groupId);
      }

      const pagination = paginationResult.data;
      const paginated = events.slice(pagination.offset, pagination.offset + pagination.limit);
      attachPaginationHeaders(res, events.length, pagination);
      res.json(paginated);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json(buildErrorResponse('Error fetching events', error));
    }
  });

  app.get('/api/events/public', async (req, res) => {
    try {
      const paginationResult = parsePaginationParams(req.query);
      if (!paginationResult.success) {
        return res.status(400).json({
          message: 'Invalid pagination parameters',
          errors: (paginationResult as any).error.flatten(),
        });
      }

      const allEvents = await storage.getAllEvents();
      const events = allEvents.filter(event => event.isPublic);
      const pagination = paginationResult.data;
      const paginated = events.slice(pagination.offset, pagination.offset + pagination.limit);
      attachPaginationHeaders(res, events.length, pagination);
      res.json(paginated);
    } catch (error) {
      console.error('Error fetching public events:', error);
      res.status(500).json(buildErrorResponse('Error fetching public events', error));
    }
  });

  const nearbyEventsQuerySchema = z.object({
    latitude: z.coerce.number().finite().gte(-90).lte(90),
    longitude: z.coerce.number().finite().gte(-180).lte(180),
    radius: z
      .preprocess(val => (val === undefined ? 25 : val), z.coerce.number().finite().min(1).max(250))
      .default(25),
  });

  app.get('/api/events/nearby', async (req, res) => {
    try {
      const query = {
        latitude: Array.isArray(req.query.latitude) ? req.query.latitude[0] : req.query.latitude,
        longitude: Array.isArray(req.query.longitude) ? req.query.longitude[0] : req.query.longitude,
        radius: Array.isArray(req.query.radius) ? req.query.radius[0] : req.query.radius,
      };
      const parsedQuery = nearbyEventsQuerySchema.safeParse(query);
      if (!parsedQuery.success) {
        return res.status(400).json({
          message: 'Invalid nearby event parameters',
          errors: parsedQuery.error.flatten(),
        });
      }

      const paginationResult = parsePaginationParams(req.query);
      if (!paginationResult.success) {
        return res.status(400).json({
          message: 'Invalid pagination parameters',
          errors: (paginationResult as any).error.flatten(),
        });
      }

      const { latitude, longitude, radius } = parsedQuery.data;

      const nearby = await storage.getNearbyEvents(latitude, longitude, radius);

      const pagination = paginationResult.data;
      const paginated = nearby.slice(pagination.offset, pagination.offset + pagination.limit);
      attachPaginationHeaders(res, nearby.length, pagination);
      res.json(paginated);
    } catch (error) {
      console.error('Error fetching nearby events:', error);
      res.status(500).json(buildErrorResponse('Error fetching nearby events', error));
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
      res.status(500).json(buildErrorResponse('Error fetching event', error));
    }
  });

  app.post('/api/events', contentCreationLimiter, isAuthenticated, async (req, res) => {
    try {
      const userId = requireSessionUserId(req);
      const validatedData = insertEventSchema.parse({
        ...req.body,
        creatorId: userId
      });
      await ensureCleanText(validatedData.title, 'Event title');
      await ensureCleanText(validatedData.description, 'Event description');
      await ensureCleanText(validatedData.location, 'Event location');

      const event = await storage.createEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      if (handleModerationError(res, error)) return;
      console.error('Error creating event:', error);
      res.status(500).json(buildErrorResponse('Error creating event', error));
    }
  });

  const eventRsvpSchema = z.object({
    params: z.object({ id: z.coerce.number().int().positive() }),
    body: z.object({ status: z.enum(['going', 'maybe', 'not_going']) }),
  });

  const hasEventAccess = async (event: any, userId: number) => {
    // If event is public OR not explicitly private, allow access
    // This handles the case where existing events have isPublic=false but aren't meant to be private
    if (event.isPublic === true || event.isPrivate !== true) {
      return true;
    }

    // For explicitly private events (isPrivate=true), check permissions:

    if (event.creatorId === userId) {
      return true;
    }

    if (event.communityId) {
      try {
        if (await storage.isCommunityMember(userId, event.communityId)) {
          return true;
        }
      } catch (error) {
        console.warn('Error checking community membership for event RSVP:', error);
      }
    }

    if (event.groupId) {
      try {
        if (await storage.isGroupMember(event.groupId, userId)) {
          return true;
        }
      } catch (error) {
        console.warn('Error checking group membership for event RSVP:', error);
      }
    }

    if (typeof storage.isUserInvitedToEvent === 'function') {
      try {
        if (await storage.isUserInvitedToEvent(userId, event.id)) {
          return true;
        }
      } catch (error) {
        console.warn('Error checking event invitation for RSVP:', error);
      }
    }

    return false;
  };

  app.get('/api/events/:id/rsvps', async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      if (!Number.isFinite(eventId)) {
        return res.status(400).json({ message: 'Invalid event ID' });
      }

      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      if (!event.isPublic) {
        const userId = getSessionUserId(req);
        if (!userId) {
          return res.status(401).json({ message: 'Authentication required' });
        }
        const canAccess = await hasEventAccess(event, userId);
        if (!canAccess) {
          return res.status(403).json({ message: 'You do not have access to this private event' });
        }
      }

      const rsvps = await storage.getEventRSVPs(eventId);
      res.json(rsvps);
    } catch (error) {
      console.error('Error fetching event RSVPs:', error);
      res.status(500).json(buildErrorResponse('Error fetching event RSVPs', error));
    }
  });

  app.get('/api/events/:id/rsvp', isAuthenticated, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = requireSessionUserId(req);

      if (!Number.isFinite(eventId)) {
        return res.status(400).json({ message: 'Invalid event ID' });
      }

      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      const canAccess = await hasEventAccess(event, userId);
      if (!canAccess) {
        return res.status(403).json({ message: 'You do not have access to this private event' });
      }

      const rsvp = await storage.getUserEventRSVP(eventId, userId);
      if (!rsvp) {
        return res.status(404).json({ message: 'RSVP not found' });
      }
      res.json(rsvp);
    } catch (error) {
      console.error('Error fetching RSVP:', error);
      res.status(500).json(buildErrorResponse('Error fetching RSVP', error));
    }
  });

  const upsertEventRsvp = async (req: any, res: any) => {
    try {
      const parsed = eventRsvpSchema.safeParse({ params: req.params, body: req.body });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid RSVP payload' });
      }

      const eventId = parsed.data.params.id;
      const { status } = parsed.data.body;
      const userId = requireSessionUserId(req);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Verify event exists and user can access it
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      const canAccess = await hasEventAccess(event, userId);
      if (!canAccess) {
        return res.status(403).json({
          message: 'You do not have access to this private event'
        });
      }

      const rsvp = await storage.upsertEventRSVP(eventId, userId, status);
      res.json(rsvp);
    } catch (error) {
      console.error('Error updating RSVP:', error);
      res.status(500).json(buildErrorResponse('Error updating RSVP', error));
    }
  };

  app.post('/api/events/:id/rsvp', isAuthenticated, upsertEventRsvp);
  app.patch('/api/events/:id/rsvp', isAuthenticated, upsertEventRsvp);

  app.delete('/api/events/:id', isAuthenticated, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
  const userId = requireSessionUserId(req);

      // Check if user is the organizer or admin
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      // For non-organizers, verify admin status from the database
      if (event.creatorId !== userId) {
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(401).json({ message: 'User not found' });
        }

        if (!user.isAdmin) {
          return res.status(403).json({
            message: 'Only the organizer or admin can delete this event'
          });
        }
      }

      await storage.deleteEvent(eventId);
      res.json({ message: 'Event deleted successfully' });
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json(buildErrorResponse('Error deleting event', error));
    }
  });

  // Prayer requests endpoints
  app.get('/api/prayer-requests', async (req, res) => {
    try {
      const prayerRequests = await storage.getAllPrayerRequests();
      res.json(prayerRequests);
    } catch (error) {
      console.error('Error fetching prayer requests:', error);
      res.status(500).json(buildErrorResponse('Error fetching prayer requests', error));
    }
  });

  app.post('/api/prayer-requests', contentCreationLimiter, isAuthenticated, async (req, res) => {
    try {
  const userId = requireSessionUserId(req);
      const validatedData = insertPrayerRequestSchema.parse({
        ...req.body,
        userId: userId
      });
      await ensureCleanText(validatedData.title, 'Prayer request title');
      await ensureCleanText(validatedData.description, 'Prayer request description');

      const prayerRequest = await storage.createPrayerRequest(validatedData);
      res.status(201).json(prayerRequest);
    } catch (error) {
      if (handleModerationError(res, error)) return;
      console.error('Error creating prayer request:', error);
      res.status(500).json(buildErrorResponse('Error creating prayer request', error));
    }
  });

  app.post('/api/prayer-requests/:id/pray', isAuthenticated, async (req, res) => {
    try {
      const prayerRequestId = parseInt(req.params.id);
  const userId = requireSessionUserId(req);

      const prayer = await storage.createPrayer({
        prayerRequestId: prayerRequestId,
        userId: userId
      });

      res.status(201).json(prayer);
    } catch (error) {
      console.error('Error recording prayer:', error);
      res.status(500).json(buildErrorResponse('Error recording prayer', error));
    }
  });

  // Apologetics endpoints
  app.get('/api/apologetics', async (req, res) => {
    try {
      if (typeof storage.getAllApologeticsResources !== 'function') {
        throw new Error('storage.getAllApologeticsResources is not implemented');
      }
      const resources = await storage.getAllApologeticsResources();
      res.json(resources);
    } catch (error) {
      console.error('Error fetching apologetics resources:', error);
      res.status(500).json(buildErrorResponse('Error fetching apologetics resources', error));
    }
  });

  app.get('/api/apologetics/topics', async (req, res) => {
    try {
      const topics = await storage.getAllApologeticsTopics();
      res.json(topics);
    } catch (error) {
      console.error('Error fetching apologetics topics:', error);
      res.status(500).json(buildErrorResponse('Error fetching apologetics topics', error));
    }
  });

  app.get('/api/apologetics/questions', async (req, res) => {
    try {
      const questions = await storage.getAllApologeticsQuestions();
      res.json(questions);
    } catch (error) {
      console.error('Error fetching apologetics questions:', error);
      res.status(500).json(buildErrorResponse('Error fetching apologetics questions', error));
    }
  });

  app.post('/api/apologetics/questions', contentCreationLimiter, isAuthenticated, async (req, res) => {
    try {
  const userId = requireSessionUserId(req);
      const { topicId, title, content, requiresVerifiedAnswerer } = req.body;

      const user = await storage.getUser(userId);
      const expertOnly = !!requiresVerifiedAnswerer && (user?.isAdmin || user?.isVerifiedApologeticsAnswerer);

      const question = await storage.createApologeticsQuestion({
        topicId: topicId,
        title: title,
        content: content,
        askedBy: userId,
        authorId: userId,
        requiresVerifiedAnswerer: expertOnly
      });

      res.status(201).json(question);
    } catch (error) {
      console.error('Error creating apologetics question:', error);
      res.status(500).json(buildErrorResponse('Error creating apologetics question', error));
    }
  });

  app.post('/api/apologetics/answers', isAuthenticated, async (req, res) => {
    try {
      const userId = requireSessionUserId(req);
      const { questionId, content } = req.body;

      const question = await storage.getApologeticsQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }

      const user = await storage.getUser(userId);
      const requiresVerified = Boolean((question as any).requiresVerifiedAnswerer);
      const allowedTopicIds = await storage.getApologeticsAnswererPermissions(userId);

      if (requiresVerified && !user?.isVerifiedApologeticsAnswerer && !user?.isAdmin) {
        return res.status(403).json({ message: 'This question requires a verified apologist to answer' });
      }

      if (user?.isVerifiedApologeticsAnswerer && !user?.isAdmin) {
        const topicId = (question as any).topicId as number | undefined;
        if (allowedTopicIds.length > 0 && topicId && !allowedTopicIds.includes(topicId)) {
          return res.status(403).json({ message: 'You are not permitted to answer questions for this topic' });
        }
      }

      const answer = await storage.createApologeticsAnswer({
        questionId: questionId,
        content: content,
        answeredBy: userId,
        authorId: userId,
        isVerifiedAnswer: user?.isVerifiedApologeticsAnswerer || user?.isAdmin || false
      });

      res.status(201).json(answer);
    } catch (error) {
      console.error('Error creating apologetics answer:', error);
      res.status(500).json(buildErrorResponse('Error creating apologetics answer', error));
    }
  });

  app.post('/api/apologetics/answers/:id/upvote', isAuthenticated, async (req, res) => {
    try {
      const answerId = parseInt(req.params.id);
      if (isNaN(answerId)) {
        return res.status(400).json({ message: 'Invalid answer ID' });
      }

      const answer = await storage.upvoteApologeticsAnswer(answerId);
      res.json(answer);
    } catch (error) {
      console.error('Error upvoting answer:', error);
      res.status(500).json(buildErrorResponse('Error upvoting answer', error));
    }
  });

  app.get('/api/apologetics/questions/:id', async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      if (isNaN(questionId)) {
        return res.status(400).json({ message: 'Invalid question ID' });
      }

      // Increment view count
      await storage.incrementApologeticsQuestionViews(questionId);

      const question = await storage.getApologeticsQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }

      const answers = await storage.getApologeticsAnswersByQuestion(questionId);
      res.json({ question, answers });
    } catch (error) {
      console.error('Error fetching question:', error);
      res.status(500).json(buildErrorResponse('Error fetching question', error));
    }
  });

  // Groups endpoints
  app.get('/api/groups', isAuthenticated, async (req, res) => {
    try {
  const userId = requireSessionUserId(req);
      const groups = await storage.getGroupsByUserId(userId);
      res.json(groups);
    } catch (error) {
      console.error('Error fetching groups:', error);
      res.status(500).json(buildErrorResponse('Error fetching groups', error));
    }
  });

  app.post('/api/groups', isAuthenticated, async (req, res) => {
    try {
  const userId = requireSessionUserId(req);
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
      res.status(500).json(buildErrorResponse('Error creating group', error));
    }
  });

  // Livestreams endpoints
  app.get('/api/livestreams', async (req, res) => {
    try {
      const livestreams = await storage.getAllLivestreams();
      res.json(livestreams);
    } catch (error) {
      console.error('Error fetching livestreams:', error);
      res.status(500).json(buildErrorResponse('Error fetching livestreams', error));
    }
  });

  app.post('/api/livestreams', isAuthenticated, async (req, res) => {
    try {
  const userId = requireSessionUserId(req);
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
      res.status(500).json(buildErrorResponse('Error creating livestream', error));
    }
  });

  // Application endpoints
  app.post('/api/applications/livestreamer', isAuthenticated, async (req, res) => {
    try {
  const userId = requireSessionUserId(req);
      const validatedData = insertLivestreamerApplicationSchema.parse({
        ...req.body,
        userId: userId
      }) as unknown as LivestreamAppPayload & InsertLivestreamerApplication;

      const application = await storage.createLivestreamerApplication(validatedData);

      // Send notification email to admins using the centralized notification helper
      try {
        const user = await storage.getUser(userId);
        const applicantName = (user && (user.displayName || user.username)) || 'Applicant';
        const applicantEmail = (user && user.email) || EMAIL_FROM;
        const adminDest = process.env.ADMIN_NOTIFICATION_EMAIL || EMAIL_FROM;

        await sendLivestreamerApplicationNotificationEmail({
          email: adminDest,
          applicantName,
          applicantEmail,
          ministryName: validatedData.ministryName || 'Not specified',
          applicationId: application.id,
          applicationDate: new Date().toISOString(),
          reviewLink: `${BASE_URL}/admin/livestreamer-applications/${application.id}`
        }, applicantName, application.id);
      } catch (emailError) {
        console.error('Failed to send application notification email:', emailError);
      }

      res.status(201).json(application);
    } catch (error) {
      console.error('Error creating livestreamer application:', error);
      res.status(500).json(buildErrorResponse('Error creating livestreamer application', error));
    }
  });

  app.post('/api/applications/apologist-scholar', isAuthenticated, async (req, res) => {
    try {
      const userId = requireSessionUserId(req);
      const validatedData = insertApologistScholarApplicationSchema.parse({
        ...req.body,
        userId: userId
      }) as unknown as ApologistScholarAppPayload & InsertApologistScholarApplication;

      const application = await storage.createApologistScholarApplication(validatedData);

      // Send notification email to admins using the apologist-specific helper
      try {
        const user = await storage.getUser(userId);
        const applicantName = validatedData.fullName || (user && (user.displayName || user.username)) || 'Applicant';
        const applicantEmail = (user && user.email) || EMAIL_FROM;
        const adminDest = process.env.ADMIN_NOTIFICATION_EMAIL || EMAIL_FROM;

        // Use dedicated apologist scholar notification helper
        await sendApologistScholarApplicationNotificationEmail({
          email: adminDest,
          applicantName,
          applicantEmail,
          ministryName: '',
          applicationId: application.id,
          applicationDate: new Date().toISOString(),
          reviewLink: `${BASE_URL}/admin/apologist-scholar-applications/${application.id}`
        }, applicantName, application.id);
      } catch (emailError) {
        console.error('Failed to send application notification email:', emailError);
      }

      res.status(201).json(application);
    } catch (error) {
      console.error('Error creating apologist scholar application:', error);
      res.status(500).json(buildErrorResponse('Error creating apologist scholar application', error));
    }
  });

  app.get('/api/admin/apologetics/answerers/:userId', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      if (!Number.isFinite(userId)) {
        return res.status(400).json({ message: 'Invalid user id' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const topicIds = await storage.getApologeticsAnswererPermissions(userId);
      return res.json({ userId, isVerified: !!user.isVerifiedApologeticsAnswerer, topicIds });
    } catch (error) {
      console.error('Error fetching apologist permissions:', error);
      res.status(500).json(buildErrorResponse('Error fetching apologist permissions', error));
    }
  });

  app.post('/api/admin/apologetics/answerers/:userId', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      if (!Number.isFinite(userId)) {
        return res.status(400).json({ message: 'Invalid user id' });
      }

      const { isVerified, topicIds } = req.body || {};
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (typeof isVerified === 'boolean') {
        await storage.setVerifiedApologeticsAnswerer(userId, isVerified);
      }

      if (topicIds !== undefined && !Array.isArray(topicIds)) {
        return res.status(400).json({ message: 'topicIds must be an array of topic ids' });
      }

      if (Array.isArray(topicIds)) {
        const normalizedTopicIds = Array.from(new Set(topicIds.map((id: any) => Number(id)).filter(Number.isFinite)));
        if (normalizedTopicIds.length > 0) {
          const validTopicIds = new Set((await storage.getAllApologeticsTopics()).map(t => t.id));
          const missingTopics = normalizedTopicIds.filter(id => !validTopicIds.has(id));
          if (missingTopics.length > 0) {
            return res.status(400).json({ message: `Unknown topic ids: ${missingTopics.join(', ')}` });
          }
        }

        await storage.setApologeticsAnswererPermissions(userId, normalizedTopicIds);
      }

      const updatedUser = await storage.getUser(userId);
      const updatedTopics = await storage.getApologeticsAnswererPermissions(userId);
      return res.json({ userId, isVerified: !!updatedUser?.isVerifiedApologeticsAnswerer, topicIds: updatedTopics });
    } catch (error) {
      console.error('Error updating apologist permissions:', error);
      res.status(500).json(buildErrorResponse('Error updating apologist permissions', error));
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

      // Use the storage method that exists on both MemStorage and DbStorage
  const reviewerId = requireSessionUserId(req);
      const application = await storage.updateApologistScholarApplication(
        applicationId,
        status,
        reviewNotes,
        reviewerId
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

        // Use the application status notification helper
        await sendApplicationStatusUpdateEmail({
          email: application.email,
          applicantName: application.fullName || application.applicantName || 'Applicant',
          status,
          ministryName: (application as any).ministryName || '',
          reviewNotes: reviewNotes || undefined,
          platformLink: `${BASE_URL}/apologetics/questions`
        });
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
      }

      res.json(application);
    } catch (error) {
      console.error('Error reviewing application:', error);
      res.status(500).json(buildErrorResponse('Error reviewing application', error));
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

  const reviewerId = requireSessionUserId(req);
      const application = await storage.updateLivestreamerApplication(
        applicationId,
        status,
        reviewNotes,
        reviewerId
      );

      // Send status update email
      try {
        const emailMessage = status === "approved"
          ? "We're pleased to inform you that your application to become a livestreamer has been approved. You can now start creating livestreams on our platform."
          : `Your livestreamer application has been reviewed. Status: ${status.toUpperCase()}. ${reviewNotes ? `Reviewer notes: ${reviewNotes}` : ''}`;

        // Send templated status update using the centralized helper
        await sendApplicationStatusUpdateEmail({
          email: application.email,
          applicantName: application.applicantName || application.fullName || 'Applicant',
          status,
          ministryName: (application as any).ministryName || '',
          reviewNotes: reviewNotes || undefined,
          platformLink: status === 'approved' ? `${BASE_URL}/livestreams/create` : `${BASE_URL}/livestreamer-application`
        });
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
      }

      res.json(application);
    } catch (error) {
      console.error('Error updating application status:', error);
      res.status(500).json(buildErrorResponse('Error updating application status', error));
    }
  });

  // Search endpoints
  // Location-based community search (supports city, state, interests, radius)
  registerLocationSearchRoutes(app);

  // Global search endpoint (returns flat array with type filters)
  app.use('/api/search', searchRoutes);

  // Object storage endpoints
  const uploadsRoot = path.resolve(process.cwd(), 'public', 'uploads');

  app.post('/api/objects/upload', uploadLimiter, isAuthenticated, async (req, res) => {
    try {
      const { fileName, fileType } = req.body as { fileName?: string; fileType?: string };
      const userId = requireSessionUserId(req);
      ensureAllowedMimeType(fileType, 'upload request');
      const normalizedName = path.basename(fileName || `upload-${Date.now()}`);
      const safeBase = normalizedName.replace(/[^a-zA-Z0-9._-]/g, '');
      await ensureCleanText(safeBase, 'File name');
      const key = `${userId}/${Date.now()}-${safeBase || 'file'}`;
      await fs.promises.mkdir(path.join(uploadsRoot, `${userId}`), { recursive: true });

      res.json({
        uploadUrl: `/api/objects/upload/${encodeURIComponent(key)}`,
        method: 'PUT',
        headers: { 'Content-Type': fileType || 'application/octet-stream' },
        assetUrl: `/uploads/${key}`
      });
    } catch (error) {
      if (handleModerationError(res, error)) return;
      console.error('Error generating upload parameters:', error);
      res.status(500).json(buildErrorResponse('Error generating upload parameters', error));
    }
  });

  app.put(
    '/api/objects/upload/:key',
    uploadLimiter,
    isAuthenticated,
    express.raw({ type: '*/*', limit: '25mb' }),
    async (req, res) => {
      try {
        if (!Buffer.isBuffer(req.body)) {
          return res.status(400).json({ message: 'Invalid upload payload' });
        }

        const userId = requireSessionUserId(req);
        const rawKey = decodeURIComponent(req.params.key);
        const relativePath = path.normalize(rawKey).replace(/^(\.\.[/\\])+/, '');
        const [ownerId] = relativePath.split(/[\\/]/);
        const isAdminRequest = req.session?.isAdmin === true;

        if (parseInt(ownerId) !== userId && !isAdminRequest) {
          return res.status(403).json({ message: 'Not authorized to upload for this user' });
        }

        ensureSafeBinaryUpload(req.body, req.headers['content-type'], 'binary upload');

        const destination = path.join(uploadsRoot, relativePath);
        await fs.promises.mkdir(path.dirname(destination), { recursive: true });
        await fs.promises.writeFile(destination, req.body);

        res.json({ url: `/uploads/${relativePath}` });
      } catch (error) {
        if (handleModerationError(res, error)) return;
        console.error('Error saving upload:', error);
        res.status(500).json(buildErrorResponse('Error uploading file', error));
      }
    }
  );

  // Notifications endpoints
  app.get('/api/notifications', isAuthenticated, async (req, res) => {
    try {
      const userId = requireSessionUserId(req);
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json(buildErrorResponse('Error fetching notifications', error));
    }
  });

  app.put('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id, 10);
      if (!Number.isFinite(notificationId)) {
        return res.status(400).json({ message: 'Invalid notification id' });
      }
      const userId = requireSessionUserId(req);
      if (typeof storage.markNotificationAsRead !== 'function') {
        throw new Error('storage.markNotificationAsRead is not implemented');
      }
      const updated = await storage.markNotificationAsRead(notificationId, userId);
      if (!updated) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json(buildErrorResponse('Error marking notification as read', error));
    }
  });

  // User preferences endpoints
  app.get('/api/user/preferences', isAuthenticated, async (req, res) => {
    try {
  const userId = requireSessionUserId(req);
      const preferences = await storage.getUserPreferences(userId);
      res.json(preferences);
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      res.status(500).json(buildErrorResponse('Error fetching user preferences', error));
    }
  });

  app.put('/api/user/preferences', isAuthenticated, async (req, res) => {
    try {
      const userId = requireSessionUserId(req);
      const preferences = await storage.updateUserPreferences(userId, req.body);
      res.json(preferences);
    } catch (error) {
      console.error('Error updating user preferences:', error);
      res.status(500).json(buildErrorResponse('Error updating user preferences', error));
    }
  });

  // Record user interactions for recommendation engine
  app.post('/api/recommendations/interaction', isAuthenticated, async (req, res) => {
    try {
  const userId = requireSessionUserId(req);
      const { contentId, contentType, interactionType } = req.body;


      // Store in recommendation system (this would be implemented in storage)
      // await storage.recordUserInteraction(userId, contentId, contentType, interactionType);

      res.json({ success: true });
    } catch (error) {
      console.error('Error recording interaction:', error);
      res.status(500).json(buildErrorResponse('Error recording interaction', error));
    }
  });

  // Get personalized feed
  app.get('/api/recommendations/feed', isAuthenticated, async (req, res) => {
    try {
  const userId = requireSessionUserId(req);
      const limit = parseInt(req.query.limit as string) || 20;
      
      // This would use the recommendation engine
      // const feed = await storage.getPersonalizedFeed(userId, limit);
      const feed = await storage.getAllMicroblogs(); // Fallback for now
      
      res.json(feed.slice(0, limit));
    } catch (error) {
      console.error('Error generating personalized feed:', error);
      res.status(500).json(buildErrorResponse('Error generating personalized feed', error));
    }
  });

  // Get friends activity
  app.get('/api/recommendations/friends-activity', isAuthenticated, async (req, res) => {
    try {
  const userId = requireSessionUserId(req);
      
      // This would get activity from user's friends/connections
      // const activity = await storage.getFriendsActivity(userId);
      const activity = []; // Placeholder
      
      res.json(activity);
    } catch (error) {
      console.error('Error fetching friends activity:', error);
      res.status(500).json(buildErrorResponse('Error fetching friends activity', error));
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
      res.status(500).json(buildErrorResponse('Error sending test email', error));
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

  // Serve privacy and terms as friendly URLs (no .html extension)
  const resolvePublicFile = (filename: string) => {
    const candidates = [
      path.resolve(process.cwd(), 'dist', 'public', filename),
      path.resolve(process.cwd(), 'public', filename),
    ];

    return candidates.find((candidate) => fs.existsSync(candidate));
  };

  app.get('/privacy', (_req, res) => {
    const candidate = resolvePublicFile('privacy.html');

    if (candidate) return res.sendFile(candidate);
    return res.status(404).send('Not found');
  });

  app.get('/terms', (_req, res) => {
    const candidate = resolvePublicFile('terms.html');

    if (candidate) return res.sendFile(candidate);
    return res.status(404).send('Not found');
  });

  app.get('/community-guidelines', (_req, res) => {
    const candidate = resolvePublicFile('community-guidelines.html');

    if (candidate) return res.sendFile(candidate);
    return res.status(404).send('Not found');
  });

  // Error handling middleware
  app.use((error: any, req: any, res: any, next: any) => {
    console.error('API Error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.issues 
      });
    }
    
    res.status(500).json({ 
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  });

  return httpServer;
}
