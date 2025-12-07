# API Fixes - Code Examples

## Fix 1: DM Send Error Response (Critical)

### Current Code - BROKEN
```typescript
// server/routes/dmRoutes.ts:34
if (!content) return res.status(400).send("Message content required");
```

### Fixed Code
```typescript
if (!content) return res.status(400).json({ message: "Message content required" });
```

---

## Fix 2: Socket.IO Error Handling (Critical)

### Current Code - BROKEN
```typescript
// server/routes.ts:175-201
socket.on('new_message', async (data) => {
  try {
    const { roomId, content, senderId } = data;
    if (parseInt(senderId) !== authenticatedUserId) {
      console.log(`User ${authenticatedUserId} attempted to send message as user ${senderId}`);
      return;
    }
    const newMessage = await storage.createChatMessage({
      chatRoomId: parseInt(roomId),
      senderId: authenticatedUserId,
      content: content,
    });
    const sender = await storage.getUser(authenticatedUserId);
    const messageWithSender = { ...newMessage, sender };
    io.to(`room_${roomId}`).emit('message_received', messageWithSender);
  } catch (error) {
    console.error('Error handling chat message:', error);
    // CLIENT HAS NO IDEA MESSAGE FAILED!
  }
});
```

### Fixed Code
```typescript
socket.on('new_message', async (data) => {
  try {
    const { roomId, content, senderId } = data;
    if (parseInt(senderId) !== authenticatedUserId) {
      socket.emit('error', { 
        message: 'You cannot send messages as another user',
        code: 'UNAUTHORIZED' 
      });
      return;
    }
    const newMessage = await storage.createChatMessage({
      chatRoomId: parseInt(roomId),
      senderId: authenticatedUserId,
      content: content,
    });
    const sender = await storage.getUser(authenticatedUserId);
    const messageWithSender = { ...newMessage, sender };
    io.to(`room_${roomId}`).emit('message_received', messageWithSender);
  } catch (error) {
    console.error('Error handling chat message:', error);
    socket.emit('error', { 
      message: 'Failed to send message',
      code: 'SERVER_ERROR'
    });
  }
});
```

---

## Fix 3: User Endpoints Data Filtering (Critical)

### Current Code - BROKEN
```typescript
// server/routes/api/user.ts:108
router.get('/communities', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const resolvedUserId = typeof userId === 'number' ? userId : parseInt(String(userId));
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // BUG: Returns ALL communities, not user's
    const communities = await storage.getAllCommunities();
    res.json(communities);
  } catch (error) {
    next(error);
  }
});
```

### Fixed Code
```typescript
router.get('/communities', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const resolvedUserId = typeof userId === 'number' ? userId : parseInt(String(userId));
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // FIXED: Filter by user membership
    const communities = await storage.getUserCommunities(resolvedUserId);
    res.json(communities);
  } catch (error) {
    next(error);
  }
});
```

### Apply Same Fix To:
- `/communities` endpoint - line 108
- `/posts` endpoint - line 141  
- `/events` endpoint - line 158

---

## Fix 4: Add Unblock Endpoint (Critical)

### New Endpoint to Add
```typescript
// server/routes/safety.ts - ADD THIS ROUTE

// DELETE /unblock - unblock a user
router.delete('/unblock/:userId', isAuthenticated, async (req: any, res) => {
  try {
    const unblockerId = req.session?.userId;
    const { userId } = req.params;

    if (!unblockerId) return res.status(401).json({ message: 'Not authenticated' });
    
    const blockedUserId = parseInt(userId as any);
    if (!blockedUserId) return res.status(400).json({ message: 'Invalid userId' });

    // Implementation depends on storage layer
    // Should remove entry from userBlocks table where blockerId=unblockerId and blockedId=blockedUserId
    const result = await storage.removeUserBlock({
      blockerId: unblockerId,
      blockedId: blockedUserId
    });

    if (!result) {
      return res.status(404).json({ message: 'Block not found' });
    }

    res.json({ ok: true, message: 'User unblocked' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ message: 'Error unblocking user' });
  }
});
```

---

## Fix 5: Session userId Type Consistency (Critical)

### Current Code - BROKEN
```typescript
// server/auth.ts:167
req.session.userId = user.id.toString(); // Stored as STRING!
```

### Fixed Code
```typescript
// server/auth.ts:167
req.session.userId = user.id; // Store as number

// AND CHANGE THIS (line 291):
// FROM:
req.session.userId = user.id.toString();
// TO:
req.session.userId = user.id;
```

### Then Standardize Retrieval
```typescript
// Create this helper in auth.ts and use everywhere
export function getSessionUserId(req: Request): number | undefined {
  const raw = req.session?.userId;
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === 'number') return raw;
  const n = parseInt(String(raw), 10);
  return Number.isFinite(n) ? n : undefined;
}

// Use in all routes:
const userId = getSessionUserId(req);
if (!userId) return res.status(401).json({ message: 'Not authenticated' });
```

---

## Fix 6: Add Rate Limiting to Critical Endpoints

### Current Code - MISSING
```typescript
// server/routes/posts.ts
router.post('/api/posts', isAuthenticated, async (req, res) => {
  // NO RATE LIMITING!
});
```

### Fixed Code
```typescript
// server/routes/posts.ts - ADD AT TOP
import rateLimit from 'express-rate-limit';

const createPostLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 posts per hour
  message: 'Too many posts created, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// THEN USE:
router.post('/api/posts', isAuthenticated, createPostLimiter, async (req, res) => {
  // ... existing code
});
```

### Apply To:
- `/api/posts` (create) - 20/hour
- `/api/comments` (create) - 50/hour
- `/api/dms/send` - 100/hour
- `/api/moderation/report` - 10/hour
- `/api/communities/:id/join` - 10/hour
- `/api/microblogs` (create) - 20/hour

---

## Fix 7: RSVP Authorization (High Priority)

### Current Code - BROKEN
```typescript
// server/routes.ts:1197
app.patch('/api/events/:id/rsvp', isAuthenticated, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = getSessionUserId(req)!;
    const { status } = req.body;

    const rsvp = await storage.updateEventRSVP(eventId, status);
    res.json(rsvp); // NO VALIDATION userId MATCHES rsvp.userId!
  } catch (error) {
    console.error('Error updating RSVP:', error);
    res.status(500).json({ message: 'Error updating RSVP' });
  }
});
```

### Fixed Code
```typescript
app.patch('/api/events/:id/rsvp', isAuthenticated, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = getSessionUserId(req)!;
    const { status } = req.body;

    // Validate RSVP belongs to user
    const rsvp = await storage.getEventRSVP(eventId, userId);
    if (!rsvp) {
      return res.status(404).json({ message: 'RSVP not found' });
    }

    // Only allow valid status values
    const validStatuses = ['going', 'interested', 'not_going'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid RSVP status' });
    }

    const updatedRsvp = await storage.updateEventRSVP(eventId, userId, status);
    res.json(updatedRsvp);
  } catch (error) {
    console.error('Error updating RSVP:', error);
    res.status(500).json({ message: 'Error updating RSVP' });
  }
});
```

---

## Fix 8: Upvote Methods Track User (High Priority)

### Current Code - BROKEN
```typescript
// server/routes/posts.ts:73
router.post('/api/posts/:id/upvote', isAuthenticated, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const post = await storage.upvotePost(postId);
    // MISSING userId - how does storage know who voted?
    res.json(post);
  } catch (error) {
    console.error('Error upvoting post:', error);
    res.status(500).json({ message: 'Error upvoting post' });
  }
});
```

### Fixed Code
```typescript
router.post('/api/posts/:id/upvote', isAuthenticated, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = getSessionUserId(req)!;
    
    // Check if already upvoted
    const existingUpvote = await storage.getPostUpvote(postId, userId);
    if (existingUpvote) {
      return res.status(400).json({ message: 'Already upvoted this post' });
    }
    
    const upvote = await storage.upvotePost(postId, userId);
    const post = await storage.getPost(postId);
    res.json(post);
  } catch (error) {
    console.error('Error upvoting post:', error);
    res.status(500).json({ message: 'Error upvoting post' });
  }
});
```

### Apply Same Fix To:
- `/api/comments/:id/upvote` - line 107
- `/api/microblogs/:id/like` - line 1100

---

## Fix 9: Add Missing DELETE Endpoints

### Add to server/routes/posts.ts
```typescript
// DELETE /api/posts/:id - delete own post
router.delete('/api/posts/:id', isAuthenticated, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = getSessionUserId(req)!;
    
    const post = await storage.getPost(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    // Only creator or admin can delete
    if (post.authorId !== userId && !req.session.isAdmin) {
      return res.status(403).json({ message: 'Only creator can delete post' });
    }
    
    await storage.deletePost(postId);
    res.json({ ok: true, message: 'Post deleted' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Error deleting post' });
  }
});

// PATCH /api/posts/:id - edit own post
router.patch('/api/posts/:id', isAuthenticated, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = getSessionUserId(req)!;
    const { content, title } = req.body;
    
    const post = await storage.getPost(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    // Only creator can edit
    if (post.authorId !== userId) {
      return res.status(403).json({ message: 'Only creator can edit post' });
    }
    
    const updatedPost = await storage.updatePost(postId, { content, title });
    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Error updating post' });
  }
});
```

---

## Fix 10: Consolidate Duplicate Endpoints

### Recommendation
Use the canonical safety endpoints and redirect/deprecate the legacy moderation paths:

**Keep:** `/api/reports` (legacy `/api/moderation/report` redirects here)

**Keep:** `/api/blocks` (legacy `/api/moderation/block` redirects here)

**Keep:** `/api/blocked-users` (legacy `/api/moderation/blocked-users` redirects here)

Update frontend calls to use the canonical `/api/reports`, `/api/blocks`, and `/api/blocked-users` routes.

---

## Summary of Files to Fix (Priority Order)

1. `server/routes/dmRoutes.ts` - Fix error format (line 34)
2. `server/routes.ts` - Fix socket errors, user endpoints, RSVP validation
3. `server/routes/api/user.ts` - Filter endpoints by user (3 locations)
4. `server/routes/safety.ts` - Add unblock endpoint
5. `server/auth.ts` - Fix userId type (2 locations)
6. `server/routes/posts.ts` - Add rate limiting, DELETE, PATCH, upvote fix
7. `server/routes/moderation.ts` - Consolidate endpoints
8. All route files - Standardize to use `getSessionUserId()` helper

