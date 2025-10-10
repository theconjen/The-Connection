import {
  User, InsertUser,
  Community, InsertCommunity,
  CommunityMember, InsertCommunityMember,
  CommunityInvitation, InsertCommunityInvitation,
  CommunityChatRoom, InsertCommunityChatRoom,
  ChatMessage, InsertChatMessage,
  CommunityWallPost, InsertCommunityWallPost,
  Post, InsertPost,
  Comment, InsertComment,
  Group, InsertGroup,
  GroupMember, InsertGroupMember,
  ApologeticsResource, InsertApologeticsResource,
  Livestream, InsertLivestream,
  LivestreamerApplication, InsertLivestreamerApplication,
  ApologistScholarApplication, InsertApologistScholarApplication,
  Microblog, InsertMicroblog,
  MicroblogLike, InsertMicroblogLike,
  UserPreferences, InsertUserPreferences,

  // Apologetics system
  ApologeticsTopic, InsertApologeticsTopic,
  ApologeticsQuestion, InsertApologeticsQuestion,
  ApologeticsAnswer, InsertApologeticsAnswer,

  // Community Events
  Event, InsertEvent,
  EventRsvp, InsertEventRsvp,

  // Prayer system
  PrayerRequest, InsertPrayerRequest,
  Prayer, InsertPrayer,

  // Bible study tools
  BibleReadingPlan, InsertBibleReadingPlan,
  BibleReadingProgress, InsertBibleReadingProgress,
  BibleStudyNote, InsertBibleStudyNote,

  // Direct messaging
  Message, InsertMessage,

  // Moderation types
  ContentReport, InsertContentReport,
  UserBlock, InsertUserBlock,

  // Database tables
  users, communities, communityMembers, communityInvitations, communityChatRooms, chatMessages, communityWallPosts,
  posts, comments, groups, groupMembers, apologeticsResources,
  livestreams, microblogs, microblogLikes,
  apologeticsTopics, apologeticsQuestions, apologeticsAnswers,
  events, eventRsvps, prayerRequests, prayers,
  bibleReadingPlans, bibleReadingProgress, bibleStudyNotes,
  livestreamerApplications, apologistScholarApplications,
  userPreferences, messages,
  // moderation tables
    contentReports, userBlocks, pushTokens, notifications
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql, inArray, like } from "drizzle-orm";
import { whereNotDeleted, andNotDeleted } from "./db/helpers";
import { geocodeAddress } from "./geocoding";
import softDelete from './db/softDelete';

// Add this safety utility class at the top of the file, after imports
class StorageSafety {
  private static implementedMethods = new Set([
    'getUser', 'getUserById', 'getUserByUsername', 'getUserByEmail', 
    'searchUsers', 'getAllUsers', 'updateUser', 'createUser', 
    'updateUserPassword', 'setVerifiedApologeticsAnswerer', 
    'getVerifiedApologeticsAnswerers', 'getAllCommunities', 
    'searchCommunities', 'getPublicCommunitiesAndUserCommunities', 
    'getCommunity', 'getCommunityBySlug', 'createCommunity', 
    'updateCommunity', 'deleteCommunity', 'getCommunityMembers',
    'getCommunityMember', 'getUserCommunities', 'addCommunityMember',
    'updateCommunityMemberRole', 'removeCommunityMember', 'isCommunityMember',
    'isCommunityOwner', 'isCommunityModerator', 'createCommunityInvitation',
    'getCommunityInvitations', 'getCommunityInvitationByToken',
    'getCommunityInvitationById', 'updateCommunityInvitationStatus',
    'deleteCommunityInvitation', 'getCommunityInvitationByEmailAndCommunity',
    'getCommunityRooms', 'getPublicCommunityRooms', 'getCommunityRoom',
    'createCommunityRoom', 'updateCommunityRoom', 'deleteCommunityRoom',
    'getChatMessages', 'getChatMessagesAfter', 'createChatMessage',
    'deleteChatMessage', 'getCommunityWallPosts', 'getCommunityWallPost',
    'createCommunityWallPost', 'updateCommunityWallPost', 'deleteCommunityWallPost',
    'getAllPosts', 'getPost', 'getPostsByCommunitySlug', 'getPostsByGroupId',
    'getUserPosts', 'createPost', 'upvotePost', 'getComment',
    'getCommentsByPostId', 'createComment', 'upvoteComment', 'getGroup',
    'getGroupsByUserId', 'createGroup', 'addGroupMember', 'getGroupMembers',
    'isGroupAdmin', 'isGroupMember', 'getAllApologeticsResources',
    'getApologeticsResource', 'createApologeticsResource', 'getPublicPrayerRequests',
    'getAllPrayerRequests', 'getPrayerRequest', 'getUserPrayerRequests',
    'getGroupPrayerRequests', 'getPrayerRequestsVisibleToUser', 'createPrayerRequest',
    'updatePrayerRequest', 'markPrayerRequestAsAnswered', 'deletePrayerRequest',
    'createPrayer', 'getPrayersForRequest', 'getUserPrayedRequests', 'getAllApologeticsTopics',
    'getApologeticsTopic', 'getApologeticsTopicBySlug', 'createApologeticsTopic',
    'getAllApologeticsQuestions', 'getApologeticsQuestion', 'getApologeticsQuestionsByTopic',
    'createApologeticsQuestion', 'updateApologeticsQuestionStatus',
    'getApologeticsAnswersByQuestion', 'createApologeticsAnswer', 'getAllEvents',
    'getEvent', 'getUserEvents', 'createEvent', 'updateEvent', 'deleteEvent',
    'createEventRSVP', 'getEventRSVPs', 'getUserEventRSVP', 'updateEventRSVP',
    'deleteEventRSVP', 'getAllMicroblogs', 'getMicroblog', 'getUserMicroblogs',
    'createMicroblog', 'updateMicroblog', 'deleteMicroblog', 'likeMicroblog',
    'unlikeMicroblog', 'getUserLikedMicroblogs', 'getAllLivestreams',
    'createLivestream', 'getLivestreamerApplicationByUserId',
    'getPendingLivestreamerApplications', 'createLivestreamerApplication',
    'updateLivestreamerApplication', 'isApprovedLivestreamer',
    'getApologistScholarApplicationByUserId', 'getPendingApologistScholarApplications',
    'createApologistScholarApplication', 'updateApologistScholarApplication',
    'getAllLivestreamerApplications', 'getAllApologistScholarApplications',
    'getLivestreamerApplicationStats', 'updateLivestreamerApplicationStatus', 'deleteUser',
    'getAllBibleReadingPlans', 'getBibleReadingPlan', 'createBibleReadingPlan',
    'getBibleReadingProgress', 'createBibleReadingProgress', 'markDayCompleted',
    'getBibleStudyNotes', 'getBibleStudyNote', 'createBibleStudyNote',
    'updateBibleStudyNote', 'deleteBibleStudyNote', 'getDirectMessages', 'createDirectMessage', 'updateUserPreferences', 'getUserPreferences'
  ]);

  static isMethodImplemented(methodName: string): boolean {
    return this.implementedMethods.has(methodName);
  }

  static createSafeFallback<T>(methodName: string, fallback: T): T {
    if (!this.isMethodImplemented(methodName)) {
      console.warn(`Method ${methodName} not fully implemented, using fallback`);
    }
    return fallback;
  }
}

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  searchUsers(searchTerm: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  updateUserPreferences(userId: number, preferences: Partial<UserPreferences>): Promise<UserPreferences>;
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(userId: number, hashedPassword: string): Promise<User | undefined>;
  setVerifiedApologeticsAnswerer(userId: number, isVerified: boolean): Promise<User>;
  getVerifiedApologeticsAnswerers(): Promise<User[]>;
  
  // Community methods
  getAllCommunities(): Promise<Community[]>;
  searchCommunities(searchTerm: string): Promise<Community[]>;
  getPublicCommunitiesAndUserCommunities(userId?: number, searchQuery?: string): Promise<Community[]>;
  getCommunity(id: number): Promise<Community | undefined>;
  getCommunityBySlug(slug: string): Promise<Community | undefined>;
  createCommunity(community: InsertCommunity): Promise<Community>;
  updateCommunity(id: number, community: Partial<Community>): Promise<Community>;
  deleteCommunity(id: number): Promise<boolean>;
  
  // Community Invitations
  createCommunityInvitation(invitation: InsertCommunityInvitation): Promise<CommunityInvitation>;
  getCommunityInvitations(communityId: number): Promise<(CommunityInvitation & { inviter: User })[]>;
  getCommunityInvitationByToken(token: string): Promise<CommunityInvitation | undefined>;
  getCommunityInvitationById(id: number): Promise<CommunityInvitation | undefined>;
  updateCommunityInvitationStatus(id: number, status: string): Promise<CommunityInvitation>;
  deleteCommunityInvitation(id: number): Promise<boolean>;
  getCommunityInvitationByEmailAndCommunity(email: string, communityId: number): Promise<CommunityInvitation | undefined>;
  
  // Community Members & Roles
  getCommunityMembers(communityId: number): Promise<(CommunityMember & { user: User })[]>;
  getCommunityMember(communityId: number, userId: number): Promise<CommunityMember | undefined>;
  getUserCommunities(userId: number): Promise<(Community & { memberCount: number })[]>;
  addCommunityMember(member: InsertCommunityMember): Promise<CommunityMember>;
  updateCommunityMemberRole(id: number, role: string): Promise<CommunityMember>;
  removeCommunityMember(communityId: number, userId: number): Promise<boolean>;
  isCommunityMember(communityId: number, userId: number): Promise<boolean>;
  isCommunityOwner(communityId: number, userId: number): Promise<boolean>;
  isCommunityModerator(communityId: number, userId: number): Promise<boolean>;
  
  // Community Chat Rooms
  getCommunityRooms(communityId: number): Promise<CommunityChatRoom[]>;
  getPublicCommunityRooms(communityId: number): Promise<CommunityChatRoom[]>;
  getCommunityRoom(id: number): Promise<CommunityChatRoom | undefined>;
  createCommunityRoom(room: InsertCommunityChatRoom): Promise<CommunityChatRoom>;
  updateCommunityRoom(id: number, data: Partial<CommunityChatRoom>): Promise<CommunityChatRoom>;
  deleteCommunityRoom(id: number): Promise<boolean>;
  
  // Chat Messages
  getChatMessages(roomId: number, limit?: number): Promise<(ChatMessage & { sender: User })[]>;
  getChatMessagesAfter(roomId: number, afterId: number): Promise<(ChatMessage & { sender: User })[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  deleteChatMessage(id: number): Promise<boolean>;
  
  // Community Wall Posts
  getCommunityWallPosts(communityId: number, isPrivate?: boolean): Promise<(CommunityWallPost & { author: User })[]>;
  getCommunityWallPost(id: number): Promise<(CommunityWallPost & { author: User }) | undefined>;
  createCommunityWallPost(post: InsertCommunityWallPost): Promise<CommunityWallPost>;
  updateCommunityWallPost(id: number, data: Partial<CommunityWallPost>): Promise<CommunityWallPost>;
  deleteCommunityWallPost(id: number): Promise<boolean>;
  
  // Post methods
  getAllPosts(filter?: string): Promise<Post[]>;
  getPost(id: number): Promise<Post | undefined>;
  getPostsByCommunitySlug(communitySlug: string, filter?: string): Promise<Post[]>;
  getPostsByGroupId(groupId: number, filter?: string): Promise<Post[]>;
  getUserPosts(userId: number): Promise<any[]>;
  createPost(post: InsertPost): Promise<Post>;
  upvotePost(id: number): Promise<Post>;
  
  // Comment methods
  getComment(id: number): Promise<Comment | undefined>;
  getCommentsByPostId(postId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  upvoteComment(id: number): Promise<Comment>;
  
  // Group methods
  getGroup(id: number): Promise<Group | undefined>;
  getGroupsByUserId(userId: number): Promise<Group[]>;
  createGroup(group: InsertGroup): Promise<Group>;
  
  // Group member methods
  addGroupMember(member: InsertGroupMember): Promise<GroupMember>;
  getGroupMembers(groupId: number): Promise<GroupMember[]>;
  isGroupAdmin(groupId: number, userId: number): Promise<boolean>;
  isGroupMember(groupId: number, userId: number): Promise<boolean>;
  
  // Apologetics resource methods
  getAllApologeticsResources(): Promise<ApologeticsResource[]>;
  getApologeticsResource(id: number): Promise<ApologeticsResource | undefined>;
  createApologeticsResource(resource: InsertApologeticsResource): Promise<ApologeticsResource>;
  
  // Prayer Request methods
  getPublicPrayerRequests(): Promise<PrayerRequest[]>;
  getAllPrayerRequests(filter?: string): Promise<PrayerRequest[]>;
  getPrayerRequest(id: number): Promise<PrayerRequest | undefined>;
  getUserPrayerRequests(userId: number): Promise<PrayerRequest[]>;
  getGroupPrayerRequests(groupId: number): Promise<PrayerRequest[]>;
  getPrayerRequestsVisibleToUser(userId: number): Promise<PrayerRequest[]>;
  createPrayerRequest(prayer: InsertPrayerRequest): Promise<PrayerRequest>;
  updatePrayerRequest(id: number, prayer: Partial<InsertPrayerRequest>): Promise<PrayerRequest>;
  markPrayerRequestAsAnswered(id: number, description: string): Promise<PrayerRequest>;
  deletePrayerRequest(id: number): Promise<boolean>;
  
  // Prayer methods
  createPrayer(prayer: InsertPrayer): Promise<Prayer>;
  getPrayersForRequest(prayerRequestId: number): Promise<Prayer[]>;
  getUserPrayedRequests(userId: number): Promise<number[]>;
  
  // Apologetics Q&A methods
  getAllApologeticsTopics(): Promise<ApologeticsTopic[]>;
  getApologeticsTopic(id: number): Promise<ApologeticsTopic | undefined>;
  getApologeticsTopicBySlug(slug: string): Promise<ApologeticsTopic | undefined>;
  createApologeticsTopic(topic: InsertApologeticsTopic): Promise<ApologeticsTopic>;
  
  getAllApologeticsQuestions(filterByStatus?: string): Promise<ApologeticsQuestion[]>;
  getApologeticsQuestion(id: number): Promise<ApologeticsQuestion | undefined>;
  getApologeticsQuestionsByTopic(topicId: number): Promise<ApologeticsQuestion[]>;
  createApologeticsQuestion(question: InsertApologeticsQuestion): Promise<ApologeticsQuestion>;
  updateApologeticsQuestionStatus(id: number, status: string): Promise<ApologeticsQuestion>;
  
  getApologeticsAnswersByQuestion(questionId: number): Promise<ApologeticsAnswer[]>;
  createApologeticsAnswer(answer: InsertApologeticsAnswer): Promise<ApologeticsAnswer>;
  
  // Event methods
  getAllEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  getUserEvents(userId: number): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, data: Partial<Event>): Promise<Event>;
  deleteEvent(id: number): Promise<boolean>;
  
  // Event RSVP methods
  createEventRSVP(rsvp: InsertEventRsvp): Promise<EventRsvp>;
  getEventRSVPs(eventId: number): Promise<EventRsvp[]>;
  getUserEventRSVP(eventId: number, userId: number): Promise<EventRsvp | undefined>;
  updateEventRSVP(id: number, status: string): Promise<EventRsvp>;
  deleteEventRSVP(id: number): Promise<boolean>;
  
  // Microblog methods
  getAllMicroblogs(): Promise<Microblog[]>;
  getMicroblog(id: number): Promise<Microblog | undefined>;
  getUserMicroblogs(userId: number): Promise<Microblog[]>;
  createMicroblog(microblog: InsertMicroblog): Promise<Microblog>;
  updateMicroblog(id: number, data: Partial<Microblog>): Promise<Microblog>;
  deleteMicroblog(id: number): Promise<boolean>;
  
  // Microblog like methods
  likeMicroblog(microblogId: number, userId: number): Promise<MicroblogLike>;
  unlikeMicroblog(microblogId: number, userId: number): Promise<boolean>;
  getUserLikedMicroblogs(userId: number): Promise<Microblog[]>;
  
  // Livestream methods
  getAllLivestreams(): Promise<Livestream[]>;
  createLivestream(livestream: InsertLivestream): Promise<Livestream>;
  
  // Livestreamer application methods
  getLivestreamerApplicationByUserId(userId: number): Promise<LivestreamerApplication | undefined>;
  getPendingLivestreamerApplications(): Promise<LivestreamerApplication[]>;
  createLivestreamerApplication(application: InsertLivestreamerApplication): Promise<LivestreamerApplication>;
  updateLivestreamerApplication(id: number, status: string, reviewNotes: string, reviewerId: number): Promise<LivestreamerApplication>;
  isApprovedLivestreamer(userId: number): Promise<boolean>;
  
  // Apologist Scholar application methods
  getApologistScholarApplicationByUserId(userId: number): Promise<ApologistScholarApplication | undefined>;
  getPendingApologistScholarApplications(): Promise<ApologistScholarApplication[]>;
  createApologistScholarApplication(application: InsertApologistScholarApplication): Promise<ApologistScholarApplication>;
  updateApologistScholarApplication(id: number, status: string, reviewNotes: string, reviewerId: number): Promise<ApologistScholarApplication>;
  
  // Admin methods
  getAllLivestreamerApplications(): Promise<LivestreamerApplication[]>;
  getAllApologistScholarApplications(): Promise<ApologistScholarApplication[]>;
  getLivestreamerApplicationStats(): Promise<any>;
  updateLivestreamerApplicationStatus(id: number, status: string, reviewNotes?: string): Promise<LivestreamerApplication>;
  deleteUser(userId: number): Promise<boolean>;
  
  // Bible Reading Plan methods
  getAllBibleReadingPlans(): Promise<BibleReadingPlan[]>;
  getBibleReadingPlan(id: number): Promise<BibleReadingPlan | undefined>;
  createBibleReadingPlan(plan: InsertBibleReadingPlan): Promise<BibleReadingPlan>;
  
  // Bible Reading Progress methods
  getBibleReadingProgress(userId: number, planId: number): Promise<BibleReadingProgress | undefined>;
  createBibleReadingProgress(progress: InsertBibleReadingProgress): Promise<BibleReadingProgress>;
  markDayCompleted(progressId: number, day: string): Promise<BibleReadingProgress>;
  
  // Bible Study Note methods
  getBibleStudyNotes(userId: number): Promise<BibleStudyNote[]>;
  getBibleStudyNote(id: number): Promise<BibleStudyNote | undefined>;
  createBibleStudyNote(note: InsertBibleStudyNote): Promise<BibleStudyNote>;
  updateBibleStudyNote(id: number, data: Partial<BibleStudyNote>): Promise<BibleStudyNote>;
  deleteBibleStudyNote(id: number): Promise<boolean>;
  
  // Direct Messaging methods
  getDirectMessages(userId1: number, userId2: number): Promise<any[]>;
  createDirectMessage(message: any): Promise<any>;
  // Push notification methods
  savePushToken(token: { userId: number; token: string; platform?: string; lastUsed?: Date }): Promise<any>;
  getUserPushTokens(userId: number): Promise<any[]>;
  deletePushToken(token: string, userId: number): Promise<'deleted'|'notfound'|'forbidden'>;
  // Notifications
  getUserNotifications(userId: number): Promise<any[]>;
  markNotificationAsRead(id: number, userId: number): Promise<boolean>;
  // Moderation methods
  createContentReport(report: InsertContentReport): Promise<ContentReport>;
  createUserBlock(block: InsertUserBlock): Promise<UserBlock>;
  getBlockedUserIdsFor(blockerId: number): Promise<number[]>;
  // Admin moderation helpers
  getReports?(filter?: { status?: string; limit?: number }): Promise<ContentReport[]>;
  getReportById?(id: number): Promise<ContentReport | undefined>;
  updateReport?(id: number, update: Partial<ContentReport> & { status?: string; moderatorNotes?: string | null; moderatorId?: number | null; resolvedAt?: Date | null }): Promise<ContentReport>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private data = {
    users: [] as User[],
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
        createdAt: new Date(),
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
        createdAt: new Date(),
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
        createdAt: new Date(),
        deletedAt: null
      }
    ] as Community[],
    communityMembers: [] as CommunityMember[],
    communityInvitations: [] as CommunityInvitation[],
    communityChatRooms: [] as CommunityChatRoom[],
    chatMessages: [] as ChatMessage[],
    communityWallPosts: [] as CommunityWallPost[],
    posts: [] as Post[],
    comments: [] as Comment[],
    groups: [] as Group[],
    groupMembers: [] as GroupMember[],
    apologeticsResources: [] as ApologeticsResource[],
    livestreams: [] as Livestream[],
    prayerRequests: [] as PrayerRequest[],
    prayers: [] as Prayer[],
    apologeticsTopics: [] as ApologeticsTopic[],
    apologeticsQuestions: [] as ApologeticsQuestion[],
    apologeticsAnswers: [] as ApologeticsAnswer[],
    events: [] as Event[],
    eventRsvps: [] as EventRsvp[],
    microblogs: [] as Microblog[],
    microblogLikes: [] as MicroblogLike[],
    livestreamerApplications: [] as LivestreamerApplication[],
    apologistScholarApplications: [] as ApologistScholarApplication[],
    bibleReadingPlans: [] as BibleReadingPlan[],
    bibleReadingProgress: [] as BibleReadingProgress[],
    bibleStudyNotes: [] as BibleStudyNote[],
    userPreferences: [] as UserPreferences[],
    messages: [] as Message[],
    // Moderation in-memory stores
    contentReports: [] as any[],
    userBlocks: [] as any[],
  };
  
  private nextId = 1;
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.data.users.find(u => u.id === id);
  }
  
  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.data.users.find(u => u.username === username);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.data.users.find(u => u.email === email);
  }
  
  async searchUsers(searchTerm: string): Promise<User[]> {
    const term = searchTerm.toLowerCase();
    return this.data.users.filter(u => 
      u.username.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.displayName?.toLowerCase().includes(term)
    );
  }
  
  async getAllUsers(): Promise<User[]> {
    return this.data.users.filter(u => !u.deletedAt).map(u => ({ ...u }));
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const userIndex = this.data.users.findIndex(u => u.id === id);
    if (userIndex === -1) throw new Error('User not found');
    
    this.data.users[userIndex] = { ...this.data.users[userIndex], ...userData };
    return this.data.users[userIndex];
  }
  
  async updateUserPreferences(userId: number, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    let userPref = this.data.userPreferences.find(p => p.userId === userId);
    
    if (!userPref) {
      userPref = {
        id: this.nextId++,
        userId,
        interests: null,
        favoriteTopics: null,
        engagementHistory: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.data.userPreferences.push(userPref);
    }
    
    Object.assign(userPref, preferences, { updatedAt: new Date() });
    return userPref;
  }
  
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    return this.data.userPreferences.find(p => p.userId === userId);
  }

  // Push token methods (in-memory)
  async savePushToken(token: any): Promise<any> {
    const existing = this.data.messages.find ? null : null; // no-op to keep TS happy
    const found = this.data.posts.find ? null : null;
    // Simple behavior: avoid duplicate by token
    const existingIdx = (this.data as any).pushTokens?.findIndex((p: any) => p.token === token.token) ?? -1;
    if (existingIdx !== -1) {
      (this.data as any).pushTokens[existingIdx] = { ...((this.data as any).pushTokens[existingIdx]), ...token, lastUsed: new Date() };
      return (this.data as any).pushTokens[existingIdx];
    }
    if (!(this.data as any).pushTokens) (this.data as any).pushTokens = [];
    const obj = { id: this.nextId++, ...token };
    (this.data as any).pushTokens.push(obj);
    return obj;
  }

  async getUserPushTokens(userId: number): Promise<any[]> {
    return ((this.data as any).pushTokens || []).filter((p: any) => p.userId === userId);
  }

  async deletePushToken(token: string, userId: number): Promise<'deleted'|'notfound'|'forbidden'> {
    const arr = (this.data as any).pushTokens || [];
    const idx = arr.findIndex((p: any) => p.token === token);
    if (idx === -1) return 'notfound';
    if (arr[idx].userId !== userId) return 'forbidden';
    arr.splice(idx, 1);
    return 'deleted';
  }

  // Notifications (in-memory)
  async getUserNotifications(userId: number): Promise<any[]> {
    return ((this.data as any).notifications || []).filter((n: any) => n.userId === userId);
  }

  async markNotificationAsRead(id: number, userId: number): Promise<boolean> {
    const arr = (this.data as any).notifications || [];
    const n = arr.find((x: any) => x.id === id);
    if (!n) return false;
    if (n.userId !== userId) return false;
    n.isRead = true;
    return true;
  }
  
  async createUser(user: any): Promise<User> {
    const newUser: User = {
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
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    };
    this.data.users.push(newUser);
    return newUser;
  }
  
  async updateUserPassword(userId: number, hashedPassword: string): Promise<User | undefined> {
    const user = this.data.users.find(u => u.id === userId);
    if (user) {
      user.password = hashedPassword;
      return user;
    }
    return undefined;
  }
  
  async setVerifiedApologeticsAnswerer(userId: number, isVerified: boolean): Promise<User> {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    
    user.isVerifiedApologeticsAnswerer = isVerified;
    return user;
  }
  
  async getVerifiedApologeticsAnswerers(): Promise<User[]> {
    return this.data.users.filter(u => u.isVerifiedApologeticsAnswerer && !u.deletedAt);
  }
  
  // Community methods
  async getAllCommunities(): Promise<Community[]> {
    return this.data.communities.filter(c => !c.deletedAt).map(c => ({ ...c }));
  }
  
  async searchCommunities(searchTerm: string): Promise<Community[]> {
    const term = searchTerm.toLowerCase();
    return this.data.communities.filter(c => 
      c.name.toLowerCase().includes(term) ||
      c.description.toLowerCase().includes(term)
    );
  }
  
  async getPublicCommunitiesAndUserCommunities(userId?: number, searchQuery?: string): Promise<Community[]> {
    let communities = this.data.communities.filter(c => !c.isPrivate && !c.deletedAt);
    
    if (userId) {
      const userCommunities = this.data.communityMembers
        .filter(m => m.userId === userId)
        .map(m => this.data.communities.find(c => c.id === m.communityId))
        .filter(Boolean) as Community[];
      
      // Merge and deduplicate
      const communityMap = new Map();
      [...communities, ...userCommunities].forEach(c => communityMap.set(c.id, c));
      communities = Array.from(communityMap.values());
    }
    
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      communities = communities.filter(c => 
        c.name.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term)
      );
    }
    
    return communities;
  }
  
  async getCommunity(id: number): Promise<Community | undefined> {
    return this.data.communities.find(c => c.id === id && !c.deletedAt);
  }
  
  async getCommunityBySlug(slug: string): Promise<Community | undefined> {
    return this.data.communities.find(c => c.slug === slug && !c.deletedAt);
  }
  
  async createCommunity(community: any): Promise<Community> {
    const newCommunity: Community = {
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
      createdAt: new Date(),
      deletedAt: null,
      createdBy: community.createdBy
    };
    this.data.communities.push(newCommunity);
    return newCommunity;
  }
  
  async updateCommunity(id: number, community: Partial<Community>): Promise<Community> {
    const index = this.data.communities.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Community not found');
    
    this.data.communities[index] = { ...this.data.communities[index], ...community };
    return this.data.communities[index];
  }
  
  async deleteCommunity(id: number): Promise<boolean> {
    const comm = this.data.communities.find(c => c.id === id);
    if (!comm) return false;
    (comm as any).deletedAt = new Date();
    return true;
  }
  
  // Community invitation methods
  async createCommunityInvitation(invitation: any): Promise<CommunityInvitation> {
    const newInvitation: CommunityInvitation = {
      id: this.nextId++,
      communityId: invitation.communityId,
      inviterUserId: invitation.inviterUserId,
      inviteeEmail: invitation.inviteeEmail,
      inviteeUserId: invitation.inviteeUserId || null,
      status: invitation.status || "pending",
      token: invitation.token,
      createdAt: new Date(),
      expiresAt: invitation.expiresAt
    };
    this.data.communityInvitations.push(newInvitation);
    return newInvitation;
  }
  
  async getCommunityInvitations(communityId: number): Promise<(CommunityInvitation & { inviter: User })[]> {
    return this.data.communityInvitations
      .filter(i => i.communityId === communityId)
      .map(i => ({
        ...i,
        inviter: this.data.users.find(u => u.id === i.inviterUserId)!
      }));
  }
  
  async getCommunityInvitationByToken(token: string): Promise<CommunityInvitation | undefined> {
    return this.data.communityInvitations.find(i => i.token === token);
  }
  
  async getCommunityInvitationById(id: number): Promise<CommunityInvitation | undefined> {
    return this.data.communityInvitations.find(i => i.id === id);
  }
  
  async updateCommunityInvitationStatus(id: number, status: string): Promise<CommunityInvitation> {
    const invitation = this.data.communityInvitations.find(i => i.id === id);
    if (!invitation) throw new Error('Invitation not found');
    
    invitation.status = status;
    return invitation;
  }
  
  async deleteCommunityInvitation(id: number): Promise<boolean> {
    const index = this.data.communityInvitations.findIndex(i => i.id === id);
    if (index === -1) return false;
    
    this.data.communityInvitations.splice(index, 1);
    return true;
  }
  
  async getCommunityInvitationByEmailAndCommunity(email: string, communityId: number): Promise<CommunityInvitation | undefined> {
    return this.data.communityInvitations.find(i => i.inviteeEmail === email && i.communityId === communityId);
  }
  
  // Community member methods
  async getCommunityMembers(communityId: number): Promise<(CommunityMember & { user: User })[]> {
    return this.data.communityMembers
      .filter(m => m.communityId === communityId)
      .map(m => ({
        ...m,
        user: this.data.users.find(u => u.id === m.userId)!
      }));
  }
  
  async getCommunityMember(communityId: number, userId: number): Promise<CommunityMember | undefined> {
    return this.data.communityMembers.find(m => m.communityId === communityId && m.userId === userId);
  }
  
  async getUserCommunities(userId: number): Promise<(Community & { memberCount: number })[]> {
    const userMemberships = this.data.communityMembers.filter(m => m.userId === userId);
    return userMemberships.map(m => {
      const community = this.data.communities.find(c => c.id === m.communityId)!;
      const memberCount = this.data.communityMembers.filter(mem => mem.communityId === community.id).length;
      return { ...community, memberCount };
    });
  }
  
  async addCommunityMember(member: any): Promise<CommunityMember> {
    const newMember: CommunityMember = {
      id: this.nextId++,
      communityId: member.communityId,
      userId: member.userId,
      role: member.role || "member",
      joinedAt: new Date()
    };
    this.data.communityMembers.push(newMember);

    // Update member count
    const community = this.data.communities.find(c => c.id === member.communityId);
    if (community) {
      community.memberCount = (community.memberCount || 0) + 1;
    }

    return newMember;
  }
  
  async updateCommunityMemberRole(id: number, role: string): Promise<CommunityMember> {
    const member = this.data.communityMembers.find(m => m.id === id);
    if (!member) throw new Error('Member not found');
    
    member.role = role;
    return member;
  }
  
  async removeCommunityMember(communityId: number, userId: number): Promise<boolean> {
    const index = this.data.communityMembers.findIndex(m => m.communityId === communityId && m.userId === userId);
    if (index === -1) return false;
    
    this.data.communityMembers.splice(index, 1);
    
    // Update member count
    const community = this.data.communities.find(c => c.id === communityId);
    if (community && community.memberCount > 0) {
      community.memberCount--;
    }
    
    return true;
  }
  
  async isCommunityMember(communityId: number, userId: number): Promise<boolean> {
    return this.data.communityMembers.some(m => m.communityId === communityId && m.userId === userId);
  }
  
  async isCommunityOwner(communityId: number, userId: number): Promise<boolean> {
    const member = await this.getCommunityMember(communityId, userId);
    return member?.role === 'owner';
  }
  
  async isCommunityModerator(communityId: number, userId: number): Promise<boolean> {
    const member = await this.getCommunityMember(communityId, userId);
    return member?.role === 'moderator' || member?.role === 'owner';
  }
  
  // Community chat room methods
  async getCommunityRooms(communityId: number): Promise<CommunityChatRoom[]> {
    return this.data.communityChatRooms.filter(r => r.communityId === communityId);
  }
  
  async getPublicCommunityRooms(communityId: number): Promise<CommunityChatRoom[]> {
    return this.data.communityChatRooms.filter(r => r.communityId === communityId && !r.isPrivate);
  }
  
  async getCommunityRoom(id: number): Promise<CommunityChatRoom | undefined> {
    return this.data.communityChatRooms.find(r => r.id === id);
  }
  
  async createCommunityRoom(room: any): Promise<CommunityChatRoom> {
    const newRoom: CommunityChatRoom = {
      id: this.nextId++,
      communityId: room.communityId,
      name: room.name,
      description: room.description || null,
      isPrivate: room.isPrivate || false,
      createdAt: new Date(),
      createdBy: room.createdBy
    };
    this.data.communityChatRooms.push(newRoom);
    return newRoom;
  }
  
  async updateCommunityRoom(id: number, data: Partial<CommunityChatRoom>): Promise<CommunityChatRoom> {
    const room = this.data.communityChatRooms.find(r => r.id === id);
    if (!room) throw new Error('Room not found');
    
    Object.assign(room, data);
    return room;
  }
  
  async deleteCommunityRoom(id: number): Promise<boolean> {
    const index = this.data.communityChatRooms.findIndex(r => r.id === id);
    if (index === -1) return false;
    
    this.data.communityChatRooms.splice(index, 1);
    return true;
  }
  
  // Chat message methods
  async getChatMessages(roomId: number, limit?: number): Promise<(ChatMessage & { sender: User })[]> {
    const messages = this.data.chatMessages
      .filter(m => m.chatRoomId === roomId)
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime())
      .map(m => ({
        ...m,
        sender: this.data.users.find(u => u.id === m.senderId)!
      }));
    
    return limit ? messages.slice(-limit) : messages;
  }
  
  async getChatMessagesAfter(roomId: number, afterId: number): Promise<(ChatMessage & { sender: User })[]> {
    const afterMessage = this.data.chatMessages.find(m => m.id === afterId);
    if (!afterMessage) return [];
    
    return this.data.chatMessages
      .filter(m => m.chatRoomId === roomId && new Date(m.createdAt!).getTime() > new Date(afterMessage.createdAt!).getTime())
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime())
      .map(m => ({
        ...m,
        sender: this.data.users.find(u => u.id === m.senderId)!
      }));
  }
  
  async createChatMessage(message: any): Promise<ChatMessage> {
    const newMessage: ChatMessage = {
      id: this.nextId++,
      content: message.content,
      chatRoomId: message.chatRoomId,
      senderId: message.senderId,
      isSystemMessage: message.isSystemMessage || false,
      createdAt: new Date()
    };
    this.data.chatMessages.push(newMessage);
    return newMessage;
  }
  
  async deleteChatMessage(id: number): Promise<boolean> {
    const index = this.data.chatMessages.findIndex(m => m.id === id);
    if (index === -1) return false;
    
    this.data.chatMessages.splice(index, 1);
    return true;
  }
  
  // Community wall post methods
  async getCommunityWallPosts(communityId: number, isPrivate?: boolean): Promise<(CommunityWallPost & { author: User })[]> {
    const posts = this.data.communityWallPosts
      .filter(p => p.communityId === communityId && (isPrivate === undefined || p.isPrivate === isPrivate))
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .map(p => ({
        ...p,
        author: this.data.users.find(u => u.id === p.authorId)!
      }));
    
    return posts;
  }
  
  async getCommunityWallPost(id: number): Promise<(CommunityWallPost & { author: User }) | undefined> {
    const post = this.data.communityWallPosts.find(p => p.id === id);
    if (!post) return undefined;
    
    return {
      ...post,
      author: this.data.users.find(u => u.id === post.authorId)!
    };
  }
  
  async createCommunityWallPost(post: InsertCommunityWallPost): Promise<CommunityWallPost> {
    const newPost: CommunityWallPost = {
      id: this.nextId++,
      likeCount: 0,
      commentCount: 0,
      createdAt: new Date(),
      deletedAt: null,
      ...post,
    };
    this.data.communityWallPosts.push(newPost);
    return newPost;
  }
  
  async updateCommunityWallPost(id: number, data: Partial<CommunityWallPost>): Promise<CommunityWallPost> {
    const post = this.data.communityWallPosts.find(p => p.id === id);
    if (!post) throw new Error('Post not found');
    
    Object.assign(post, data);
    return post;
  }
  
  async deleteCommunityWallPost(id: number): Promise<boolean> {
    const post = this.data.communityWallPosts.find(p => p.id === id);
    if (!post) return false;
    (post as any).deletedAt = new Date();
    return true;
  }
  
  // Post methods
  async getAllPosts(filter?: string): Promise<Post[]> {
    let posts = this.data.posts.filter(p => !p.deletedAt);
    
    if (filter === 'top') {
      posts.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    } else if (filter === 'hot') {
      posts.sort((a, b) => {
        const aScore = (a.upvotes || 0) / Math.max(1, Math.floor((Date.now() - new Date(a.createdAt!).getTime()) / (1000 * 60 * 60)));
        const bScore = (b.upvotes || 0) / Math.max(1, Math.floor((Date.now() - new Date(b.createdAt!).getTime()) / (1000 * 60 * 60)));
        return bScore - aScore;
      });
    } else {
      posts.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    }
    
    return posts;
  }
  
  async getPost(id: number): Promise<Post | undefined> {
    return this.data.posts.find(p => p.id === id && !p.deletedAt);
  }
  
  async getPostsByCommunitySlug(communitySlug: string, filter?: string): Promise<Post[]> {
    // For in-memory storage, we'll need to find the community first
    const community = this.data.communities.find(c => c.slug === communitySlug);
    if (!community) return [];
    
  let posts = this.data.posts.filter(p => p.communityId === community.id && !p.deletedAt);
    
    if (filter === 'top') {
      posts.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    } else if (filter === 'hot') {
      posts.sort((a, b) => {
        const aScore = (a.upvotes || 0) / Math.max(1, Math.floor((Date.now() - new Date(a.createdAt!).getTime()) / (1000 * 60 * 60)));
        const bScore = (b.upvotes || 0) / Math.max(1, Math.floor((Date.now() - new Date(b.createdAt!).getTime()) / (1000 * 60 * 60)));
        return bScore - aScore;
      });
    } else {
      posts.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    }
    
    return posts;
  }
  
  async getPostsByGroupId(groupId: number, filter?: string): Promise<Post[]> {
  let posts = this.data.posts.filter(p => p.groupId === groupId && !p.deletedAt);
    
    if (filter === 'top') {
      posts.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    } else if (filter === 'hot') {
      posts.sort((a, b) => {
        const aScore = (a.upvotes || 0) / Math.max(1, Math.floor((Date.now() - new Date(a.createdAt!).getTime()) / (1000 * 60 * 60)));
        const bScore = (b.upvotes || 0) / Math.max(1, Math.floor((Date.now() - new Date(b.createdAt!).getTime()) / (1000 * 60 * 60)));
        return bScore - aScore;
      });
    } else {
      posts.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    }
    
    return posts;
  }
  
  async getUserPosts(userId: number): Promise<any[]> {
  const posts = this.data.posts.filter(p => p.authorId === userId && !p.deletedAt);
    const microblogs = this.data.microblogs.filter(m => m.authorId === userId);
    const wallPosts = this.data.communityWallPosts.filter(p => p.authorId === userId);
    
    return [
      ...posts.map(p => ({ ...p, type: 'post' })),
      ...microblogs.map(m => ({ ...m, type: 'microblog' })),
      ...wallPosts.map(p => ({ ...p, type: 'wall_post' }))
    ].sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }
  
  async createPost(post: InsertPost): Promise<Post> {
    const newPost: Post = {
      id: this.nextId++,
      upvotes: 0,
      commentCount: 0,
      createdAt: new Date(),
      deletedAt: null,
      ...post,
    };
    this.data.posts.push(newPost);
    return newPost;
  }
  
  async upvotePost(id: number): Promise<Post> {
    const post = this.data.posts.find(p => p.id === id);
    if (!post) throw new Error('Post not found');
    
    post.upvotes = (post.upvotes || 0) + 1;
    return post;
  }
  
  // Comment methods
  async getComment(id: number): Promise<Comment | undefined> {
    return this.data.comments.find(c => c.id === id);
  }
  
  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    return this.data.comments
      .filter(c => c.postId === postId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }
  
  async createComment(comment: InsertComment): Promise<Comment> {
    const newComment: Comment = {
      id: this.nextId++,
      upvotes: 0,
      createdAt: new Date(),
      ...comment,
    };
    this.data.comments.push(newComment);
    
    // Update post comment count
    const post = this.data.posts.find(p => p.id === newComment.postId);
    if (post) {
      post.commentCount = (post.commentCount || 0) + 1;
    }
    
    return newComment;
  }
  
  async upvoteComment(id: number): Promise<Comment> {
    const comment = this.data.comments.find(c => c.id === id);
    if (!comment) throw new Error('Comment not found');
    
    comment.upvotes = (comment.upvotes || 0) + 1;
    return comment;
  }
  
  // Group methods
  async getGroup(id: number): Promise<Group | undefined> {
    return this.data.groups.find(g => g.id === id);
  }
  
  async getGroupsByUserId(userId: number): Promise<Group[]> {
    const userGroups = this.data.groupMembers.filter(m => m.userId === userId);
    return userGroups.map(m => this.data.groups.find(g => g.id === m.groupId)!);
  }
  
  async createGroup(group: InsertGroup): Promise<Group> {
    const newGroup: Group = {
      id: this.nextId++,
      createdAt: new Date(),
      ...group,
    };
    this.data.groups.push(newGroup);
    return newGroup;
  }
  
  // Group member methods
  async addGroupMember(member: any): Promise<GroupMember> {
    const newMember: GroupMember = {
      id: this.nextId++,
      groupId: member.groupId,
      userId: member.userId,
      isAdmin: member.isAdmin || false,
      joinedAt: new Date()
    };
    this.data.groupMembers.push(newMember);
    return newMember;
  }
  
  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return this.data.groupMembers.filter(m => m.groupId === groupId);
  }
  
  async isGroupAdmin(groupId: number, userId: number): Promise<boolean> {
    const member = this.data.groupMembers.find(m => m.groupId === groupId && m.userId === userId);
    return member?.isAdmin === true;
  }
  
  async isGroupMember(groupId: number, userId: number): Promise<boolean> {
    return this.data.groupMembers.some(m => m.groupId === groupId && m.userId === userId);
  }
  
  // Apologetics resource methods
  async getAllApologeticsResources(): Promise<ApologeticsResource[]> {
    return [...this.data.apologeticsResources];
  }
  
  async getApologeticsResource(id: number): Promise<ApologeticsResource | undefined> {
    return this.data.apologeticsResources.find(r => r.id === id);
  }
  
  async createApologeticsResource(resource: InsertApologeticsResource): Promise<ApologeticsResource> {
    const newResource: ApologeticsResource = {
      id: this.nextId++,
      createdAt: new Date(),
      ...resource,
    };
    this.data.apologeticsResources.push(newResource);
    return newResource;
  }
  
  // Prayer request methods
  async getPublicPrayerRequests(): Promise<PrayerRequest[]> {
    return this.data.prayerRequests
      .filter(p => p.privacyLevel === 'public')
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }
  
  async getAllPrayerRequests(filter?: string): Promise<PrayerRequest[]> {
    let requests = [...this.data.prayerRequests];
    
    if (filter === 'answered') {
      requests = requests.filter(p => p.isAnswered);
    } else if (filter === 'unanswered') {
      requests = requests.filter(p => !p.isAnswered);
    }
    
    // Add description field from title for compatibility
    return requests.map(p => ({ ...p, description: p.title }));
  }
  
  async getPrayerRequest(id: number): Promise<PrayerRequest | undefined> {
    const request = this.data.prayerRequests.find(p => p.id === id);
    return request ? { ...request, description: request.title } as PrayerRequest & { description: string } : undefined;
  }
  
  async getUserPrayerRequests(userId: number): Promise<PrayerRequest[]> {
    return this.data.prayerRequests
      .filter(p => p.authorId === userId)
      .map(p => ({ ...p, description: p.title }));
  }
  
  async getGroupPrayerRequests(groupId: number): Promise<PrayerRequest[]> {
    return this.data.prayerRequests
      .filter(p => p.groupId === groupId)
      .map(p => ({ ...p, description: p.title }));
  }
  
  async getPrayerRequestsVisibleToUser(userId: number): Promise<PrayerRequest[]> {
    // Get user's groups
    const userGroups = this.data.groupMembers
      .filter(gm => gm.userId === userId)
      .map(gm => gm.groupId);
    
    return this.data.prayerRequests
      .filter(p => {
        // Public prayer requests
        if (p.privacyLevel === 'public') return true;
        // Prayer requests from groups the user is in
        if (p.privacyLevel === 'group-only' && p.groupId && userGroups.includes(p.groupId)) return true;
        // User's own prayer requests
        if (p.authorId === userId) return true;
        return false;
      })
      .map(p => ({ ...p, description: p.title }));
  }
  
  async createPrayerRequest(prayer: any): Promise<PrayerRequest> {
    const newPrayer: PrayerRequest = {
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
      createdAt: new Date(),
      updatedAt: null
    };
    this.data.prayerRequests.push(newPrayer);
    return newPrayer;
  }
  
  async updatePrayerRequest(id: number, prayer: Partial<InsertPrayerRequest>): Promise<PrayerRequest> {
    const request = this.data.prayerRequests.find(p => p.id === id);
    if (!request) throw new Error('Prayer request not found');
    
    Object.assign(request, prayer, { updatedAt: new Date() });
    return request;
  }
  
  async markPrayerRequestAsAnswered(id: number, description: string): Promise<PrayerRequest> {
    const request = this.data.prayerRequests.find(p => p.id === id);
    if (!request) throw new Error('Prayer request not found');
    
    request.isAnswered = true;
    request.answeredDescription = description;
    request.updatedAt = new Date();
    
    return request;
  }
  
  async deletePrayerRequest(id: number): Promise<boolean> {
    const index = this.data.prayerRequests.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    this.data.prayerRequests.splice(index, 1);
    return true;
  }
  
  // Prayer methods
  async createPrayer(prayer: any): Promise<Prayer> {
    const newPrayer: Prayer = {
      id: this.nextId++,
      userId: prayer.userId,
      prayerRequestId: prayer.prayerRequestId,
      createdAt: new Date()
    };
    this.data.prayers.push(newPrayer);

    // Increment prayer count on the request
    const request = this.data.prayerRequests.find(p => p.id === prayer.prayerRequestId);
    if (request) {
      request.prayerCount = (request.prayerCount || 0) + 1;
    }

    return newPrayer;
  }
  
  async getPrayersForRequest(prayerRequestId: number): Promise<Prayer[]> {
    return this.data.prayers.filter(p => p.prayerRequestId === prayerRequestId);
  }
  
  async getUserPrayedRequests(userId: number): Promise<number[]> {
    const userPrayers = this.data.prayers.filter(p => p.userId === userId);
    return Array.from(new Set(userPrayers.map(p => p.prayerRequestId)));
  }
  
  // Apologetics Q&A methods
  async getAllApologeticsTopics(): Promise<ApologeticsTopic[]> {
    return [...this.data.apologeticsTopics];
  }
  
  async getApologeticsTopic(id: number): Promise<ApologeticsTopic | undefined> {
    return this.data.apologeticsTopics.find(t => t.id === id);
  }
  
  async getApologeticsTopicBySlug(slug: string): Promise<ApologeticsTopic | undefined> {
    return this.data.apologeticsTopics.find(t => t.slug === slug);
  }
  
  async createApologeticsTopic(topic: InsertApologeticsTopic): Promise<ApologeticsTopic> {
    const newTopic: ApologeticsTopic = {
      id: this.nextId++,
      createdAt: new Date(),
      ...topic,
    };
    this.data.apologeticsTopics.push(newTopic);
    return newTopic;
  }
  
  async getAllApologeticsQuestions(filterByStatus?: string): Promise<ApologeticsQuestion[]> {
    let questions = [...this.data.apologeticsQuestions];
    
    if (filterByStatus) {
      questions = questions.filter(q => q.status === filterByStatus);
    }
    
    return questions.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }
  
  async getApologeticsQuestion(id: number): Promise<ApologeticsQuestion | undefined> {
    return this.data.apologeticsQuestions.find(q => q.id === id);
  }
  
  async getApologeticsQuestionsByTopic(topicId: number): Promise<ApologeticsQuestion[]> {
    return this.data.apologeticsQuestions.filter(q => q.topicId === topicId);
  }
  
  async createApologeticsQuestion(question: any): Promise<ApologeticsQuestion> {
    const newQuestion: ApologeticsQuestion = {
      id: this.nextId++,
      title: question.title,
      content: question.content,
      authorId: question.authorId,
      topicId: question.topicId,
      status: question.status || 'pending',
      answerCount: 0,
      createdAt: new Date(),
      viewCount: 0
    };
    this.data.apologeticsQuestions.push(newQuestion);

    // Update topic question count
    const topic = this.data.apologeticsTopics.find(t => t.id === question.topicId);
    if (topic) {
      (topic as any).questionCount = ((topic as any).questionCount || 0) + 1;
    }

    return newQuestion;
  }
  
  async updateApologeticsQuestionStatus(id: number, status: string): Promise<ApologeticsQuestion> {
    const question = this.data.apologeticsQuestions.find(q => q.id === id);
    if (!question) throw new Error('Question not found');
    
    question.status = status;
    return question;
  }
  
  async getApologeticsAnswersByQuestion(questionId: number): Promise<ApologeticsAnswer[]> {
    return this.data.apologeticsAnswers
      .filter(a => a.questionId === questionId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }
  
  async createApologeticsAnswer(answer: any): Promise<ApologeticsAnswer> {
    const newAnswer: ApologeticsAnswer = {
      id: this.nextId++,
      content: answer.content,
      authorId: answer.authorId,
      questionId: answer.questionId,
      isVerifiedAnswer: answer.isVerifiedAnswer || false,
      upvotes: 0,
      createdAt: new Date()
    };
    this.data.apologeticsAnswers.push(newAnswer);
    return newAnswer;
  }
  
  // Event methods
  async getAllEvents(): Promise<Event[]> {
    return this.data.events.filter(e => !e.deletedAt).sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  }
  
  async getEvent(id: number): Promise<Event | undefined> {
    return this.data.events.find(e => e.id === id && !e.deletedAt);
  }
  
  async getUserEvents(userId: number): Promise<Event[]> {
    return this.data.events.filter(e => e.creatorId === userId && !e.deletedAt);
  }
  
  async createEvent(event: InsertEvent): Promise<Event> {
    const newEvent = {
      id: this.nextId++,
      ...event,
      createdAt: new Date()
    } as Event;
    (newEvent as any).rsvpCount = 0;
    this.data.events.push(newEvent);
    return newEvent;
  }
  
  async updateEvent(id: number, data: Partial<Event>): Promise<Event> {
    const event = this.data.events.find(e => e.id === id);
    if (!event) throw new Error('Event not found');
    
    Object.assign(event, data);
    return event;
  }
  
  async deleteEvent(id: number): Promise<boolean> {
    const ev = this.data.events.find(e => e.id === id);
    if (!ev) return false;
    (ev as any).deletedAt = new Date();
    return true;
  }
  
  // Event RSVP methods
  async createEventRSVP(rsvp: any): Promise<EventRsvp> {
    const newRsvp: EventRsvp = {
      id: this.nextId++,
      userId: rsvp.userId,
      status: rsvp.status,
      eventId: rsvp.eventId,
      createdAt: new Date()
    };
    this.data.eventRsvps.push(newRsvp);

    // Update event RSVP count
    const event = this.data.events.find(e => e.id === rsvp.eventId);
    if (event) {
      (event as any).rsvpCount = ((event as any).rsvpCount || 0) + 1;
    }

    return newRsvp;
  }
  
  async getEventRSVPs(eventId: number): Promise<EventRsvp[]> {
    return this.data.eventRsvps.filter(r => r.eventId === eventId);
  }
  
  async getUserEventRSVP(eventId: number, userId: number): Promise<EventRsvp | undefined> {
    return this.data.eventRsvps.find(r => r.eventId === eventId && r.userId === userId);
  }
  
  async updateEventRSVP(id: number, status: string): Promise<EventRsvp> {
    const rsvp = this.data.eventRsvps.find(r => r.id === id);
    if (!rsvp) throw new Error('RSVP not found');
    
    rsvp.status = status;
    return rsvp;
  }
  
  async deleteEventRSVP(id: number): Promise<boolean> {
    const index = this.data.eventRsvps.findIndex(r => r.id === id);
    if (index === -1) return false;
    
    const rsvp = this.data.eventRsvps[index];
    this.data.eventRsvps.splice(index, 1);
    
    // Update event RSVP count
    const event = this.data.events.find(e => e.id === (rsvp as any).eventId);
    if (event && (event as any).rsvpCount > 0) {
      (event as any).rsvpCount--;
    }
    
    return true;
  }
  
  // Livestream methods
  async getAllLivestreams(): Promise<Livestream[]> {
    return [...this.data.livestreams].sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }
  
  async createLivestream(livestream: any): Promise<Livestream> {
    const newLivestream: Livestream = {
      id: this.nextId++,
      title: livestream.title,
      description: livestream.description || null,
      createdAt: new Date(),
      status: 'upcoming',
      hostId: livestream.hostId,
      thumbnail: livestream.thumbnail || null,
      viewerCount: 0,
      scheduledFor: livestream.scheduledFor,
      duration: livestream.duration || null,
      tags: livestream.tags || null,
      streamUrl: livestream.streamUrl || null,
      isLive: livestream.isLive || false
    };
    this.data.livestreams.push(newLivestream);
    return newLivestream;
  }
  
  // Microblog methods
  async getAllMicroblogs(): Promise<Microblog[]> {
    return [...this.data.microblogs].sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }
  
  async getMicroblog(id: number): Promise<Microblog | undefined> {
    return this.data.microblogs.find(m => m.id === id);
  }
  
  async getUserMicroblogs(userId: number): Promise<Microblog[]> {
    return this.data.microblogs
      .filter(m => m.authorId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }
  
  async createMicroblog(microblog: InsertMicroblog): Promise<Microblog> {
    const newMicroblog: Microblog = {
      id: this.nextId++,
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      createdAt: new Date(),
      ...microblog,
    };
    this.data.microblogs.push(newMicroblog);
    return newMicroblog;
  }
  
  async updateMicroblog(id: number, data: Partial<Microblog>): Promise<Microblog> {
    const microblog = this.data.microblogs.find(m => m.id === id);
    if (!microblog) throw new Error('Microblog not found');
    
    Object.assign(microblog, data);
    return microblog;
  }
  
  async deleteMicroblog(id: number): Promise<boolean> {
    const mb = this.data.microblogs.find(m => m.id === id);
    if (!mb) return false;
    (mb as any).deletedAt = new Date();
    return true;
  }
  
  // Microblog like methods
  async likeMicroblog(microblogId: number, userId: number): Promise<MicroblogLike> {
    // Check if already liked
    const existingLike = this.data.microblogLikes.find(l => l.microblogId === microblogId && l.userId === userId);
    if (existingLike) {
      throw new Error('Already liked');
    }
    
    const newLike: MicroblogLike = {
      id: this.nextId++,
      microblogId,
      userId,
      createdAt: new Date()
    };
    this.data.microblogLikes.push(newLike);
    
    // Update microblog like count
    const microblog = this.data.microblogs.find(m => m.id === microblogId);
    if (microblog) {
      microblog.likeCount = (microblog.likeCount || 0) + 1;
    }
    
    return newLike;
  }
  
  async unlikeMicroblog(microblogId: number, userId: number): Promise<boolean> {
    const index = this.data.microblogLikes.findIndex(l => l.microblogId === microblogId && l.userId === userId);
    if (index === -1) return false;
    
    this.data.microblogLikes.splice(index, 1);
    
    // Update microblog like count
    const microblog = this.data.microblogs.find(m => m.id === microblogId);
    if (microblog && microblog.likeCount > 0) {
      microblog.likeCount--;
    }
    
    return true;
  }
  
  async getUserLikedMicroblogs(userId: number): Promise<Microblog[]> {
    const userLikes = this.data.microblogLikes.filter(l => l.userId === userId);
    return userLikes.map(l => this.data.microblogs.find(m => m.id === l.microblogId)!);
  }
  
  // Livestreamer application methods
  async getLivestreamerApplicationByUserId(userId: number): Promise<LivestreamerApplication | undefined> {
    return this.data.livestreamerApplications.find(a => a.userId === userId);
  }
  
  async getPendingLivestreamerApplications(): Promise<LivestreamerApplication[]> {
    return this.data.livestreamerApplications.filter(a => a.status === 'pending');
  }
  
  async createLivestreamerApplication(application: InsertLivestreamerApplication): Promise<LivestreamerApplication> {
    const newApplication = {
      id: this.nextId++,
      ...application,
      status: 'pending',
      reviewNotes: null,
      reviewedBy: null,
      reviewedAt: null,
      submittedAt: new Date()
    } as LivestreamerApplication;
    this.data.livestreamerApplications.push(newApplication);
    return newApplication;
  }
  
  async updateLivestreamerApplication(id: number, status: string, reviewNotes: string, reviewerId: number): Promise<LivestreamerApplication> {
    const application = this.data.livestreamerApplications.find(a => a.id === id);
    if (!application) throw new Error('Application not found');
    
    application.status = status;
    application.reviewNotes = reviewNotes;
    application.reviewedBy = reviewerId;
    application.reviewedAt = new Date();
    
    return application;
  }
  
  async isApprovedLivestreamer(userId: number): Promise<boolean> {
    const application = this.data.livestreamerApplications.find(a => a.userId === userId && a.status === 'approved');
    return !!application;
  }
  
  // Apologist Scholar application methods
  async getApologistScholarApplicationByUserId(userId: number): Promise<ApologistScholarApplication | undefined> {
    return this.data.apologistScholarApplications.find(a => a.userId === userId);
  }
  
  async getPendingApologistScholarApplications(): Promise<ApologistScholarApplication[]> {
    return this.data.apologistScholarApplications.filter(a => a.status === 'pending');
  }
  
  async createApologistScholarApplication(application: InsertApologistScholarApplication): Promise<ApologistScholarApplication> {
    const newApplication = {
      id: this.nextId++,
      ...application,
      status: 'pending',
      reviewNotes: null,
      reviewedBy: null,
      reviewedAt: null,
      submittedAt: new Date()
    } as ApologistScholarApplication;
    this.data.apologistScholarApplications.push(newApplication);
    return newApplication;
  }
  
  async updateApologistScholarApplication(id: number, status: string, reviewNotes: string, reviewerId: number): Promise<ApologistScholarApplication> {
    const application = this.data.apologistScholarApplications.find(a => a.id === id);
    if (!application) throw new Error('Application not found');
    
    application.status = status;
    application.reviewNotes = reviewNotes;
    application.reviewedBy = reviewerId;
    application.reviewedAt = new Date();
    
    return application;
  }
  
  // Bible Reading Plan methods
  async getAllBibleReadingPlans(): Promise<BibleReadingPlan[]> {
    return [...this.data.bibleReadingPlans];
  }
  
  async getBibleReadingPlan(id: number): Promise<BibleReadingPlan | undefined> {
    return this.data.bibleReadingPlans.find(p => p.id === id);
  }
  
  async createBibleReadingPlan(plan: any): Promise<BibleReadingPlan> {
    const newPlan: BibleReadingPlan = {
      id: this.nextId++,
      title: plan.title,
      description: plan.description,
      groupId: plan.groupId,
      duration: plan.duration,
      isPublic: plan.isPublic,
      creatorId: plan.creatorId,
      readings: plan.readings,
      createdAt: new Date()
    };
    this.data.bibleReadingPlans.push(newPlan);
    return newPlan;
  }
  
  // Bible Reading Progress methods
  async getBibleReadingProgress(userId: number, planId: number): Promise<BibleReadingProgress | undefined> {
    return this.data.bibleReadingProgress.find(p => p.userId === userId && p.planId === planId);
  }
  
  async createBibleReadingProgress(progress: InsertBibleReadingProgress): Promise<BibleReadingProgress> {
    const newProgress: BibleReadingProgress = {
      id: this.nextId++,
      currentDay: 1,
      completedDays: "[]",
      startedAt: new Date(),
      completedAt: null,
      ...progress,
    };
    this.data.bibleReadingProgress.push(newProgress);
    return newProgress;
  }
  
  async markDayCompleted(progressId: number, day: string): Promise<BibleReadingProgress> {
    const progress = this.data.bibleReadingProgress.find(p => p.id === progressId);
    if (!progress) throw new Error('Progress not found');

    let completedDays: string[];
    try {
      completedDays = JSON.parse(progress.completedDays || "[]");
    } catch {
      completedDays = [];
    }
    if (!completedDays.includes(day)) {
      completedDays.push(day);
      progress.completedDays = JSON.stringify(completedDays);
      progress.currentDay = (progress.currentDay || 1) + 1;
    }

    return progress;
  }
  
  // Bible Study Note methods
  async getBibleStudyNotes(userId: number): Promise<BibleStudyNote[]> {
    return this.data.bibleStudyNotes.filter(n => n.userId === userId);
  }
  
  async getBibleStudyNote(id: number): Promise<BibleStudyNote | undefined> {
    return this.data.bibleStudyNotes.find(n => n.id === id);
  }
  
  async createBibleStudyNote(note: any): Promise<BibleStudyNote> {
    const newNote: BibleStudyNote = {
      id: this.nextId++,
      title: note.title,
      isPublic: note.isPublic,
      groupId: note.groupId,
      userId: note.userId,
      content: note.content,
      passage: note.passage,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.data.bibleStudyNotes.push(newNote);
    return newNote;
  }
  
  async updateBibleStudyNote(id: number, data: Partial<BibleStudyNote>): Promise<BibleStudyNote> {
    const note = this.data.bibleStudyNotes.find(n => n.id === id);
    if (!note) throw new Error('Note not found');
    
    Object.assign(note, data, { updatedAt: new Date() });
    return note;
  }
  
  async deleteBibleStudyNote(id: number): Promise<boolean> {
    const index = this.data.bibleStudyNotes.findIndex(n => n.id === id);
    if (index === -1) return false;
    
    this.data.bibleStudyNotes.splice(index, 1);
    return true;
  }
  
  // Admin methods
  async getAllLivestreamerApplications(): Promise<LivestreamerApplication[]> {
    return [...this.data.livestreamerApplications];
  }
  
  async getAllApologistScholarApplications(): Promise<ApologistScholarApplication[]> {
    return [...this.data.apologistScholarApplications];
  }
  
  async getLivestreamerApplicationStats(): Promise<any> {
    const all = this.data.livestreamerApplications;
    return {
      total: all.length,
      pending: all.filter(a => a.status === 'pending').length,
      approved: all.filter(a => a.status === 'approved').length,
      rejected: all.filter(a => a.status === 'rejected').length
    };
  }
  
  async updateLivestreamerApplicationStatus(id: number, status: string, reviewNotes?: string): Promise<LivestreamerApplication> {
    const application = this.data.livestreamerApplications.find(a => a.id === id);
    if (!application) throw new Error('Application not found');
    
    application.status = status as any;
    if (reviewNotes) application.reviewNotes = reviewNotes;
    application.reviewedAt = new Date();
    
    return application;
  }
  
  async deleteUser(userId: number): Promise<boolean> {
    const index = this.data.users.findIndex(u => u.id === userId);
    if (index === -1) return false;
    
    this.data.users.splice(index, 1);
    return true;
  }
  
  // Direct Messaging methods
  async getDirectMessages(userId1: number, userId2: number): Promise<any[]> {
    return this.data.messages
      .filter(m => 
        (m.senderId === userId1 && m.receiverId === userId2) ||
        (m.senderId === userId2 && m.receiverId === userId1)
      )
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
  }
  
  async createDirectMessage(message: any): Promise<any> {
    const newMessage = {
      id: crypto.randomUUID(),
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      createdAt: new Date()
    };
    this.data.messages.push(newMessage);
    return newMessage;
  }

  // Moderation methods (in-memory)
  async createContentReport(report: any): Promise<ContentReport> {
    const newReport: any = {
      id: this.nextId++,
      reporterId: report.reporterId,
      contentType: report.contentType,
      contentId: report.contentId,
      reason: report.reason || 'other',
      description: report.description || null,
      status: 'pending',
      moderatorId: null,
      moderatorNotes: null,
      resolvedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.data.contentReports.push(newReport);
    return newReport as ContentReport;
  }

  async createUserBlock(block: any): Promise<UserBlock> {
    // enforce unique blocker/blocked pair
    const exists = this.data.userBlocks.find(b => b.blockerId === block.blockerId && b.blockedId === block.blockedId);
    if (exists) return exists as UserBlock;
    const newBlock: any = {
      id: this.nextId++,
      blockerId: block.blockerId,
      blockedId: block.blockedId,
      reason: block.reason || null,
      createdAt: new Date()
    };
    this.data.userBlocks.push(newBlock);
    return newBlock as UserBlock;
  }

  async getBlockedUserIdsFor(blockerId: number): Promise<number[]> {
    return this.data.userBlocks.filter(b => b.blockerId === blockerId).map(b => b.blockedId);
  }

  // Admin moderation helpers (in-memory)
  async getReports(filter?: { status?: string; limit?: number }): Promise<ContentReport[]> {
    let rows = this.data.contentReports.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (filter?.status) rows = rows.filter(r => r.status === filter.status);
    if (filter?.limit) rows = rows.slice(0, filter.limit);
    return rows as ContentReport[];
  }

  async getReportById(id: number): Promise<ContentReport | undefined> {
    return this.data.contentReports.find(r => r.id === id) as ContentReport | undefined;
  }

  async updateReport(id: number, update: Partial<ContentReport> & { status?: string; moderatorNotes?: string | null; moderatorId?: number | null; resolvedAt?: Date | null }): Promise<ContentReport> {
    const idx = this.data.contentReports.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Report not found');
    const existing = this.data.contentReports[idx];
    const updated = { ...existing, ...update, updatedAt: new Date() };
    this.data.contentReports[idx] = updated;
    return updated as ContentReport;
  }
}

// Database-backed storage implementation
export class DbStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(and(eq(users.id, id), whereNotDeleted(users)));
    return result[0];
  }
  
  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(and(eq(users.username, username), whereNotDeleted(users)));
    return result[0];
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(and(eq(users.email, email), whereNotDeleted(users)));
    return result[0];
  }
  
  async searchUsers(searchTerm: string): Promise<User[]> {
    const term = `%${searchTerm}%`;
    return await db.select().from(users).where(and(
      or(
        like(users.username, term),
        like(users.email, term),
        like(users.displayName, term)
      ),
      whereNotDeleted(users)
    ));
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).where(whereNotDeleted(users));
  }

  // Moderation methods (DB)
  async createContentReport(report: InsertContentReport): Promise<ContentReport> {
  const [row] = await db.insert(contentReports).values(report as any).returning();
    return row as ContentReport;
  }

  async createUserBlock(block: InsertUserBlock): Promise<UserBlock> {
    // Upsert to enforce uniqueness blocker+blocked
  const inserted = await db.insert(userBlocks).values(block as any).onConflictDoNothing().returning();
    if (inserted && inserted.length > 0) return inserted[0] as UserBlock;
    // If nothing inserted, fetch existing
    const existing = await db.select().from(userBlocks).where(and(eq(userBlocks.blockerId, (block as any).blockerId), eq(userBlocks.blockedId, (block as any).blockedId)));
    return existing[0] as UserBlock;
  }

  async getBlockedUserIdsFor(blockerId: number): Promise<number[]> {
    const rows = await db.select({ blockedId: userBlocks.blockedId }).from(userBlocks).where(eq(userBlocks.blockerId, blockerId));
    return rows.map(r => (r as any).blockedId as number);
  }

  // Admin moderation helpers (DB)
  async getReports(filter?: { status?: string; limit?: number }): Promise<ContentReport[]> {
    const q = db.select().from(contentReports as any);
    if (filter?.status) q.where(eq((contentReports as any).status, filter.status as any));
    q.orderBy(desc((contentReports as any).createdAt));
    if (filter?.limit) q.limit(filter.limit as any);
    const rows = await q;
    return rows as ContentReport[];
  }

  async getReportById(id: number): Promise<ContentReport | undefined> {
    const rows = await db.select().from(contentReports as any).where(eq((contentReports as any).id, id as any));
    return rows[0] as ContentReport | undefined;
  }

  async updateReport(id: number, update: Partial<ContentReport> & { status?: string; moderatorNotes?: string | null; moderatorId?: number | null; resolvedAt?: Date | null }): Promise<ContentReport> {
    const updated = await db.update(contentReports as any).set(update as any).where(eq((contentReports as any).id, id as any)).returning();
    if (!updated || updated.length === 0) throw new Error('Report not found');
    return updated[0] as ContentReport;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const result = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    if (!result[0]) throw new Error('User not found');
    return result[0];
  }
  
  async updateUserPreferences(userId: number, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    // For now, just return a default preferences object
    // This can be expanded when the userPreferences table is properly set up
    return {
      id: 1,
      userId,
      interests: preferences.interests || null,
      favoriteTopics: preferences.favoriteTopics || null,
      engagementHistory: preferences.engagementHistory || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    // For now, return undefined since the table isn't fully implemented
    return undefined;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user as any).returning();
    return result[0];
  }
  
  async updateUserPassword(userId: number, hashedPassword: string): Promise<User | undefined> {
    const result = await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId)).returning();
    return result[0];
  }
  
  async setVerifiedApologeticsAnswerer(userId: number, isVerified: boolean): Promise<User> {
    const result = await db.update(users).set({ isVerifiedApologeticsAnswerer: isVerified } as any).where(eq(users.id, userId)).returning();
    if (!result[0]) throw new Error('User not found');
    return result[0];
  }
  
  async getVerifiedApologeticsAnswerers(): Promise<User[]> {
    return await db.select().from(users).where(and(eq(users.isVerifiedApologeticsAnswerer, true), whereNotDeleted(users)));
  }
  
  // Community methods - simplified for now
  async getAllCommunities(): Promise<Community[]> {
    return await db.select().from(communities).where(whereNotDeleted(communities));
  }
  
  async searchCommunities(searchTerm: string): Promise<Community[]> {
    const term = `%${searchTerm}%`;
    return await db.select().from(communities).where(and(
      or(
        like(communities.name, term),
        like(communities.description, term)
      ),
      whereNotDeleted(communities)
    ));
  }
  
  async getPublicCommunitiesAndUserCommunities(userId?: number, searchQuery?: string): Promise<Community[]> {
    let whereCondition = eq(communities.isPrivate, false);

    if (searchQuery) {
      const term = `%${searchQuery}%`;
      whereCondition = and(whereCondition, or(like(communities.name, term), like(communities.description, term)));
    }

    // Ensure we only return non-deleted communities at runtime
    whereCondition = and(whereCondition, whereNotDeleted(communities));

    const query = db.select().from(communities).where(whereCondition);
    return await query;
  }
  
  async getCommunity(id: number): Promise<Community | undefined> {
    const result = await db.select().from(communities).where(and(eq(communities.id, id), whereNotDeleted(communities)));
    return result[0];
  }
  
  async getCommunityBySlug(slug: string): Promise<Community | undefined> {
    const result = await db.select().from(communities).where(and(eq(communities.slug, slug), whereNotDeleted(communities)));
    return result[0];
  }
  
  async createCommunity(community: InsertCommunity): Promise<Community> {
    // Geocode the address if city/state are provided but no coordinates
    const comm: any = community as any; // local alias to appease TS for flexible payload
    let latitude = comm.latitude;
    let longitude = comm.longitude;

    if (!latitude && !longitude && (comm.city || comm.state)) {
      const geocodeResult = await geocodeAddress('', comm.city, comm.state);
      if ('latitude' in geocodeResult) {
        latitude = geocodeResult.latitude.toString();
        longitude = geocodeResult.longitude.toString();
      }
    }

    const communityData = {
      ...community,
      latitude,
      longitude
    };

    const result = await db.insert(communities).values(communityData as any).returning();
    return result[0];
  }
  
  async updateCommunity(id: number, community: Partial<Community>): Promise<Community> {
    const result = await db.update(communities).set(community).where(eq(communities.id, id)).returning();
    if (!result[0]) throw new Error('Community not found');
    return result[0];
  }
  
  async deleteCommunity(id: number): Promise<boolean> {
    const result = await softDelete(db, communities, communities.id, id);
    // Drizzle's update may not expose rowCount in typed outputs; defensively return true
    return !!result;
  }
  
  // Placeholder implementations for other methods - can be expanded as needed
  async getCommunityMembers(communityId: number): Promise<(CommunityMember & { user: User })[]> {
    return [];
  }
  
  async getCommunityMember(communityId: number, userId: number): Promise<CommunityMember | undefined> {
    return undefined;
  }
  
  async getUserCommunities(userId: number): Promise<(Community & { memberCount: number })[]> {
    return [];
  }
  
  async addCommunityMember(member: InsertCommunityMember): Promise<CommunityMember> {
    throw new Error('Not implemented');
  }
  
  async updateCommunityMemberRole(id: number, role: string): Promise<CommunityMember> {
    throw new Error('Not implemented');
  }
  
  async removeCommunityMember(communityId: number, userId: number): Promise<boolean> {
    return false;
  }
  
  async isCommunityMember(communityId: number, userId: number): Promise<boolean> {
    return false;
  }
  
  async isCommunityOwner(communityId: number, userId: number): Promise<boolean> {
    return false;
  }
  
  async isCommunityModerator(communityId: number, userId: number): Promise<boolean> {
    return false;
  }
  
  // Community invitation methods
  async createCommunityInvitation(invitation: InsertCommunityInvitation): Promise<CommunityInvitation> {
    throw new Error('Not implemented');
  }
  
  async getCommunityInvitations(communityId: number): Promise<(CommunityInvitation & { inviter: User })[]> {
    return [];
  }
  
  async getCommunityInvitationByToken(token: string): Promise<CommunityInvitation | undefined> {
    return undefined;
  }
  
  async getCommunityInvitationById(id: number): Promise<CommunityInvitation | undefined> {
    return undefined;
  }
  
  async updateCommunityInvitationStatus(id: number, status: string): Promise<CommunityInvitation> {
    throw new Error('Not implemented');
  }
  
  async deleteCommunityInvitation(id: number): Promise<boolean> {
    return false;
  }
  
  async getCommunityInvitationByEmailAndCommunity(email: string, communityId: number): Promise<CommunityInvitation | undefined> {
    return undefined;
  }
  
  // Community chat room methods
  async getCommunityRooms(communityId: number): Promise<CommunityChatRoom[]> {
    return [];
  }
  
  async getPublicCommunityRooms(communityId: number): Promise<CommunityChatRoom[]> {
    return [];
  }
  
  async getCommunityRoom(id: number): Promise<CommunityChatRoom | undefined> {
    return undefined;
  }
  
  async createCommunityRoom(room: InsertCommunityChatRoom): Promise<CommunityChatRoom> {
    throw new Error('Not implemented');
  }
  
  async updateCommunityRoom(id: number, data: Partial<CommunityChatRoom>): Promise<CommunityChatRoom> {
    throw new Error('Not implemented');
  }
  
  async deleteCommunityRoom(id: number): Promise<boolean> {
    return false;
  }
  
  // Chat message methods
  async getChatMessages(roomId: number, limit?: number): Promise<(ChatMessage & { sender: User })[]> {
    return [];
  }
  
  async getChatMessagesAfter(roomId: number, afterId: number): Promise<(ChatMessage & { sender: User })[]> {
    return [];
  }
  
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    throw new Error('Not implemented');
  }
  
  async deleteChatMessage(id: number): Promise<boolean> {
    return false;
  }
  
  // Community wall post methods
  async getCommunityWallPosts(communityId: number, isPrivate?: boolean): Promise<(CommunityWallPost & { author: User })[]> {
    return [];
  }
  
  async getCommunityWallPost(id: number): Promise<(CommunityWallPost & { author: User }) | undefined> {
    return undefined;
  }
  
  async createCommunityWallPost(post: InsertCommunityWallPost): Promise<CommunityWallPost> {
    throw new Error('Not implemented');
  }
  
  async updateCommunityWallPost(id: number, data: Partial<CommunityWallPost>): Promise<CommunityWallPost> {
    throw new Error('Not implemented');
  }
  
  async deleteCommunityWallPost(id: number): Promise<boolean> {
    const result = await softDelete(db, communityWallPosts, communityWallPosts.id, id);
    return !!result;
  }
  
  // Post methods
  async getAllPosts(filter?: string): Promise<Post[]> {
    return [];
  }
  
  async getPost(id: number): Promise<Post | undefined> {
    return undefined;
  }
  
  async getPostsByCommunitySlug(communitySlug: string, filter?: string): Promise<Post[]> {
    return [];
  }
  
  async getPostsByGroupId(groupId: number, filter?: string): Promise<Post[]> {
    return [];
  }
  
  async getUserPosts(userId: number): Promise<any[]> {
    return [];
  }
  
  async createPost(post: InsertPost): Promise<Post> {
    throw new Error('Not implemented');
  }
  
  async upvotePost(id: number): Promise<Post> {
    throw new Error('Not implemented');
  }
  
  // Comment methods
  async getComment(id: number): Promise<Comment | undefined> {
    return undefined;
  }
  
  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    return [];
  }
  
  async createComment(comment: InsertComment): Promise<Comment> {
    throw new Error('Not implemented');
  }
  
  async upvoteComment(id: number): Promise<Comment> {
    throw new Error('Not implemented');
  }
  
  // Group methods
  async getGroup(id: number): Promise<Group | undefined> {
    return undefined;
  }
  
  async getGroupsByUserId(userId: number): Promise<Group[]> {
    return [];
  }
  
  async createGroup(group: InsertGroup): Promise<Group> {
    throw new Error('Not implemented');
  }
  
  // Group member methods
  async addGroupMember(member: InsertGroupMember): Promise<GroupMember> {
    throw new Error('Not implemented');
  }
  
  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return [];
  }
  
  async isGroupAdmin(groupId: number, userId: number): Promise<boolean> {
    return false;
  }
  
  async isGroupMember(groupId: number, userId: number): Promise<boolean> {
    return false;
  }
  
  // Apologetics resource methods
  async getAllApologeticsResources(): Promise<ApologeticsResource[]> {
    return [];
  }
  
  async getApologeticsResource(id: number): Promise<ApologeticsResource | undefined> {
    return undefined;
  }
  
  async createApologeticsResource(resource: InsertApologeticsResource): Promise<ApologeticsResource> {
    throw new Error('Not implemented');
  }
  
  // Prayer request methods
  async getPublicPrayerRequests(): Promise<PrayerRequest[]> {
    return [];
  }
  
  async getAllPrayerRequests(filter?: string): Promise<PrayerRequest[]> {
    return [];
  }
  
  async getPrayerRequest(id: number): Promise<PrayerRequest | undefined> {
    return undefined;
  }
  
  async getUserPrayerRequests(userId: number): Promise<PrayerRequest[]> {
    return [];
  }
  
  async getGroupPrayerRequests(groupId: number): Promise<PrayerRequest[]> {
    return [];
  }
  
  async getPrayerRequestsVisibleToUser(userId: number): Promise<PrayerRequest[]> {
    // Get user's groups
    const userGroups = await db.select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(eq(groupMembers.userId, userId));
    
    const groupIds = userGroups.map(g => g.groupId);
    
    // Get prayer requests visible to user
    const conditions = [];
    
    // Public prayer requests
    conditions.push(eq(prayerRequests.privacyLevel, 'public'));
    
    // Prayer requests from groups the user is in
    if (groupIds.length > 0) {
      conditions.push(and(
        eq(prayerRequests.privacyLevel, 'group-only'),
        inArray(prayerRequests.groupId, groupIds)
      ));
    }
    
    // User's own prayer requests
    conditions.push(eq(prayerRequests.authorId, userId));
    
    return await db.select().from(prayerRequests).where(or(...conditions));
  }
  
  async createPrayerRequest(prayer: InsertPrayerRequest): Promise<PrayerRequest> {
    throw new Error('Not implemented');
  }
  
  async updatePrayerRequest(id: number, prayer: Partial<InsertPrayerRequest>): Promise<PrayerRequest> {
    throw new Error('Not implemented');
  }
  
  async markPrayerRequestAsAnswered(id: number, description: string): Promise<PrayerRequest> {
    throw new Error('Not implemented');
  }
  
  async deletePrayerRequest(id: number): Promise<boolean> {
    return false;
  }
  
  // Prayer methods
  async createPrayer(prayer: InsertPrayer): Promise<Prayer> {
    throw new Error('Not implemented');
  }
  
  async getPrayersForRequest(prayerRequestId: number): Promise<Prayer[]> {
    return [];
  }
  
  async getUserPrayedRequests(userId: number): Promise<number[]> {
    return [];
  }
  
  // Apologetics Q&A methods
  async getAllApologeticsTopics(): Promise<ApologeticsTopic[]> {
    return [];
  }
  
  async getApologeticsTopic(id: number): Promise<ApologeticsTopic | undefined> {
    return undefined;
  }
  
  async getApologeticsTopicBySlug(slug: string): Promise<ApologeticsTopic | undefined> {
    return undefined;
  }
  
  async createApologeticsTopic(topic: InsertApologeticsTopic): Promise<ApologeticsTopic> {
    throw new Error('Not implemented');
  }
  
  async getAllApologeticsQuestions(filterByStatus?: string): Promise<ApologeticsQuestion[]> {
    return [];
  }
  
  async getApologeticsQuestion(id: number): Promise<ApologeticsQuestion | undefined> {
    return undefined;
  }
  
  async getApologeticsQuestionsByTopic(topicId: number): Promise<ApologeticsQuestion[]> {
    return [];
  }
  
  async createApologeticsQuestion(question: InsertApologeticsQuestion): Promise<ApologeticsQuestion> {
    throw new Error('Not implemented');
  }
  
  async updateApologeticsQuestionStatus(id: number, status: string): Promise<ApologeticsQuestion> {
    throw new Error('Not implemented');
  }
  
  async getApologeticsAnswersByQuestion(questionId: number): Promise<ApologeticsAnswer[]> {
    return [];
  }
  
  async createApologeticsAnswer(answer: InsertApologeticsAnswer): Promise<ApologeticsAnswer> {
    throw new Error('Not implemented');
  }
  
  // Event methods
  async getAllEvents(): Promise<Event[]> {
    return [];
  }
  
  async getEvent(id: number): Promise<Event | undefined> {
    return undefined;
  }
  
  async getUserEvents(userId: number): Promise<Event[]> {
    return [];
  }
  
  async createEvent(event: InsertEvent): Promise<Event> {
    throw new Error('Not implemented');
  }
  
  async updateEvent(id: number, data: Partial<Event>): Promise<Event> {
    throw new Error('Not implemented');
  }
  
  async deleteEvent(id: number): Promise<boolean> {
    const result = await softDelete(db, events, events.id, id);
    return !!result;
  }

  async getNearbyEvents(latitude: number, longitude: number, radius: number): Promise<Event[]> {
    // This is a placeholder implementation.
    // A proper implementation would involve spatial queries on the database.
    console.warn('getNearbyEvents is not fully implemented in DbStorage. Returning empty array.');
    return [];
  }
  
  // Event RSVP methods
  async createEventRSVP(rsvp: InsertEventRsvp): Promise<EventRsvp> {
    throw new Error('Not implemented');
  }
  
  async getEventRSVPs(eventId: number): Promise<EventRsvp[]> {
    return [];
  }
  
  async getUserEventRSVP(eventId: number, userId: number): Promise<EventRsvp | undefined> {
    return undefined;
  }
  
  async updateEventRSVP(id: number, status: string): Promise<EventRsvp> {
    throw new Error('Not implemented');
  }
  
  async deleteEventRSVP(id: number): Promise<boolean> {
    return false;
  }
  
  // Livestream methods
  async getAllLivestreams(): Promise<Livestream[]> {
    return [];
  }
  
  async createLivestream(livestream: InsertLivestream): Promise<Livestream> {
    const result = await db.insert(livestreams).values(livestream as any).returning();
    return result[0];
  }
  
  // Microblog methods
  async getAllMicroblogs(): Promise<Microblog[]> {
    return [];
  }
  
  async getMicroblog(id: number): Promise<Microblog | undefined> {
    return undefined;
  }
  
  async getUserMicroblogs(userId: number): Promise<Microblog[]> {
    return [];
  }
  
  async createMicroblog(microblog: InsertMicroblog): Promise<Microblog> {
    throw new Error('Not implemented');
  }
  
  async updateMicroblog(id: number, data: Partial<Microblog>): Promise<Microblog> {
    throw new Error('Not implemented');
  }
  
  async deleteMicroblog(id: number): Promise<boolean> {
    return false;
  }
  
  // Microblog like methods
  async likeMicroblog(microblogId: number, userId: number): Promise<MicroblogLike> {
    throw new Error('Not implemented');
  }
  
  async unlikeMicroblog(microblogId: number, userId: number): Promise<boolean> {
    return false;
  }
  
  async getUserLikedMicroblogs(userId: number): Promise<Microblog[]> {
    return [];
  }
  
  // Livestreamer application methods
  async getLivestreamerApplicationByUserId(userId: number): Promise<LivestreamerApplication | undefined> {
    return undefined;
  }
  
  async getPendingLivestreamerApplications(): Promise<LivestreamerApplication[]> {
    return [];
  }
  
  async createLivestreamerApplication(application: InsertLivestreamerApplication): Promise<LivestreamerApplication> {
    throw new Error('Not implemented');
  }
  
  async updateLivestreamerApplication(id: number, status: string, reviewNotes: string, reviewerId: number): Promise<LivestreamerApplication> {
    throw new Error('Not implemented');
  }
  
  async isApprovedLivestreamer(userId: number): Promise<boolean> {
    return false;
  }
  
  // Apologist Scholar application methods
  async getApologistScholarApplicationByUserId(userId: number): Promise<ApologistScholarApplication | undefined> {
    return undefined;
  }
  
  async getPendingApologistScholarApplications(): Promise<ApologistScholarApplication[]> {
    return [];
  }
  
  async createApologistScholarApplication(application: InsertApologistScholarApplication): Promise<ApologistScholarApplication> {
    throw new Error('Not implemented');
  }
  
  async updateApologistScholarApplication(id: number, status: string, reviewNotes: string, reviewerId: number): Promise<ApologistScholarApplication> {
    throw new Error('Not implemented');
  }
  
  // Bible Reading Plan methods
  async getAllBibleReadingPlans(): Promise<BibleReadingPlan[]> {
    return [];
  }
  
  async getBibleReadingPlan(id: number): Promise<BibleReadingPlan | undefined> {
    return undefined;
  }
  
  async createBibleReadingPlan(plan: InsertBibleReadingPlan): Promise<BibleReadingPlan> {
    throw new Error('Not implemented');
  }
  
  // Bible Reading Progress methods
  async getBibleReadingProgress(userId: number, planId: number): Promise<BibleReadingProgress | undefined> {
    return undefined;
  }
  
  async createBibleReadingProgress(progress: InsertBibleReadingProgress): Promise<BibleReadingProgress> {
    throw new Error('Not implemented');
  }
  
  async markDayCompleted(progressId: number, day: string): Promise<BibleReadingProgress> {
    throw new Error('Not implemented');
  }
  
  // Bible Study Note methods
  async getBibleStudyNotes(userId: number): Promise<BibleStudyNote[]> {
    return [];
  }
  
  async getBibleStudyNote(id: number): Promise<BibleStudyNote | undefined> {
    return undefined;
  }
  
  async createBibleStudyNote(note: InsertBibleStudyNote): Promise<BibleStudyNote> {
    throw new Error('Not implemented');
  }
  
  async updateBibleStudyNote(id: number, data: Partial<BibleStudyNote>): Promise<BibleStudyNote> {
    throw new Error('Not implemented');
  }
  
  async deleteBibleStudyNote(id: number): Promise<boolean> {
    return false;
  }
  
  // Admin methods
  async getAllLivestreamerApplications(): Promise<LivestreamerApplication[]> {
    return await db.select().from(livestreamerApplications);
  }
  
  async getAllApologistScholarApplications(): Promise<ApologistScholarApplication[]> {
    return await db.select().from(apologistScholarApplications);
  }
  
  async getLivestreamerApplicationStats(): Promise<any> {
    const all = await db.select().from(livestreamerApplications);
    return {
      total: all.length,
      pending: all.filter(a => a.status === 'pending').length,
      approved: all.filter(a => a.status === 'approved').length,
      rejected: all.filter(a => a.status === 'rejected').length
    };
  }
  
  async updateLivestreamerApplicationStatus(id: number, status: string, reviewNotes?: string): Promise<LivestreamerApplication> {
    const result = await db.update(livestreamerApplications)
      .set({ 
        status: status as any,
        reviewNotes: reviewNotes || null,
        reviewedAt: new Date()
      })
      .where(eq(livestreamerApplications.id, id))
      .returning();
    
    if (!result[0]) throw new Error('Application not found');
    return result[0];
  }
  
  async deleteUser(userId: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, userId));
    return result.rowCount > 0;
  }
  
  // Direct Messaging methods
  async getDirectMessages(userId1: number, userId2: number): Promise<any[]> {
    const result = await db.select().from(messages).where(
      or(
        and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
        and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
      )
    ).orderBy(messages.createdAt);
    return result;
  }
  
  async createDirectMessage(message: any): Promise<any> {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }

  // Push token + notifications (DB) - stubs until full implementation
  async savePushToken(token: any): Promise<any> {
    // Insert or update by token (unique). Return the row.
    const existing = await db.select().from(pushTokens).where(eq(pushTokens.token, token.token));
    if (existing && existing.length > 0) {
      const [row] = await db.update(pushTokens).set({ userId: token.userId, platform: token.platform || existing[0].platform, lastUsed: new Date() }).where(eq(pushTokens.token, token.token)).returning();
      return row;
    }

    const [inserted] = await db.insert(pushTokens).values({ userId: token.userId, token: token.token, platform: token.platform || 'unknown', lastUsed: token.lastUsed || new Date() } as any).returning();
    return inserted;
  }

  async getUserPushTokens(userId: number): Promise<any[]> {
    return await db.select().from(pushTokens).where(eq(pushTokens.userId, userId));
  }

  async deletePushToken(token: string, userId: number): Promise<'deleted'|'notfound'|'forbidden'> {
    const rows = await db.select().from(pushTokens).where(eq(pushTokens.token, token));
    if (!rows || rows.length === 0) return 'notfound';
    const row = rows[0] as any;
    if (row.userId !== userId) return 'forbidden';
    await db.delete(pushTokens).where(eq(pushTokens.token, token));
    return 'deleted';
  }

  async getUserNotifications(userId: number): Promise<any[]> {
    // Only return notifications for the user; order by newest
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(notifications.createdAt);
  }

  async markNotificationAsRead(id: number, userId: number): Promise<boolean> {
    const rows = await db.select().from(notifications).where(eq(notifications.id, id));
    if (!rows || rows.length === 0) return false;
    const n = rows[0] as any;
    if (n.userId !== userId) return false;
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
    return true;
  }
}

// Export storage instance - switch based on environment
export const storage: IStorage = process.env.USE_DB === 'true'
  ? new DbStorage()
  : new MemStorage();
