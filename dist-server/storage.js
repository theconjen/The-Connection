import {
  messages,
  pushTokens,
  notifications
} from "./shared/schema.js";
import { db } from "./db.js";
import { eq, and, or } from "drizzle-orm";
class StorageSafety {
  static implementedMethods = /* @__PURE__ */ new Set([
    "getUser",
    "getUserById",
    "getUserByUsername",
    "getUserByEmail",
    "searchUsers",
    "getAllUsers",
    "updateUser",
    "createUser",
    "updateUserPassword",
    "setVerifiedApologeticsAnswerer",
    "getVerifiedApologeticsAnswerers",
    "getAllCommunities",
    "searchCommunities",
    "getPublicCommunitiesAndUserCommunities",
    "getCommunity",
    "getCommunityBySlug",
    "createCommunity",
    "updateCommunity",
    "deleteCommunity",
    "getCommunityMembers",
    "getCommunityMember",
    "getUserCommunities",
    "addCommunityMember",
    "updateCommunityMemberRole",
    "removeCommunityMember",
    "isCommunityMember",
    "isCommunityOwner",
    "isCommunityModerator",
    "createCommunityInvitation",
    "getCommunityInvitations",
    "getCommunityInvitationByToken",
    "getCommunityInvitationById",
    "updateCommunityInvitationStatus",
    "deleteCommunityInvitation",
    "getCommunityInvitationByEmailAndCommunity",
    "getCommunityRooms",
    "getPublicCommunityRooms",
    "getCommunityRoom",
    "createCommunityRoom",
    "updateCommunityRoom",
    "deleteCommunityRoom",
    "getChatMessages",
    "getChatMessagesAfter",
    "createChatMessage",
    "deleteChatMessage",
    "getCommunityWallPosts",
    "getCommunityWallPost",
    "createCommunityWallPost",
    "updateCommunityWallPost",
    "deleteCommunityWallPost",
    "getAllPosts",
    "getPost",
    "getPostsByCommunitySlug",
    "getPostsByGroupId",
    "getUserPosts",
    "createPost",
    "upvotePost",
    "getComment",
    "getCommentsByPostId",
    "createComment",
    "upvoteComment",
    "getGroup",
    "getGroupsByUserId",
    "createGroup",
    "addGroupMember",
    "getGroupMembers",
    "isGroupAdmin",
    "isGroupMember",
    "getAllApologeticsResources",
    "getApologeticsResource",
    "createApologeticsResource",
    "getPublicPrayerRequests",
    "getAllPrayerRequests",
    "getPrayerRequest",
    "getUserPrayerRequests",
    "getGroupPrayerRequests",
    "getPrayerRequestsVisibleToUser",
    "createPrayerRequest",
    "updatePrayerRequest",
    "markPrayerRequestAsAnswered",
    "deletePrayerRequest",
    "createPrayer",
    "getPrayersForRequest",
    "getUserPrayedRequests",
    "getAllApologeticsTopics",
    "getApologeticsTopic",
    "getApologeticsTopicBySlug",
    "createApologeticsTopic",
    "getAllApologeticsQuestions",
    "getApologeticsQuestion",
    "getApologeticsQuestionsByTopic",
    "createApologeticsQuestion",
    "updateApologeticsQuestionStatus",
    "getApologeticsAnswersByQuestion",
    "createApologeticsAnswer",
    "getAllEvents",
    "getEvent",
    "getUserEvents",
    "createEvent",
    "updateEvent",
    "deleteEvent",
    "createEventRSVP",
    "getEventRSVPs",
    "getUserEventRSVP",
    "updateEventRSVP",
    "deleteEventRSVP",
    "getAllMicroblogs",
    "getMicroblog",
    "getUserMicroblogs",
    "createMicroblog",
    "updateMicroblog",
    "deleteMicroblog",
    "likeMicroblog",
    "unlikeMicroblog",
    "getUserLikedMicroblogs",
    "getAllLivestreams",
    "createLivestream",
    "getLivestreamerApplicationByUserId",
    "getPendingLivestreamerApplications",
    "createLivestreamerApplication",
    "updateLivestreamerApplication",
    "isApprovedLivestreamer",
    "getApologistScholarApplicationByUserId",
    "getPendingApologistScholarApplications",
    "createApologistScholarApplication",
    "updateApologistScholarApplication",
    "getAllLivestreamerApplications",
    "getAllApologistScholarApplications",
    "getLivestreamerApplicationStats",
    "updateLivestreamerApplicationStatus",
    "deleteUser",
    "getAllBibleReadingPlans",
    "getBibleReadingPlan",
    "createBibleReadingPlan",
    "getBibleReadingProgress",
    "createBibleReadingProgress",
    "markDayCompleted",
    "getBibleStudyNotes",
    "getBibleStudyNote",
    "createBibleStudyNote",
    "updateBibleStudyNote",
    "deleteBibleStudyNote",
    "getDirectMessages",
    "createDirectMessage",
    "updateUserPreferences",
    "getUserPreferences"
  ]);
  static isMethodImplemented(methodName) {
    return this.implementedMethods.has(methodName);
  }
  static createSafeFallback(methodName, fallback) {
    if (!this.isMethodImplemented(methodName)) {
      console.warn(`Method ${methodName} not fully implemented, using fallback`);
    }
    return fallback;
  }
}
class MemStorage {
  data = {
    users: [],
    communities: [
      {
        id: 1,
        name: "Prayer Requests",
        description: "Share your prayer requests and pray for others in the community.",
        slug: "prayer-requests",
        iconName: "pray",
        iconColor: "primary",
        interestTags: JSON.stringify(["prayer", "support", "community"]),
        city: null,
        state: null,
        isLocalCommunity: false,
        latitude: null,
        longitude: null,
        memberCount: 1,
        createdBy: 1,
        isPrivate: false,
        hasPrivateWall: true,
        hasPublicWall: true,
        createdAt: /* @__PURE__ */ new Date(),
        deletedAt: null
      },
      {
        id: 2,
        name: "Bible Study",
        description: "Discuss and study the Bible together with fellow believers.",
        slug: "bible-study",
        iconName: "book",
        iconColor: "secondary",
        interestTags: JSON.stringify(["bible", "study", "scripture"]),
        city: null,
        state: null,
        isLocalCommunity: false,
        latitude: null,
        longitude: null,
        memberCount: 1,
        createdBy: 1,
        isPrivate: false,
        hasPrivateWall: true,
        hasPublicWall: true,
        createdAt: /* @__PURE__ */ new Date(),
        deletedAt: null
      },
      {
        id: 3,
        name: "Christian Apologetics",
        description: "Discuss and learn about defending the Christian faith.",
        slug: "apologetics",
        iconName: "shield",
        iconColor: "accent",
        interestTags: JSON.stringify(["apologetics", "defense", "faith"]),
        city: null,
        state: null,
        isLocalCommunity: false,
        latitude: null,
        longitude: null,
        memberCount: 1,
        createdBy: 1,
        isPrivate: false,
        hasPrivateWall: true,
        hasPublicWall: true,
        createdAt: /* @__PURE__ */ new Date(),
        deletedAt: null
      }
    ],
    communityMembers: [],
    communityInvitations: [],
    communityChatRooms: [],
    chatMessages: [],
    communityWallPosts: [],
    posts: [],
    comments: [],
    groups: [],
    groupMembers: [],
    apologeticsResources: [],
    livestreams: [],
    prayerRequests: [],
    prayers: [],
    apologeticsTopics: [],
    apologeticsQuestions: [],
    apologeticsAnswers: [],
    events: [],
    eventRsvps: [],
    microblogs: [],
    microblogLikes: [],
    livestreamerApplications: [],
    apologistScholarApplications: [],
    bibleReadingPlans: [],
    bibleReadingProgress: [],
    bibleStudyNotes: [],
    userPreferences: [],
    messages: [],
    // Moderation in-memory stores
    contentReports: [],
    userBlocks: []
  };
  nextId = 1;
  constructor() {
    if (this.data.users.length === 0) {
      const admin = {
        id: 1,
        username: "admin",
        email: "admin@example.com",
        password: "password",
        displayName: "Admin",
        bio: null,
        avatarUrl: null,
        city: null,
        state: null,
        zipCode: null,
        latitude: null,
        longitude: null,
        onboardingCompleted: true,
        isVerifiedApologeticsAnswerer: false,
        isAdmin: true,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date(),
        deletedAt: null
      };
      this.data.users.push(admin);
      const defaultCommunityIds = this.data.communities.map((c) => c.id);
      defaultCommunityIds.forEach((cid) => {
        this.data.communityMembers.push({
          id: this.nextId++,
          communityId: cid,
          userId: admin.id,
          role: "owner",
          joinedAt: /* @__PURE__ */ new Date()
        });
        const comm = this.data.communities.find((c) => c.id === cid);
        if (comm) comm.memberCount = (comm.memberCount || 0) + 1;
      });
    }
    const maxId = [
      ...this.data.users,
      ...this.data.communities,
      ...this.data.communityMembers,
      ...this.data.communityInvitations,
      ...this.data.communityChatRooms,
      ...this.data.chatMessages,
      ...this.data.communityWallPosts,
      ...this.data.posts,
      ...this.data.comments,
      ...this.data.groups,
      ...this.data.groupMembers,
      ...this.data.apologeticsResources,
      ...this.data.livestreams,
      ...this.data.prayerRequests,
      ...this.data.prayers,
      ...this.data.apologeticsTopics,
      ...this.data.apologeticsQuestions,
      ...this.data.apologeticsAnswers,
      ...this.data.events,
      ...this.data.eventRsvps,
      ...this.data.microblogs,
      ...this.data.microblogLikes,
      ...this.data.livestreamerApplications,
      ...this.data.apologistScholarApplications,
      ...this.data.bibleReadingPlans,
      ...this.data.bibleReadingProgress,
      ...this.data.bibleStudyNotes,
      ...this.data.messages,
      ...this.data.contentReports,
      ...this.data.userBlocks
    ].reduce((max, item) => item && typeof item.id === "number" ? Math.max(max, item.id) : max, 0);
    this.nextId = Math.max(this.nextId, maxId + 1);
  }
  // User methods
  async getUser(id) {
    return this.data.users.find((u) => u.id === id);
  }
  async getUserById(id) {
    return this.getUser(id);
  }
  async getUserByUsername(username) {
    return this.data.users.find((u) => u.username === username);
  }
  async getUserByEmail(email) {
    return this.data.users.find((u) => u.email === email);
  }
  async searchUsers(searchTerm) {
    const term = searchTerm.toLowerCase();
    return this.data.users.filter(
      (u) => u.username.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || u.displayName?.toLowerCase().includes(term)
    );
  }
  async getAllUsers() {
    return this.data.users.filter((u) => !u.deletedAt).map((u) => ({ ...u }));
  }
  async updateUser(id, userData) {
    const userIndex = this.data.users.findIndex((u) => u.id === id);
    if (userIndex === -1) throw new Error("User not found");
    this.data.users[userIndex] = { ...this.data.users[userIndex], ...userData };
    return this.data.users[userIndex];
  }
  async updateUserPreferences(userId, preferences) {
    let userPref = this.data.userPreferences.find((p) => p.userId === userId);
    if (!userPref) {
      userPref = {
        id: this.nextId++,
        userId,
        interests: null,
        favoriteTopics: null,
        engagementHistory: null,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      this.data.userPreferences.push(userPref);
    }
    Object.assign(userPref, preferences, { updatedAt: /* @__PURE__ */ new Date() });
    return userPref;
  }
  async getUserPreferences(userId) {
    return this.data.userPreferences.find((p) => p.userId === userId);
  }
  // Remove in-memory push token/notification methods to avoid duplicates with DB stubs
  async createUser(user) {
    const newUser = {
      id: this.nextId++,
      username: user.username,
      email: user.email,
      password: user.password,
      displayName: user.displayName || user.username,
      bio: user.bio || null,
      avatarUrl: user.avatarUrl || null,
      city: user.city || null,
      state: user.state || null,
      zipCode: user.zipCode || null,
      latitude: user.latitude || null,
      longitude: user.longitude || null,
      onboardingCompleted: user.onboardingCompleted || false,
      isVerifiedApologeticsAnswerer: false,
      isAdmin: user.isAdmin || false,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      deletedAt: null
    };
    this.data.users.push(newUser);
    return newUser;
  }
  async updateUserPassword(userId, hashedPassword) {
    const user = this.data.users.find((u) => u.id === userId);
    if (user) {
      user.password = hashedPassword;
      return user;
    }
    return void 0;
  }
  async setVerifiedApologeticsAnswerer(userId, isVerified) {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");
    user.isVerifiedApologeticsAnswerer = isVerified;
    return user;
  }
  async getVerifiedApologeticsAnswerers() {
    return this.data.users.filter((u) => u.isVerifiedApologeticsAnswerer && !u.deletedAt);
  }
  // Community methods
  async getAllCommunities() {
    return this.data.communities.filter((c) => !c.deletedAt).map((c) => ({ ...c }));
  }
  async searchCommunities(searchTerm) {
    const term = searchTerm.toLowerCase();
    return this.data.communities.filter(
      (c) => c.name.toLowerCase().includes(term) || c.description.toLowerCase().includes(term)
    );
  }
  async getPublicCommunitiesAndUserCommunities(userId, searchQuery) {
    let communities2 = this.data.communities.filter((c) => !c.isPrivate && !c.deletedAt);
    if (userId) {
      const userCommunities = this.data.communityMembers.filter((m) => m.userId === userId).map((m) => this.data.communities.find((c) => c.id === m.communityId)).filter(Boolean);
      const communityMap = /* @__PURE__ */ new Map();
      [...communities2, ...userCommunities].forEach((c) => communityMap.set(c.id, c));
      communities2 = Array.from(communityMap.values());
    }
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      communities2 = communities2.filter(
        (c) => c.name.toLowerCase().includes(term) || c.description.toLowerCase().includes(term)
      );
    }
    return communities2;
  }
  async getCommunity(id) {
    return this.data.communities.find((c) => c.id === id && !c.deletedAt);
  }
  async getCommunityBySlug(slug) {
    return this.data.communities.find((c) => c.slug === slug && !c.deletedAt);
  }
  async createCommunity(community) {
    const newCommunity = {
      id: this.nextId++,
      name: community.name,
      description: community.description,
      slug: community.slug,
      iconName: community.iconName,
      iconColor: community.iconColor,
      interestTags: community.interestTags || [],
      city: community.city || null,
      state: community.state || null,
      isLocalCommunity: community.isLocalCommunity || false,
      latitude: community.latitude || null,
      longitude: community.longitude || null,
      memberCount: 0,
      isPrivate: community.isPrivate || false,
      hasPrivateWall: community.hasPrivateWall || false,
      hasPublicWall: community.hasPublicWall || true,
      createdAt: /* @__PURE__ */ new Date(),
      deletedAt: null,
      createdBy: community.createdBy
    };
    this.data.communities.push(newCommunity);
    return newCommunity;
  }
  async updateCommunity(id, community) {
    const index = this.data.communities.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Community not found");
    this.data.communities[index] = { ...this.data.communities[index], ...community };
    return this.data.communities[index];
  }
  async deleteCommunity(id) {
    const comm = this.data.communities.find((c) => c.id === id);
    if (!comm) return false;
    comm.deletedAt = /* @__PURE__ */ new Date();
    return true;
  }
  // Community invitation methods
  async createCommunityInvitation(invitation) {
    const newInvitation = {
      id: this.nextId++,
      communityId: invitation.communityId,
      inviterUserId: invitation.inviterUserId,
      inviteeEmail: invitation.inviteeEmail,
      inviteeUserId: invitation.inviteeUserId || null,
      status: invitation.status || "pending",
      token: invitation.token,
      createdAt: /* @__PURE__ */ new Date(),
      expiresAt: invitation.expiresAt
    };
    this.data.communityInvitations.push(newInvitation);
    return newInvitation;
  }
  async getCommunityInvitations(communityId) {
    return this.data.communityInvitations.filter((i) => i.communityId === communityId).map((i) => ({
      ...i,
      inviter: this.data.users.find((u) => u.id === i.inviterUserId)
    }));
  }
  async getCommunityInvitationByToken(token) {
    return this.data.communityInvitations.find((i) => i.token === token);
  }
  async getCommunityInvitationById(id) {
    return this.data.communityInvitations.find((i) => i.id === id);
  }
  async updateCommunityInvitationStatus(id, status) {
    const invitation = this.data.communityInvitations.find((i) => i.id === id);
    if (!invitation) throw new Error("Invitation not found");
    invitation.status = status;
    return invitation;
  }
  async deleteCommunityInvitation(id) {
    const index = this.data.communityInvitations.findIndex((i) => i.id === id);
    if (index === -1) return false;
    this.data.communityInvitations.splice(index, 1);
    return true;
  }
  async getCommunityInvitationByEmailAndCommunity(email, communityId) {
    return this.data.communityInvitations.find((i) => i.inviteeEmail === email && i.communityId === communityId);
  }
  // Community member methods
  async getCommunityMembers(communityId) {
    return this.data.communityMembers.filter((m) => m.communityId === communityId).map((m) => ({
      ...m,
      user: this.data.users.find((u) => u.id === m.userId)
    }));
  }
  async getCommunityMember(communityId, userId) {
    return this.data.communityMembers.find((m) => m.communityId === communityId && m.userId === userId);
  }
  async getUserCommunities(userId) {
    const userMemberships = this.data.communityMembers.filter((m) => m.userId === userId);
    return userMemberships.map((m) => {
      const community = this.data.communities.find((c) => c.id === m.communityId);
      const memberCount = this.data.communityMembers.filter((mem) => mem.communityId === community.id).length;
      return { ...community, memberCount };
    });
  }
  async addCommunityMember(member) {
    const newMember = {
      id: this.nextId++,
      communityId: member.communityId,
      userId: member.userId,
      role: member.role || "member",
      joinedAt: /* @__PURE__ */ new Date()
    };
    this.data.communityMembers.push(newMember);
    const community = this.data.communities.find((c) => c.id === member.communityId);
    if (community) {
      community.memberCount = (community.memberCount || 0) + 1;
    }
    return newMember;
  }
  async updateCommunityMemberRole(id, role) {
    const member = this.data.communityMembers.find((m) => m.id === id);
    if (!member) throw new Error("Member not found");
    member.role = role;
    return member;
  }
  async removeCommunityMember(communityId, userId) {
    const index = this.data.communityMembers.findIndex((m) => m.communityId === communityId && m.userId === userId);
    if (index === -1) return false;
    this.data.communityMembers.splice(index, 1);
    const community = this.data.communities.find((c) => c.id === communityId);
    if (community && community.memberCount > 0) {
      community.memberCount--;
    }
    return true;
  }
  async isCommunityMember(communityId, userId) {
    return this.data.communityMembers.some((m) => m.communityId === communityId && m.userId === userId);
  }
  async isCommunityOwner(communityId, userId) {
    const member = await this.getCommunityMember(communityId, userId);
    return member?.role === "owner";
  }
  async isCommunityModerator(communityId, userId) {
    const member = await this.getCommunityMember(communityId, userId);
    return member?.role === "moderator" || member?.role === "owner";
  }
  // Community chat room methods
  async getCommunityRooms(communityId) {
    return this.data.communityChatRooms.filter((r) => r.communityId === communityId);
  }
  async getPublicCommunityRooms(communityId) {
    return this.data.communityChatRooms.filter((r) => r.communityId === communityId && !r.isPrivate);
  }
  async getCommunityRoom(id) {
    return this.data.communityChatRooms.find((r) => r.id === id);
  }
  async createCommunityRoom(room) {
    const newRoom = {
      id: this.nextId++,
      communityId: room.communityId,
      name: room.name,
      description: room.description || null,
      isPrivate: room.isPrivate || false,
      createdAt: /* @__PURE__ */ new Date(),
      createdBy: room.createdBy
    };
    this.data.communityChatRooms.push(newRoom);
    return newRoom;
  }
  async updateCommunityRoom(id, data) {
    const room = this.data.communityChatRooms.find((r) => r.id === id);
    if (!room) throw new Error("Room not found");
    Object.assign(room, data);
    return room;
  }
  async deleteCommunityRoom(id) {
    const index = this.data.communityChatRooms.findIndex((r) => r.id === id);
    if (index === -1) return false;
    this.data.communityChatRooms.splice(index, 1);
    return true;
  }
  // Chat message methods
  async getChatMessages(roomId, limit) {
    const messages2 = this.data.chatMessages.filter((m) => m.chatRoomId === roomId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((m) => ({
      ...m,
      sender: this.data.users.find((u) => u.id === m.senderId)
    }));
    return limit ? messages2.slice(-limit) : messages2;
  }
  async getChatMessagesAfter(roomId, afterId) {
    const afterMessage = this.data.chatMessages.find((m) => m.id === afterId);
    if (!afterMessage) return [];
    return this.data.chatMessages.filter((m) => m.chatRoomId === roomId && new Date(m.createdAt).getTime() > new Date(afterMessage.createdAt).getTime()).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((m) => ({
      ...m,
      sender: this.data.users.find((u) => u.id === m.senderId)
    }));
  }
  async createChatMessage(message) {
    const newMessage = {
      id: this.nextId++,
      content: message.content,
      chatRoomId: message.chatRoomId,
      senderId: message.senderId,
      isSystemMessage: message.isSystemMessage || false,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.data.chatMessages.push(newMessage);
    return newMessage;
  }
  async deleteChatMessage(id) {
    const index = this.data.chatMessages.findIndex((m) => m.id === id);
    if (index === -1) return false;
    this.data.chatMessages.splice(index, 1);
    return true;
  }
  // Community wall post methods
  async getCommunityWallPosts(communityId, isPrivate) {
    const posts2 = this.data.communityWallPosts.filter((p) => p.communityId === communityId && (isPrivate === void 0 || p.isPrivate === isPrivate)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((p) => ({
      ...p,
      author: this.data.users.find((u) => u.id === p.authorId)
    }));
    return posts2;
  }
  async getCommunityWallPost(id) {
    const post = this.data.communityWallPosts.find((p) => p.id === id);
    if (!post) return void 0;
    return {
      ...post,
      author: this.data.users.find((u) => u.id === post.authorId)
    };
  }
  async createCommunityWallPost(post) {
    const newPost = {
      id: this.nextId++,
      likeCount: 0,
      commentCount: 0,
      createdAt: /* @__PURE__ */ new Date(),
      deletedAt: null,
      ...post
    };
    this.data.communityWallPosts.push(newPost);
    return newPost;
  }
  async updateCommunityWallPost(id, data) {
    const post = this.data.communityWallPosts.find((p) => p.id === id);
    if (!post) throw new Error("Post not found");
    Object.assign(post, data);
    return post;
  }
  async deleteCommunityWallPost(id) {
    const post = this.data.communityWallPosts.find((p) => p.id === id);
    if (!post) return false;
    post.deletedAt = /* @__PURE__ */ new Date();
    return true;
  }
  // Post methods
  async getAllPosts(filter) {
    let posts2 = this.data.posts.filter((p) => !p.deletedAt);
    if (filter === "top") {
      posts2.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    } else if (filter === "hot") {
      posts2.sort((a, b) => {
        const aScore = (a.upvotes || 0) / Math.max(1, Math.floor((Date.now() - new Date(a.createdAt).getTime()) / (1e3 * 60 * 60)));
        const bScore = (b.upvotes || 0) / Math.max(1, Math.floor((Date.now() - new Date(b.createdAt).getTime()) / (1e3 * 60 * 60)));
        return bScore - aScore;
      });
    } else {
      posts2.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return posts2;
  }
  async getPost(id) {
    return this.data.posts.find((p) => p.id === id && !p.deletedAt);
  }
  async getPostsByCommunitySlug(communitySlug, filter) {
    const community = this.data.communities.find((c) => c.slug === communitySlug);
    if (!community) return [];
    let posts2 = this.data.posts.filter((p) => p.communityId === community.id && !p.deletedAt);
    if (filter === "top") {
      posts2.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    } else if (filter === "hot") {
      posts2.sort((a, b) => {
        const aScore = (a.upvotes || 0) / Math.max(1, Math.floor((Date.now() - new Date(a.createdAt).getTime()) / (1e3 * 60 * 60)));
        const bScore = (b.upvotes || 0) / Math.max(1, Math.floor((Date.now() - new Date(b.createdAt).getTime()) / (1e3 * 60 * 60)));
        return bScore - aScore;
      });
    } else {
      posts2.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return posts2;
  }
  async getPostsByGroupId(groupId, filter) {
    let posts2 = this.data.posts.filter((p) => p.groupId === groupId && !p.deletedAt);
    if (filter === "top") {
      posts2.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    } else if (filter === "hot") {
      posts2.sort((a, b) => {
        const aScore = (a.upvotes || 0) / Math.max(1, Math.floor((Date.now() - new Date(a.createdAt).getTime()) / (1e3 * 60 * 60)));
        const bScore = (b.upvotes || 0) / Math.max(1, Math.floor((Date.now() - new Date(b.createdAt).getTime()) / (1e3 * 60 * 60)));
        return bScore - aScore;
      });
    } else {
      posts2.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return posts2;
  }
  async getUserPosts(userId) {
    const posts2 = this.data.posts.filter((p) => p.authorId === userId && !p.deletedAt);
    const microblogs2 = this.data.microblogs.filter((m) => m.authorId === userId);
    const wallPosts = this.data.communityWallPosts.filter((p) => p.authorId === userId);
    return [
      ...posts2.map((p) => ({ ...p, type: "post" })),
      ...microblogs2.map((m) => ({ ...m, type: "microblog" })),
      ...wallPosts.map((p) => ({ ...p, type: "wall_post" }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  async createPost(post) {
    const newPost = {
      id: this.nextId++,
      upvotes: 0,
      commentCount: 0,
      createdAt: /* @__PURE__ */ new Date(),
      deletedAt: null,
      ...post
    };
    this.data.posts.push(newPost);
    return newPost;
  }
  async upvotePost(id) {
    const post = this.data.posts.find((p) => p.id === id);
    if (!post) throw new Error("Post not found");
    post.upvotes = (post.upvotes || 0) + 1;
    return post;
  }
  // Comment methods
  async getComment(id) {
    return this.data.comments.find((c) => c.id === id);
  }
  async getCommentsByPostId(postId) {
    return this.data.comments.filter((c) => c.postId === postId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  async createComment(comment) {
    const newComment = {
      id: this.nextId++,
      upvotes: 0,
      createdAt: /* @__PURE__ */ new Date(),
      ...comment
    };
    this.data.comments.push(newComment);
    const post = this.data.posts.find((p) => p.id === newComment.postId);
    if (post) {
      post.commentCount = (post.commentCount || 0) + 1;
    }
    return newComment;
  }
  async upvoteComment(id) {
    const comment = this.data.comments.find((c) => c.id === id);
    if (!comment) throw new Error("Comment not found");
    comment.upvotes = (comment.upvotes || 0) + 1;
    return comment;
  }
  // Group methods
  async getGroup(id) {
    return this.data.groups.find((g) => g.id === id);
  }
  async getGroupsByUserId(userId) {
    const userGroups = this.data.groupMembers.filter((m) => m.userId === userId);
    return userGroups.map((m) => this.data.groups.find((g) => g.id === m.groupId));
  }
  async createGroup(group) {
    const newGroup = {
      id: this.nextId++,
      createdAt: /* @__PURE__ */ new Date(),
      ...group
    };
    this.data.groups.push(newGroup);
    return newGroup;
  }
  // Group member methods
  async addGroupMember(member) {
    const newMember = {
      id: this.nextId++,
      groupId: member.groupId,
      userId: member.userId,
      isAdmin: member.isAdmin || false,
      joinedAt: /* @__PURE__ */ new Date()
    };
    this.data.groupMembers.push(newMember);
    return newMember;
  }
  async getGroupMembers(groupId) {
    return this.data.groupMembers.filter((m) => m.groupId === groupId);
  }
  async isGroupAdmin(groupId, userId) {
    const member = this.data.groupMembers.find((m) => m.groupId === groupId && m.userId === userId);
    return member?.isAdmin === true;
  }
  async isGroupMember(groupId, userId) {
    return this.data.groupMembers.some((m) => m.groupId === groupId && m.userId === userId);
  }
  // Apologetics resource methods
  async getAllApologeticsResources() {
    return [...this.data.apologeticsResources];
  }
  async getApologeticsResource(id) {
    return this.data.apologeticsResources.find((r) => r.id === id);
  }
  async createApologeticsResource(resource) {
    const newResource = {
      id: this.nextId++,
      createdAt: /* @__PURE__ */ new Date(),
      ...resource
    };
    this.data.apologeticsResources.push(newResource);
    return newResource;
  }
  // Prayer request methods
  async getPublicPrayerRequests() {
    return this.data.prayerRequests.filter((p) => p.privacyLevel === "public").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  async getAllPrayerRequests(filter) {
    let requests = [...this.data.prayerRequests];
    if (filter === "answered") {
      requests = requests.filter((p) => p.isAnswered);
    } else if (filter === "unanswered") {
      requests = requests.filter((p) => !p.isAnswered);
    }
    return requests.map((p) => ({ ...p, description: p.title }));
  }
  async getPrayerRequest(id) {
    const request = this.data.prayerRequests.find((p) => p.id === id);
    return request ? { ...request, description: request.title } : void 0;
  }
  async getUserPrayerRequests(userId) {
    return this.data.prayerRequests.filter((p) => p.authorId === userId).map((p) => ({ ...p, description: p.title }));
  }
  async getGroupPrayerRequests(groupId) {
    return this.data.prayerRequests.filter((p) => p.groupId === groupId).map((p) => ({ ...p, description: p.title }));
  }
  async getPrayerRequestsVisibleToUser(userId) {
    const userGroups = this.data.groupMembers.filter((gm) => gm.userId === userId).map((gm) => gm.groupId);
    return this.data.prayerRequests.filter((p) => {
      if (p.privacyLevel === "public") return true;
      if (p.privacyLevel === "group-only" && p.groupId && userGroups.includes(p.groupId)) return true;
      if (p.authorId === userId) return true;
      return false;
    }).map((p) => ({ ...p, description: p.title }));
  }
  async createPrayerRequest(prayer) {
    const newPrayer = {
      id: this.nextId++,
      title: prayer.title,
      content: prayer.content,
      isAnonymous: prayer.isAnonymous,
      privacyLevel: prayer.privacyLevel,
      groupId: prayer.groupId,
      authorId: prayer.authorId,
      prayerCount: 0,
      isAnswered: false,
      answeredDescription: null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: null
    };
    this.data.prayerRequests.push(newPrayer);
    return newPrayer;
  }
  async updatePrayerRequest(id, prayer) {
    const request = this.data.prayerRequests.find((p) => p.id === id);
    if (!request) throw new Error("Prayer request not found");
    Object.assign(request, prayer, { updatedAt: /* @__PURE__ */ new Date() });
    return request;
  }
  async markPrayerRequestAsAnswered(id, description) {
    const request = this.data.prayerRequests.find((p) => p.id === id);
    if (!request) throw new Error("Prayer request not found");
    request.isAnswered = true;
    request.answeredDescription = description;
    request.updatedAt = /* @__PURE__ */ new Date();
    return request;
  }
  async deletePrayerRequest(id) {
    const index = this.data.prayerRequests.findIndex((p) => p.id === id);
    if (index === -1) return false;
    this.data.prayerRequests.splice(index, 1);
    return true;
  }
  // Prayer methods
  async createPrayer(prayer) {
    const newPrayer = {
      id: this.nextId++,
      userId: prayer.userId,
      prayerRequestId: prayer.prayerRequestId,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.data.prayers.push(newPrayer);
    const request = this.data.prayerRequests.find((p) => p.id === prayer.prayerRequestId);
    if (request) {
      request.prayerCount = (request.prayerCount || 0) + 1;
    }
    return newPrayer;
  }
  async getPrayersForRequest(prayerRequestId) {
    return this.data.prayers.filter((p) => p.prayerRequestId === prayerRequestId);
  }
  async getUserPrayedRequests(userId) {
    const userPrayers = this.data.prayers.filter((p) => p.userId === userId);
    return Array.from(new Set(userPrayers.map((p) => p.prayerRequestId)));
  }
  // Apologetics Q&A methods
  async getAllApologeticsTopics() {
    return [...this.data.apologeticsTopics];
  }
  async getApologeticsTopic(id) {
    return this.data.apologeticsTopics.find((t) => t.id === id);
  }
  async getApologeticsTopicBySlug(slug) {
    return this.data.apologeticsTopics.find((t) => t.slug === slug);
  }
  async createApologeticsTopic(topic) {
    const newTopic = {
      id: this.nextId++,
      createdAt: /* @__PURE__ */ new Date(),
      ...topic
    };
    this.data.apologeticsTopics.push(newTopic);
    return newTopic;
  }
  async getAllApologeticsQuestions(filterByStatus) {
    let questions = [...this.data.apologeticsQuestions];
    if (filterByStatus) {
      questions = questions.filter((q) => q.status === filterByStatus);
    }
    return questions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  async getApologeticsQuestion(id) {
    return this.data.apologeticsQuestions.find((q) => q.id === id);
  }
  async getApologeticsQuestionsByTopic(topicId) {
    return this.data.apologeticsQuestions.filter((q) => q.topicId === topicId);
  }
  async createApologeticsQuestion(question) {
    const newQuestion = {
      id: this.nextId++,
      title: question.title,
      content: question.content,
      authorId: question.authorId,
      topicId: question.topicId,
      status: question.status || "pending",
      answerCount: 0,
      createdAt: /* @__PURE__ */ new Date(),
      viewCount: 0
    };
    this.data.apologeticsQuestions.push(newQuestion);
    const topic = this.data.apologeticsTopics.find((t) => t.id === question.topicId);
    if (topic) {
      topic.questionCount = (topic.questionCount || 0) + 1;
    }
    return newQuestion;
  }
  async updateApologeticsQuestionStatus(id, status) {
    const question = this.data.apologeticsQuestions.find((q) => q.id === id);
    if (!question) throw new Error("Question not found");
    question.status = status;
    return question;
  }
  async getApologeticsAnswersByQuestion(questionId) {
    return this.data.apologeticsAnswers.filter((a) => a.questionId === questionId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  async createApologeticsAnswer(answer) {
    const newAnswer = {
      id: this.nextId++,
      content: answer.content,
      authorId: answer.authorId,
      questionId: answer.questionId,
      isVerifiedAnswer: answer.isVerifiedAnswer || false,
      upvotes: 0,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.data.apologeticsAnswers.push(newAnswer);
    return newAnswer;
  }
  // Event methods
  async getAllEvents() {
    return this.data.events.filter((e) => !e.deletedAt).sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  }
  async getEvent(id) {
    return this.data.events.find((e) => e.id === id && !e.deletedAt);
  }
  async getUserEvents(userId) {
    return this.data.events.filter((e) => e.creatorId === userId && !e.deletedAt);
  }
  async createEvent(event) {
    const newEvent = {
      id: this.nextId++,
      ...event,
      createdAt: /* @__PURE__ */ new Date()
    };
    newEvent.rsvpCount = 0;
    this.data.events.push(newEvent);
    return newEvent;
  }
  async updateEvent(id, data) {
    const event = this.data.events.find((e) => e.id === id);
    if (!event) throw new Error("Event not found");
    Object.assign(event, data);
    return event;
  }
  async deleteEvent(id) {
    const ev = this.data.events.find((e) => e.id === id);
    if (!ev) return false;
    ev.deletedAt = /* @__PURE__ */ new Date();
    return true;
  }
  // Event RSVP methods
  async createEventRSVP(rsvp) {
    const newRsvp = {
      id: this.nextId++,
      userId: rsvp.userId,
      status: rsvp.status,
      eventId: rsvp.eventId,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.data.eventRsvps.push(newRsvp);
    const event = this.data.events.find((e) => e.id === rsvp.eventId);
    if (event) {
      event.rsvpCount = (event.rsvpCount || 0) + 1;
    }
    return newRsvp;
  }
  async getEventRSVPs(eventId) {
    return this.data.eventRsvps.filter((r) => r.eventId === eventId);
  }
  async getUserEventRSVP(eventId, userId) {
    return this.data.eventRsvps.find((r) => r.eventId === eventId && r.userId === userId);
  }
  async updateEventRSVP(id, status) {
    const rsvp = this.data.eventRsvps.find((r) => r.id === id);
    if (!rsvp) throw new Error("RSVP not found");
    rsvp.status = status;
    return rsvp;
  }
  async deleteEventRSVP(id) {
    const index = this.data.eventRsvps.findIndex((r) => r.id === id);
    if (index === -1) return false;
    const rsvp = this.data.eventRsvps[index];
    this.data.eventRsvps.splice(index, 1);
    const event = this.data.events.find((e) => e.id === rsvp.eventId);
    if (event && event.rsvpCount > 0) {
      event.rsvpCount--;
    }
    return true;
  }
  // Microblog methods
  async getAllMicroblogs() {
    return [...this.data.microblogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  async getMicroblog(id) {
    return this.data.microblogs.find((m) => m.id === id);
  }
  async getUserMicroblogs(userId) {
    return this.data.microblogs.filter((m) => m.authorId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  async createMicroblog(microblog) {
    const newMicroblog = {
      id: this.nextId++,
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      createdAt: /* @__PURE__ */ new Date(),
      ...microblog
    };
    this.data.microblogs.push(newMicroblog);
    return newMicroblog;
  }
  async updateMicroblog(id, data) {
    const microblog = this.data.microblogs.find((m) => m.id === id);
    if (!microblog) throw new Error("Microblog not found");
    Object.assign(microblog, data);
    return microblog;
  }
  async deleteMicroblog(id) {
    const mb = this.data.microblogs.find((m) => m.id === id);
    if (!mb) return false;
    mb.deletedAt = /* @__PURE__ */ new Date();
    return true;
  }
  // Microblog like methods
  async likeMicroblog(microblogId, userId) {
    const existingLike = this.data.microblogLikes.find((l) => l.microblogId === microblogId && l.userId === userId);
    if (existingLike) {
      throw new Error("Already liked");
    }
    const newLike = {
      id: this.nextId++,
      microblogId,
      userId,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.data.microblogLikes.push(newLike);
    const microblog = this.data.microblogs.find((m) => m.id === microblogId);
    if (microblog) {
      microblog.likeCount = (microblog.likeCount || 0) + 1;
    }
    return newLike;
  }
  async unlikeMicroblog(microblogId, userId) {
    const index = this.data.microblogLikes.findIndex((l) => l.microblogId === microblogId && l.userId === userId);
    if (index === -1) return false;
    this.data.microblogLikes.splice(index, 1);
    const microblog = this.data.microblogs.find((m) => m.id === microblogId);
    if (microblog && microblog.likeCount > 0) {
      microblog.likeCount--;
    }
    return true;
  }
  async getUserLikedMicroblogs(userId) {
    const userLikes = this.data.microblogLikes.filter((l) => l.userId === userId);
    return userLikes.map((l) => this.data.microblogs.find((m) => m.id === l.microblogId));
  }
  // Livestreamer application methods
  async getLivestreamerApplicationByUserId(userId) {
    return this.data.livestreamerApplications.find((a) => a.userId === userId);
  }
  async getPendingLivestreamerApplications() {
    return this.data.livestreamerApplications.filter((a) => a.status === "pending");
  }
  async createLivestreamerApplication(application) {
    const newApplication = {
      id: this.nextId++,
      ...application,
      status: "pending",
      reviewNotes: null,
      reviewedBy: null,
      reviewedAt: null,
      submittedAt: /* @__PURE__ */ new Date()
    };
    this.data.livestreamerApplications.push(newApplication);
    return newApplication;
  }
  async updateLivestreamerApplication(id, status, reviewNotes, reviewerId) {
    const application = this.data.livestreamerApplications.find((a) => a.id === id);
    if (!application) throw new Error("Application not found");
    application.status = status;
    application.reviewNotes = reviewNotes;
    application.reviewedBy = reviewerId;
    application.reviewedAt = /* @__PURE__ */ new Date();
    return application;
  }
  async isApprovedLivestreamer(userId) {
    const application = this.data.livestreamerApplications.find((a) => a.userId === userId && a.status === "approved");
    return !!application;
  }
  // Apologist Scholar application methods
  async getApologistScholarApplicationByUserId(userId) {
    return this.data.apologistScholarApplications.find((a) => a.userId === userId);
  }
  async getPendingApologistScholarApplications() {
    return this.data.apologistScholarApplications.filter((a) => a.status === "pending");
  }
  async createApologistScholarApplication(application) {
    const newApplication = {
      id: this.nextId++,
      ...application,
      status: "pending",
      reviewNotes: null,
      reviewedBy: null,
      reviewedAt: null,
      submittedAt: /* @__PURE__ */ new Date()
    };
    this.data.apologistScholarApplications.push(newApplication);
    return newApplication;
  }
  async updateApologistScholarApplication(id, status, reviewNotes, reviewerId) {
    const application = this.data.apologistScholarApplications.find((a) => a.id === id);
    if (!application) throw new Error("Application not found");
    application.status = status;
    application.reviewNotes = reviewNotes;
    application.reviewedBy = reviewerId;
    application.reviewedAt = /* @__PURE__ */ new Date();
    return application;
  }
  // Admin methods
  async getAllLivestreamerApplications() {
    return [...this.data.livestreamerApplications];
  }
  async getAllApologistScholarApplications() {
    return [...this.data.apologistScholarApplications];
  }
  async getLivestreamerApplicationStats() {
    const all = this.data.livestreamerApplications;
    return {
      total: all.length,
      pending: all.filter((a) => a.status === "pending").length,
      approved: all.filter((a) => a.status === "approved").length,
      rejected: all.filter((a) => a.status === "rejected").length
    };
  }
  async updateLivestreamerApplicationStatus(id, status, reviewNotes) {
    const application = this.data.livestreamerApplications.find((a) => a.id === id);
    if (!application) throw new Error("Application not found");
    application.status = status;
    if (reviewNotes) application.reviewNotes = reviewNotes;
    application.reviewedAt = /* @__PURE__ */ new Date();
    return application;
  }
  async deleteUser(userId) {
    const index = this.data.users.findIndex((u) => u.id === userId);
    if (index === -1) return false;
    this.data.users.splice(index, 1);
    return true;
  }
  // Direct Messaging methods
  async getDirectMessages(userId1, userId2) {
    const result = await db.select().from(messages).where(
      or(
        and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
        and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
      )
    ).orderBy(messages.createdAt);
    return result;
  }
  async createDirectMessage(message) {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }
  // Push token + notifications (DB) - stubs until full implementation
  async savePushToken(token) {
    const existing = await db.select().from(pushTokens).where(eq(pushTokens.token, token.token));
    if (existing && existing.length > 0) {
      const [row] = await db.update(pushTokens).set({ userId: token.userId, platform: token.platform || existing[0].platform, lastUsed: /* @__PURE__ */ new Date() }).where(eq(pushTokens.token, token.token)).returning();
      return row;
    }
    const [inserted] = await db.insert(pushTokens).values({ userId: token.userId, token: token.token, platform: token.platform || "unknown", lastUsed: token.lastUsed || /* @__PURE__ */ new Date() }).returning();
    return inserted;
  }
  async getUserPushTokens(userId) {
    return await db.select().from(pushTokens).where(eq(pushTokens.userId, userId));
  }
  async deletePushToken(token, userId) {
    const rows = await db.select().from(pushTokens).where(eq(pushTokens.token, token));
    if (!rows || rows.length === 0) return "notfound";
    const row = rows[0];
    if (row.userId !== userId) return "forbidden";
    await db.delete(pushTokens).where(eq(pushTokens.token, token));
    return "deleted";
  }
  async getUserNotifications(userId) {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(notifications.createdAt);
  }
  async markNotificationAsRead(id, userId) {
    const rows = await db.select().from(notifications).where(eq(notifications.id, id));
    if (!rows || rows.length === 0) return false;
    const n = rows[0];
    if (n.userId !== userId) return false;
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
    return true;
  }
  // ========================
  // Bible Reading Plans (in-memory)
  // ========================
  async getAllBibleReadingPlans() {
    return [...this.data.bibleReadingPlans];
  }
  async getBibleReadingPlan(id) {
    return this.data.bibleReadingPlans.find((p) => p.id === id);
  }
  async createBibleReadingPlan(plan) {
    const newPlan = {
      id: this.nextId++,
      createdAt: /* @__PURE__ */ new Date(),
      ...plan
    };
    this.data.bibleReadingPlans.push(newPlan);
    return newPlan;
  }
  // ========================
  // Bible Reading Progress (in-memory)
  // ========================
  async getBibleReadingProgress(userId, planId) {
    return this.data.bibleReadingProgress.find((p) => p.userId === userId && p.planId === planId);
  }
  async createBibleReadingProgress(progress) {
    const p = progress;
    const existing = await this.getBibleReadingProgress(p.userId, p.planId);
    if (existing) return existing;
    const newProg = {
      id: this.nextId++,
      planId: p.planId,
      userId: p.userId,
      currentDay: 1,
      completedDays: [],
      startedAt: /* @__PURE__ */ new Date(),
      completedAt: null
    };
    this.data.bibleReadingProgress.push(newProg);
    return newProg;
  }
  async markDayCompleted(progressId, day) {
    const prog = this.data.bibleReadingProgress.find((p) => p.id === progressId);
    if (!prog) throw new Error("Progress not found");
    const completed = Array.isArray(prog.completedDays) ? prog.completedDays : [];
    if (!completed.includes(day)) completed.push(day);
    prog.completedDays = completed;
    const dayNum = parseInt(day, 10);
    if (!isNaN(dayNum) && prog.currentDay && dayNum >= prog.currentDay) {
      prog.currentDay = dayNum;
    }
    return prog;
  }
  // ========================
  // Bible Study Notes (in-memory)
  // ========================
  async getBibleStudyNotes(userId) {
    return this.data.bibleStudyNotes.filter((n) => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  async getBibleStudyNote(id) {
    return this.data.bibleStudyNotes.find((n) => n.id === id);
  }
  async createBibleStudyNote(note) {
    const newNote = {
      id: this.nextId++,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      ...note
    };
    this.data.bibleStudyNotes.push(newNote);
    return newNote;
  }
  async updateBibleStudyNote(id, data) {
    const note = this.data.bibleStudyNotes.find((n) => n.id === id);
    if (!note) throw new Error("Note not found");
    Object.assign(note, data, { updatedAt: /* @__PURE__ */ new Date() });
    return note;
  }
  async deleteBibleStudyNote(id) {
    const idx = this.data.bibleStudyNotes.findIndex((n) => n.id === id);
    if (idx === -1) return false;
    this.data.bibleStudyNotes.splice(idx, 1);
    return true;
  }
  // ========================
  // Moderation (in-memory)
  // ========================
  async createContentReport(report) {
    const newReport = {
      id: this.nextId++,
      status: report.status || "pending",
      moderatorId: null,
      moderatorNotes: null,
      resolvedAt: null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      ...report
    };
    this.data.contentReports.push(newReport);
    return newReport;
  }
  async createUserBlock(block) {
    const exists = this.data.userBlocks.find((b) => b.blockerId === block.blockerId && b.blockedId === block.blockedId);
    if (exists) return exists;
    const newBlock = {
      id: this.nextId++,
      createdAt: /* @__PURE__ */ new Date(),
      ...block
    };
    this.data.userBlocks.push(newBlock);
    return newBlock;
  }
  async getBlockedUserIdsFor(blockerId) {
    return this.data.userBlocks.filter((b) => b.blockerId === blockerId).map((b) => b.blockedId);
  }
  async getReports(filter) {
    let reports = [...this.data.contentReports];
    if (filter?.status) reports = reports.filter((r) => r.status === filter.status);
    if (filter?.limit && filter.limit > 0) reports = reports.slice(0, filter.limit);
    return reports;
  }
  async getReportById(id) {
    return this.data.contentReports.find((r) => r.id === id);
  }
  async updateReport(id, update) {
    const report = this.data.contentReports.find((r) => r.id === id);
    if (!report) throw new Error("Report not found");
    Object.assign(report, update, { updatedAt: /* @__PURE__ */ new Date() });
    return report;
  }
}
class DbStorage extends MemStorage {
}
const storage = new MemStorage();
export {
  DbStorage,
  MemStorage,
  storage
};
