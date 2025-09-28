import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date, time, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  isVerifiedApologeticsAnswerer: boolean("is_verified_apologetics_answerer").default(false),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isVerifiedApologeticsAnswerer: true,
  createdAt: true,
  updatedAt: true
});
const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  adminUserId: integer("admin_user_id").notNull().references(() => users.id),
  plan: text("plan").default("free"),
  // free, standard, premium
  website: text("website"),
  email: text("email"),
  // Contact email for the organization
  logoUrl: text("logo_url"),
  // Organization logo/avatar
  mission: text("mission"),
  // Mission statement
  serviceTimes: text("service_times"),
  // JSON string of service times/schedule
  socialMedia: text("social_media"),
  // JSON string of social media links
  foundedDate: date("founded_date"),
  // When the organization was founded
  congregationSize: integer("congregation_size"),
  // Approximate size
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  phone: text("phone"),
  denomination: text("denomination"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
const insertOrganizationSchema = createInsertSchema(organizations).pick({
  name: true,
  description: true,
  adminUserId: true,
  website: true,
  email: true,
  logoUrl: true,
  mission: true,
  serviceTimes: true,
  socialMedia: true,
  foundedDate: true,
  congregationSize: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
  phone: true,
  denomination: true
});
const organizationUsers = pgTable("organization_users", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").default("member"),
  // admin, pastor, leader, member
  joinedAt: timestamp("joined_at").defaultNow()
});
const insertOrganizationUserSchema = createInsertSchema(organizationUsers).pick({
  organizationId: true,
  userId: true,
  role: true
});
const communities = pgTable("communities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  slug: text("slug").notNull().unique(),
  iconName: text("icon_name").notNull(),
  iconColor: text("icon_color").notNull(),
  interestTags: text("interest_tags").array(),
  city: text("city"),
  state: text("state"),
  isLocalCommunity: boolean("is_local_community").default(false),
  latitude: text("latitude"),
  longitude: text("longitude"),
  memberCount: integer("member_count").default(0),
  isPrivate: boolean("is_private").default(false),
  hasPrivateWall: boolean("has_private_wall").default(false),
  hasPublicWall: boolean("has_public_wall").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id)
});
const insertCommunityObjectSchema = createInsertSchema(communities).omit({
  id: true,
  memberCount: true,
  createdAt: true
});
const insertCommunitySchema = insertCommunityObjectSchema.refine((data) => data.name && data.name.trim().length > 0, {
  message: "Community name is required and cannot be empty",
  path: ["name"]
}).refine((data) => data.hasPrivateWall || data.hasPublicWall, {
  message: "At least one wall (private or public) must be enabled",
  path: ["hasPublicWall"]
});
const communityMembers = pgTable("community_members", {
  id: serial("id").primaryKey(),
  communityId: integer("community_id").references(() => communities.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").notNull().default("member"),
  // "owner", "moderator", "member"
  joinedAt: timestamp("joined_at").defaultNow()
});
const insertCommunityMemberSchema = createInsertSchema(communityMembers).pick({
  communityId: true,
  userId: true,
  role: true
});
const communityInvitations = pgTable("community_invitations", {
  id: serial("id").primaryKey(),
  communityId: integer("community_id").references(() => communities.id).notNull(),
  inviterUserId: integer("inviter_user_id").references(() => users.id).notNull(),
  inviteeEmail: text("invitee_email").notNull(),
  inviteeUserId: integer("invitee_user_id").references(() => users.id),
  // Optional - set when user exists
  status: text("status").notNull().default("pending"),
  // "pending", "accepted", "declined", "expired"
  token: text("token").notNull().unique(),
  // Secure token for invitation links
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull()
});
const insertCommunityInvitationSchema = createInsertSchema(communityInvitations).pick({
  communityId: true,
  inviterUserId: true,
  inviteeEmail: true,
  inviteeUserId: true,
  status: true,
  token: true,
  expiresAt: true
});
const userFollows = pgTable("user_follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").references(() => users.id).notNull(),
  followingId: integer("following_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
const insertUserFollowSchema = createInsertSchema(userFollows).pick({
  followerId: true,
  followingId: true
});
const userInteractions = pgTable("user_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  contentId: integer("content_id").notNull(),
  contentType: text("content_type").notNull(),
  // 'microblog', 'community', 'event', 'prayer_request', 'bible_study'
  interactionType: text("interaction_type").notNull(),
  // 'view', 'like', 'comment', 'share', 'save', 'prayer_request', 'bible_study'
  interactionStrength: integer("interaction_strength").default(1),
  // Weight of interaction based on faith-based scoring
  metadata: jsonb("metadata"),
  // Store additional context like topic tags, sentiment
  createdAt: timestamp("created_at").defaultNow()
});
const insertUserInteractionSchema = createInsertSchema(userInteractions).pick({
  userId: true,
  contentId: true,
  contentType: true,
  interactionType: true,
  interactionStrength: true
});
const communityChatRooms = pgTable("community_chat_rooms", {
  id: serial("id").primaryKey(),
  communityId: integer("community_id").references(() => communities.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isPrivate: boolean("is_private").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id).notNull()
});
const insertCommunityChatRoomSchema = createInsertSchema(communityChatRooms).pick({
  communityId: true,
  name: true,
  description: true,
  isPrivate: true,
  createdBy: true
});
const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  chatRoomId: integer("chat_room_id").references(() => communityChatRooms.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  isSystemMessage: boolean("is_system_message").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  content: true,
  chatRoomId: true,
  senderId: true,
  isSystemMessage: true
});
const communityWallPosts = pgTable("community_wall_posts", {
  id: serial("id").primaryKey(),
  communityId: integer("community_id").references(() => communities.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  isPrivate: boolean("is_private").default(false),
  // For private wall posts
  likeCount: integer("like_count").default(0),
  commentCount: integer("comment_count").default(0),
  createdAt: timestamp("created_at").defaultNow()
});
const insertCommunityWallPostSchema = createInsertSchema(communityWallPosts).pick({
  communityId: true,
  authorId: true,
  content: true,
  imageUrl: true,
  isPrivate: true
});
const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconName: text("icon_name").notNull(),
  iconColor: text("icon_color").notNull(),
  isPrivate: boolean("is_private").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id)
});
const insertGroupSchema = createInsertSchema(groups).pick({
  name: true,
  description: true,
  iconName: true,
  iconColor: true,
  isPrivate: true,
  createdBy: true
});
const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => groups.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  isAdmin: boolean("is_admin").default(false),
  joinedAt: timestamp("joined_at").defaultNow()
});
const insertGroupMemberSchema = createInsertSchema(groupMembers).pick({
  groupId: true,
  userId: true,
  isAdmin: true
});
const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  communityId: integer("community_id").references(() => communities.id),
  groupId: integer("group_id").references(() => groups.id),
  authorId: integer("author_id").references(() => users.id),
  upvotes: integer("upvotes").default(0),
  commentCount: integer("comment_count").default(0),
  createdAt: timestamp("created_at").defaultNow()
});
const insertPostSchema = createInsertSchema(posts).pick({
  title: true,
  content: true,
  imageUrl: true,
  communityId: true,
  groupId: true,
  authorId: true
});
const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  postId: integer("post_id").notNull(),
  authorId: integer("author_id"),
  parentId: integer("parent_id"),
  upvotes: integer("upvotes").default(0),
  createdAt: timestamp("created_at").defaultNow()
});
const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
  postId: true,
  authorId: true,
  parentId: true
});
const apologeticsResources = pgTable("apologetics_resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  // book, video, podcast, etc.
  iconName: text("icon_name").notNull(),
  url: text("url"),
  createdAt: timestamp("created_at").defaultNow()
});
const insertApologeticsResourceSchema = createInsertSchema(apologeticsResources).pick({
  title: true,
  description: true,
  type: true,
  iconName: true,
  url: true
});
const apologeticsTopics = pgTable("apologetics_topics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  iconName: text("icon_name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow()
});
const insertApologeticsTopicSchema = createInsertSchema(apologeticsTopics).pick({
  name: true,
  description: true,
  iconName: true,
  slug: true
});
const apologeticsQuestions = pgTable("apologetics_questions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  topicId: integer("topic_id").references(() => apologeticsTopics.id).notNull(),
  status: text("status").notNull().default("open"),
  // open, answered, closed
  answerCount: integer("answer_count").default(0),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow()
});
const insertApologeticsQuestionSchema = createInsertSchema(apologeticsQuestions).pick({
  title: true,
  content: true,
  authorId: true,
  topicId: true,
  status: true
});
const apologeticsAnswers = pgTable("apologetics_answers", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  questionId: integer("question_id").references(() => apologeticsQuestions.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  isVerifiedAnswer: boolean("is_verified_answer").default(false),
  upvotes: integer("upvotes").default(0),
  createdAt: timestamp("created_at").defaultNow()
});
const insertApologeticsAnswerSchema = createInsertSchema(apologeticsAnswers).pick({
  content: true,
  questionId: true,
  authorId: true,
  isVerifiedAnswer: true
});
const livestreams = pgTable("livestreams", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  hostId: integer("host_id").references(() => users.id).notNull(),
  thumbnail: text("thumbnail"),
  status: text("status").notNull().default("upcoming"),
  // "live", "upcoming", "ended"
  viewerCount: integer("viewer_count").default(0),
  scheduledFor: timestamp("scheduled_for"),
  duration: text("duration"),
  tags: text("tags"),
  createdAt: timestamp("created_at").defaultNow()
});
const insertLivestreamSchema = createInsertSchema(livestreams).pick({
  title: true,
  description: true,
  hostId: true,
  thumbnail: true,
  status: true,
  scheduledFor: true,
  duration: true,
  tags: true
});
const livestreamerApplications = pgTable("livestreamer_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  status: text("status").notNull().default("pending"),
  // "pending", "approved", "rejected"
  ministryName: text("ministry_name"),
  ministryDescription: text("ministry_description").notNull(),
  ministerialExperience: text("ministerial_experience"),
  statementOfFaith: text("statement_of_faith").notNull(),
  socialMediaLinks: text("social_media_links"),
  referenceName: text("reference_name").notNull(),
  referenceContact: text("reference_contact").notNull(),
  referenceRelationship: text("reference_relationship").notNull(),
  sampleContentUrl: text("sample_content_url").notNull(),
  livestreamTopics: text("livestream_topics").notNull(),
  targetAudience: text("target_audience").notNull(),
  agreedToTerms: boolean("agreed_to_terms").notNull(),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  reviewedAt: timestamp("reviewed_at"),
  submittedAt: timestamp("submitted_at").defaultNow()
});
const insertLivestreamerApplicationSchema = createInsertSchema(livestreamerApplications).pick({
  userId: true,
  ministryName: true,
  ministryDescription: true,
  ministerialExperience: true,
  statementOfFaith: true,
  socialMediaLinks: true,
  referenceName: true,
  referenceContact: true,
  referenceRelationship: true,
  sampleContentUrl: true,
  livestreamTopics: true,
  targetAudience: true,
  agreedToTerms: true
});
const creatorTiers = pgTable("creator_tiers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  benefits: text("benefits").notNull(),
  iconName: text("icon_name").notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
const insertCreatorTierSchema = createInsertSchema(creatorTiers).pick({
  name: true,
  description: true,
  requirements: true,
  benefits: true,
  iconName: true,
  order: true
});
const userCreatorTiers = pgTable("user_creator_tiers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  tierId: integer("tier_id").references(() => creatorTiers.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  validUntil: timestamp("valid_until")
});
const insertUserCreatorTierSchema = createInsertSchema(userCreatorTiers).pick({
  userId: true,
  tierId: true,
  validUntil: true
});
const virtualGifts = pgTable("virtual_gifts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconName: text("icon_name").notNull(),
  value: integer("value").notNull(),
  // Value in platform points/currency
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});
const insertVirtualGiftSchema = createInsertSchema(virtualGifts).pick({
  name: true,
  description: true,
  iconName: true,
  value: true,
  isActive: true
});
const livestreamGifts = pgTable("livestream_gifts", {
  id: serial("id").primaryKey(),
  livestreamId: integer("livestream_id").references(() => livestreams.id).notNull(),
  giftId: integer("gift_id").references(() => virtualGifts.id).notNull(),
  senderId: integer("sender_id").references(() => users.id),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  message: text("message"),
  sentAt: timestamp("sent_at").defaultNow()
});
const insertLivestreamGiftSchema = createInsertSchema(livestreamGifts).pick({
  livestreamId: true,
  giftId: true,
  senderId: true,
  receiverId: true,
  message: true
});
const apologistScholarApplications = pgTable("apologist_scholar_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  status: text("status").notNull().default("pending"),
  // "pending", "approved", "rejected"
  fullName: text("full_name").notNull(),
  academicCredentials: text("academic_credentials").notNull(),
  educationalBackground: text("educational_background").notNull(),
  theologicalPerspective: text("theological_perspective").notNull(),
  statementOfFaith: text("statement_of_faith").notNull(),
  areasOfExpertise: text("areas_of_expertise").notNull(),
  publishedWorks: text("published_works"),
  priorApologeticsExperience: text("prior_apologetics_experience").notNull(),
  writingSample: text("writing_sample").notNull(),
  onlineSocialHandles: text("online_social_handles"),
  referenceName: text("reference_name").notNull(),
  referenceContact: text("reference_contact").notNull(),
  referenceInstitution: text("reference_institution").notNull(),
  motivation: text("motivation").notNull(),
  weeklyTimeCommitment: text("weekly_time_commitment").notNull(),
  agreedToGuidelines: boolean("agreed_to_guidelines").notNull(),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  reviewedAt: timestamp("reviewed_at"),
  submittedAt: timestamp("submitted_at").defaultNow()
});
const insertApologistScholarApplicationSchema = createInsertSchema(apologistScholarApplications).pick({
  userId: true,
  fullName: true,
  academicCredentials: true,
  educationalBackground: true,
  theologicalPerspective: true,
  statementOfFaith: true,
  areasOfExpertise: true,
  publishedWorks: true,
  priorApologeticsExperience: true,
  writingSample: true,
  onlineSocialHandles: true,
  referenceName: true,
  referenceContact: true,
  referenceInstitution: true,
  motivation: true,
  weeklyTimeCommitment: true,
  agreedToGuidelines: true
});
const microblogs = pgTable("microblogs", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  // Optional image attachment
  authorId: integer("author_id").references(() => users.id).notNull(),
  communityId: integer("community_id").references(() => communities.id),
  // Optional community (public if null)
  groupId: integer("group_id").references(() => groups.id),
  // Optional private group (public if null)
  likeCount: integer("like_count").default(0),
  repostCount: integer("repost_count").default(0),
  replyCount: integer("reply_count").default(0),
  parentId: integer("parent_id").references(() => microblogs.id),
  // For replies to other microblogs
  createdAt: timestamp("created_at").defaultNow()
});
const insertMicroblogSchema = createInsertSchema(microblogs).pick({
  content: true,
  imageUrl: true,
  authorId: true,
  communityId: true,
  groupId: true,
  parentId: true
});
const microblogLikes = pgTable("microblog_likes", {
  id: serial("id").primaryKey(),
  microblogId: integer("microblog_id").references(() => microblogs.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
const insertMicroblogLikeSchema = createInsertSchema(microblogLikes).pick({
  microblogId: true,
  userId: true
});
const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  // General location name
  address: text("address"),
  // Full street address
  city: text("city"),
  // City
  state: text("state"),
  // State or province
  zipCode: text("zip_code"),
  // Postal/ZIP code
  isVirtual: boolean("is_virtual").default(false),
  isPublic: boolean("is_public").default(false),
  // Allow events to be publicly visible
  showOnMap: boolean("show_on_map").default(true),
  // Whether to display the event on maps
  virtualMeetingUrl: text("virtual_meeting_url"),
  eventDate: date("event_date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  imageUrl: text("image_url"),
  latitude: text("latitude"),
  // For map integration
  longitude: text("longitude"),
  // For map integration
  communityId: integer("community_id").references(() => communities.id),
  groupId: integer("group_id").references(() => groups.id),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});
const insertEventSchema = createInsertSchema(events).pick({
  title: true,
  description: true,
  location: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
  isVirtual: true,
  isPublic: true,
  showOnMap: true,
  virtualMeetingUrl: true,
  eventDate: true,
  startTime: true,
  endTime: true,
  imageUrl: true,
  latitude: true,
  longitude: true,
  communityId: true,
  groupId: true,
  creatorId: true
});
const eventRsvps = pgTable("event_rsvps", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").notNull(),
  // attending, maybe, declined
  createdAt: timestamp("created_at").defaultNow()
});
const insertEventRsvpSchema = createInsertSchema(eventRsvps).pick({
  eventId: true,
  userId: true,
  status: true
});
const prayerRequests = pgTable("prayer_requests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isAnonymous: boolean("is_anonymous").default(false),
  privacyLevel: text("privacy_level").notNull(),
  // public, friends-only, group-only
  groupId: integer("group_id").references(() => groups.id),
  authorId: integer("author_id").notNull().references(() => users.id),
  prayerCount: integer("prayer_count").default(0),
  isAnswered: boolean("is_answered").default(false),
  answeredDescription: text("answered_description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
const insertPrayerRequestSchema = createInsertSchema(prayerRequests).pick({
  title: true,
  content: true,
  isAnonymous: true,
  privacyLevel: true,
  groupId: true,
  authorId: true
});
const prayers = pgTable("prayers", {
  id: serial("id").primaryKey(),
  prayerRequestId: integer("prayer_request_id").notNull().references(() => prayerRequests.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});
const insertPrayerSchema = createInsertSchema(prayers).pick({
  prayerRequestId: true,
  userId: true
});
const mentorProfiles = pgTable("mentor_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  spiritualGifts: text("spiritual_gifts").array(),
  areasOfExpertise: text("areas_of_expertise").array(),
  yearsOfFaith: integer("years_of_faith"),
  shortBio: text("short_bio").notNull(),
  availability: text("availability").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});
const insertMentorProfileSchema = createInsertSchema(mentorProfiles).pick({
  userId: true,
  spiritualGifts: true,
  areasOfExpertise: true,
  yearsOfFaith: true,
  shortBio: true,
  availability: true
});
const mentorshipRequests = pgTable("mentorship_requests", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id").notNull().references(() => users.id),
  menteeId: integer("mentee_id").notNull().references(() => users.id),
  message: text("message"),
  status: text("status").notNull(),
  // pending, accepted, declined
  createdAt: timestamp("created_at").defaultNow()
});
const insertMentorshipRequestSchema = createInsertSchema(mentorshipRequests).pick({
  mentorId: true,
  menteeId: true,
  message: true,
  status: true
});
const mentorshipRelationships = pgTable("mentorship_relationships", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id").notNull().references(() => users.id),
  menteeId: integer("mentee_id").notNull().references(() => users.id),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  goals: jsonb("goals")
});
const insertMentorshipRelationshipSchema = createInsertSchema(mentorshipRelationships).pick({
  mentorId: true,
  menteeId: true,
  goals: true
});
const bibleReadingPlans = pgTable("bible_reading_plans", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  duration: integer("duration").notNull(),
  // days
  readings: jsonb("readings").notNull(),
  // Array of daily readings
  creatorId: integer("creator_id").references(() => users.id),
  groupId: integer("group_id").references(() => groups.id),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow()
});
const insertBibleReadingPlanSchema = createInsertSchema(bibleReadingPlans).pick({
  title: true,
  description: true,
  duration: true,
  readings: true,
  creatorId: true,
  groupId: true,
  isPublic: true
});
const bibleReadingProgress = pgTable("bible_reading_progress", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull().references(() => bibleReadingPlans.id),
  userId: integer("user_id").notNull().references(() => users.id),
  currentDay: integer("current_day").default(1),
  completedDays: jsonb("completed_days").default([]),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at")
});
const insertBibleReadingProgressSchema = createInsertSchema(bibleReadingProgress).pick({
  planId: true,
  userId: true
});
const bibleStudyNotes = pgTable("bible_study_notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  groupId: integer("group_id").references(() => groups.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  passage: text("passage"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
const insertBibleStudyNotesSchema = createInsertSchema(bibleStudyNotes).pick({
  userId: true,
  groupId: true,
  title: true,
  content: true,
  passage: true,
  isPublic: true
});
const verseMemorization = pgTable("verse_memorization", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  verse: text("verse").notNull(),
  reference: text("reference").notNull(),
  startDate: timestamp("start_date").defaultNow(),
  masteredDate: timestamp("mastered_date"),
  reviewDates: jsonb("review_dates").default([]),
  reminderFrequency: integer("reminder_frequency")
  // days
});
const insertVerseMemorizationSchema = createInsertSchema(verseMemorization).pick({
  userId: true,
  verse: true,
  reference: true,
  reminderFrequency: true
});
const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  interests: jsonb("interests").default([]),
  favoriteTopics: jsonb("favorite_topics").default([]),
  engagementHistory: jsonb("engagement_history").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
const contentRecommendations = pgTable("content_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  contentType: text("content_type").notNull(),
  // 'post', 'microblog', 'apologetics', 'bible_study', etc.
  contentId: integer("content_id").notNull(),
  score: integer("score").notNull(),
  reason: text("reason"),
  isViewed: boolean("is_viewed").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
const insertUserPreferencesSchema = createInsertSchema(userPreferences).pick({
  userId: true,
  interests: true,
  favoriteTopics: true
});
const insertContentRecommendationSchema = createInsertSchema(contentRecommendations).pick({
  userId: true,
  contentType: true,
  contentId: true,
  score: true,
  reason: true
});
const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  // prayer, service, bible-reading
  duration: integer("duration").notNull(),
  // days
  goals: jsonb("goals").notNull(),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  groupId: integer("group_id").references(() => groups.id),
  communityId: integer("community_id").references(() => communities.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
const insertChallengeSchema = createInsertSchema(challenges).pick({
  title: true,
  description: true,
  type: true,
  duration: true,
  goals: true,
  creatorId: true,
  groupId: true,
  communityId: true,
  startDate: true,
  endDate: true
});
const challengeParticipants = pgTable("challenge_participants", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id),
  userId: integer("user_id").notNull().references(() => users.id),
  progress: jsonb("progress").default({}),
  isCompleted: boolean("is_completed").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
  completedAt: timestamp("completed_at")
});
const insertChallengeParticipantSchema = createInsertSchema(challengeParticipants).pick({
  challengeId: true,
  userId: true
});
const challengeTestimonials = pgTable("challenge_testimonials", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
const insertChallengeTestimonialSchema = createInsertSchema(challengeTestimonials).pick({
  challengeId: true,
  userId: true,
  content: true
});
const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  // book, podcast, video, article
  url: text("url"),
  author: text("author"),
  imageUrl: text("image_url"),
  tags: text("tags").array(),
  averageRating: integer("average_rating").default(0),
  submitterId: integer("submitter_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});
const insertResourceSchema = createInsertSchema(resources).pick({
  title: true,
  description: true,
  type: true,
  url: true,
  author: true,
  imageUrl: true,
  tags: true,
  submitterId: true
});
const resourceRatings = pgTable("resource_ratings", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").notNull().references(() => resources.id),
  userId: integer("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow()
});
const insertResourceRatingSchema = createInsertSchema(resourceRatings).pick({
  resourceId: true,
  userId: true,
  rating: true,
  review: true
});
const resourceCollections = pgTable("resource_collections", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow()
});
const insertResourceCollectionSchema = createInsertSchema(resourceCollections).pick({
  title: true,
  description: true,
  creatorId: true,
  isPublic: true
});
const collectionResources = pgTable("collection_resources", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id").notNull().references(() => resourceCollections.id),
  resourceId: integer("resource_id").notNull().references(() => resources.id),
  addedAt: timestamp("added_at").defaultNow()
});
const insertCollectionResourceSchema = createInsertSchema(collectionResources).pick({
  collectionId: true,
  resourceId: true
});
const serviceProjects = pgTable("service_projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  date: date("date"),
  startTime: time("start_time"),
  endTime: time("end_time"),
  organizerId: integer("organizer_id").notNull().references(() => users.id),
  communityId: integer("community_id").references(() => communities.id),
  groupId: integer("group_id").references(() => groups.id),
  volunteerLimit: integer("volunteer_limit"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow()
});
const insertServiceProjectSchema = createInsertSchema(serviceProjects).pick({
  title: true,
  description: true,
  location: true,
  date: true,
  startTime: true,
  endTime: true,
  organizerId: true,
  communityId: true,
  groupId: true,
  volunteerLimit: true,
  imageUrl: true
});
const serviceVolunteers = pgTable("service_volunteers", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => serviceProjects.id),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").notNull(),
  // signed-up, confirmed, attended, cancelled
  hoursServed: integer("hours_served"),
  createdAt: timestamp("created_at").defaultNow()
});
const insertServiceVolunteerSchema = createInsertSchema(serviceVolunteers).pick({
  projectId: true,
  userId: true,
  status: true
});
const serviceTestimonials = pgTable("service_testimonials", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => serviceProjects.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow()
});
const insertServiceTestimonialSchema = createInsertSchema(serviceTestimonials).pick({
  projectId: true,
  userId: true,
  content: true,
  imageUrl: true
});
const messages = pgTable("messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  senderId: integer("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: integer("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true
});
const contentReports = pgTable("content_reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").notNull().references(() => users.id),
  contentType: text("content_type").notNull(),
  // 'post', 'microblog', 'comment', 'event', 'prayer_request'
  contentId: integer("content_id").notNull(),
  reason: text("reason").notNull(),
  // 'spam', 'harassment', 'inappropriate', 'hate_speech', 'false_info', 'other'
  description: text("description"),
  status: text("status").default("pending"),
  // 'pending', 'reviewing', 'resolved', 'dismissed'
  moderatorId: integer("moderator_id").references(() => users.id),
  moderatorNotes: text("moderator_notes"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
const insertContentReportSchema = createInsertSchema(contentReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
  moderatorId: true,
  moderatorNotes: true
});
const userBlocks = pgTable("user_blocks", {
  id: serial("id").primaryKey(),
  blockerId: integer("blocker_id").notNull().references(() => users.id),
  blockedId: integer("blocked_id").notNull().references(() => users.id),
  reason: text("reason"),
  // 'harassment', 'spam', 'inappropriate', 'other'
  createdAt: timestamp("created_at").defaultNow()
});
const insertUserBlockSchema = createInsertSchema(userBlocks).omit({
  id: true,
  createdAt: true
});
const moderationActions = pgTable("moderation_actions", {
  id: serial("id").primaryKey(),
  moderatorId: integer("moderator_id").notNull().references(() => users.id),
  contentType: text("content_type").notNull(),
  contentId: integer("content_id").notNull(),
  action: text("action").notNull(),
  // 'warn', 'hide', 'delete', 'ban_user'
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow()
});
const insertModerationActionSchema = createInsertSchema(moderationActions).omit({
  id: true,
  createdAt: true
});
const moderationSettings = pgTable("moderation_settings", {
  id: serial("id").primaryKey(),
  autoModerateEnabled: boolean("auto_moderate_enabled").default(true),
  profanityFilterEnabled: boolean("profanity_filter_enabled").default(true),
  spamDetectionEnabled: boolean("spam_detection_enabled").default(true),
  reviewThreshold: integer("review_threshold").default(3),
  // Number of reports before auto-hide
  contactEmail: text("contact_email").default("support@theconnection.app"),
  responseTimeSlaHours: integer("response_time_sla_hours").default(24),
  updatedAt: timestamp("updated_at").defaultNow()
});
const insertModerationSettingsSchema = createInsertSchema(moderationSettings).omit({
  id: true,
  updatedAt: true
});
export {
  apologeticsAnswers,
  apologeticsQuestions,
  apologeticsResources,
  apologeticsTopics,
  apologistScholarApplications,
  bibleReadingPlans,
  bibleReadingProgress,
  bibleStudyNotes,
  challengeParticipants,
  challengeTestimonials,
  challenges,
  chatMessages,
  collectionResources,
  comments,
  communities,
  communityChatRooms,
  communityInvitations,
  communityMembers,
  communityWallPosts,
  contentRecommendations,
  contentReports,
  creatorTiers,
  eventRsvps,
  events,
  groupMembers,
  groups,
  insertApologeticsAnswerSchema,
  insertApologeticsQuestionSchema,
  insertApologeticsResourceSchema,
  insertApologeticsTopicSchema,
  insertApologistScholarApplicationSchema,
  insertBibleReadingPlanSchema,
  insertBibleReadingProgressSchema,
  insertBibleStudyNotesSchema,
  insertChallengeParticipantSchema,
  insertChallengeSchema,
  insertChallengeTestimonialSchema,
  insertChatMessageSchema,
  insertCollectionResourceSchema,
  insertCommentSchema,
  insertCommunityChatRoomSchema,
  insertCommunityInvitationSchema,
  insertCommunityMemberSchema,
  insertCommunityObjectSchema,
  insertCommunitySchema,
  insertCommunityWallPostSchema,
  insertContentRecommendationSchema,
  insertContentReportSchema,
  insertCreatorTierSchema,
  insertEventRsvpSchema,
  insertEventSchema,
  insertGroupMemberSchema,
  insertGroupSchema,
  insertLivestreamGiftSchema,
  insertLivestreamSchema,
  insertLivestreamerApplicationSchema,
  insertMentorProfileSchema,
  insertMentorshipRelationshipSchema,
  insertMentorshipRequestSchema,
  insertMessageSchema,
  insertMicroblogLikeSchema,
  insertMicroblogSchema,
  insertModerationActionSchema,
  insertModerationSettingsSchema,
  insertOrganizationSchema,
  insertOrganizationUserSchema,
  insertPostSchema,
  insertPrayerRequestSchema,
  insertPrayerSchema,
  insertResourceCollectionSchema,
  insertResourceRatingSchema,
  insertResourceSchema,
  insertServiceProjectSchema,
  insertServiceTestimonialSchema,
  insertServiceVolunteerSchema,
  insertUserBlockSchema,
  insertUserCreatorTierSchema,
  insertUserFollowSchema,
  insertUserInteractionSchema,
  insertUserPreferencesSchema,
  insertUserSchema,
  insertVerseMemorizationSchema,
  insertVirtualGiftSchema,
  livestreamGifts,
  livestreamerApplications,
  livestreams,
  mentorProfiles,
  mentorshipRelationships,
  mentorshipRequests,
  messages,
  microblogLikes,
  microblogs,
  moderationActions,
  moderationSettings,
  organizationUsers,
  organizations,
  posts,
  prayerRequests,
  prayers,
  resourceCollections,
  resourceRatings,
  resources,
  serviceProjects,
  serviceTestimonials,
  serviceVolunteers,
  sessions,
  userBlocks,
  userCreatorTiers,
  userFollows,
  userInteractions,
  userPreferences,
  users,
  verseMemorization,
  virtualGifts
};
