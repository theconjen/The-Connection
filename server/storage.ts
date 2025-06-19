import { 
  User, InsertUser, 
  Community, InsertCommunity,
  CommunityMember, InsertCommunityMember,
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
  CreatorTier, VirtualGift, LivestreamGift,
  Microblog, InsertMicroblog,
  MicroblogLike, InsertMicroblogLike,
  UserPreferences, InsertUserPreferences,
  ContentRecommendation, InsertContentRecommendation,
  
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
  users, communities, communityMembers, communityChatRooms, chatMessages, communityWallPosts,
  posts, comments, groups, groupMembers, apologeticsResources, 
  livestreams, microblogs, microblogLikes,
  apologeticsTopics, apologeticsQuestions, apologeticsAnswers,
  events, eventRsvps, prayerRequests, prayers,
  mentorProfiles, mentorshipRequests, mentorshipRelationships,
  bibleReadingPlans, bibleReadingProgress, bibleStudyNotes, verseMemorization,
  challenges, challengeParticipants, challengeTestimonials,
  resources, resourceRatings, resourceCollections, collectionResources,
  serviceProjects, serviceVolunteers, serviceTestimonials,
  // Recommendation system
  userPreferences, contentRecommendations
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, or, desc, SQL, sql, inArray, isNull } from "drizzle-orm";
import { pool } from './db';

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  updateUserPreferences(userId: number, preferences: Partial<UserPreferences>): Promise<UserPreferences>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(userId: number, hashedPassword: string): Promise<User | undefined>;
  setVerifiedApologeticsAnswerer(userId: number, isVerified: boolean): Promise<User>;
  getVerifiedApologeticsAnswerers(): Promise<User[]>;
  
  // Community methods
  getAllCommunities(): Promise<Community[]>;
  getCommunity(id: number): Promise<Community | undefined>;
  getCommunityBySlug(slug: string): Promise<Community | undefined>;
  createCommunity(community: InsertCommunity): Promise<Community>;
  updateCommunity(id: number, community: Partial<Community>): Promise<Community>;
  deleteCommunity(id: number): Promise<boolean>;
  
  // Community Members & Roles
  getCommunityMembers(communityId: number): Promise<(CommunityMember & { user: User })[]>;
  getCommunityMember(communityId: number, userId: number): Promise<CommunityMember | undefined>;
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
  
  // Apologist Scholar application methods
  getApologistScholarApplicationByUserId(userId: number): Promise<ApologistScholarApplication | undefined>;
  getPendingApologistScholarApplications(): Promise<ApologistScholarApplication[]>;
  createApologistScholarApplication(application: InsertApologistScholarApplication): Promise<ApologistScholarApplication>;
  updateApologistScholarApplication(id: number, status: string, reviewNotes: string, reviewerId: number): Promise<ApologistScholarApplication>;
  isApprovedApologistScholar(userId: number): Promise<boolean>;
  
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
  getPublicEvents(): Promise<Event[]>;
  getEventsNearby(latitude: string, longitude: string, radiusInKm: number): Promise<Event[]>;
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
  
  // Event methods
  getAllEvents(filter?: string): Promise<Event[]>;
  getPublicEvents(): Promise<Event[]>;
  getEventsNearby(latitude: string, longitude: string, radiusInKm: number): Promise<Event[]>;
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
  // CONTENT RECOMMENDATIONS
  // ========================
  // Session store
  sessionStore: any; // Using any to avoid typing issues with session store
  
  // Content Recommendation methods
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  updateUserPreferences(userId: number, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences>;
  getAllRecommendations(userId: number): Promise<ContentRecommendation[]>;
  getRecommendation(id: number): Promise<ContentRecommendation | undefined>;
  addContentRecommendation(recommendation: InsertContentRecommendation): Promise<ContentRecommendation>;
  markRecommendationAsViewed(id: number): Promise<boolean>;
  
  // Content retrieval for recommendations
  getTopPosts(limit: number): Promise<Post[]>;
  getTopMicroblogs(limit: number): Promise<Microblog[]>;
  getUpcomingEvents(limit: number): Promise<Event[]>;
  getPrayerRequestsVisibleToUser(userId: number): Promise<PrayerRequest[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private communities: Map<number, Community>;
  private communityMembers: Map<number, CommunityMember>;
  private communityChatRooms: Map<number, CommunityChatRoom>;
  private chatMessages: Map<number, ChatMessage>;
  private communityWallPosts: Map<number, CommunityWallPost>;
  private posts: Map<number, Post>;
  private comments: Map<number, Comment>;
  private groups: Map<number, Group>;
  private groupMembers: Map<number, GroupMember>;
  private userPreferences: Map<number, UserPreferences>;
  private contentRecommendations: Map<number, ContentRecommendation>;
  private apologeticsResources: Map<number, ApologeticsResource>;
  private prayerRequests: Map<number, PrayerRequest>;
  private prayers: Map<number, Prayer>;
  private events: Map<number, Event>;
  private eventRsvps: Map<number, EventRsvp>;
  
  private userIdCounter: number;
  private communityIdCounter: number;
  private communityMemberIdCounter: number;
  private communityChatRoomIdCounter: number;
  private chatMessageIdCounter: number;
  private communityWallPostIdCounter: number;
  private postIdCounter: number;
  private commentIdCounter: number;
  private groupIdCounter: number;
  private groupMemberIdCounter: number;
  private apologeticsResourceIdCounter: number;
  private prayerRequestIdCounter: number;
  private prayerIdCounter: number;
  private eventIdCounter: number;
  private eventRsvpIdCounter: number;
  private userPreferencesIdCounter: number;
  private contentRecommendationIdCounter: number;
  
  sessionStore: any;

  constructor() {
    this.users = new Map();
    this.communities = new Map();
    this.communityMembers = new Map();
    this.communityChatRooms = new Map();
    this.chatMessages = new Map();
    this.communityWallPosts = new Map();
    this.posts = new Map();
    this.comments = new Map();
    this.groups = new Map();
    this.groupMembers = new Map();
    this.prayerRequests = new Map();
    this.prayers = new Map();
    this.userPreferences = new Map();
    this.contentRecommendations = new Map();
    this.apologeticsResources = new Map();
    this.events = new Map();
    this.eventRsvps = new Map();
    
    this.userIdCounter = 1;
    this.communityIdCounter = 1;
    this.communityMemberIdCounter = 1;
    this.communityChatRoomIdCounter = 1;
    this.chatMessageIdCounter = 1;
    this.communityWallPostIdCounter = 1;
    this.postIdCounter = 1;
    this.commentIdCounter = 1;
    this.groupIdCounter = 1;
    this.groupMemberIdCounter = 1;
    this.apologeticsResourceIdCounter = 1;
    this.prayerRequestIdCounter = 1;
    this.prayerIdCounter = 1;
    this.eventIdCounter = 1;
    this.eventRsvpIdCounter = 1;
    this.userPreferencesIdCounter = 1;
    this.contentRecommendationIdCounter = 1;
    
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
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    // Update user data
    const updatedUser = {
      ...user,
      ...userData,
      updatedAt: new Date()
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserPreferences(userId: number, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    // Get existing preferences or create new ones
    let userPrefs = Array.from(this.userPreferences.values()).find(p => p.userId === userId);
    
    if (userPrefs) {
      // Update existing preferences
      userPrefs = {
        ...userPrefs,
        ...preferences,
        updatedAt: new Date()
      };
    } else {
      // Create new preferences
      const id = Math.max(0, ...Array.from(this.userPreferences.values()).map(p => p.id || 0)) + 1;
      userPrefs = {
        id,
        userId,
        createdAt: new Date(),
        ...preferences
      };
    }
    
    this.userPreferences.set(userPrefs.id, userPrefs);
    return userPrefs;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) {
      return undefined;
    }
    
    const updatedUser = {
      ...user,
      ...userData,
      updatedAt: new Date()
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
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
      createdAt: now,
      hasPrivateWall: insertCommunity.hasPrivateWall || false,
      hasPublicWall: insertCommunity.hasPublicWall !== false // default to true if not specified
    };
    this.communities.set(id, community);
    return community;
  }
  
  async updateCommunity(id: number, communityData: Partial<Community>): Promise<Community> {
    const community = await this.getCommunity(id);
    if (!community) {
      throw new Error(`Community with ID ${id} not found`);
    }
    
    const updatedCommunity = {
      ...community,
      ...communityData
    };
    
    this.communities.set(id, updatedCommunity);
    return updatedCommunity;
  }
  
  async deleteCommunity(id: number): Promise<boolean> {
    const exists = this.communities.has(id);
    if (exists) {
      // Delete all related data
      // 1. Delete community members
      const communityMembers = Array.from(this.communityMembers.values())
        .filter(member => member.communityId === id);
      for (const member of communityMembers) {
        this.communityMembers.delete(member.id);
      }
      
      // 2. Delete chat rooms and their messages
      const chatRooms = Array.from(this.communityChatRooms.values())
        .filter(room => room.communityId === id);
      for (const room of chatRooms) {
        const messages = Array.from(this.chatMessages.values())
          .filter(msg => msg.chatRoomId === room.id);
        for (const message of messages) {
          this.chatMessages.delete(message.id);
        }
        this.communityChatRooms.delete(room.id);
      }
      
      // 3. Delete wall posts
      const wallPosts = Array.from(this.communityWallPosts.values())
        .filter(post => post.communityId === id);
      for (const post of wallPosts) {
        this.communityWallPosts.delete(post.id);
      }
      
      // 4. Delete community itself
      this.communities.delete(id);
    }
    return exists;
  }
  
  // Community Members methods
  async getCommunityMembers(communityId: number): Promise<(CommunityMember & { user: User })[]> {
    const members = Array.from(this.communityMembers.values())
      .filter(member => member.communityId === communityId);
      
    return Promise.all(members.map(async member => {
      const user = await this.getUser(member.userId);
      if (!user) {
        throw new Error(`User with ID ${member.userId} not found`);
      }
      return { ...member, user };
    }));
  }
  
  async getCommunityMember(communityId: number, userId: number): Promise<CommunityMember | undefined> {
    return Array.from(this.communityMembers.values())
      .find(member => member.communityId === communityId && member.userId === userId);
  }
  
  async addCommunityMember(member: InsertCommunityMember): Promise<CommunityMember> {
    const id = this.communityMemberIdCounter++;
    const now = new Date();
    const newMember: CommunityMember = {
      ...member,
      id,
      joinedAt: now
    };
    
    this.communityMembers.set(id, newMember);
    
    // Update community member count
    const community = await this.getCommunity(member.communityId);
    if (community) {
      await this.updateCommunity(community.id, { 
        memberCount: (community.memberCount || 0) + 1 
      });
    }
    
    return newMember;
  }
  
  async updateCommunityMemberRole(id: number, role: string): Promise<CommunityMember> {
    const member = this.communityMembers.get(id);
    if (!member) {
      throw new Error(`Community member with ID ${id} not found`);
    }
    
    const updatedMember = { ...member, role };
    this.communityMembers.set(id, updatedMember);
    return updatedMember;
  }
  
  async removeCommunityMember(communityId: number, userId: number): Promise<boolean> {
    const member = Array.from(this.communityMembers.values())
      .find(m => m.communityId === communityId && m.userId === userId);
      
    if (member) {
      this.communityMembers.delete(member.id);
      
      // Update community member count
      const community = await this.getCommunity(communityId);
      if (community && community.memberCount && community.memberCount > 0) {
        await this.updateCommunity(community.id, { 
          memberCount: community.memberCount - 1 
        });
      }
      
      return true;
    }
    
    return false;
  }
  
  async isCommunityMember(communityId: number, userId: number): Promise<boolean> {
    const member = await this.getCommunityMember(communityId, userId);
    return !!member;
  }
  
  async isCommunityOwner(communityId: number, userId: number): Promise<boolean> {
    const member = await this.getCommunityMember(communityId, userId);
    return !!member && member.role === 'owner';
  }
  
  async isCommunityModerator(communityId: number, userId: number): Promise<boolean> {
    const member = await this.getCommunityMember(communityId, userId);
    return !!member && (member.role === 'moderator' || member.role === 'owner');
  }
  
  // Community Chat Room methods
  async getCommunityRooms(communityId: number): Promise<CommunityChatRoom[]> {
    return Array.from(this.communityChatRooms.values())
      .filter(room => room.communityId === communityId);
  }
  
  async getPublicCommunityRooms(communityId: number): Promise<CommunityChatRoom[]> {
    return Array.from(this.communityChatRooms.values())
      .filter(room => room.communityId === communityId && !room.isPrivate);
  }
  
  async getCommunityRoom(id: number): Promise<CommunityChatRoom | undefined> {
    return this.communityChatRooms.get(id);
  }
  
  async createCommunityRoom(room: InsertCommunityChatRoom): Promise<CommunityChatRoom> {
    const id = this.communityChatRoomIdCounter++;
    const now = new Date();
    
    const newRoom: CommunityChatRoom = {
      ...room,
      id,
      createdAt: now,
      isPrivate: room.isPrivate || false
    };
    
    this.communityChatRooms.set(id, newRoom);
    return newRoom;
  }
  
  async updateCommunityRoom(id: number, data: Partial<CommunityChatRoom>): Promise<CommunityChatRoom> {
    const room = this.communityChatRooms.get(id);
    if (!room) {
      throw new Error(`Community chat room with ID ${id} not found`);
    }
    
    const updatedRoom = { ...room, ...data };
    this.communityChatRooms.set(id, updatedRoom);
    return updatedRoom;
  }
  
  async deleteCommunityRoom(id: number): Promise<boolean> {
    const exists = this.communityChatRooms.has(id);
    
    if (exists) {
      // Delete all messages in this room
      const messages = Array.from(this.chatMessages.values())
        .filter(msg => msg.chatRoomId === id);
      
      for (const message of messages) {
        this.chatMessages.delete(message.id);
      }
      
      // Delete the room itself
      this.communityChatRooms.delete(id);
    }
    
    return exists;
  }
  
  // Chat Messages methods
  async getChatMessages(roomId: number, limit: number = 50): Promise<(ChatMessage & { sender: User })[]> {
    const messages = Array.from(this.chatMessages.values())
      .filter(msg => msg.chatRoomId === roomId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()) // Oldest first
      .slice(-limit); // Get the most recent messages up to the limit
      
    return Promise.all(messages.map(async message => {
      const sender = await this.getUser(message.senderId);
      if (!sender && !message.isSystemMessage) {
        throw new Error(`User with ID ${message.senderId} not found`);
      }
      return { 
        ...message, 
        sender: sender || { 
          id: 0, 
          username: "System", 
          email: "", 
          password: "",
          displayName: "System",
          bio: null,
          avatarUrl: null,
          isVerifiedApologeticsAnswerer: null,
          createdAt: null
        } 
      };
    }));
  }
  
  async getChatMessagesAfter(roomId: number, afterId: number): Promise<(ChatMessage & { sender: User })[]> {
    const afterMessage = this.chatMessages.get(afterId);
    if (!afterMessage) {
      return [];
    }
    
    const messages = Array.from(this.chatMessages.values())
      .filter(msg => 
        msg.chatRoomId === roomId && 
        msg.createdAt.getTime() > afterMessage.createdAt.getTime()
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      
    return Promise.all(messages.map(async message => {
      const sender = await this.getUser(message.senderId);
      if (!sender && !message.isSystemMessage) {
        throw new Error(`User with ID ${message.senderId} not found`);
      }
      return { 
        ...message, 
        sender: sender || { 
          id: 0, 
          username: "System", 
          email: "", 
          password: "",
          displayName: "System",
          bio: null,
          avatarUrl: null,
          isVerifiedApologeticsAnswerer: null,
          createdAt: null
        } 
      };
    }));
  }
  
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = this.chatMessageIdCounter++;
    const now = new Date();
    
    const newMessage: ChatMessage = {
      ...message,
      id,
      createdAt: now,
      isSystemMessage: message.isSystemMessage || false
    };
    
    this.chatMessages.set(id, newMessage);
    return newMessage;
  }
  
  async deleteChatMessage(id: number): Promise<boolean> {
    const exists = this.chatMessages.has(id);
    if (exists) {
      this.chatMessages.delete(id);
    }
    return exists;
  }
  
  // Community Wall Posts methods
  async getCommunityWallPosts(communityId: number, isPrivate?: boolean): Promise<(CommunityWallPost & { author: User })[]> {
    let posts = Array.from(this.communityWallPosts.values())
      .filter(post => post.communityId === communityId);
      
    if (isPrivate !== undefined) {
      posts = posts.filter(post => post.isPrivate === isPrivate);
    }
    
    posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Newest first
    
    return Promise.all(posts.map(async post => {
      const author = await this.getUser(post.authorId);
      if (!author) {
        throw new Error(`User with ID ${post.authorId} not found`);
      }
      return { ...post, author };
    }));
  }
  
  async getCommunityWallPost(id: number): Promise<(CommunityWallPost & { author: User }) | undefined> {
    const post = this.communityWallPosts.get(id);
    if (!post) {
      return undefined;
    }
    
    const author = await this.getUser(post.authorId);
    if (!author) {
      throw new Error(`User with ID ${post.authorId} not found`);
    }
    
    return { ...post, author };
  }
  
  async createCommunityWallPost(post: InsertCommunityWallPost): Promise<CommunityWallPost> {
    const id = this.communityWallPostIdCounter++;
    const now = new Date();
    
    const newPost: CommunityWallPost = {
      ...post,
      id,
      createdAt: now,
      isPrivate: post.isPrivate || false,
      likeCount: 0,
      commentCount: 0
    };
    
    this.communityWallPosts.set(id, newPost);
    return newPost;
  }
  
  async updateCommunityWallPost(id: number, data: Partial<CommunityWallPost>): Promise<CommunityWallPost> {
    const post = this.communityWallPosts.get(id);
    if (!post) {
      throw new Error(`Community wall post with ID ${id} not found`);
    }
    
    const updatedPost = { ...post, ...data };
    this.communityWallPosts.set(id, updatedPost);
    return updatedPost;
  }
  
  async deleteCommunityWallPost(id: number): Promise<boolean> {
    const exists = this.communityWallPosts.has(id);
    if (exists) {
      this.communityWallPosts.delete(id);
    }
    return exists;
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
  
  async getAllPrayerRequests(): Promise<PrayerRequest[]> {
    return Array.from(this.prayerRequests.values())
      .filter(prayer => prayer.privacyLevel === 'public')
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
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

  // ========================
  // EVENT METHODS
  // ========================

  async getAllEvents(filter?: string): Promise<Event[]> {
    let events = Array.from(this.events.values());
    
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      events = events.filter(event => 
        event.title.toLowerCase().includes(lowerFilter) || 
        event.description.toLowerCase().includes(lowerFilter) ||
        (event.location && event.location.toLowerCase().includes(lowerFilter))
      );
    }
    
    // Sort events by date, most recent first
    return events.sort((a, b) => {
      const dateA = new Date(`${a.eventDate.toString()}T${a.startTime.toString()}`);
      const dateB = new Date(`${b.eventDate.toString()}T${b.startTime.toString()}`);
      return dateA.getTime() - dateB.getTime();
    });
  }

  async getPublicEvents(): Promise<Event[]> {
    const events = Array.from(this.events.values());
    
    // Filter out only public events
    const publicEvents = events.filter(event => event.isPublic);
    
    // Sort events by date, most recent first
    return publicEvents.sort((a, b) => {
      const dateA = new Date(`${a.eventDate.toString()}T${a.startTime.toString()}`);
      const dateB = new Date(`${b.eventDate.toString()}T${b.startTime.toString()}`);
      return dateA.getTime() - dateB.getTime();
    });
  }

  async getEventsNearby(latitude: string, longitude: string, radiusInKm: number): Promise<Event[]> {
    const events = await this.getPublicEvents();
    
    if (!latitude || !longitude) {
      return events;
    }
    
    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);
    
    // Filter events that have location coordinates
    return events.filter(event => {
      if (!event.latitude || !event.longitude) return false;
      
      const eventLat = parseFloat(event.latitude);
      const eventLng = parseFloat(event.longitude);
      
      // Calculate distance using the Haversine formula
      const distance = this.calculateDistance(userLat, userLng, eventLat, eventLng);
      
      // Return true if the event is within the specified radius
      return distance <= radiusInKm;
    });
  }
  
  // Helper function to calculate distance between two coordinates using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  }
  
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getEventsByCommunity(communityId: number): Promise<Event[]> {
    const events = Array.from(this.events.values());
    return events
      .filter(event => event.communityId === communityId)
      .sort((a, b) => {
        const dateA = new Date(`${a.eventDate.toString()}T${a.startTime.toString()}`);
        const dateB = new Date(`${b.eventDate.toString()}T${b.startTime.toString()}`);
        return dateA.getTime() - dateB.getTime();
      });
  }

  async getEventsByGroup(groupId: number): Promise<Event[]> {
    const events = Array.from(this.events.values());
    return events
      .filter(event => event.groupId === groupId)
      .sort((a, b) => {
        const dateA = new Date(`${a.eventDate.toString()}T${a.startTime.toString()}`);
        const dateB = new Date(`${b.eventDate.toString()}T${b.startTime.toString()}`);
        return dateA.getTime() - dateB.getTime();
      });
  }

  async getEventsByUser(userId: number): Promise<Event[]> {
    const events = Array.from(this.events.values());
    return events
      .filter(event => event.creatorId === userId)
      .sort((a, b) => {
        const dateA = new Date(`${a.eventDate.toString()}T${a.startTime.toString()}`);
        const dateB = new Date(`${b.eventDate.toString()}T${b.startTime.toString()}`);
        return dateA.getTime() - dateB.getTime();
      });
  }
  
  async getAllEvents(filter?: string): Promise<Event[]> {
    const events = Array.from(this.events.values());
    
    if (filter === 'upcoming') {
      const now = new Date();
      return events
        .filter(event => {
          const eventDate = new Date(`${event.eventDate.toString()}T${event.endTime.toString()}`);
          return eventDate >= now;
        })
        .sort((a, b) => {
          const dateA = new Date(`${a.eventDate.toString()}T${a.startTime.toString()}`);
          const dateB = new Date(`${b.eventDate.toString()}T${b.startTime.toString()}`);
          return dateA.getTime() - dateB.getTime();
        });
    } else if (filter === 'past') {
      const now = new Date();
      return events
        .filter(event => {
          const eventDate = new Date(`${event.eventDate.toString()}T${event.endTime.toString()}`);
          return eventDate < now;
        })
        .sort((a, b) => {
          const dateA = new Date(`${a.eventDate.toString()}T${a.startTime.toString()}`);
          const dateB = new Date(`${b.eventDate.toString()}T${b.startTime.toString()}`);
          return dateB.getTime() - dateA.getTime(); // descending order for past events
        });
    }
    
    // Default: return all events sorted by date
    return events.sort((a, b) => {
      const dateA = new Date(`${a.eventDate.toString()}T${a.startTime.toString()}`);
      const dateB = new Date(`${b.eventDate.toString()}T${b.startTime.toString()}`);
      return dateA.getTime() - dateB.getTime();
    });
  }
  
  async getPublicEvents(): Promise<Event[]> {
    const events = Array.from(this.events.values());
    const now = new Date();
    
    return events
      .filter(event => {
        // Public events are those with no groupId (open to all) and are upcoming
        const eventDate = new Date(`${event.eventDate.toString()}T${event.endTime.toString()}`);
        return !event.groupId && eventDate >= now;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.eventDate.toString()}T${a.startTime.toString()}`);
        const dateB = new Date(`${b.eventDate.toString()}T${b.startTime.toString()}`);
        return dateA.getTime() - dateB.getTime();
      });
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const id = this.eventIdCounter++;
    const newEvent: Event = {
      ...event,
      id,
      createdAt: new Date(),
    };
    
    this.events.set(id, newEvent);
    return newEvent;
  }

  async updateEvent(id: number, eventData: Partial<Event>): Promise<Event> {
    const event = await this.getEvent(id);
    if (!event) {
      throw new Error(`Event with id ${id} not found`);
    }
    
    const updatedEvent = { ...event, ...eventData };
    this.events.set(id, updatedEvent);
    
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const exists = this.events.has(id);
    if (!exists) {
      return false;
    }
    
    this.events.delete(id);
    
    // Delete associated RSVPs as well
    const rsvps = Array.from(this.eventRsvps.values());
    const eventRsvps = rsvps.filter(rsvp => rsvp.eventId === id);
    
    for (const rsvp of eventRsvps) {
      this.eventRsvps.delete(rsvp.id);
    }
    
    return true;
  }

  // Event RSVP methods
  async getEventRsvps(eventId: number): Promise<EventRsvp[]> {
    const rsvps = Array.from(this.eventRsvps.values());
    return rsvps.filter(rsvp => rsvp.eventId === eventId);
  }

  async getUserEventRsvp(eventId: number, userId: number): Promise<EventRsvp | undefined> {
    const rsvps = Array.from(this.eventRsvps.values());
    return rsvps.find(rsvp => rsvp.eventId === eventId && rsvp.userId === userId);
  }

  async createEventRsvp(rsvp: InsertEventRsvp): Promise<EventRsvp> {
    const id = this.eventRsvpIdCounter++;
    const newRsvp: EventRsvp = {
      ...rsvp,
      id,
      createdAt: new Date(),
    };
    
    this.eventRsvps.set(id, newRsvp);
    return newRsvp;
  }

  async updateEventRsvp(id: number, status: string): Promise<EventRsvp> {
    const rsvp = this.eventRsvps.get(id);
    if (!rsvp) {
      throw new Error(`RSVP with id ${id} not found`);
    }
    
    const updatedRsvp = { ...rsvp, status };
    this.eventRsvps.set(id, updatedRsvp);
    
    return updatedRsvp;
  }
  
  // ========================
  // BIBLE STUDY TOOLS IMPLEMENTATION
  // ========================
  
  // Bible Reading Plans
  private bibleReadingPlans = new Map<number, BibleReadingPlan>();
  private bibleReadingPlanIdCounter = 1;
  
  async getAllBibleReadingPlans(filter?: string): Promise<BibleReadingPlan[]> {
    const plans = Array.from(this.bibleReadingPlans.values());
    
    if (filter === 'public') {
      return plans.filter(plan => plan.isPublic);
    } else if (filter === 'private') {
      return plans.filter(plan => !plan.isPublic);
    }
    
    return plans;
  }
  
  async getBibleReadingPlan(id: number): Promise<BibleReadingPlan | undefined> {
    return this.bibleReadingPlans.get(id);
  }
  
  async getGroupBibleReadingPlans(groupId: number): Promise<BibleReadingPlan[]> {
    const plans = Array.from(this.bibleReadingPlans.values());
    return plans.filter(plan => plan.groupId === groupId);
  }
  
  async getUserBibleReadingPlans(userId: number): Promise<BibleReadingPlan[]> {
    const plans = Array.from(this.bibleReadingPlans.values());
    return plans.filter(plan => plan.creatorId === userId);
  }
  
  async createBibleReadingPlan(plan: InsertBibleReadingPlan): Promise<BibleReadingPlan> {
    const id = this.bibleReadingPlanIdCounter++;
    const newPlan: BibleReadingPlan = {
      ...plan,
      id,
      createdAt: new Date(),
    };
    
    this.bibleReadingPlans.set(id, newPlan);
    return newPlan;
  }
  
  async updateBibleReadingPlan(id: number, data: Partial<BibleReadingPlan>): Promise<BibleReadingPlan> {
    const plan = this.bibleReadingPlans.get(id);
    if (!plan) {
      throw new Error(`Bible reading plan with id ${id} not found`);
    }
    
    const updatedPlan = { ...plan, ...data };
    this.bibleReadingPlans.set(id, updatedPlan);
    
    return updatedPlan;
  }
  
  async deleteBibleReadingPlan(id: number): Promise<boolean> {
    const exists = this.bibleReadingPlans.has(id);
    if (!exists) {
      return false;
    }
    
    this.bibleReadingPlans.delete(id);
    
    // Also delete associated progress
    const allProgress = Array.from(this.bibleReadingProgress.values());
    const planProgress = allProgress.filter(p => p.planId === id);
    
    for (const progress of planProgress) {
      this.bibleReadingProgress.delete(progress.id);
    }
    
    return true;
  }
  
  // Bible Reading Progress
  private bibleReadingProgress = new Map<number, BibleReadingProgress>();
  private bibleReadingProgressIdCounter = 1;
  
  async getBibleReadingProgress(userId: number, planId: number): Promise<BibleReadingProgress | undefined> {
    const allProgress = Array.from(this.bibleReadingProgress.values());
    return allProgress.find(p => p.userId === userId && p.planId === planId);
  }
  
  async getUserReadingProgress(userId: number): Promise<BibleReadingProgress[]> {
    const allProgress = Array.from(this.bibleReadingProgress.values());
    return allProgress.filter(p => p.userId === userId);
  }
  
  async createBibleReadingProgress(progress: InsertBibleReadingProgress): Promise<BibleReadingProgress> {
    const id = this.bibleReadingProgressIdCounter++;
    const newProgress: BibleReadingProgress = {
      ...progress,
      id,
      currentDay: 1,
      completedDays: [],
      startedAt: new Date(),
      completedAt: null,
    };
    
    this.bibleReadingProgress.set(id, newProgress);
    return newProgress;
  }
  
  async updateBibleReadingProgress(id: number, data: Partial<BibleReadingProgress>): Promise<BibleReadingProgress> {
    const progress = this.bibleReadingProgress.get(id);
    if (!progress) {
      throw new Error(`Bible reading progress with id ${id} not found`);
    }
    
    const updatedProgress = { ...progress, ...data };
    this.bibleReadingProgress.set(id, updatedProgress);
    
    return updatedProgress;
  }
  
  async markDayCompleted(progressId: number, day: number): Promise<BibleReadingProgress> {
    const progress = this.bibleReadingProgress.get(progressId);
    if (!progress) {
      throw new Error(`Bible reading progress with id ${progressId} not found`);
    }
    
    // Make sure we don't add duplicate days
    if (!progress.completedDays.includes(day)) {
      const completedDays = [...progress.completedDays, day];
      completedDays.sort((a, b) => a - b); // Keep array sorted
      
      // Get the reading plan
      const plan = await this.getBibleReadingPlan(progress.planId);
      if (!plan) {
        throw new Error(`Reading plan with id ${progress.planId} not found`);
      }
      
      // Check if all days are completed
      let completedAt = progress.completedAt;
      let currentDay = progress.currentDay;
      
      if (completedDays.length >= plan.duration) {
        completedAt = new Date();
      } else {
        // Set current day to the next uncompleted day
        for (let i = 1; i <= plan.duration; i++) {
          if (!completedDays.includes(i)) {
            currentDay = i;
            break;
          }
        }
      }
      
      const updatedProgress = { 
        ...progress, 
        completedDays, 
        completedAt,
        currentDay 
      };
      
      this.bibleReadingProgress.set(progressId, updatedProgress);
      return updatedProgress;
    }
    
    return progress;
  }
  
  // Bible Study Notes
  private bibleStudyNotes = new Map<number, BibleStudyNote>();
  private bibleStudyNoteIdCounter = 1;
  
  async getBibleStudyNotes(filter: { userId?: number, groupId?: number, isPublic?: boolean }): Promise<BibleStudyNote[]> {
    const notes = Array.from(this.bibleStudyNotes.values());
    
    return notes.filter(note => {
      if (filter.userId !== undefined && note.userId !== filter.userId) {
        return false;
      }
      
      if (filter.groupId !== undefined && note.groupId !== filter.groupId) {
        return false;
      }
      
      if (filter.isPublic !== undefined && note.isPublic !== filter.isPublic) {
        return false;
      }
      
      return true;
    }).sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime(); // most recent first
    });
  }
  
  async getBibleStudyNote(id: number): Promise<BibleStudyNote | undefined> {
    return this.bibleStudyNotes.get(id);
  }
  
  async createBibleStudyNote(note: InsertBibleStudyNote): Promise<BibleStudyNote> {
    const id = this.bibleStudyNoteIdCounter++;
    const now = new Date();
    const newNote: BibleStudyNote = {
      ...note,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    this.bibleStudyNotes.set(id, newNote);
    return newNote;
  }
  
  async updateBibleStudyNote(id: number, data: Partial<BibleStudyNote>): Promise<BibleStudyNote> {
    const note = this.bibleStudyNotes.get(id);
    if (!note) {
      throw new Error(`Bible study note with id ${id} not found`);
    }
    
    const updatedNote = { 
      ...note, 
      ...data,
      updatedAt: new Date()
    };
    
    this.bibleStudyNotes.set(id, updatedNote);
    return updatedNote;
  }
  
  async deleteBibleStudyNote(id: number): Promise<boolean> {
    const exists = this.bibleStudyNotes.has(id);
    if (!exists) {
      return false;
    }
    
    this.bibleStudyNotes.delete(id);
    return true;
  }
  
  // Verse Memorization
  private verseMemorization = new Map<number, VerseMemorization>();
  private verseMemorizationIdCounter = 1;
  
  async getUserVerseMemorization(userId: number): Promise<VerseMemorization[]> {
    const verses = Array.from(this.verseMemorization.values());
    return verses
      .filter(verse => verse.userId === userId)
      .sort((a, b) => {
        if (!a.startDate || !b.startDate) return 0;
        return b.startDate.getTime() - a.startDate.getTime();
      });
  }
  
  async getVerseMemorization(id: number): Promise<VerseMemorization | undefined> {
    return this.verseMemorization.get(id);
  }
  
  async createVerseMemorization(verse: InsertVerseMemorization): Promise<VerseMemorization> {
    const id = this.verseMemorizationIdCounter++;
    const newVerse: VerseMemorization = {
      ...verse,
      id,
      startDate: new Date(),
      masteredDate: null,
      reviewDates: [],
    };
    
    this.verseMemorization.set(id, newVerse);
    return newVerse;
  }
  
  async updateVerseMemorization(id: number, data: Partial<VerseMemorization>): Promise<VerseMemorization> {
    const verse = this.verseMemorization.get(id);
    if (!verse) {
      throw new Error(`Verse memorization with id ${id} not found`);
    }
    
    const updatedVerse = { ...verse, ...data };
    this.verseMemorization.set(id, updatedVerse);
    
    return updatedVerse;
  }
  
  async markVerseMastered(id: number): Promise<VerseMemorization> {
    const verse = this.verseMemorization.get(id);
    if (!verse) {
      throw new Error(`Verse memorization with id ${id} not found`);
    }
    
    const updatedVerse = { 
      ...verse, 
      masteredDate: new Date() 
    };
    
    this.verseMemorization.set(id, updatedVerse);
    return updatedVerse;
  }
  
  async addVerseReviewDate(id: number): Promise<VerseMemorization> {
    const verse = this.verseMemorization.get(id);
    if (!verse) {
      throw new Error(`Verse memorization with id ${id} not found`);
    }
    
    const reviewDates = [...verse.reviewDates, new Date()];
    
    const updatedVerse = { ...verse, reviewDates };
    this.verseMemorization.set(id, updatedVerse);
    
    return updatedVerse;
  }
  
  async deleteVerseMemorization(id: number): Promise<boolean> {
    const exists = this.verseMemorization.has(id);
    if (!exists) {
      return false;
    }
    
    this.verseMemorization.delete(id);
    return true;
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  
  // Check if user is an admin
  async checkUserIsAdmin(userId: number): Promise<boolean> {
    const [user] = await db.select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, userId));
    
    return user?.isAdmin || false;
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
    // Add created_at and updated_at if not provided
    const now = new Date();
    const userData = {
      ...user,
      createdAt: user.createdAt || now,
      updatedAt: now
    };
    
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  }
  
  async updateUserPassword(userId: number, hashedPassword: string): Promise<User | undefined> {
    try {
      const now = new Date();
      const result = await db
        .update(users)
        .set({ 
          password: hashedPassword,
          updatedAt: now
        })
        .where(eq(users.id, userId))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error updating user password:", error);
      return undefined;
    }
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

  async updateCommunity(id: number, community: Partial<Community>): Promise<Community> {
    const result = await db.update(communities)
      .set({ ...community, updatedAt: new Date() })
      .where(eq(communities.id, id))
      .returning();
    return result[0];
  }

  async deleteCommunity(id: number): Promise<boolean> {
    const result = await db.delete(communities).where(eq(communities.id, id));
    return result.rowCount > 0;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const result = await db.update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async setVerifiedApologeticsAnswerer(userId: number, isVerified: boolean): Promise<User> {
    const result = await db.update(users)
      .set({ isVerifiedApologeticsAnswerer: isVerified, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async getVerifiedApologeticsAnswerers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isVerifiedApologeticsAnswerer, true));
  }

  async updateUserPreferences(userId: number, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    // For now, return a placeholder as this table might not exist yet
    return {} as UserPreferences;
  }

  // Community Member Management
  async getCommunityMembers(communityId: number): Promise<(CommunityMember & { user: User })[]> {
    const result = await db.select({
      id: communityMembers.id,
      communityId: communityMembers.communityId,
      userId: communityMembers.userId,
      role: communityMembers.role,
      joinedAt: communityMembers.joinedAt,
      user: users
    })
    .from(communityMembers)
    .innerJoin(users, eq(communityMembers.userId, users.id))
    .where(eq(communityMembers.communityId, communityId));
    
    return result;
  }

  async getCommunityMember(communityId: number, userId: number): Promise<CommunityMember | undefined> {
    const result = await db.select()
      .from(communityMembers)
      .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)))
      .limit(1);
    return result[0];
  }

  async addCommunityMember(member: InsertCommunityMember): Promise<CommunityMember> {
    const result = await db.insert(communityMembers).values(member).returning();
    return result[0];
  }

  async updateCommunityMemberRole(id: number, role: string): Promise<CommunityMember> {
    const result = await db.update(communityMembers)
      .set({ role })
      .where(eq(communityMembers.id, id))
      .returning();
    return result[0];
  }

  async removeCommunityMember(communityId: number, userId: number): Promise<boolean> {
    const result = await db.delete(communityMembers)
      .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)));
    return result.rowCount > 0;
  }

  async isCommunityMember(communityId: number, userId: number): Promise<boolean> {
    const result = await db.select({ id: communityMembers.id })
      .from(communityMembers)
      .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)))
      .limit(1);
    return result.length > 0;
  }

  async isCommunityOwner(communityId: number, userId: number): Promise<boolean> {
    const result = await db.select({ role: communityMembers.role })
      .from(communityMembers)
      .where(and(
        eq(communityMembers.communityId, communityId), 
        eq(communityMembers.userId, userId),
        eq(communityMembers.role, "owner")
      ))
      .limit(1);
    return result.length > 0;
  }

  async isCommunityModerator(communityId: number, userId: number): Promise<boolean> {
    const result = await db.select({ role: communityMembers.role })
      .from(communityMembers)
      .where(and(
        eq(communityMembers.communityId, communityId), 
        eq(communityMembers.userId, userId),
        or(eq(communityMembers.role, "moderator"), eq(communityMembers.role, "owner"))
      ))
      .limit(1);
    return result.length > 0;
  }

  // Community Chat Room Management
  async getCommunityRooms(communityId: number): Promise<CommunityChatRoom[]> {
    return await db.select()
      .from(communityChatRooms)
      .where(eq(communityChatRooms.communityId, communityId));
  }

  async getPublicCommunityRooms(communityId: number): Promise<CommunityChatRoom[]> {
    return await db.select()
      .from(communityChatRooms)
      .where(and(eq(communityChatRooms.communityId, communityId), eq(communityChatRooms.isPrivate, false)));
  }

  async getCommunityRoom(id: number): Promise<CommunityChatRoom | undefined> {
    const result = await db.select()
      .from(communityChatRooms)
      .where(eq(communityChatRooms.id, id))
      .limit(1);
    return result[0];
  }

  async createCommunityRoom(room: InsertCommunityChatRoom): Promise<CommunityChatRoom> {
    const result = await db.insert(communityChatRooms).values(room).returning();
    return result[0];
  }

  async updateCommunityRoom(id: number, data: Partial<CommunityChatRoom>): Promise<CommunityChatRoom> {
    const result = await db.update(communityChatRooms)
      .set(data)
      .where(eq(communityChatRooms.id, id))
      .returning();
    return result[0];
  }

  async deleteCommunityRoom(id: number): Promise<boolean> {
    const result = await db.delete(communityChatRooms)
      .where(eq(communityChatRooms.id, id));
    return result.rowCount > 0;
  }

  // Chat Messages
  async getChatMessages(roomId: number, limit = 50): Promise<(ChatMessage & { sender: User })[]> {
    const result = await db.select({
      id: chatMessages.id,
      content: chatMessages.content,
      chatRoomId: chatMessages.chatRoomId,
      senderId: chatMessages.senderId,
      isSystemMessage: chatMessages.isSystemMessage,
      createdAt: chatMessages.createdAt,
      sender: users
    })
    .from(chatMessages)
    .innerJoin(users, eq(chatMessages.senderId, users.id))
    .where(eq(chatMessages.chatRoomId, roomId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
    
    return result;
  }

  async getChatMessagesAfter(roomId: number, afterId: number): Promise<(ChatMessage & { sender: User })[]> {
    const result = await db.select({
      id: chatMessages.id,
      content: chatMessages.content,
      chatRoomId: chatMessages.chatRoomId,
      senderId: chatMessages.senderId,
      isSystemMessage: chatMessages.isSystemMessage,
      createdAt: chatMessages.createdAt,
      sender: users
    })
    .from(chatMessages)
    .innerJoin(users, eq(chatMessages.senderId, users.id))
    .where(and(eq(chatMessages.chatRoomId, roomId), sql`${chatMessages.id} > ${afterId}`))
    .orderBy(chatMessages.createdAt);
    
    return result;
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const result = await db.insert(chatMessages).values(message).returning();
    return result[0];
  }

  async deleteChatMessage(id: number): Promise<boolean> {
    const result = await db.delete(chatMessages).where(eq(chatMessages.id, id));
    return result.rowCount > 0;
  }

  // Community Wall Posts
  async getCommunityWallPosts(communityId: number, isPrivate?: boolean): Promise<(CommunityWallPost & { author: User })[]> {
    let whereCondition = eq(communityWallPosts.communityId, communityId);
    
    if (isPrivate !== undefined) {
      whereCondition = and(whereCondition, eq(communityWallPosts.isPrivate, isPrivate));
    }

    const result = await db.select({
      id: communityWallPosts.id,
      communityId: communityWallPosts.communityId,
      authorId: communityWallPosts.authorId,
      content: communityWallPosts.content,
      imageUrl: communityWallPosts.imageUrl,
      isPrivate: communityWallPosts.isPrivate,
      likeCount: communityWallPosts.likeCount,
      commentCount: communityWallPosts.commentCount,
      createdAt: communityWallPosts.createdAt,
      author: users
    })
    .from(communityWallPosts)
    .innerJoin(users, eq(communityWallPosts.authorId, users.id))
    .where(whereCondition)
    .orderBy(desc(communityWallPosts.createdAt));
    
    return result;
  }

  async getCommunityWallPost(id: number): Promise<(CommunityWallPost & { author: User }) | undefined> {
    const result = await db.select({
      id: communityWallPosts.id,
      communityId: communityWallPosts.communityId,
      authorId: communityWallPosts.authorId,
      content: communityWallPosts.content,
      imageUrl: communityWallPosts.imageUrl,
      isPrivate: communityWallPosts.isPrivate,
      likeCount: communityWallPosts.likeCount,
      commentCount: communityWallPosts.commentCount,
      createdAt: communityWallPosts.createdAt,
      author: users
    })
    .from(communityWallPosts)
    .innerJoin(users, eq(communityWallPosts.authorId, users.id))
    .where(eq(communityWallPosts.id, id))
    .limit(1);
    
    return result[0];
  }

  async createCommunityWallPost(post: InsertCommunityWallPost): Promise<CommunityWallPost> {
    const result = await db.insert(communityWallPosts).values(post).returning();
    return result[0];
  }

  async updateCommunityWallPost(id: number, data: Partial<CommunityWallPost>): Promise<CommunityWallPost> {
    const result = await db.update(communityWallPosts)
      .set(data)
      .where(eq(communityWallPosts.id, id))
      .returning();
    return result[0];
  }

  async deleteCommunityWallPost(id: number): Promise<boolean> {
    const result = await db.delete(communityWallPosts)
      .where(eq(communityWallPosts.id, id));
    return result.rowCount > 0;
  }

  // Prayer Request Methods
  async getPublicPrayerRequests(): Promise<PrayerRequest[]> {
    return await db.select()
      .from(prayerRequests)
      .where(eq(prayerRequests.privacyLevel, 'public'))
      .orderBy(desc(prayerRequests.createdAt));
  }

  async getAllPrayerRequests(): Promise<PrayerRequest[]> {
    return await db.select()
      .from(prayerRequests)
      .orderBy(desc(prayerRequests.createdAt));
  }

  async getPrayerRequest(id: number): Promise<PrayerRequest | undefined> {
    const result = await db.select()
      .from(prayerRequests)
      .where(eq(prayerRequests.id, id))
      .limit(1);
    return result[0];
  }

  async getUserPrayerRequests(userId: number): Promise<PrayerRequest[]> {
    return await db.select()
      .from(prayerRequests)
      .where(eq(prayerRequests.authorId, userId))
      .orderBy(desc(prayerRequests.createdAt));
  }

  async getGroupPrayerRequests(groupId: number): Promise<PrayerRequest[]> {
    return await db.select()
      .from(prayerRequests)
      .where(eq(prayerRequests.groupId, groupId))
      .orderBy(desc(prayerRequests.createdAt));
  }

  async createPrayerRequest(request: InsertPrayerRequest): Promise<PrayerRequest> {
    const result = await db.insert(prayerRequests).values(request).returning();
    return result[0];
  }

  async updatePrayerRequest(id: number, data: Partial<PrayerRequest>): Promise<PrayerRequest> {
    const result = await db.update(prayerRequests)
      .set(data)
      .where(eq(prayerRequests.id, id))
      .returning();
    return result[0];
  }

  async markPrayerRequestAsAnswered(id: number): Promise<PrayerRequest> {
    const result = await db.update(prayerRequests)
      .set({ isAnswered: true })
      .where(eq(prayerRequests.id, id))
      .returning();
    return result[0];
  }

  async deletePrayerRequest(id: number): Promise<boolean> {
    const result = await db.delete(prayerRequests)
      .where(eq(prayerRequests.id, id));
    return result.rowCount > 0;
  }

  async createPrayer(prayer: InsertPrayer): Promise<Prayer> {
    const result = await db.insert(prayers).values(prayer).returning();
    return result[0];
  }

  async getPrayersForRequest(requestId: number): Promise<Prayer[]> {
    return await db.select()
      .from(prayers)
      .where(eq(prayers.requestId, requestId))
      .orderBy(desc(prayers.createdAt));
  }

  async getUserPrayedRequests(userId: number): Promise<PrayerRequest[]> {
    const prayedRequestIds = await db.select({ requestId: prayers.requestId })
      .from(prayers)
      .where(eq(prayers.userId, userId));
    
    if (prayedRequestIds.length === 0) return [];
    
    return await db.select()
      .from(prayerRequests)
      .where(inArray(prayerRequests.id, prayedRequestIds.map(p => p.requestId)))
      .orderBy(desc(prayerRequests.createdAt));
  }

  // Group Member Methods
  async isGroupMember(groupId: number, userId: number): Promise<boolean> {
    const result = await db.select({ id: groupMembers.id })
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .limit(1);
    return result.length > 0;
  }

  // Apologetics Methods
  async createApologeticsTopic(topic: InsertApologeticsTopic): Promise<ApologeticsTopic> {
    const result = await db.insert(apologeticsTopics).values(topic).returning();
    return result[0];
  }

  async incrementApologeticsQuestionViewCount(id: number): Promise<void> {
    await db.update(apologeticsQuestions)
      .set({ viewCount: sql`${apologeticsQuestions.viewCount} + 1` })
      .where(eq(apologeticsQuestions.id, id));
  }

  // Livestream Methods
  async createLivestream(livestream: InsertLivestream): Promise<Livestream> {
    const result = await db.insert(livestreams).values(livestream).returning();
    return result[0];
  }

  async getLivestream(id: number): Promise<Livestream | undefined> {
    const result = await db.select()
      .from(livestreams)
      .where(eq(livestreams.id, id))
      .limit(1);
    return result[0];
  }

  // Virtual Gift Methods (placeholder implementations)
  async getActiveVirtualGifts(): Promise<any[]> {
    // Placeholder implementation
    return [];
  }

  async sendGiftToLivestream(giftId: number, livestreamId: number, senderId: number): Promise<any> {
    // Placeholder implementation
    return {};
  }

  async getAllCreatorTiers(): Promise<any[]> {
    // Placeholder implementation
    return [];
  }

  // Bible Study Methods
  async getBibleStudyNotes(userId: number, passage?: string): Promise<BibleStudyNote[]> {
    let query = db.select().from(bibleStudyNotes).where(eq(bibleStudyNotes.userId, userId));
    
    if (passage) {
      query = query.where(eq(bibleStudyNotes.passage, passage));
    }
    
    return await query.orderBy(desc(bibleStudyNotes.createdAt));
  }

  async markDayCompleted(userId: number, planId: number, day: number): Promise<void> {
    // Implementation for marking a day as completed in a reading plan
    await db.update(bibleReadingProgress)
      .set({ 
        currentDay: day + 1,
        completedDays: sql`array_append(coalesce(${bibleReadingProgress.completedDays}, '{}'), ${day})`
      })
      .where(and(eq(bibleReadingProgress.userId, userId), eq(bibleReadingProgress.planId, planId)));
  }

  // Verse Memorization Methods
  async getUserVerseMemorization(userId: number): Promise<VerseMemorization[]> {
    return await db.select()
      .from(verseMemorization)
      .where(eq(verseMemorization.userId, userId))
      .orderBy(desc(verseMemorization.startDate));
  }

  async createVerseMemorization(verse: InsertVerseMemorization): Promise<VerseMemorization> {
    const result = await db.insert(verseMemorization).values(verse).returning();
    return result[0];
  }

  async markVerseMastered(id: number): Promise<VerseMemorization> {
    const result = await db.update(verseMemorization)
      .set({ masteredDate: new Date() })
      .where(eq(verseMemorization.id, id))
      .returning();
    return result[0];
  }

  async addVerseReviewDate(id: number, reviewDate: Date): Promise<VerseMemorization> {
    const result = await db.update(verseMemorization)
      .set({ 
        reviewDates: sql`array_append(coalesce(${verseMemorization.reviewDates}, '{}'), ${reviewDate.toISOString()})`
      })
      .where(eq(verseMemorization.id, id))
      .returning();
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
  
  // Apologetics topics methods
  async getAllApologeticsTopics(): Promise<any[]> {
    return await pool.query(`
      SELECT id, title as name, description, slug, created_at as "createdAt"
      FROM apologetics_topics
      ORDER BY id
    `).then(result => result.rows);
  }
  
  async getApologeticsTopic(id: number): Promise<any | undefined> {
    return await pool.query(`
      SELECT id, title as name, description, slug, created_at as "createdAt"
      FROM apologetics_topics
      WHERE id = $1
      LIMIT 1
    `, [id]).then(result => result.rows[0] || undefined);
  }
  
  async getApologeticsTopicBySlug(slug: string): Promise<any | undefined> {
    return await pool.query(`
      SELECT id, title as name, description, slug, created_at as "createdAt"
      FROM apologetics_topics
      WHERE slug = $1
      LIMIT 1
    `, [slug]).then(result => result.rows[0] || undefined);
  }
  
  // Apologetics questions methods
  async getAllApologeticsQuestions(): Promise<any[]> {
    return await pool.query(`
      SELECT 
        q.id, q.title, q.content, q.user_id as "authorId", q.topic_id as "topicId", 
        q.status, q.view_count as "viewCount", q.created_at as "createdAt"
      FROM apologetics_questions q
      ORDER BY q.created_at DESC
    `).then(result => result.rows);
  }
  
  async getApologeticsQuestion(id: number): Promise<any | undefined> {
    return await pool.query(`
      SELECT 
        q.id, q.title, q.content, q.user_id as "authorId", q.topic_id as "topicId", 
        q.status, q.view_count as "viewCount", q.created_at as "createdAt"
      FROM apologetics_questions q
      WHERE q.id = $1
      LIMIT 1
    `, [id]).then(result => result.rows[0] || undefined);
  }
  
  async getApologeticsQuestionsByTopic(topicId: number): Promise<any[]> {
    return await pool.query(`
      SELECT 
        q.id, q.title, q.content, q.user_id as "authorId", q.topic_id as "topicId", 
        q.status, q.view_count as "viewCount", q.created_at as "createdAt"
      FROM apologetics_questions q
      WHERE q.topic_id = $1
      ORDER BY q.created_at DESC
    `, [topicId]).then(result => result.rows);
  }
  
  async createApologeticsQuestion(question: any): Promise<any> {
    const { title, content, authorId, topicId, status = "open" } = question;
    return await pool.query(`
      INSERT INTO apologetics_questions (title, content, user_id, topic_id, status, view_count)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, title, content, user_id as "authorId", topic_id as "topicId", status, view_count as "viewCount", created_at as "createdAt"
    `, [title, content, authorId, topicId, status, 0]).then(result => result.rows[0]);
  }
  
  async updateApologeticsQuestionStatus(id: number, status: string): Promise<any> {
    return await pool.query(`
      UPDATE apologetics_questions
      SET status = $1
      WHERE id = $2
      RETURNING id, title, content, user_id as "authorId", topic_id as "topicId", 
                status, view_count as "viewCount", created_at as "createdAt"
    `, [status, id]).then(result => result.rows[0]);
  }
  
  // Apologetics answers methods
  async getApologeticsAnswersByQuestion(questionId: number): Promise<any[]> {
    return await pool.query(`
      SELECT 
        a.id, a.content, a.question_id as "questionId", a.user_id as "authorId", 
        a.is_verified_answer as "isVerifiedAnswer", a.created_at as "createdAt"
      FROM apologetics_answers a
      WHERE a.question_id = $1
      ORDER BY a.is_verified_answer DESC, a.created_at DESC
    `, [questionId]).then(result => result.rows);
  }
  
  async createApologeticsAnswer(answer: any): Promise<any> {
    const { content, questionId, authorId, isVerifiedAnswer = false } = answer;
    
    // Insert the answer
    const result = await pool.query(`
      INSERT INTO apologetics_answers (content, question_id, user_id, is_verified_answer)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        id, content, question_id as "questionId", user_id as "authorId", 
        is_verified_answer as "isVerifiedAnswer", created_at as "createdAt"
    `, [content, questionId, authorId, isVerifiedAnswer]);
    
    // Increment answer count on the question
    await pool.query(`
      UPDATE apologetics_questions
      SET answer_count = COALESCE(answer_count, 0) + 1
      WHERE id = $1
    `, [questionId]);
    
    return result.rows[0];
  }
  
  async upvoteApologeticsAnswer(id: number): Promise<any> {
    return await pool.query(`
      UPDATE apologetics_answers
      SET upvotes = COALESCE(upvotes, 0) + 1
      WHERE id = $1
      RETURNING id, content, question_id as "questionId", user_id as "authorId", 
                is_verified_answer as "isVerifiedAnswer", upvotes, created_at as "createdAt"
    `, [id]).then(result => result.rows[0]);
  }
  
  // Verified apologetics answerers methods
  async getVerifiedApologeticsAnswerers(): Promise<any[]> {
    return await pool.query(`
      SELECT id, username, email, display_name as "displayName", bio, avatar_url as "avatarUrl",
             is_verified_apologetics_answerer as "isVerifiedApologeticsAnswerer", created_at as "createdAt"
      FROM users
      WHERE is_verified_apologetics_answerer = true
    `).then(result => result.rows);
  }
  
  async setVerifiedApologeticsAnswerer(userId: number, isVerified: boolean): Promise<any> {
    return await pool.query(`
      UPDATE users
      SET is_verified_apologetics_answerer = $1
      WHERE id = $2
      RETURNING id, username, email, display_name as "displayName", bio, avatar_url as "avatarUrl",
                is_verified_apologetics_answerer as "isVerifiedApologeticsAnswerer", created_at as "createdAt"
    `, [isVerified, userId]).then(result => result.rows[0]);
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    // Prepare update fields and values
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    // Add each field to update query
    for (const [key, value] of Object.entries(userData)) {
      if (value !== undefined) {
        // Convert camelCase to snake_case for DB column names
        const columnName = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${columnName} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    // Add updated_at timestamp
    fields.push(`updated_at = $${paramIndex}`);
    values.push(new Date());
    
    // Add user ID as last parameter
    values.push(id);
    
    if (fields.length === 0) {
      throw new Error("No valid fields to update");
    }
    
    // Build and execute query
    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex + 1}
      RETURNING id, username, email, password, display_name as "displayName", bio, avatar_url as "avatarUrl",
        city, state, zip_code as "zipCode", latitude, longitude, is_admin as "isAdmin",
        is_verified_apologetics_answerer as "isVerifiedApologeticsAnswerer", created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    return result.rows[0];
  }
  
  async updateUserPreferences(userId: number, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    // First check if preferences exist
    const checkResult = await pool.query(`
      SELECT * FROM user_preferences WHERE user_id = $1 LIMIT 1
    `, [userId]);
    
    const now = new Date();
    
    // If preferences exist, update them
    if (checkResult.rows.length > 0) {
      // Prepare update fields and values
      const fields = [];
      const values = [];
      let paramIndex = 1;
      
      // Add each field to update query
      for (const [key, value] of Object.entries(preferences)) {
        if (value !== undefined) {
          // Convert camelCase to snake_case for DB column names
          const columnName = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          fields.push(`${columnName} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }
      
      // Add updated_at timestamp
      fields.push(`updated_at = $${paramIndex}`);
      values.push(now);
      
      // Add user ID as last parameter
      values.push(userId);
      
      if (fields.length === 0) {
        throw new Error("No valid fields to update");
      }
      
      // Build and execute query
      const query = `
        UPDATE user_preferences
        SET ${fields.join(', ')}
        WHERE user_id = $${paramIndex + 1}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } 
    // Otherwise, create new preferences
    else {
      // Prepare insert fields and placeholders
      const fields = ['user_id', 'created_at'];
      const placeholders = ['$1', '$2'];
      const values = [userId, now];
      let paramIndex = 3;
      
      // Add each field to insert query
      for (const [key, value] of Object.entries(preferences)) {
        if (value !== undefined) {
          // Convert camelCase to snake_case for DB column names
          const columnName = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          fields.push(columnName);
          placeholders.push(`$${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }
      
      // Build and execute query
      const query = `
        INSERT INTO user_preferences (${fields.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      return result.rows[0];
    }
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
    try {
      const likes = await db
        .select()
        .from(microblogLikes)
        .where(eq(microblogLikes.userId, userId));
      
      return likes.map(like => like.microblogId);
    } catch (error) {
      console.error("Error getting user liked microblogs:", error);
      return [];
    }
  }

  // ========================
  // CONTENT RECOMMENDATIONS
  // ========================
  
  // User preferences methods
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    try {
      const [preferences] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId));
      
      return preferences;
    } catch (error) {
      console.error("Error getting user preferences:", error);
      return undefined;
    }
  }

  async updateUserPreferences(userId: number, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    try {
      const existingPrefs = await this.getUserPreferences(userId);
      
      if (existingPrefs) {
        // Update existing preferences
        const [updatedPrefs] = await db
          .update(userPreferences)
          .set({
            ...preferences,
            updatedAt: new Date()
          })
          .where(eq(userPreferences.id, existingPrefs.id))
          .returning();
          
        return updatedPrefs;
      } else {
        // Create new preferences
        const [newPrefs] = await db
          .insert(userPreferences)
          .values({
            userId,
            interests: preferences.interests || [],
            favoriteTopics: preferences.favoriteTopics || [],
            contentTypesPreference: preferences.contentTypesPreference || {},
            notificationSettings: preferences.notificationSettings || {},
            appSettings: preferences.appSettings || {},
            engagementHistory: preferences.engagementHistory || [],
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
          
        return newPrefs;
      }
    } catch (error) {
      console.error("Error updating user preferences:", error);
      throw new Error("Failed to update user preferences");
    }
  }

  // Recommendation methods
  async getAllRecommendations(userId: number): Promise<ContentRecommendation[]> {
    try {
      // Get all recommendations for the user, sorted by viewed status and score
      const recommendations = await db
        .select()
        .from(contentRecommendations)
        .where(eq(contentRecommendations.userId, userId))
        .orderBy(
          contentRecommendations.viewed,
          desc(contentRecommendations.score)
        );
      
      return recommendations;
    } catch (error) {
      console.error("Error getting recommendations:", error);
      return [];
    }
  }

  async getRecommendation(id: number): Promise<ContentRecommendation | undefined> {
    try {
      const [recommendation] = await db
        .select()
        .from(contentRecommendations)
        .where(eq(contentRecommendations.id, id));
      
      return recommendation;
    } catch (error) {
      console.error("Error getting recommendation:", error);
      return undefined;
    }
  }

  async addContentRecommendation(recommendation: InsertContentRecommendation): Promise<ContentRecommendation> {
    try {
      const [newRecommendation] = await db
        .insert(contentRecommendations)
        .values({
          ...recommendation,
          createdAt: new Date(),
          viewed: false
        })
        .returning();
      
      return newRecommendation;
    } catch (error) {
      console.error("Error adding recommendation:", error);
      throw new Error("Failed to add recommendation");
    }
  }

  async markRecommendationAsViewed(id: number): Promise<boolean> {
    try {
      const result = await db
        .update(contentRecommendations)
        .set({ 
          viewed: true,
          viewedAt: new Date()
        })
        .where(eq(contentRecommendations.id, id));
      
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error marking recommendation as viewed:", error);
      return false;
    }
  }

  // Content retrieval for recommendations
  async getTopPosts(limit: number): Promise<Post[]> {
    try {
      // Get posts sorted by upvotes and comment count
      const topPosts = await db
        .select()
        .from(posts)
        .orderBy(desc(sql`${posts.upvotes} + ${posts.commentCount} * 2`))
        .limit(limit);
      
      return topPosts;
    } catch (error) {
      console.error("Error getting top posts:", error);
      return [];
    }
  }

  async getTopMicroblogs(limit: number): Promise<Microblog[]> {
    try {
      // Get microblogs that are not replies, sorted by likes and replies
      const topMicroblogs = await db
        .select()
        .from(microblogs)
        .where(isNull(microblogs.parentId))
        .orderBy(desc(sql`${microblogs.likeCount} + ${microblogs.replyCount} * 2`))
        .limit(limit);
      
      return topMicroblogs;
    } catch (error) {
      console.error("Error getting top microblogs:", error);
      return [];
    }
  }

  // Event methods
  async getAllEvents(filter?: string): Promise<Event[]> {
    try {
      // Base query
      let query = db.select().from(events);
      
      // Apply filter if provided
      if (filter) {
        if (filter === "upcoming") {
          const now = new Date();
          query = query.where(sql`${events.eventDate} >= CURRENT_DATE`);
        } else if (filter === "past") {
          const now = new Date();
          query = query.where(sql`${events.eventDate} < CURRENT_DATE`);
        } else if (filter === "virtual") {
          query = query.where(eq(events.isVirtual, true));
        } else if (filter === "in-person") {
          query = query.where(eq(events.isVirtual, false));
        } else {
          // Text search
          query = query.where(
            or(
              sql`${events.title} ILIKE ${'%' + filter + '%'}`,
              sql`${events.description} ILIKE ${'%' + filter + '%'}`,
              sql`${events.location} ILIKE ${'%' + filter + '%'}`,
              sql`${events.address} ILIKE ${'%' + filter + '%'}`,
              sql`${events.city} ILIKE ${'%' + filter + '%'}`,
              sql`${events.state} ILIKE ${'%' + filter + '%'}`
            )
          );
        }
      }
      
      // Order by date (most recent first for past events, soonest first for upcoming)
      if (filter === "past") {
        query = query.orderBy(desc(events.eventDate), desc(events.startTime));
      } else {
        query = query.orderBy(events.eventDate, events.startTime);
      }
      
      const result = await query;
      return result;
    } catch (error) {
      console.error("Error getting events:", error);
      return [];
    }
  }
  
  async getPublicEvents(): Promise<Event[]> {
    try {
      const result = await db
        .select()
        .from(events)
        .where(
          and(
            eq(events.isPublic, true),
            sql`${events.eventDate} >= CURRENT_DATE`
          )
        )
        .orderBy(events.eventDate, events.startTime);
      
      return result;
    } catch (error) {
      console.error("Error getting public events:", error);
      return [];
    }
  }
  
  async getEventsNearby(latitude: string, longitude: string, radiusInKm: number): Promise<Event[]> {
    try {
      if (!latitude || !longitude) {
        return this.getPublicEvents();
      }
      
      const userLat = parseFloat(latitude);
      const userLng = parseFloat(longitude);
      
      if (isNaN(userLat) || isNaN(userLng)) {
        return this.getPublicEvents();
      }
      
      // First get public events
      const publicEvents = await this.getPublicEvents();
      
      // Filter events that have location coordinates and calculate distance
      return publicEvents
        .filter(event => {
          // Ensure event has valid coordinates
          if (!event.latitude || !event.longitude) return false;
          
          const eventLat = parseFloat(event.latitude);
          const eventLng = parseFloat(event.longitude);
          
          if (isNaN(eventLat) || isNaN(eventLng)) return false;
          
          // Calculate distance using haversine formula
          const distance = this.calculateDistance(
            userLat, userLng,
            eventLat, eventLng
          );
          
          // Keep events within the specified radius
          return distance <= radiusInKm;
        })
        .sort((a, b) => {
          // Sort by distance from user (closest first)
          const distA = this.calculateDistance(
            userLat, userLng,
            parseFloat(a.latitude!), parseFloat(a.longitude!)
          );
          const distB = this.calculateDistance(
            userLat, userLng,
            parseFloat(b.latitude!), parseFloat(b.longitude!)
          );
          
          return distA - distB;
        });
    } catch (error) {
      console.error("Error getting nearby events:", error);
      return [];
    }
  }
  
  // Helper function to calculate distance between two coordinates using haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    return d;
  }
  
  private toRad(degrees: number): number {
    return degrees * Math.PI / 180;
  }
  
  async getEvent(id: number): Promise<Event | undefined> {
    try {
      const result = await db
        .select()
        .from(events)
        .where(eq(events.id, id))
        .limit(1);
      
      return result[0];
    } catch (error) {
      console.error(`Error getting event with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async getEventsByCommunity(communityId: number): Promise<Event[]> {
    try {
      const result = await db
        .select()
        .from(events)
        .where(eq(events.communityId, communityId))
        .orderBy(events.eventDate, events.startTime);
      
      return result;
    } catch (error) {
      console.error(`Error getting events for community ${communityId}:`, error);
      return [];
    }
  }
  
  async getEventsByGroup(groupId: number): Promise<Event[]> {
    try {
      const result = await db
        .select()
        .from(events)
        .where(eq(events.groupId, groupId))
        .orderBy(events.eventDate, events.startTime);
      
      return result;
    } catch (error) {
      console.error(`Error getting events for group ${groupId}:`, error);
      return [];
    }
  }
  
  async getEventsByUser(userId: number): Promise<Event[]> {
    try {
      const result = await db
        .select()
        .from(events)
        .where(eq(events.creatorId, userId))
        .orderBy(events.eventDate, events.startTime);
      
      return result;
    } catch (error) {
      console.error(`Error getting events for user ${userId}:`, error);
      return [];
    }
  }
  
  async createEvent(event: InsertEvent): Promise<Event> {
    try {
      const result = await db
        .insert(events)
        .values(event)
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error creating event:", error);
      throw new Error("Failed to create event");
    }
  }
  
  async updateEvent(id: number, eventData: Partial<Event>): Promise<Event> {
    try {
      const result = await db
        .update(events)
        .set(eventData)
        .where(eq(events.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error(`Event with ID ${id} not found`);
      }
      
      return result[0];
    } catch (error) {
      console.error(`Error updating event ${id}:`, error);
      throw new Error("Failed to update event");
    }
  }
  
  async deleteEvent(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(events)
        .where(eq(events.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error(`Error deleting event ${id}:`, error);
      return false;
    }
  }
  
  async getUpcomingEvents(limit: number): Promise<Event[]> {
    try {
      const now = new Date();
      
      // Get future events sorted by start date
      const upcomingEvents = await db
        .select()
        .from(events)
        .where(sql`${events.startTime} > ${now}`)
        .orderBy(events.startTime)
        .limit(limit);
      
      return upcomingEvents;
    } catch (error) {
      console.error("Error getting upcoming events:", error);
      return [];
    }
  }
  
  // Event RSVP methods
  async getEventRsvps(eventId: number): Promise<EventRsvp[]> {
    try {
      const rsvps = await db
        .select({
          id: eventRsvps.id,
          eventId: eventRsvps.eventId,
          userId: eventRsvps.userId,
          status: eventRsvps.status,
          createdAt: eventRsvps.createdAt,
          user: {
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            avatarUrl: users.avatarUrl
          }
        })
        .from(eventRsvps)
        .leftJoin(users, eq(eventRsvps.userId, users.id))
        .where(eq(eventRsvps.eventId, eventId));
      
      return rsvps;
    } catch (error) {
      console.error(`Error getting RSVPs for event ${eventId}:`, error);
      return [];
    }
  }

  async getUserEventRsvp(eventId: number, userId: number): Promise<EventRsvp | undefined> {
    try {
      const result = await db
        .select()
        .from(eventRsvps)
        .where(
          and(
            eq(eventRsvps.eventId, eventId),
            eq(eventRsvps.userId, userId)
          )
        )
        .limit(1);
      
      return result[0];
    } catch (error) {
      console.error(`Error getting user RSVP for event ${eventId}:`, error);
      return undefined;
    }
  }

  async createEventRsvp(rsvp: InsertEventRsvp): Promise<EventRsvp> {
    try {
      const result = await db
        .insert(eventRsvps)
        .values(rsvp)
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error creating event RSVP:", error);
      throw new Error("Failed to create RSVP");
    }
  }

  async updateEventRsvp(id: number, status: string): Promise<EventRsvp> {
    try {
      const result = await db
        .update(eventRsvps)
        .set({ status })
        .where(eq(eventRsvps.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error(`RSVP with ID ${id} not found`);
      }
      
      return result[0];
    } catch (error) {
      console.error(`Error updating RSVP ${id}:`, error);
      throw new Error("Failed to update RSVP");
    }
  }

  async getPrayerRequestsVisibleToUser(userId: number): Promise<PrayerRequest[]> {
    try {
      // Get public prayer requests
      const publicRequests = await db
        .select()
        .from(prayerRequests)
        .where(eq(prayerRequests.privacyLevel, 'public'));
      
      // Get the user's own prayer requests
      const userRequests = await db
        .select()
        .from(prayerRequests)
        .where(eq(prayerRequests.authorId, userId));
      
      // Get user's groups
      const userGroups = await db
        .select()
        .from(groupMembers)
        .where(eq(groupMembers.userId, userId));
      
      const userGroupIds = userGroups.map(g => g.groupId);
      
      // Get prayer requests from user's groups
      const groupRequests = userGroupIds.length > 0 
        ? await db
            .select()
            .from(prayerRequests)
            .where(
              and(
                eq(prayerRequests.privacyLevel, 'group'),
                inArray(prayerRequests.groupId, userGroupIds)
              )
            )
        : [];
      
      // Combine and de-duplicate
      const allRequests = [...publicRequests, ...userRequests, ...groupRequests];
      const uniqueIds = new Set();
      const uniqueRequests = allRequests.filter(request => {
        if (uniqueIds.has(request.id)) {
          return false;
        }
        uniqueIds.add(request.id);
        return true;
      });
      
      return uniqueRequests;
    } catch (error) {
      console.error("Error getting prayer requests visible to user:", error);
      return [];
    }
  }

  // Bible Study methods
  async getAllBibleReadingPlans(filter?: string): Promise<BibleReadingPlan[]> {
    try {
      let query = db.select().from(bibleReadingPlans);
      
      if (filter === 'public') {
        query = query.where(eq(bibleReadingPlans.isPublic, true));
      }
      
      return await query.orderBy(desc(bibleReadingPlans.createdAt));
    } catch (error) {
      console.error("Error getting all Bible reading plans:", error);
      return [];
    }
  }

  async getUserBibleReadingPlans(userId: number): Promise<BibleReadingPlan[]> {
    try {
      return await db
        .select()
        .from(bibleReadingPlans)
        .where(
          or(
            eq(bibleReadingPlans.creatorId, userId),
            eq(bibleReadingPlans.isPublic, true)
          )
        )
        .orderBy(desc(bibleReadingPlans.createdAt));
    } catch (error) {
      console.error("Error getting user Bible reading plans:", error);
      return [];
    }
  }

  async getGroupBibleReadingPlans(groupId: number): Promise<BibleReadingPlan[]> {
    try {
      return await db
        .select()
        .from(bibleReadingPlans)
        .where(eq(bibleReadingPlans.groupId, groupId))
        .orderBy(desc(bibleReadingPlans.createdAt));
    } catch (error) {
      console.error("Error getting group Bible reading plans:", error);
      return [];
    }
  }
  
  async createBibleReadingPlan(plan: InsertBibleReadingPlan): Promise<BibleReadingPlan> {
    try {
      const [newPlan] = await db
        .insert(bibleReadingPlans)
        .values(plan)
        .returning();
      
      return newPlan;
    } catch (error) {
      console.error("Error creating Bible reading plan:", error);
      throw error;
    }
  }
  
  async updateBibleReadingPlan(id: number, data: Partial<BibleReadingPlan>): Promise<BibleReadingPlan> {
    try {
      const result = await db
        .update(bibleReadingPlans)
        .set(data)
        .where(eq(bibleReadingPlans.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error updating Bible reading plan:", error);
      throw error;
    }
  }
  
  async deleteBibleReadingPlan(id: number): Promise<boolean> {
    try {
      await db.delete(bibleReadingPlans).where(eq(bibleReadingPlans.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting Bible reading plan:", error);
      return false;
    }
  }
  
  // Bible Reading Progress methods
  async getUserReadingProgress(userId: number): Promise<typeof bibleReadingProgress.$inferSelect[]> {
    try {
      return await db
        .select()
        .from(bibleReadingProgress)
        .where(eq(bibleReadingProgress.userId, userId));
    } catch (error) {
      console.error("Error getting user reading progress:", error);
      return [];
    }
  }
  
  async getBibleReadingProgress(userId: number, planId: number): Promise<typeof bibleReadingProgress.$inferSelect | undefined> {
    try {
      const result = await db
        .select()
        .from(bibleReadingProgress)
        .where(
          and(
            eq(bibleReadingProgress.userId, userId),
            eq(bibleReadingProgress.planId, planId)
          )
        )
        .limit(1);
      
      return result[0];
    } catch (error) {
      console.error("Error getting Bible reading progress:", error);
      return undefined;
    }
  }
  
  async createBibleReadingProgress(progress: typeof insertBibleReadingProgressSchema._type): Promise<typeof bibleReadingProgress.$inferSelect> {
    try {
      const result = await db.insert(bibleReadingProgress).values(progress).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating Bible reading progress:", error);
      throw error;
    }
  }
  
  async updateBibleReadingProgress(
    userId: number,
    planId: number,
    data: { 
      currentDay?: number, 
      completedDays?: unknown,
      completedAt?: Date | null 
    }
  ): Promise<typeof bibleReadingProgress.$inferSelect> {
    try {
      const result = await db
        .update(bibleReadingProgress)
        .set(data)
        .where(
          and(
            eq(bibleReadingProgress.userId, userId),
            eq(bibleReadingProgress.planId, planId)
          )
        )
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error updating Bible reading progress:", error);
      throw error;
    }
  }
  
  // Bible Study Notes methods
  async getAllBibleStudyNotes(): Promise<typeof bibleStudyNotes.$inferSelect[]> {
    try {
      return await db
        .select()
        .from(bibleStudyNotes)
        .where(eq(bibleStudyNotes.isPublic, true))
        .orderBy(desc(bibleStudyNotes.createdAt));
    } catch (error) {
      console.error("Error getting all Bible study notes:", error);
      return [];
    }
  }
  
  async getUserBibleStudyNotes(userId: number): Promise<typeof bibleStudyNotes.$inferSelect[]> {
    try {
      return await db
        .select()
        .from(bibleStudyNotes)
        .where(eq(bibleStudyNotes.userId, userId))
        .orderBy(desc(bibleStudyNotes.createdAt));
    } catch (error) {
      console.error("Error getting user Bible study notes:", error);
      return [];
    }
  }
  
  async getGroupBibleStudyNotes(groupId: number): Promise<typeof bibleStudyNotes.$inferSelect[]> {
    try {
      return await db
        .select()
        .from(bibleStudyNotes)
        .where(eq(bibleStudyNotes.groupId, groupId))
        .orderBy(desc(bibleStudyNotes.createdAt));
    } catch (error) {
      console.error("Error getting group Bible study notes:", error);
      return [];
    }
  }
  
  async getBibleStudyNote(id: number): Promise<typeof bibleStudyNotes.$inferSelect | undefined> {
    try {
      const result = await db
        .select()
        .from(bibleStudyNotes)
        .where(eq(bibleStudyNotes.id, id))
        .limit(1);
      
      return result[0];
    } catch (error) {
      console.error("Error getting Bible study note:", error);
      return undefined;
    }
  }
  
  async createBibleStudyNote(note: typeof insertBibleStudyNotesSchema._type): Promise<typeof bibleStudyNotes.$inferSelect> {
    try {
      const result = await db.insert(bibleStudyNotes).values(note).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating Bible study note:", error);
      throw error;
    }
  }
  
  async updateBibleStudyNote(
    id: number,
    data: Partial<typeof insertBibleStudyNotesSchema._type>
  ): Promise<typeof bibleStudyNotes.$inferSelect> {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };
      
      const result = await db
        .update(bibleStudyNotes)
        .set(updateData)
        .where(eq(bibleStudyNotes.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error updating Bible study note:", error);
      throw error;
    }
  }
  
  async deleteBibleStudyNote(id: number): Promise<boolean> {
    try {
      await db.delete(bibleStudyNotes).where(eq(bibleStudyNotes.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting Bible study note:", error);
      return false;
    }
  }
  
  // Livestreamer application methods
  async getLivestreamerApplicationByUserId(userId: number): Promise<LivestreamerApplication | undefined> {
    try {
      const applications = await db
        .select()
        .from(livestreamerApplications)
        .where(eq(livestreamerApplications.userId, userId));
      
      return applications[0];
    } catch (error) {
      console.error("Error getting livestreamer application by user ID:", error);
      return undefined;
    }
  }
  
  async getPendingLivestreamerApplications(): Promise<LivestreamerApplication[]> {
    try {
      const pendingApplications = await db
        .select()
        .from(livestreamerApplications)
        .where(eq(livestreamerApplications.status, "pending"))
        .orderBy(livestreamerApplications.submittedAt);
      
      return pendingApplications;
    } catch (error) {
      console.error("Error getting pending livestreamer applications:", error);
      return [];
    }
  }
  
  async createLivestreamerApplication(application: InsertLivestreamerApplication): Promise<LivestreamerApplication> {
    try {
      const result = await db
        .insert(livestreamerApplications)
        .values(application)
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error creating livestreamer application:", error);
      throw error;
    }
  }
  
  async updateLivestreamerApplication(
    id: number, 
    status: string, 
    reviewNotes: string, 
    reviewerId: number
  ): Promise<LivestreamerApplication> {
    try {
      const result = await db
        .update(livestreamerApplications)
        .set({ 
          status, 
          reviewNotes, 
          reviewedBy: reviewerId,
          reviewedAt: new Date()
        })
        .where(eq(livestreamerApplications.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error updating livestreamer application:", error);
      throw error;
    }
  }
  
  async isApprovedLivestreamer(userId: number): Promise<boolean> {
    try {
      const applications = await db
        .select()
        .from(livestreamerApplications)
        .where(
          and(
            eq(livestreamerApplications.userId, userId),
            eq(livestreamerApplications.status, "approved")
          )
        );
      
      return applications.length > 0;
    } catch (error) {
      console.error("Error checking approved livestreamer status:", error);
      return false;
    }
  }
  
  // Apologist Scholar application methods
  async getApologistScholarApplicationByUserId(userId: number): Promise<ApologistScholarApplication | undefined> {
    try {
      const applications = await db
        .select()
        .from(apologistScholarApplications)
        .where(eq(apologistScholarApplications.userId, userId));
      
      return applications[0];
    } catch (error) {
      console.error("Error getting apologist scholar application by user ID:", error);
      return undefined;
    }
  }
  
  async getPendingApologistScholarApplications(): Promise<ApologistScholarApplication[]> {
    try {
      const pendingApplications = await db
        .select()
        .from(apologistScholarApplications)
        .where(eq(apologistScholarApplications.status, "pending"))
        .orderBy(apologistScholarApplications.submittedAt);
      
      return pendingApplications;
    } catch (error) {
      console.error("Error getting pending apologist scholar applications:", error);
      return [];
    }
  }
  
  async createApologistScholarApplication(application: InsertApologistScholarApplication): Promise<ApologistScholarApplication> {
    try {
      const result = await db
        .insert(apologistScholarApplications)
        .values(application)
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error creating apologist scholar application:", error);
      throw error;
    }
  }
  
  async updateApologistScholarApplication(
    id: number, 
    status: string, 
    reviewNotes: string, 
    reviewerId: number
  ): Promise<ApologistScholarApplication> {
    try {
      const result = await db
        .update(apologistScholarApplications)
        .set({ 
          status, 
          reviewNotes, 
          reviewedBy: reviewerId,
          reviewedAt: new Date()
        })
        .where(eq(apologistScholarApplications.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error updating apologist scholar application:", error);
      throw error;
    }
  }
  
  async isApprovedApologistScholar(userId: number): Promise<boolean> {
    try {
      const applications = await db
        .select()
        .from(apologistScholarApplications)
        .where(
          and(
            eq(apologistScholarApplications.userId, userId),
            eq(apologistScholarApplications.status, "approved")
          )
        );
      
      return applications.length > 0;
    } catch (error) {
      console.error("Error checking if user is approved apologist scholar:", error);
      return false;
    }
  }
}

// Replace MemStorage with DatabaseStorage
export const storage = new DatabaseStorage();
