# Web App Patterns to Copy for Mobile Launch

**Goal**: Accelerate mobile app launch by reusing working web app code patterns.

---

## 🚀 Quick Wins - Copy These Immediately

### 1. **API Client Pattern** ⭐️ CRITICAL
**Location**: `client/src/lib/api.ts`

**What it does**: Standardized fetch wrapper with credentials and error handling

**How to adapt for mobile**:
```typescript
// Your mobile version already has src/lib/apiClient.ts
// Just verify it matches this pattern:

export async function apiRequest<T = any>(
  method: string,
  url: string,
  body?: any
): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      // Add auth token from secure storage
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include', // Web only - mobile uses token auth
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}
```

**Copy from**: `/client/src/lib/api.ts` (lines 1-30)

---

### 2. **Feed/Microblogs Implementation** ⭐️ READY TO COPY
**Location**: `client/src/pages/microblogs-page.tsx`

**What's working**:
- ✅ Fetch all microblogs with author data
- ✅ Like/unlike functionality
- ✅ Create new posts
- ✅ Pull-to-refresh
- ✅ "Latest" and "Popular" tabs
- ✅ Mobile-optimized components

**Mobile components to copy**:
- `client/src/components/MobileMicroblogPost.tsx` - Post card UI
- `client/src/components/MobileMicroblogComposer.tsx` - Create post UI
- `client/src/components/MobilePullRefresh.tsx` - Pull to refresh

**API endpoints used**:
```typescript
GET  /api/microblogs          // List all
POST /api/microblogs          // Create new
POST /api/microblogs/:id/like // Like/unlike
GET  /api/microblogs/:id      // Get single
```

**Key pattern**:
```typescript
// Fetch posts with author enrichment
const { data: posts } = useQuery({
  queryKey: ['/api/microblogs'],
  queryFn: async () => {
    const posts = await apiRequest('GET', '/api/microblogs');

    // Enrich with author data
    const postsWithAuthors = await Promise.all(
      posts.map(async (post) => {
        const author = await apiRequest('GET', `/api/users/${post.authorId}`);
        return { ...post, author };
      })
    );

    return postsWithAuthors;
  },
});
```

**Copy entire page**: `/client/src/pages/microblogs-page.tsx` → adapt for React Native

---

### 3. **Communities Implementation** ⭐️ READY TO COPY
**Location**: `client/src/pages/communities-page.tsx`

**What's working**:
- ✅ List all communities
- ✅ Search communities
- ✅ Join/leave communities
- ✅ Create communities with icons and colors
- ✅ Privacy settings (public/private)
- ✅ Location-based filtering
- ✅ Member list

**API endpoints**:
```typescript
GET    /api/communities           // List all
POST   /api/communities           // Create
GET    /api/communities/:slug     // Get details
POST   /api/communities/:id/join  // Join
DELETE /api/communities/:id/leave // Leave
GET    /api/communities/:id/members // Members
```

**Key pattern - Create community**:
```typescript
const createMutation = useMutation({
  mutationFn: async (data: {
    name: string;
    description: string;
    privacySetting: 'public' | 'private';
    icon?: string;
    primaryColor?: string;
  }) => {
    return apiRequest('POST', '/api/communities', data);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/communities'] });
  },
});
```

**Copy from**:
- `/client/src/pages/communities-page.tsx` - Main page
- `/client/src/components/community/CreateCommunityDialog.tsx` - Creation UI

---

### 4. **Events Implementation** ⭐️ READY TO COPY
**Location**: `client/src/pages/events-page.tsx`

**What's working**:
- ✅ Three view modes: All, Public, Nearby
- ✅ Map view with Leaflet
- ✅ Event creation form
- ✅ RSVP functionality
- ✅ Search and location filtering
- ✅ Virtual and in-person events

**API endpoints**:
```typescript
GET  /api/events              // All events
GET  /api/events/public       // Public only
GET  /api/events/nearby?lat=X&lng=Y&radius=50  // Nearby
POST /api/events              // Create
POST /api/events/:id/rsvp     // RSVP
```

**Key pattern - Nearby events**:
```typescript
const { data: nearbyEvents } = useQuery({
  queryKey: ['/api/events/nearby', userLocation],
  queryFn: async () => {
    if (!userLocation) return [];
    const { latitude, longitude } = userLocation;
    return apiRequest(
      'GET',
      `/api/events/nearby?lat=${latitude}&lng=${longitude}&radius=50`
    );
  },
  enabled: !!userLocation,
});
```

**Copy from**:
- `/client/src/pages/events-page.tsx` - Main page
- `/client/src/components/events/EventsList.tsx` - List view
- `/client/src/components/events/EventsMap.tsx` - Map view (adapt React Leaflet to react-native-maps)

---

### 5. **Forum/Posts Implementation** ⭐️ READY TO COPY
**Location**: `client/src/pages/posts-page.tsx`, `client/src/pages/post-detail-page.tsx`

**What's working**:
- ✅ List forum posts
- ✅ Post detail with comments
- ✅ Upvote posts
- ✅ Create posts
- ✅ Add comments
- ✅ Filter by popular/recent

**API endpoints**:
```typescript
GET  /api/posts               // List posts
GET  /api/posts/:id           // Get post
POST /api/posts               // Create post
POST /api/posts/:id/upvote    // Upvote
GET  /api/posts/:id/comments  // Get comments
POST /api/comments            // Add comment
```

**Key pattern - Post with comments**:
```typescript
// Fetch post
const { data: post } = useQuery({
  queryKey: ['/api/posts', postId],
  queryFn: () => apiRequest('GET', `/api/posts/${postId}`),
});

// Fetch comments separately
const { data: comments } = useQuery({
  queryKey: ['/api/posts', postId, 'comments'],
  queryFn: () => apiRequest('GET', `/api/posts/${postId}/comments`),
});

// Upvote mutation
const upvoteMutation = useMutation({
  mutationFn: () => apiRequest('POST', `/api/posts/${postId}/upvote`),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/posts', postId] });
  },
});
```

**Copy from**:
- `/client/src/pages/posts-page.tsx` - Post list
- `/client/src/pages/post-detail-page.tsx` - Post detail
- `/client/src/components/PostCard.tsx` - Post card UI

---

## 🎨 UI Components to Adapt

### Mobile-Optimized Components
**Location**: `client/src/components/`

These are already mobile-optimized - just adapt JSX to React Native:

1. **MobileMicroblogPost.tsx** - Post card with avatar, content, like button
2. **MobileMicroblogComposer.tsx** - Bottom sheet composer
3. **FloatingActionButton.tsx** - FAB for create actions
4. **MobilePullRefresh.tsx** - Pull to refresh pattern
5. **TouchFeedback.tsx** - Touch feedback wrapper

**Adaptation strategy**:
- Replace `<div>` with `<View>`
- Replace `<button>` with `<Pressable>`
- Replace CSS classes with StyleSheet
- Replace `onClick` with `onPress`

---

## 🔧 Hooks to Copy

### 1. **useAuth Hook** ⭐️ CRITICAL
**Location**: `client/src/hooks/use-auth.impl.ts`

**What it provides**:
```typescript
const {
  user,           // Current user object
  isLoading,      // Loading state
  login,          // Login mutation
  register,       // Register mutation
  logout,         // Logout function
} = useAuth();
```

**Pattern**:
```typescript
export function useAuth() {
  const queryClient = useQueryClient();

  // Fetch current user
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      try {
        return await apiRequest('GET', '/api/user');
      } catch {
        return null; // Not logged in
      }
    },
    retry: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      apiRequest('POST', '/api/login', credentials),
    onSuccess: (userData) => {
      queryClient.setQueryData(['/api/user'], userData);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/logout'),
    onSuccess: () => {
      queryClient.setQueryData(['/api/user'], null);
    },
  });

  return {
    user,
    isLoading,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
  };
}
```

**Your mobile app already has**: `src/contexts/AuthContext.tsx`
**Action**: Compare with web version and sync patterns

---

### 2. **useWebSocket Hook** ⭐️ FOR DMs
**Location**: `client/src/hooks/use-chat-websocket.tsx`

**What it provides**: Real-time chat via Socket.IO

**Pattern**:
```typescript
const {
  connected,
  messages,
  sendMessage,
  joinRoom,
  leaveRoom,
} = useChatWebSocket(userId);
```

**Copy entire hook**: `/client/src/hooks/use-chat-websocket.tsx`
**Adaptation**: Works with React Native, just update connection URL

---

## 📊 Data Fetching Patterns

### Standard Query Pattern
Used throughout the web app:

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['/api/endpoint', param1, param2],
  queryFn: () => apiRequest('GET', `/api/endpoint?param=${param1}`),
  enabled: !!param1, // Only fetch if param exists
});
```

### Standard Mutation Pattern
```typescript
const mutation = useMutation({
  mutationFn: (data) => apiRequest('POST', '/api/endpoint', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/endpoint'] });
    toast({ title: "Success!", variant: "default" });
  },
  onError: (error) => {
    toast({ title: "Error", description: error.message, variant: "destructive" });
  },
});
```

---

## 🎯 Priority Implementation Order

### Week 1 - Core Features (Copy from web)
1. ✅ **Feed** - Copy from `microblogs-page.tsx`
   - Replace FeedScreen's mock data with real API
   - Use MobileMicroblogPost component pattern

2. ✅ **Communities** - Copy from `communities-page.tsx`
   - Replace CommunitiesScreen's mock data
   - Add join/leave functionality

3. ✅ **Events** - Copy from `events-page.tsx`
   - Already has location and filters
   - Add RSVP functionality
   - Connect to real API

4. ✅ **Forum** - Copy from `posts-page.tsx`
   - Replace ForumsScreen's mock data
   - Add upvote functionality

### Week 2 - DMs and Polish
5. **Messages** - Copy from `dms-page.tsx`
   - Already has UI and API hooks
   - Copy WebSocket integration
   - Test real-time messaging

6. **Polish**
   - Remove console.logs
   - Add error boundaries
   - Test all flows

---

## 📝 File Copy Checklist

### High Priority - Copy These Files
- [ ] `/client/src/lib/api.ts` → Review against mobile apiClient.ts
- [ ] `/client/src/pages/microblogs-page.tsx` → FeedScreen implementation
- [ ] `/client/src/pages/communities-page.tsx` → CommunitiesScreen implementation
- [ ] `/client/src/pages/events-page.tsx` → EventsScreen implementation
- [ ] `/client/src/pages/posts-page.tsx` → ForumsScreen implementation
- [ ] `/client/src/hooks/use-chat-websocket.tsx` → Real-time DMs
- [ ] `/client/src/components/MobileMicroblogPost.tsx` → Post card pattern
- [ ] `/client/src/components/MobileMicroblogComposer.tsx` → Create post UI

### Medium Priority - Reference These
- [ ] `/client/src/hooks/use-auth.impl.ts` → Compare with AuthContext
- [ ] `/client/src/components/community/*` → Community features
- [ ] `/client/src/components/events/*` → Event features
- [ ] `/client/src/pages/post-detail-page.tsx` → Post detail pattern

---

## 🔄 Adaptation Strategy

### For Each Web Component:
1. **Read the web version** - Understand the logic
2. **Copy the data fetching** - API calls are identical
3. **Adapt the UI** - Convert HTML/CSS to React Native
4. **Test the flow** - Verify it works end-to-end

### JSX to React Native Translation
```typescript
// WEB VERSION
<div className="post-card" onClick={handleClick}>
  <img src={avatar} alt="avatar" />
  <p className="text-lg">{content}</p>
  <button className="like-btn">Like</button>
</div>

// MOBILE VERSION
<Pressable style={styles.postCard} onPress={handleClick}>
  <Image source={{ uri: avatar }} style={styles.avatar} />
  <Text style={styles.content}>{content}</Text>
  <Pressable style={styles.likeBtn}>
    <Text>Like</Text>
  </Pressable>
</Pressable>
```

---

## 🎯 Success Criteria

After copying web patterns, you should have:
- ✅ All 4 main tabs connected to real APIs
- ✅ Create/Read/Update operations working
- ✅ Real user data displayed
- ✅ Like/upvote functionality
- ✅ Join/leave communities
- ✅ RSVP to events
- ✅ Direct messaging with real-time updates

**Estimated time with copying**: 3-5 days instead of 2-3 weeks! 🚀

---

## 📞 Quick Reference

**Web App Path**: `/Users/rawaselou/Desktop/The-Connection-main/client/`
**Mobile App Path**: `/Users/rawaselou/Desktop/The-Connection-main/mobile-app/TheConnectionMobile-new/`

**Key Web Files**:
- API Client: `client/src/lib/api.ts`
- Auth Hook: `client/src/hooks/use-auth.impl.ts`
- Query Client: `client/src/lib/queryClient.ts`
- Microblogs: `client/src/pages/microblogs-page.tsx`
- Communities: `client/src/pages/communities-page.tsx`
- Events: `client/src/pages/events-page.tsx`
- Posts: `client/src/pages/posts-page.tsx`
- DMs: `client/src/pages/dms-page.tsx`

**Mobile Files to Update**:
- Feed: `src/screens/FeedScreen.tsx`
- Communities: `src/screens/CommunitiesScreen.tsx`
- Events: `src/screens/EventsScreen.tsx`
- Forum: `src/screens/ForumsScreen.tsx`
- Messages: `src/screens/Messages.tsx`

---

**Next Step**: Start with Feed/Microblogs - it's the simplest and will establish the pattern for the rest! 🎉
