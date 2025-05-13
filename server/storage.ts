import { 
  User, InsertUser, 
  Community, InsertCommunity,
  Post, InsertPost,
  Comment, InsertComment,
  Group, InsertGroup,
  GroupMember, InsertGroupMember,
  ApologeticsResource, InsertApologeticsResource,
  Livestream, InsertLivestream,
  LivestreamerApplication, InsertLivestreamerApplication,
  CreatorTier, VirtualGift, LivestreamGift,
  Microblog, InsertMicroblog,
  MicroblogLike, InsertMicroblogLike,
  
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
  
  // Mentorship system
  MentorProfile, InsertMentorProfile,
  MentorshipRequest, InsertMentorshipRequest,
  MentorshipRelationship, InsertMentorshipRelationship,
  
  // Bible study tools
  BibleReadingPlan, InsertBibleReadingPlan,
  BibleReadingProgress, InsertBibleReadingProgress,
  BibleStudyNote, InsertBibleStudyNote,
  VerseMemorization, InsertVerseMemorization,
  
  // Community challenges
  Challenge, InsertChallenge,
  ChallengeParticipant, InsertChallengeParticipant,
  ChallengeTestimonial, InsertChallengeTestimonial,
  
  // Resource sharing
  Resource, InsertResource,
  ResourceRating, InsertResourceRating,
  ResourceCollection, InsertResourceCollection,
  CollectionResource, InsertCollectionResource,
  
  // Community service
  ServiceProject, InsertServiceProject,
  ServiceVolunteer, InsertServiceVolunteer,
  ServiceTestimonial, InsertServiceTestimonial,
  
  // Database tables
  users, communities, posts, comments, groups, groupMembers, apologeticsResources, 
  livestreams, microblogs, microblogLikes,
  apologeticsTopics, apologeticsQuestions, apologeticsAnswers,
  events, eventRsvps, prayerRequests, prayers,
  mentorProfiles, mentorshipRequests, mentorshipRelationships,
  bibleReadingPlans, bibleReadingProgress, bibleStudyNotes, verseMemorization,
  challenges, challengeParticipants, challengeTestimonials,
  resources, resourceRatings, resourceCollections, collectionResources,
  serviceProjects, serviceVolunteers, serviceTestimonials
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, desc, SQL, sql, inArray, isNull } from "drizzle-orm";
import { pool } from './db';

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  setVerifiedApologeticsAnswerer(userId: number, isVerified: boolean): Promise<User>;
  getVerifiedApologeticsAnswerers(): Promise<User[]>;
  
  // Community methods
  getAllCommunities(): Promise<Community[]>;
  getCommunity(id: number): Promise<Community | undefined>;
  getCommunityBySlug(slug: string): Promise<Community | undefined>;
  createCommunity(community: InsertCommunity): Promise<Community>;
  
  // Post methods
  getAllPosts(filter?: string): Promise<Post[]>;
  getPost(id: number): Promise<Post | undefined>;
  getPostsByCommunitySlug(communitySlug: string, filter?: string): Promise<Post[]>;
  getPostsByGroupId(groupId: number, filter?: string): Promise<Post[]>;
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
  
  // Prayer Request methods
  getPublicPrayerRequests(): Promise<PrayerRequest[]>;
  getAllPrayerRequests(filter?: string): Promise<PrayerRequest[]>;
  getPrayerRequest(id: number): Promise<PrayerRequest | undefined>;
  getUserPrayerRequests(userId: number): Promise<PrayerRequest[]>;
  getGroupPrayerRequests(groupId: number): Promise<PrayerRequest[]>;
  createPrayerRequest(prayer: InsertPrayerRequest): Promise<PrayerRequest>;
  updatePrayerRequest(id: number, prayer: Partial<InsertPrayerRequest>): Promise<PrayerRequest>;
  markPrayerRequestAsAnswered(id: number, description: string): Promise<PrayerRequest>;
  deletePrayerRequest(id: number): Promise<boolean>;
  
  // Prayer methods
  createPrayer(prayer: InsertPrayer): Promise<Prayer>;
  getPrayersForRequest(prayerRequestId: number): Promise<Prayer[]>;
  getUserPrayedRequests(userId: number): Promise<number[]>;
  createApologeticsResource(resource: InsertApologeticsResource): Promise<ApologeticsResource>;
  
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
  incrementApologeticsQuestionViewCount(id: number): Promise<ApologeticsQuestion>;
  
  getApologeticsAnswersByQuestion(questionId: number): Promise<ApologeticsAnswer[]>;
  createApologeticsAnswer(answer: InsertApologeticsAnswer): Promise<ApologeticsAnswer>;
  upvoteApologeticsAnswer(id: number): Promise<ApologeticsAnswer>;
  
  // Microblog (Twitter-like posts) methods
  getAllMicroblogs(filterType?: string): Promise<Microblog[]>;
  getMicroblog(id: number): Promise<Microblog | undefined>;
  getMicroblogsByUserId(userId: number): Promise<Microblog[]>;
  getMicroblogsByAuthors(userIds: number[]): Promise<Microblog[]>;
  getMicroblogsByCommunityId(communityId: number): Promise<Microblog[]>;
  getMicroblogsByGroupId(groupId: number): Promise<Microblog[]>;
  getMicroblogReplies(microblogId: number): Promise<Microblog[]>;
  createMicroblog(microblog: InsertMicroblog): Promise<Microblog>;
  likeMicroblog(microblogId: number, userId: number): Promise<MicroblogLike>;
  unlikeMicroblog(microblogId: number, userId: number): Promise<boolean>;
  getUserLikedMicroblogs(userId: number): Promise<number[]>; // returns IDs of microblogs user has liked
  
  // Livestream methods
  getLivestreams(status?: string): Promise<Livestream[]>;
  getLivestream(id: number): Promise<Livestream | undefined>;
  createLivestream(livestream: InsertLivestream): Promise<Livestream>;
  updateLivestreamStatus(id: number, status: string): Promise<Livestream>;
  
  // Livestreamer application methods
  getLivestreamerApplicationByUserId(userId: number): Promise<LivestreamerApplication | undefined>;
  getPendingLivestreamerApplications(): Promise<LivestreamerApplication[]>;
  createLivestreamerApplication(application: InsertLivestreamerApplication): Promise<LivestreamerApplication>;
  updateLivestreamerApplication(id: number, status: string, reviewNotes: string, reviewerId: number): Promise<LivestreamerApplication>;
  isApprovedLivestreamer(userId: number): Promise<boolean>;
  
  // Creator tier methods
  getAllCreatorTiers(): Promise<CreatorTier[]>;
  getCreatorTier(id: number): Promise<CreatorTier | undefined>;
  
  // Virtual gift methods
  getActiveVirtualGifts(): Promise<VirtualGift[]>;
  getVirtualGift(id: number): Promise<VirtualGift | undefined>;
  sendGiftToLivestream(gift: { livestreamId: number, giftId: number, senderId: number, receiverId: number, message?: string }): Promise<LivestreamGift>;
  
  // ========================
  // COMMUNITY EVENTS
  // ========================
  getAllEvents(filter?: string): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  getEventsByCommunity(communityId: number): Promise<Event[]>;
  getEventsByGroup(groupId: number): Promise<Event[]>;
  getEventsByUser(userId: number): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, eventData: Partial<Event>): Promise<Event>;
  deleteEvent(id: number): Promise<boolean>;
  
  // Event RSVP methods
  getEventRsvps(eventId: number): Promise<EventRsvp[]>;
  getUserEventRsvp(eventId: number, userId: number): Promise<EventRsvp | undefined>;
  createEventRsvp(rsvp: InsertEventRsvp): Promise<EventRsvp>;
  updateEventRsvp(id: number, status: string): Promise<EventRsvp>;
  
  // ========================
  // PRAYER REQUESTS
  // ========================
  getAllPrayerRequests(filter?: string): Promise<PrayerRequest[]>;
  getPrayerRequest(id: number): Promise<PrayerRequest | undefined>;
  getUserPrayerRequests(userId: number): Promise<PrayerRequest[]>;
  getGroupPrayerRequests(groupId: number): Promise<PrayerRequest[]>;
  getPublicPrayerRequests(): Promise<PrayerRequest[]>;
  createPrayerRequest(request: InsertPrayerRequest): Promise<PrayerRequest>;
  updatePrayerRequest(id: number, data: Partial<PrayerRequest>): Promise<PrayerRequest>;
  markPrayerRequestAsAnswered(id: number, description: string): Promise<PrayerRequest>;
  deletePrayerRequest(id: number): Promise<boolean>;
  
  // Prayer methods (praying for requests)
  getPrayersForRequest(requestId: number): Promise<Prayer[]>;
  createPrayer(prayer: InsertPrayer): Promise<Prayer>;
  getUserPrayedRequests(userId: number): Promise<number[]>; // returns prayer request IDs
  
  // ========================
  // MENTORSHIP PROGRAM
  // ========================
  getAllMentorProfiles(): Promise<MentorProfile[]>;
  getMentorProfile(id: number): Promise<MentorProfile | undefined>;
  getMentorProfileByUserId(userId: number): Promise<MentorProfile | undefined>;
  createMentorProfile(profile: InsertMentorProfile): Promise<MentorProfile>;
  updateMentorProfile(id: number, data: Partial<MentorProfile>): Promise<MentorProfile>;
  
  // Mentorship requests
  getMentorshipRequests(filter: { mentorId?: number, menteeId?: number, status?: string }): Promise<MentorshipRequest[]>;
  getMentorshipRequest(id: number): Promise<MentorshipRequest | undefined>;
  createMentorshipRequest(request: InsertMentorshipRequest): Promise<MentorshipRequest>;
  updateMentorshipRequestStatus(id: number, status: string): Promise<MentorshipRequest>;
  
  // Mentorship relationships
  getMentorshipRelationships(filter: { mentorId?: number, menteeId?: number, isActive?: boolean }): Promise<MentorshipRelationship[]>;
  getMentorshipRelationship(id: number): Promise<MentorshipRelationship | undefined>;
  createMentorshipRelationship(relationship: InsertMentorshipRelationship): Promise<MentorshipRelationship>;
  updateMentorshipRelationship(id: number, data: Partial<MentorshipRelationship>): Promise<MentorshipRelationship>;
  endMentorshipRelationship(id: number): Promise<MentorshipRelationship>;
  
  // ========================
  // BIBLE STUDY TOOLS
  // ========================
  getAllBibleReadingPlans(filter?: string): Promise<BibleReadingPlan[]>;
  getBibleReadingPlan(id: number): Promise<BibleReadingPlan | undefined>;
  getGroupBibleReadingPlans(groupId: number): Promise<BibleReadingPlan[]>;
  getUserBibleReadingPlans(userId: number): Promise<BibleReadingPlan[]>;
  createBibleReadingPlan(plan: InsertBibleReadingPlan): Promise<BibleReadingPlan>;
  updateBibleReadingPlan(id: number, data: Partial<BibleReadingPlan>): Promise<BibleReadingPlan>;
  deleteBibleReadingPlan(id: number): Promise<boolean>;
  
  // Bible reading progress
  getBibleReadingProgress(userId: number, planId: number): Promise<BibleReadingProgress | undefined>;
  getUserReadingProgress(userId: number): Promise<BibleReadingProgress[]>;
  createBibleReadingProgress(progress: InsertBibleReadingProgress): Promise<BibleReadingProgress>;
  updateBibleReadingProgress(id: number, data: Partial<BibleReadingProgress>): Promise<BibleReadingProgress>;
  markDayCompleted(progressId: number, day: number): Promise<BibleReadingProgress>;
  
  // Bible study notes
  getBibleStudyNotes(filter: { userId?: number, groupId?: number, isPublic?: boolean }): Promise<BibleStudyNote[]>;
  getBibleStudyNote(id: number): Promise<BibleStudyNote | undefined>;
  createBibleStudyNote(note: InsertBibleStudyNote): Promise<BibleStudyNote>;
  updateBibleStudyNote(id: number, data: Partial<BibleStudyNote>): Promise<BibleStudyNote>;
  deleteBibleStudyNote(id: number): Promise<boolean>;
  
  // Verse memorization
  getUserVerseMemorization(userId: number): Promise<VerseMemorization[]>;
  getVerseMemorization(id: number): Promise<VerseMemorization | undefined>;
  createVerseMemorization(verseMemorization: InsertVerseMemorization): Promise<VerseMemorization>;
  updateVerseMemorization(id: number, data: Partial<VerseMemorization>): Promise<VerseMemorization>;
  markVerseMastered(id: number): Promise<VerseMemorization>;
  addVerseReviewDate(id: number, date: Date): Promise<VerseMemorization>;
  deleteVerseMemorization(id: number): Promise<boolean>;
  
  // ========================
  // COMMUNITY CHALLENGES
  // ========================
  getAllChallenges(filter?: string): Promise<Challenge[]>;
  getChallenge(id: number): Promise<Challenge | undefined>;
  getChallengesByCommunity(communityId: number): Promise<Challenge[]>;
  getChallengesByGroup(groupId: number): Promise<Challenge[]>;
  getActiveChallenges(): Promise<Challenge[]>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  updateChallenge(id: number, data: Partial<Challenge>): Promise<Challenge>;
  deleteChallenge(id: number): Promise<boolean>;
  
  // Challenge participants
  getChallengeParticipants(challengeId: number): Promise<ChallengeParticipant[]>;
  getUserChallenges(userId: number): Promise<{ challenge: Challenge, participant: ChallengeParticipant }[]>;
  joinChallenge(participant: InsertChallengeParticipant): Promise<ChallengeParticipant>;
  updateChallengeProgress(participantId: number, progress: Record<string, any>): Promise<ChallengeParticipant>;
  completeChallenge(participantId: number): Promise<ChallengeParticipant>;
  leaveChallenge(participantId: number): Promise<boolean>;
  
  // Challenge testimonials
  getChallengeTestimonials(challengeId: number): Promise<ChallengeTestimonial[]>;
  getUserChallengeTestimonial(challengeId: number, userId: number): Promise<ChallengeTestimonial | undefined>;
  createChallengeTestimonial(testimonial: InsertChallengeTestimonial): Promise<ChallengeTestimonial>;
  updateChallengeTestimonial(id: number, content: string): Promise<ChallengeTestimonial>;
  deleteChallengeTestimonial(id: number): Promise<boolean>;
  
  // ========================
  // RESOURCE SHARING
  // ========================
  getAllResources(filter?: string): Promise<Resource[]>;
  getResource(id: number): Promise<Resource | undefined>;
  getResourcesByType(type: string): Promise<Resource[]>;
  getResourcesByTags(tags: string[]): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: number, data: Partial<Resource>): Promise<Resource>;
  deleteResource(id: number): Promise<boolean>;
  
  // Resource ratings
  getResourceRatings(resourceId: number): Promise<ResourceRating[]>;
  getUserResourceRating(resourceId: number, userId: number): Promise<ResourceRating | undefined>;
  createResourceRating(rating: InsertResourceRating): Promise<ResourceRating>;
  updateResourceRating(id: number, data: Partial<ResourceRating>): Promise<ResourceRating>;
  deleteResourceRating(id: number): Promise<boolean>;
  
  // Resource collections
  getAllResourceCollections(isPublic?: boolean): Promise<ResourceCollection[]>;
  getUserResourceCollections(userId: number): Promise<ResourceCollection[]>;
  getResourceCollection(id: number): Promise<ResourceCollection | undefined>;
  createResourceCollection(collection: InsertResourceCollection): Promise<ResourceCollection>;
  updateResourceCollection(id: number, data: Partial<ResourceCollection>): Promise<ResourceCollection>;
  deleteResourceCollection(id: number): Promise<boolean>;
  
  // Collection resources
  getCollectionResources(collectionId: number): Promise<Resource[]>;
  addResourceToCollection(collectionResource: InsertCollectionResource): Promise<CollectionResource>;
  removeResourceFromCollection(collectionId: number, resourceId: number): Promise<boolean>;
  
  // ========================
  // COMMUNITY SERVICE
  // ========================
  getAllServiceProjects(filter?: string): Promise<ServiceProject[]>;
  getServiceProject(id: number): Promise<ServiceProject | undefined>;
  getServiceProjectsByCommunity(communityId: number): Promise<ServiceProject[]>;
  getServiceProjectsByGroup(groupId: number): Promise<ServiceProject[]>;
  getUpcomingServiceProjects(): Promise<ServiceProject[]>;
  createServiceProject(project: InsertServiceProject): Promise<ServiceProject>;
  updateServiceProject(id: number, data: Partial<ServiceProject>): Promise<ServiceProject>;
  deleteServiceProject(id: number): Promise<boolean>;
  
  // Service volunteers
  getServiceVolunteers(projectId: number): Promise<ServiceVolunteer[]>;
  getUserServiceProjects(userId: number): Promise<{ project: ServiceProject, volunteer: ServiceVolunteer }[]>;
  signUpForProject(volunteer: InsertServiceVolunteer): Promise<ServiceVolunteer>;
  updateVolunteerStatus(id: number, status: string, hoursServed?: number): Promise<ServiceVolunteer>;
  removeVolunteerFromProject(id: number): Promise<boolean>;
  
  // Service testimonials
  getServiceTestimonials(projectId: number): Promise<ServiceTestimonial[]>;
  getUserServiceTestimonial(projectId: number, userId: number): Promise<ServiceTestimonial | undefined>;
  createServiceTestimonial(testimonial: InsertServiceTestimonial): Promise<ServiceTestimonial>;
  updateServiceTestimonial(id: number, data: Partial<ServiceTestimonial>): Promise<ServiceTestimonial>;
  deleteServiceTestimonial(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: any; // Using any to avoid typing issues with session store
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private communities: Map<number, Community>;
  private posts: Map<number, Post>;
  private comments: Map<number, Comment>;
  private groups: Map<number, Group>;
  private groupMembers: Map<number, GroupMember>;
  private apologeticsResources: Map<number, ApologeticsResource>;
  private prayerRequests: Map<number, PrayerRequest>;
  private prayers: Map<number, Prayer>;
  
  private userIdCounter: number;
  private communityIdCounter: number;
  private postIdCounter: number;
  private commentIdCounter: number;
  private groupIdCounter: number;
  private groupMemberIdCounter: number;
  private apologeticsResourceIdCounter: number;
  private prayerRequestIdCounter: number;
  private prayerIdCounter: number;
  
  sessionStore: any;

  constructor() {
    this.users = new Map();
    this.communities = new Map();
    this.posts = new Map();
    this.comments = new Map();
    this.groups = new Map();
    this.groupMembers = new Map();
    this.prayerRequests = new Map();
    this.prayers = new Map();
    this.apologeticsResources = new Map();
    
    this.userIdCounter = 1;
    this.communityIdCounter = 1;
    this.postIdCounter = 1;
    this.commentIdCounter = 1;
    this.groupIdCounter = 1;
    this.groupMemberIdCounter = 1;
    this.apologeticsResourceIdCounter = 1;
    this.prayerRequestIdCounter = 1;
    this.prayerIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    // Sample communities
    this.createCommunity({
      name: "Prayer Requests",
      description: "Share your prayer requests and pray for others in the community.",
      slug: "prayer-requests",
      iconName: "pray",
      iconColor: "primary",
      createdBy: 1
    });
    
    this.createCommunity({
      name: "Bible Study",
      description: "Discuss and study the Bible together with fellow believers.",
      slug: "bible-study",
      iconName: "book",
      iconColor: "secondary",
      createdBy: 1
    });
    
    this.createCommunity({
      name: "Theology",
      description: "Dive deep into theological discussions and doctrinal topics.",
      slug: "theology",
      iconName: "church",
      iconColor: "accent",
      createdBy: 1
    });
    
    this.createCommunity({
      name: "Christian Life",
      description: "Share experiences and advice about living as a Christian in today's world.",
      slug: "christian-life",
      iconName: "heart",
      iconColor: "red",
      createdBy: 1
    });
    
    // Sample apologetics resources
    this.createApologeticsResource({
      title: "Introduction to Christian Apologetics",
      description: "A beginner's guide to defending the faith with reason and evidence.",
      type: "book",
      iconName: "book-reader",
      url: "#"
    });
    
    this.createApologeticsResource({
      title: "Responding to Common Objections",
      description: "Learn how to address common challenges to the Christian faith.",
      type: "video",
      iconName: "video",
      url: "#"
    });
    
    this.createApologeticsResource({
      title: "Faith in a Skeptical World",
      description: "A podcast exploring faith in a world of doubt and questioning.",
      type: "podcast",
      iconName: "headphones",
      url: "#"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  // Community methods
  async getAllCommunities(): Promise<Community[]> {
    return Array.from(this.communities.values());
  }

  async getCommunity(id: number): Promise<Community | undefined> {
    return this.communities.get(id);
  }

  async getCommunityBySlug(slug: string): Promise<Community | undefined> {
    return Array.from(this.communities.values()).find(
      (community) => community.slug === slug,
    );
  }

  async createCommunity(insertCommunity: InsertCommunity): Promise<Community> {
    const id = this.communityIdCounter++;
    const now = new Date();
    const community: Community = {
      ...insertCommunity,
      id,
      memberCount: 0,
      createdAt: now
    };
    this.communities.set(id, community);
    return community;
  }

  // Post methods
  async getAllPosts(filter: string = "popular"): Promise<Post[]> {
    const posts = Array.from(this.posts.values());
    
    if (filter === "latest") {
      return posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else if (filter === "top") {
      return posts.sort((a, b) => b.upvotes - a.upvotes);
    } else {
      // Default: popular - combination of recency and upvotes
      return posts.sort((a, b) => {
        const aScore = a.upvotes + (Date.now() - a.createdAt.getTime()) / 86400000;
        const bScore = b.upvotes + (Date.now() - b.createdAt.getTime()) / 86400000;
        return bScore - aScore;
      });
    }
  }

  async getPost(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }

  async getPostsByCommunitySlug(communitySlug: string, filter: string = "popular"): Promise<Post[]> {
    const community = await this.getCommunityBySlug(communitySlug);
    if (!community) return [];
    
    const posts = Array.from(this.posts.values()).filter(
      (post) => post.communityId === community.id
    );
    
    if (filter === "latest") {
      return posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else if (filter === "top") {
      return posts.sort((a, b) => b.upvotes - a.upvotes);
    } else {
      // Default: popular
      return posts.sort((a, b) => {
        const aScore = a.upvotes + (Date.now() - a.createdAt.getTime()) / 86400000;
        const bScore = b.upvotes + (Date.now() - b.createdAt.getTime()) / 86400000;
        return bScore - aScore;
      });
    }
  }

  async getPostsByGroupId(groupId: number, filter: string = "popular"): Promise<Post[]> {
    const posts = Array.from(this.posts.values()).filter(
      (post) => post.groupId === groupId
    );
    
    if (filter === "latest") {
      return posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else if (filter === "top") {
      return posts.sort((a, b) => b.upvotes - a.upvotes);
    } else {
      // Default: popular
      return posts.sort((a, b) => {
        const aScore = a.upvotes + (Date.now() - a.createdAt.getTime()) / 86400000;
        const bScore = b.upvotes + (Date.now() - b.createdAt.getTime()) / 86400000;
        return bScore - aScore;
      });
    }
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const id = this.postIdCounter++;
    const now = new Date();
    const post: Post = {
      ...insertPost,
      id,
      upvotes: 0,
      commentCount: 0,
      createdAt: now
    };
    this.posts.set(id, post);
    return post;
  }

  async upvotePost(id: number): Promise<Post> {
    const post = this.posts.get(id);
    if (!post) {
      throw new Error("Post not found");
    }
    
    const updatedPost = { ...post, upvotes: post.upvotes + 1 };
    this.posts.set(id, updatedPost);
    return updatedPost;
  }

  // Comment methods
  async getComment(id: number): Promise<Comment | undefined> {
    return this.comments.get(id);
  }

  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter((comment) => comment.postId === postId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.commentIdCounter++;
    const now = new Date();
    const comment: Comment = {
      ...insertComment,
      id,
      upvotes: 0,
      createdAt: now
    };
    this.comments.set(id, comment);
    
    // Update post comment count
    const post = this.posts.get(insertComment.postId);
    if (post) {
      const updatedPost = { ...post, commentCount: post.commentCount + 1 };
      this.posts.set(post.id, updatedPost);
    }
    
    return comment;
  }

  async upvoteComment(id: number): Promise<Comment> {
    const comment = this.comments.get(id);
    if (!comment) {
      throw new Error("Comment not found");
    }
    
    const updatedComment = { ...comment, upvotes: comment.upvotes + 1 };
    this.comments.set(id, updatedComment);
    return updatedComment;
  }

  // Group methods
  async getGroup(id: number): Promise<Group | undefined> {
    return this.groups.get(id);
  }

  async getGroupsByUserId(userId: number): Promise<Group[]> {
    // Get all group memberships for this user
    const memberships = Array.from(this.groupMembers.values())
      .filter((member) => member.userId === userId);
    
    // Get the groups
    const groupIds = memberships.map((member) => member.groupId);
    return Array.from(this.groups.values())
      .filter((group) => groupIds.includes(group.id));
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const id = this.groupIdCounter++;
    const now = new Date();
    const group: Group = {
      ...insertGroup,
      id,
      createdAt: now
    };
    this.groups.set(id, group);
    return group;
  }

  // Group member methods
  async addGroupMember(insertMember: InsertGroupMember): Promise<GroupMember> {
    const id = this.groupMemberIdCounter++;
    const now = new Date();
    const member: GroupMember = {
      ...insertMember,
      id,
      joinedAt: now
    };
    this.groupMembers.set(id, member);
    return member;
  }

  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return Array.from(this.groupMembers.values())
      .filter((member) => member.groupId === groupId);
  }

  async isGroupAdmin(groupId: number, userId: number): Promise<boolean> {
    const member = Array.from(this.groupMembers.values()).find(
      (m) => m.groupId === groupId && m.userId === userId
    );
    return member ? member.isAdmin : false;
  }

  // Apologetics resource methods
  async getAllApologeticsResources(): Promise<ApologeticsResource[]> {
    return Array.from(this.apologeticsResources.values());
  }

  async getApologeticsResource(id: number): Promise<ApologeticsResource | undefined> {
    return this.apologeticsResources.get(id);
  }

  async createApologeticsResource(insertResource: InsertApologeticsResource): Promise<ApologeticsResource> {
    const id = this.apologeticsResourceIdCounter++;
    const now = new Date();
    const resource: ApologeticsResource = {
      ...insertResource,
      id,
      createdAt: now
    };
    this.apologeticsResources.set(id, resource);
    return resource;
  }

  // Prayer request methods
  async getPublicPrayerRequests(): Promise<PrayerRequest[]> {
    return Array.from(this.prayerRequests.values())
      .filter(prayer => prayer.privacyLevel === 'public')
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }
  
  async getAllPrayerRequests(filter?: string): Promise<PrayerRequest[]> {
    let prayers = Array.from(this.prayerRequests.values());
    
    // Apply filtering if provided
    if (filter === 'answered') {
      prayers = prayers.filter(prayer => prayer.isAnswered === true);
    } else if (filter === 'unanswered') {
      prayers = prayers.filter(prayer => prayer.isAnswered !== true);
    }
    
    return prayers.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }
  
  async getPrayerRequest(id: number): Promise<PrayerRequest | undefined> {
    return this.prayerRequests.get(id);
  }
  
  async getUserPrayerRequests(userId: number): Promise<PrayerRequest[]> {
    return Array.from(this.prayerRequests.values())
      .filter(prayer => prayer.authorId === userId)
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }
  
  async getGroupPrayerRequests(groupId: number): Promise<PrayerRequest[]> {
    return Array.from(this.prayerRequests.values())
      .filter(prayer => prayer.groupId === groupId)
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }
  
  async createPrayerRequest(prayer: InsertPrayerRequest): Promise<PrayerRequest> {
    const id = this.prayerRequestIdCounter++;
    const createdAt = new Date();
    const newPrayer: PrayerRequest = {
      id,
      createdAt,
      updatedAt: null,
      prayerCount: 0,
      isAnswered: false,
      answeredDescription: null,
      ...prayer
    };
    this.prayerRequests.set(id, newPrayer);
    return newPrayer;
  }
  
  async updatePrayerRequest(id: number, data: Partial<PrayerRequest>): Promise<PrayerRequest> {
    const prayer = this.prayerRequests.get(id);
    if (!prayer) {
      throw new Error(`Prayer request with ID ${id} not found`);
    }
    
    const updatedPrayer = {
      ...prayer,
      ...data,
      updatedAt: new Date()
    };
    
    this.prayerRequests.set(id, updatedPrayer);
    return updatedPrayer;
  }
  
  async markPrayerRequestAsAnswered(id: number, answeredDescription: string): Promise<PrayerRequest> {
    const prayer = this.prayerRequests.get(id);
    if (!prayer) {
      throw new Error(`Prayer request with ID ${id} not found`);
    }
    
    const updatedPrayer = {
      ...prayer,
      isAnswered: true,
      answeredDescription,
      updatedAt: new Date()
    };
    
    this.prayerRequests.set(id, updatedPrayer);
    return updatedPrayer;
  }
  
  async deletePrayerRequest(id: number): Promise<boolean> {
    return this.prayerRequests.delete(id);
  }
  
  async createPrayer(prayer: InsertPrayer): Promise<Prayer> {
    const id = this.prayerIdCounter++;
    const createdAt = new Date();
    const newPrayer: Prayer = {
      id,
      createdAt,
      ...prayer
    };
    
    this.prayers.set(id, newPrayer);
    
    // Update the prayer count on the request
    const prayerRequest = this.prayerRequests.get(prayer.prayerRequestId);
    if (prayerRequest) {
      const prayerCount = (prayerRequest.prayerCount || 0) + 1;
      this.prayerRequests.set(prayerRequest.id, {
        ...prayerRequest,
        prayerCount
      });
    }
    
    return newPrayer;
  }
  
  async getPrayersForRequest(prayerRequestId: number): Promise<Prayer[]> {
    return Array.from(this.prayers.values())
      .filter(prayer => prayer.prayerRequestId === prayerRequestId)
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }
  
  async getUserPrayedRequests(userId: number): Promise<number[]> {
    return Array.from(this.prayers.values())
      .filter(prayer => prayer.userId === userId)
      .map(prayer => prayer.prayerRequestId);
  }

  // Helper method to check if a user is member of a group
  async isGroupMember(userId: number, groupId: number): Promise<boolean> {
    return Array.from(this.groupMembers.values())
      .some(member => member.userId === userId && member.groupId === groupId);
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    // Initialize the PostgreSQL session store
    this.sessionStore = new PostgresSessionStore({
      tableName: 'sessions',
      createTableIfMissing: true,
      pool: pool
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // Community methods
  async getAllCommunities(): Promise<Community[]> {
    return await db.select().from(communities);
  }

  async getCommunity(id: number): Promise<Community | undefined> {
    const result = await db.select().from(communities).where(eq(communities.id, id)).limit(1);
    return result[0];
  }

  async getCommunityBySlug(slug: string): Promise<Community | undefined> {
    const result = await db.select().from(communities).where(eq(communities.slug, slug)).limit(1);
    return result[0];
  }

  async createCommunity(community: InsertCommunity): Promise<Community> {
    const result = await db.insert(communities).values(community).returning();
    return result[0];
  }

  // Post methods
  async getAllPosts(filter: string = "popular"): Promise<Post[]> {
    let query = db.select().from(posts);
    
    if (filter === "latest") {
      query = query.orderBy(desc(posts.createdAt));
    } else if (filter === "top") {
      query = query.orderBy(desc(posts.upvotes));
    } else {
      // Default "popular" - use a combination of time and upvotes
      // We'll simplify this for now to be the same as "top"
      query = query.orderBy(desc(posts.upvotes));
    }
    
    return await query;
  }

  async getPost(id: number): Promise<Post | undefined> {
    const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    return result[0];
  }

  async getPostsByCommunitySlug(communitySlug: string, filter: string = "popular"): Promise<Post[]> {
    const community = await this.getCommunityBySlug(communitySlug);
    if (!community) return [];
    
    let query = db.select().from(posts).where(eq(posts.communityId, community.id));
    
    if (filter === "latest") {
      query = query.orderBy(desc(posts.createdAt));
    } else if (filter === "top") {
      query = query.orderBy(desc(posts.upvotes));
    } else {
      // Default "popular"
      query = query.orderBy(desc(posts.upvotes));
    }
    
    return await query;
  }

  async getPostsByGroupId(groupId: number, filter: string = "popular"): Promise<Post[]> {
    let query = db.select().from(posts).where(eq(posts.groupId, groupId));
    
    if (filter === "latest") {
      query = query.orderBy(desc(posts.createdAt));
    } else if (filter === "top") {
      query = query.orderBy(desc(posts.upvotes));
    } else {
      // Default "popular"
      query = query.orderBy(desc(posts.upvotes));
    }
    
    return await query;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const result = await db.insert(posts).values(post).returning();
    return result[0];
  }

  async upvotePost(id: number): Promise<Post> {
    const post = await this.getPost(id);
    if (!post) {
      throw new Error("Post not found");
    }
    
    const result = await db
      .update(posts)
      .set({ upvotes: (post.upvotes || 0) + 1 })
      .where(eq(posts.id, id))
      .returning();
    
    return result[0];
  }

  // Comment methods
  async getComment(id: number): Promise<Comment | undefined> {
    const result = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
    return result[0];
  }

  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const result = await db.insert(comments).values(comment).returning();
    
    // Update the post comment count
    await db
      .update(posts)
      .set({ 
        commentCount: sql`${posts.commentCount} + 1` 
      })
      .where(eq(posts.id, comment.postId));
    
    return result[0];
  }

  async upvoteComment(id: number): Promise<Comment> {
    const comment = await this.getComment(id);
    if (!comment) {
      throw new Error("Comment not found");
    }
    
    const result = await db
      .update(comments)
      .set({ upvotes: (comment.upvotes || 0) + 1 })
      .where(eq(comments.id, id))
      .returning();
    
    return result[0];
  }

  // Group methods
  async getGroup(id: number): Promise<Group | undefined> {
    const result = await db.select().from(groups).where(eq(groups.id, id)).limit(1);
    return result[0];
  }

  async getGroupsByUserId(userId: number): Promise<Group[]> {
    // Get groups where the user is a member
    const memberGroupIds = await db
      .select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(eq(groupMembers.userId, userId));
    
    if (memberGroupIds.length === 0) return [];
    
    const groupIds = memberGroupIds.map(g => g.groupId);
    
    // We can't use SQL "IN" easily in drizzle, so we'll fetch all groups and filter
    const allGroups = await db.select().from(groups);
    return allGroups.filter(group => groupIds.includes(group.id));
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const result = await db.insert(groups).values(group).returning();
    return result[0];
  }

  // Group member methods
  async addGroupMember(member: InsertGroupMember): Promise<GroupMember> {
    const result = await db.insert(groupMembers).values(member).returning();
    return result[0];
  }

  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId));
  }

  async isGroupAdmin(groupId: number, userId: number): Promise<boolean> {
    const result = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, userId),
          eq(groupMembers.isAdmin, true)
        )
      )
      .limit(1);
    
    return result.length > 0;
  }

  // Apologetics resource methods
  async getAllApologeticsResources(): Promise<ApologeticsResource[]> {
    return await db.select().from(apologeticsResources);
  }

  async getApologeticsResource(id: number): Promise<ApologeticsResource | undefined> {
    const result = await db.select().from(apologeticsResources).where(eq(apologeticsResources.id, id)).limit(1);
    return result[0];
  }

  async createApologeticsResource(resource: InsertApologeticsResource): Promise<ApologeticsResource> {
    const result = await db.insert(apologeticsResources).values(resource).returning();
    return result[0];
  }

  // Microblog methods implementation
  async getAllMicroblogs(filterType: string = "recent"): Promise<Microblog[]> {
    // Public microblogs only (not assigned to a community or group)
    const query = db.select().from(microblogs).where(
      and(
        isNull(microblogs.communityId),
        isNull(microblogs.groupId)
      )
    );
    
    if (filterType === "popular") {
      return await query.orderBy(desc(microblogs.likeCount));
    } else {
      // Default to recent
      return await query.orderBy(desc(microblogs.createdAt));
    }
  }
  
  async getMicroblog(id: number): Promise<Microblog | undefined> {
    const result = await db.select().from(microblogs).where(eq(microblogs.id, id)).limit(1);
    return result[0];
  }
  
  async getMicroblogsByUserId(userId: number): Promise<Microblog[]> {
    return await db
      .select()
      .from(microblogs)
      .where(eq(microblogs.authorId, userId))
      .orderBy(desc(microblogs.createdAt));
  }
  
  async getMicroblogsByAuthors(userIds: number[]): Promise<Microblog[]> {
    if (userIds.length === 0) return [];
    
    return await db
      .select()
      .from(microblogs)
      .where(inArray(microblogs.authorId, userIds))
      .orderBy(desc(microblogs.createdAt));
  }
  
  async getMicroblogsByCommunityId(communityId: number): Promise<Microblog[]> {
    return await db
      .select()
      .from(microblogs)
      .where(eq(microblogs.communityId, communityId))
      .orderBy(desc(microblogs.createdAt));
  }
  
  async getMicroblogsByGroupId(groupId: number): Promise<Microblog[]> {
    return await db
      .select()
      .from(microblogs)
      .where(eq(microblogs.groupId, groupId))
      .orderBy(desc(microblogs.createdAt));
  }
  
  async getMicroblogReplies(microblogId: number): Promise<Microblog[]> {
    return await db
      .select()
      .from(microblogs)
      .where(eq(microblogs.parentId, microblogId))
      .orderBy(desc(microblogs.createdAt));
  }
  
  async createMicroblog(microblog: InsertMicroblog): Promise<Microblog> {
    // For replies, increment reply count of the parent
    if (microblog.parentId) {
      const parent = await this.getMicroblog(microblog.parentId);
      const result = await db.insert(microblogs).values(microblog).returning();
      
      // Update parent's reply count if it exists
      if (parent) {
        await db
          .update(microblogs)
          .set({ replyCount: (parent.replyCount || 0) + 1 })
          .where(eq(microblogs.id, microblog.parentId));
      }
      
      return result[0];
    } else {
      // Simple insert for new microblogs
      const result = await db.insert(microblogs).values(microblog).returning();
      return result[0];
    }
  }
  
  async likeMicroblog(microblogId: number, userId: number): Promise<MicroblogLike> {
    // Check if already liked
    const existing = await db
      .select()
      .from(microblogLikes)
      .where(
        and(
          eq(microblogLikes.microblogId, microblogId),
          eq(microblogLikes.userId, userId)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    // Add the like
    const result = await db
      .insert(microblogLikes)
      .values({ microblogId, userId })
      .returning();
    
    // Increment the like count on the microblog
    const microblog = await this.getMicroblog(microblogId);
    if (microblog) {
      await db
        .update(microblogs)
        .set({ likeCount: (microblog.likeCount || 0) + 1 })
        .where(eq(microblogs.id, microblogId));
    }
    
    return result[0];
  }
  
  async unlikeMicroblog(microblogId: number, userId: number): Promise<boolean> {
    // Find and delete the like
    const result = await db
      .delete(microblogLikes)
      .where(
        and(
          eq(microblogLikes.microblogId, microblogId),
          eq(microblogLikes.userId, userId)
        )
      )
      .returning();
    
    if (result.length === 0) return false;
    
    // Decrement the like count on the microblog
    const microblog = await this.getMicroblog(microblogId);
    if (microblog && microblog.likeCount && microblog.likeCount > 0) {
      await db
        .update(microblogs)
        .set({ likeCount: microblog.likeCount - 1 })
        .where(eq(microblogs.id, microblogId));
    }
    
    return true;
  }
  
  async getUserLikedMicroblogs(userId: number): Promise<number[]> {
    const likes = await db
      .select()
      .from(microblogLikes)
      .where(eq(microblogLikes.userId, userId));
    
    return likes.map(like => like.microblogId);
  }
}

// Replace MemStorage with DatabaseStorage
export const storage = new DatabaseStorage();
