import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date, time, varchar, index, uuid, uniqueIndex, decimal } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { ORG_TIER_VALUES, ORG_BILLING_STATUSES } from "../../../shared/orgTierPlans";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Platform settings table - stores admin-configurable settings
export const platformSettings = pgTable("platform_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
});

// JWT token blacklist - persists blacklisted tokens across server restarts
export const tokenBlacklist = pgTable(
  "token_blacklist",
  {
    id: serial("id").primaryKey(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_token_blacklist_hash").on(table.tokenHash),
    index("IDX_token_blacklist_expires").on(table.expiresAt),
  ],
);

// Password reset tokens table - stores hashed tokens for security
export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(), // SHA-256 hash of the actual token
    email: text("email").notNull(), // Email at time of request (for audit)
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    usedAt: timestamp("used_at"), // Set when token is used (single-use enforcement)
  },
  (table) => [
    index("IDX_password_reset_token_hash").on(table.tokenHash),
    index("IDX_password_reset_user_id").on(table.userId),
    index("IDX_password_reset_expires_at").on(table.expiresAt),
  ],
);

// Users table schema
export const users = pgTable("users", {
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
  profileVisibility: text("profile_visibility").default("public"),
  showLocation: boolean("show_location").default(true),
  showInterests: boolean("show_interests").default(true),
  showActivity: boolean("show_activity").default(true),
  notifyDms: boolean("notify_dms").default(true),
  notifyCommunities: boolean("notify_communities").default(true),
  notifyForums: boolean("notify_forums").default(true),
  notifyFeed: boolean("notify_feed").default(true),
  dmPrivacy: text("dm_privacy").default("everyone"),
  emailVerified: boolean("email_verified").default(false),
  smsVerified: boolean("sms_verified").default(false),
  phoneNumber: text("phone_number"),
  emailVerificationToken: text("email_verification_token"),
  // New, more secure fields: store only a hash of the verification token
  emailVerificationTokenHash: text("email_verification_token_hash"),
  emailVerificationExpiresAt: timestamp("email_verification_expires_at"),
  emailVerificationLastSentAt: timestamp("email_verification_last_sent_at"),
  emailVerifiedAt: timestamp("email_verified_at"),
  smsVerificationCode: text("sms_verification_code"),
  loginAttempts: integer("login_attempts").default(0),
  lockoutUntil: timestamp("lockout_until"),
  // Two-Factor Authentication
  twoFactorSecret: text("two_factor_secret"), // Encrypted TOTP secret
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  // Christian-focused profile fields
  location: text("location"),
  denomination: text("denomination"),
  homeChurch: text("home_church"),
  favoriteBibleVerse: text("favorite_bible_verse"),
  testimony: text("testimony"),
  interests: text("interests"),
  // Age Assurance fields (Apple App Store requirement)
  dateOfBirth: date("date_of_birth"),
  ageGatePassed: boolean("age_gate_passed").default(false),
  ageVerifiedAt: timestamp("age_verified_at"),
  // Clergy verification fields
  isVerifiedClergy: boolean("is_verified_clergy").default(false),
  clergyVerifiedAt: timestamp("clergy_verified_at"),
  clergyVerifiedByOrgId: integer("clergy_verified_by_org_id").references(() => organizations.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isVerifiedApologeticsAnswerer: true,
  createdAt: true,
  updatedAt: true,
} as any);

// Organizations table schema (Churches and ministries)
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique(), // URL-friendly identifier, nullable for migration then NOT NULL
  description: text("description"),
  adminUserId: integer("admin_user_id").notNull().references(() => users.id),
  plan: text("plan").default("free"), // free, stewardship, partner (legacy - use orgBilling for new code)
  website: text("website"),
  email: text("email"), // Contact email for the organization
  logoUrl: text("logo_url"), // Organization logo/avatar
  mission: text("mission"), // Mission statement
  serviceTimes: text("service_times"), // JSON string of service times/schedule
  socialMedia: text("social_media"), // JSON string of social media links
  foundedDate: date("founded_date"), // When the organization was founded
  congregationSize: integer("congregation_size"), // Approximate size
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  phone: text("phone"),
  denomination: text("denomination"),
  // Visibility controls for public directory
  showPhone: boolean("show_phone").default(false),
  showAddress: boolean("show_address").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
} as any);

export const insertOrganizationSchema = createInsertSchema(organizations).pick({
  name: true,
  slug: true,
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
  denomination: true,
  showPhone: true,
  showAddress: true,
} as any);

// Organization members table
// Roles: owner (creator/primary admin), admin, moderator, member
// Note: "visitor" and "attendee" are computed at runtime, not stored here
export const organizationUsers = pgTable("organization_users", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text("role").default("member"), // owner, admin, moderator, member
  joinedAt: timestamp("joined_at").defaultNow(),
} as any);

export const insertOrganizationUserSchema = createInsertSchema(organizationUsers).pick({
  organizationId: true,
  userId: true,
  role: true,
} as any);

// Organization leaders table (About / Leadership section)
// For displaying pastors, staff, and leadership team on public profile
export const organizationLeaders = pgTable("organization_leaders", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  title: text("title"), // e.g., "Senior Pastor", "Youth Director"
  bio: text("bio"),
  photoUrl: text("photo_url"),
  isPublic: boolean("is_public").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"), // Soft delete
});

export const insertOrganizationLeaderSchema = createInsertSchema(organizationLeaders).pick({
  organizationId: true,
  name: true,
  title: true,
  bio: true,
  photoUrl: true,
  isPublic: true,
  sortOrder: true,
} as any);

export type OrganizationLeader = typeof organizationLeaders.$inferSelect;
export type InsertOrganizationLeader = typeof organizationLeaders.$inferInsert;

// Organization Announcements - church-wide announcements from leadership
export const organizationAnnouncements = pgTable("organization_announcements", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  authorId: integer("author_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  // Visibility: 'all' (public), 'members' (members only), 'leaders' (staff only)
  visibility: text("visibility").notNull().default("all"),
  // Optional: pin to top of announcement list
  isPinned: boolean("is_pinned").default(false),
  // Optional: expiration date for time-sensitive announcements
  expiresAt: timestamp("expires_at"),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"), // Soft delete
}, (table) => [
  index("org_announcements_org_idx").on(table.organizationId),
  index("org_announcements_created_idx").on(table.createdAt),
]);

export const insertOrganizationAnnouncementSchema = createInsertSchema(organizationAnnouncements).pick({
  organizationId: true,
  authorId: true,
  title: true,
  content: true,
  visibility: true,
  isPinned: true,
  expiresAt: true,
} as any);

export type OrganizationAnnouncement = typeof organizationAnnouncements.$inferSelect;
export type InsertOrganizationAnnouncement = typeof organizationAnnouncements.$inferInsert;

// User Church Affiliations - tracks where users attend/are members
// This is separate from organizationUsers which is for staff/leadership roles
export const userChurchAffiliations = pgTable("user_church_affiliations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: integer("organization_id").references(() => organizations.id, { onDelete: 'set null' }),
  // For churches not yet on the platform
  customChurchName: text("custom_church_name"),
  customChurchCity: text("custom_church_city"),
  customChurchState: text("custom_church_state"),
  // Affiliation type: 'attending' (visitor/attender) or 'member' (formal member)
  affiliationType: text("affiliation_type").notNull().default("attending"),
  // When this affiliation started
  startedAt: timestamp("started_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("user_church_affiliation_unique_idx").on(table.userId),
]);

export type UserChurchAffiliation = typeof userChurchAffiliations.$inferSelect;
export type InsertUserChurchAffiliation = typeof userChurchAffiliations.$inferInsert;

// Church Invitation Requests - when users request their church join the platform
export const churchInvitationRequests = pgTable("church_invitation_requests", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  churchName: text("church_name").notNull(),
  churchEmail: text("church_email").notNull(),
  churchCity: text("church_city"),
  churchState: text("church_state"),
  churchWebsite: text("church_website"),
  // Status: pending, sent, accepted, declined
  status: text("status").notNull().default("pending"),
  // If the church signs up, link to their organization
  resultingOrgId: integer("resulting_org_id").references(() => organizations.id, { onDelete: 'set null' }),
  sentAt: timestamp("sent_at"),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("church_invitation_requests_email_idx").on(table.churchEmail),
  index("church_invitation_requests_status_idx").on(table.status),
]);

export type ChurchInvitationRequest = typeof churchInvitationRequests.$inferSelect;
export type InsertChurchInvitationRequest = typeof churchInvitationRequests.$inferInsert;

// Communities table schema
export const communities = pgTable("communities", {
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
  // Filter fields for community discovery
  ageGroup: text("age_group"), // Youth, Young Adult, Adult, Seniors, All Ages
  gender: text("gender"), // Men's Only, Women's Only, Co-Ed
  ministryTypes: text("ministry_types").array(), // Bible Study, Prayer, Worship, etc.
  activities: text("activities").array(), // Sports, Music, Hiking, etc.
  professions: text("professions").array(), // Healthcare, Teachers, Tech, Blue Collar, etc.
  recoverySupport: text("recovery_support").array(), // Addiction Recovery, Grief Support, etc.
  meetingType: text("meeting_type"), // In-Person, Online, Hybrid
  frequency: text("frequency"), // Daily, Weekly, Bi-weekly, Monthly, One-time
  lifeStages: text("life_stages").array(), // Singles, Married, Students, etc.
  parentCategories: text("parent_categories").array(), // All Parents, Moms, Dads, etc.
  // Activity tracking fields
  lastActivityAt: timestamp("last_activity_at"), // Updated when post/event/chat happens
  recentPostCount: integer("recent_post_count").default(0), // Posts in last 7 days
  upcomingEventCount: integer("upcoming_event_count").default(0), // Events in next 30 days
  // Organization association
  organizationId: integer("organization_id").references(() => organizations.id, { onDelete: 'set null' }), // Nullable - for org-owned communities
  // Sub-communities
  parentCommunityId: integer("parent_community_id"), // Self-reference for sub-communities
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
  createdBy: integer("created_by").references(() => users.id),
} as any);

// Base schema without refinements - for frontend transformations
export const insertCommunityObjectSchema = createInsertSchema(communities).omit({
  id: true,
  memberCount: true,
  createdAt: true,
} as any);

// Refined schema with validation - for server use
export const insertCommunitySchema = insertCommunityObjectSchema
  .refine((data: any) => data.name && data.name.trim().length > 0, {
    message: "Community name is required and cannot be empty",
    path: ["name"]
  })
  .refine((data: any) => data.hasPrivateWall || data.hasPublicWall, {
    message: "At least one wall (private or public) must be enabled",
    path: ["hasPublicWall"]
  });

// Community members table schema with roles
export const communityMembers = pgTable("community_members", {
  id: serial("id").primaryKey(),
  communityId: integer("community_id").references(() => communities.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").notNull().default("member"), // "owner", "moderator", "member"
  joinedAt: timestamp("joined_at").defaultNow(),
} as any, (table) => ({
  uniqueMemberPerCommunity: uniqueIndex("community_members_unique_idx").on(table.communityId, table.userId),
}));

export const insertCommunityMemberSchema = createInsertSchema(communityMembers).pick({
  communityId: true,
  userId: true,
  role: true,
} as any);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;
export type OrganizationUser = typeof organizationUsers.$inferSelect;
export type InsertOrganizationUser = typeof organizationUsers.$inferInsert;
// Community invitations table schema
export const communityInvitations = pgTable("community_invitations", {
  id: serial("id").primaryKey(),
  communityId: integer("community_id").references(() => communities.id).notNull(),
  inviterUserId: integer("inviter_user_id").references(() => users.id).notNull(),
  inviteeEmail: text("invitee_email").notNull(),
  inviteeUserId: integer("invitee_user_id").references(() => users.id), // Optional - set when user exists
  status: text("status").notNull().default("pending"), // "pending", "accepted", "declined", "expired"
  token: text("token").notNull().unique(), // Secure token for invitation links
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
} as any);

export const insertCommunityInvitationSchema = createInsertSchema(communityInvitations).pick({
  communityId: true,
  inviterUserId: true,
  inviteeEmail: true,
  inviteeUserId: true,
  status: true,
  token: true,
  expiresAt: true,
} as any);

export type Community = typeof communities.$inferSelect;
export type InsertCommunity = typeof communities.$inferInsert;
export type CommunityMember = typeof communityMembers.$inferSelect;
export type InsertCommunityMember = typeof communityMembers.$inferInsert;
export type CommunityInvitation = typeof communityInvitations.$inferSelect;
export type InsertCommunityInvitation = typeof communityInvitations.$inferInsert;
export type CommunityChatRoom = typeof communityChatRooms.$inferSelect;
export type InsertCommunityChatRoom = typeof communityChatRooms.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
export type CommunityWallPost = typeof communityWallPosts.$inferSelect;
export type InsertCommunityWallPost = typeof communityWallPosts.$inferInsert;

// User Follows table schema for social graph
// status: 'pending' for follow requests on private accounts, 'accepted' for confirmed follows
export const userFollows = pgTable("user_follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").references(() => users.id).notNull(),
  followingId: integer("following_id").references(() => users.id).notNull(),
  status: text("status").notNull().default("accepted"), // 'pending' | 'accepted'
  createdAt: timestamp("created_at").defaultNow(),
} as any);

export const insertUserFollowSchema = createInsertSchema(userFollows).pick({
  followerId: true,
  followingId: true,
} as any);

// User Interactions table for recommendation algorithm
export const userInteractions = pgTable("user_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  contentId: integer("content_id").notNull(),
  contentType: text("content_type").notNull(), // 'microblog', 'community', 'event', 'prayer_request', 'bible_study'
  interactionType: text("interaction_type").notNull(), // 'view', 'like', 'comment', 'share', 'save', 'prayer_request', 'bible_study'
  interactionStrength: integer("interaction_strength").default(1), // Weight of interaction based on faith-based scoring
  metadata: jsonb("metadata"), // Store additional context like topic tags, sentiment
  createdAt: timestamp("created_at").defaultNow(),
} as any);

export const insertUserInteractionSchema = createInsertSchema(userInteractions).pick({
  userId: true,
  contentId: true,
  contentType: true,
  interactionType: true,
  interactionStrength: true,
} as any);

export type UserFollow = typeof userFollows.$inferSelect;
export type InsertUserFollow = typeof userFollows.$inferInsert;
export type UserInteraction = typeof userInteractions.$inferSelect;
export type InsertUserInteraction = typeof userInteractions.$inferInsert;



// Community Chat Rooms schema
export const communityChatRooms = pgTable("community_chat_rooms", {
  id: serial("id").primaryKey(),
  communityId: integer("community_id").references(() => communities.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isPrivate: boolean("is_private").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
} as any);

export const insertCommunityChatRoomSchema = createInsertSchema(communityChatRooms).pick({
  communityId: true,
  name: true,
  description: true,
  isPrivate: true,
  createdBy: true,
} as any);

// Chat Room Messages schema
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  chatRoomId: integer("chat_room_id").references(() => communityChatRooms.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  isSystemMessage: boolean("is_system_message").default(false),
  isAnnouncement: boolean("is_announcement").default(false), // Admin/mod announcements that notify all members
  createdAt: timestamp("created_at").defaultNow(),
} as any);

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  content: true,
  chatRoomId: true,
  senderId: true,
  isSystemMessage: true,
  isAnnouncement: true,
} as any);

// Community Wall Posts schema
export const communityWallPosts = pgTable("community_wall_posts", {
  id: serial("id").primaryKey(),
  communityId: integer("community_id").references(() => communities.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  isPrivate: boolean("is_private").default(false), // For private wall posts
  likeCount: integer("like_count").default(0),
  commentCount: integer("comment_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
} as any);

export const insertCommunityWallPostSchema = createInsertSchema(communityWallPosts).pick({
  communityId: true,
  authorId: true,
  content: true,
  imageUrl: true,
  isPrivate: true,
} as any);

// Groups table schema (private groups)
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconName: text("icon_name").notNull(),
  iconColor: text("icon_color").notNull(),
  isPrivate: boolean("is_private").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
} as any);

export const insertGroupSchema = createInsertSchema(groups).pick({
  name: true,
  description: true,
  iconName: true,
  iconColor: true,
  isPrivate: true,
  createdBy: true,
} as any);

// Group members table schema
export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => groups.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  isAdmin: boolean("is_admin").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
} as any);

export const insertGroupMemberSchema = createInsertSchema(groupMembers).pick({
  groupId: true,
  userId: true,
  isAdmin: true,
} as any);

// Posts table schema
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"), // Legacy single image (kept for backward compatibility)
  imageUrls: jsonb("image_urls").default('[]'), // Multiple images support (JSONB array)
  videoUrl: text("video_url"), // Video attachment
  gifUrl: text("gif_url"), // GIF attachment (from Giphy)
  communityId: integer("community_id").references(() => communities.id),
  groupId: integer("group_id").references(() => groups.id),
  authorId: integer("author_id").references(() => users.id),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  commentCount: integer("comment_count").default(0),
  detectedLanguage: text("detected_language"), // ISO 639-1 language code (e.g., en, ar, es)
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
} as any);

export const insertPostSchema = createInsertSchema(posts).pick({
  title: true,
  content: true,
  imageUrl: true,
  imageUrls: true,
  videoUrl: true,
  gifUrl: true,
  communityId: true,
  groupId: true,
  authorId: true,
} as any);

export const postVotes = pgTable(
  "post_votes",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id").notNull().references(() => posts.id),
    userId: integer("user_id").notNull().references(() => users.id),
    voteType: text("vote_type").default("upvote"), // 'upvote' or 'downvote'
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("post_votes_post_user_idx").on(table.postId, table.userId),
  ],
);

export const insertPostVoteSchema = createInsertSchema(postVotes).pick({
  postId: true,
  userId: true,
} as any);

// Comments table schema
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  postId: integer("post_id").notNull(),
  authorId: integer("author_id"),
  parentId: integer("parent_id"),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
} as any);

export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
  postId: true,
  authorId: true,
  parentId: true,
} as any);

export const commentVotes = pgTable(
  "comment_votes",
  {
    id: serial("id").primaryKey(),
    commentId: integer("comment_id").notNull().references(() => comments.id),
    userId: integer("user_id").notNull().references(() => users.id),
    voteType: text("vote_type").default("upvote"), // 'upvote' or 'downvote'
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("comment_votes_comment_user_idx").on(table.commentId, table.userId),
  ],
);

export const insertCommentVoteSchema = createInsertSchema(commentVotes).pick({
  commentId: true,
  userId: true,
} as any);

// Post-Hashtag junction table
export const postHashtags = pgTable("post_hashtags", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .references(() => posts.id, { onDelete: 'cascade' })
    .notNull(),
  hashtagId: integer("hashtag_id")
    .references(() => hashtags.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_post_hashtag_unique").on(table.postId, table.hashtagId),
  index("idx_post_hashtags_post").on(table.postId),
  index("idx_post_hashtags_hashtag").on(table.hashtagId),
]);

export type PostHashtag = typeof postHashtags.$inferSelect;
export type InsertPostHashtag = typeof postHashtags.$inferInsert;

// Post-Keyword junction table
export const postKeywords = pgTable("post_keywords", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .references(() => posts.id, { onDelete: 'cascade' })
    .notNull(),
  keywordId: integer("keyword_id")
    .references(() => keywords.id, { onDelete: 'cascade' })
    .notNull(),
  frequency: integer("frequency").default(1),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_post_keyword_unique").on(table.postId, table.keywordId),
  index("idx_post_keywords_post").on(table.postId),
  index("idx_post_keywords_keyword").on(table.keywordId),
]);

export type PostKeyword = typeof postKeywords.$inferSelect;
export type InsertPostKeyword = typeof postKeywords.$inferInsert;

// Apologetics resources schema
export const apologeticsResources = pgTable("apologetics_resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // book, video, podcast, etc.
  iconName: text("icon_name").notNull(),
  url: text("url"),
  createdAt: timestamp("created_at").defaultNow(),
} as any);

export const insertApologeticsResourceSchema = createInsertSchema(apologeticsResources).pick({
  title: true,
  description: true,
  type: true,
  iconName: true,
  url: true,
} as any);

// Apologetics Q&A system
export const apologeticsTopics = pgTable("apologetics_topics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  iconName: text("icon_name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
} as any);

export const insertApologeticsTopicSchema = createInsertSchema(apologeticsTopics).pick({
  name: true,
  description: true,
  iconName: true,
  slug: true,
} as any);

export const apologeticsAnswererPermissions = pgTable("apologetics_answerer_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  topicId: integer("topic_id").references(() => apologeticsTopics.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
} as any);

export const insertApologeticsAnswererPermissionSchema = createInsertSchema(apologeticsAnswererPermissions).pick({
  userId: true,
  topicId: true,
} as any);

export const apologeticsQuestions = pgTable("apologetics_questions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  topicId: integer("topic_id").references(() => apologeticsTopics.id).notNull(),
  status: text("status").notNull().default("open"), // open, answered, closed
  requiresVerifiedAnswerer: boolean("requires_verified_answerer").notNull().default(false),
  answerCount: integer("answer_count").default(0),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
} as any);

export const insertApologeticsQuestionSchema = createInsertSchema(apologeticsQuestions).pick({
  title: true,
  content: true,
  authorId: true,
  topicId: true,
  status: true,
  requiresVerifiedAnswerer: true,
} as any);

export const apologeticsAnswers = pgTable("apologetics_answers", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  questionId: integer("question_id").references(() => apologeticsQuestions.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  isVerifiedAnswer: boolean("is_verified_answer").default(false),
  upvotes: integer("upvotes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
} as any);

export const insertApologeticsAnswerSchema = createInsertSchema(apologeticsAnswers).pick({
  content: true,
  questionId: true,
  authorId: true,
  isVerifiedAnswer: true,
} as any);

// Apologetics Bookmarks - User saved Q&A items
export const apologeticsBookmarks = pgTable("apologetics_bookmarks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  questionId: integer("question_id").references(() => userQuestions.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
} as any, (table) => [
  uniqueIndex("idx_apologetics_bookmarks_user_question").on(table.userId, table.questionId),
]);

export const insertApologeticsBookmarkSchema = createInsertSchema(apologeticsBookmarks).pick({
  userId: true,
  questionId: true,
} as any);

export type InsertApologeticsBookmark = typeof apologeticsBookmarks.$inferInsert;
export type ApologeticsBookmark = typeof apologeticsBookmarks.$inferSelect;

// Remove these duplicate type definitions - they're already defined earlier

export type InsertGroup = typeof groups.$inferInsert;
export type Group = typeof groups.$inferSelect;

export type InsertGroupMember = typeof groupMembers.$inferInsert;
export type GroupMember = typeof groupMembers.$inferSelect;

export type InsertPost = typeof posts.$inferInsert;
export type Post = typeof posts.$inferSelect;

export type InsertPostVote = typeof postVotes.$inferInsert;
export type PostVote = typeof postVotes.$inferSelect;

export type InsertComment = typeof comments.$inferInsert;
export type Comment = typeof comments.$inferSelect;

export type InsertCommentVote = typeof commentVotes.$inferInsert;
export type CommentVote = typeof commentVotes.$inferSelect;

export type InsertApologeticsResource = typeof apologeticsResources.$inferInsert;
export type ApologeticsResource = typeof apologeticsResources.$inferSelect;

export type InsertApologeticsTopic = typeof apologeticsTopics.$inferInsert;
export type ApologeticsTopic = typeof apologeticsTopics.$inferSelect;

export type InsertApologeticsQuestion = typeof apologeticsQuestions.$inferInsert;
export type ApologeticsQuestion = typeof apologeticsQuestions.$inferSelect;

export type InsertApologeticsAnswer = typeof apologeticsAnswers.$inferInsert;
export type ApologeticsAnswer = typeof apologeticsAnswers.$inferSelect;

export type InsertApologeticsAnswererPermission = typeof apologeticsAnswererPermissions.$inferInsert;
export type ApologeticsAnswererPermission = typeof apologeticsAnswererPermissions.$inferSelect;

// Livestreams table schema
export const livestreams = pgTable("livestreams", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  hostId: integer("host_id").references(() => users.id).notNull(),
  thumbnail: text("thumbnail"),
  status: text("status").notNull().default("upcoming"), // "live", "upcoming", "ended"
  viewerCount: integer("viewer_count").default(0),
  scheduledFor: timestamp("scheduled_for"),
  duration: text("duration"),
  tags: text("tags"),
  createdAt: timestamp("created_at").defaultNow(),
} as any);

export const insertLivestreamSchema = createInsertSchema(livestreams).pick({
  title: true,
  description: true,
  hostId: true,
  thumbnail: true,
  status: true,
  scheduledFor: true,
  duration: true,
  tags: true,
} as any);

export type InsertLivestream = typeof livestreams.$inferInsert;
export type Livestream = typeof livestreams.$inferSelect;

// Livestreamer application and approval system
export const livestreamerApplications = pgTable("livestreamer_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  status: text("status").notNull().default("pending"), // "pending", "approved", "rejected"
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
  submittedAt: timestamp("submitted_at").defaultNow(),
} as any);

export const insertLivestreamerApplicationSchema = createInsertSchema(livestreamerApplications).pick({
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
} as any);

// Creator tier and incentive structure
export const creatorTiers = pgTable("creator_tiers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  benefits: text("benefits").notNull(),
  iconName: text("icon_name").notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
} as any);

export const insertCreatorTierSchema = createInsertSchema(creatorTiers).pick({
  name: true,
  description: true,
  requirements: true,
  benefits: true,
  iconName: true,
  order: true,
} as any);

// User-Creator tier relationship
export const userCreatorTiers = pgTable("user_creator_tiers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  tierId: integer("tier_id").references(() => creatorTiers.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  validUntil: timestamp("valid_until"),
} as any);

export const insertUserCreatorTierSchema = createInsertSchema(userCreatorTiers).pick({
  userId: true,
  tierId: true,
  validUntil: true,
} as any);

// Virtual gifts that can be sent during livestreams
export const virtualGifts = pgTable("virtual_gifts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconName: text("icon_name").notNull(),
  value: integer("value").notNull(), // Value in platform points/currency
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
} as any);

export const insertVirtualGiftSchema = createInsertSchema(virtualGifts).pick({
  name: true,
  description: true,
  iconName: true,
  value: true,
  isActive: true,
} as any);

// Record of gifts sent during livestreams
export const livestreamGifts = pgTable("livestream_gifts", {
  id: serial("id").primaryKey(),
  livestreamId: integer("livestream_id").references(() => livestreams.id).notNull(),
  giftId: integer("gift_id").references(() => virtualGifts.id).notNull(),
  senderId: integer("sender_id").references(() => users.id),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  message: text("message"),
  sentAt: timestamp("sent_at").defaultNow(),
} as any);

export const insertLivestreamGiftSchema = createInsertSchema(livestreamGifts).pick({
  livestreamId: true,
  giftId: true,
  senderId: true,
  receiverId: true,
  message: true,
} as any);

// Export additional types
export type InsertLivestreamerApplication = typeof livestreamerApplications.$inferInsert;
export type LivestreamerApplication = typeof livestreamerApplications.$inferSelect;

// Apologist Scholar Contributor application system
export const apologistScholarApplications = pgTable("apologist_scholar_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  status: text("status").notNull().default("pending"), // "pending", "approved", "rejected"
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
  submittedAt: timestamp("submitted_at").defaultNow(),
} as any);

export const insertApologistScholarApplicationSchema = createInsertSchema(apologistScholarApplications).pick({
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
} as any);

export type InsertApologistScholarApplication = typeof apologistScholarApplications.$inferInsert;
export type ApologistScholarApplication = typeof apologistScholarApplications.$inferSelect;

export type InsertCreatorTier = typeof creatorTiers.$inferInsert;
export type CreatorTier = typeof creatorTiers.$inferSelect;

export type InsertUserCreatorTier = typeof userCreatorTiers.$inferInsert;
export type UserCreatorTier = typeof userCreatorTiers.$inferSelect;

export type InsertVirtualGift = typeof virtualGifts.$inferInsert;
export type VirtualGift = typeof virtualGifts.$inferSelect;

export type InsertLivestreamGift = typeof livestreamGifts.$inferInsert;
export type LivestreamGift = typeof livestreamGifts.$inferSelect;

// Topic categories for microblogs
export const MICROBLOG_TOPICS = [
  'OBSERVATION',
  'QUESTION',
  'NEWS',
  'CULTURE',
  'ENTERTAINMENT',
  'SCRIPTURE',
  'TESTIMONY',
  'PRAYER',
  'OTHER'
] as const;
export type MicroblogTopic = typeof MICROBLOG_TOPICS[number];

// Post types
export const MICROBLOG_TYPES = ['STANDARD', 'POLL'] as const;
export type MicroblogType = typeof MICROBLOG_TYPES[number];

// Microblog posts (Twitter-like) schema
export const microblogs: any = pgTable("microblogs", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  imageUrl: text("image_url"), // Legacy single image (kept for backward compatibility)
  imageUrls: jsonb("image_urls").default('[]'), // Multiple images support (JSONB array)
  videoUrl: text("video_url"), // Video attachment
  gifUrl: text("gif_url"), // GIF attachment (from Giphy)
  authorId: integer("author_id").references(() => users.id).notNull(),
  communityId: integer("community_id").references(() => communities.id), // Optional community (public if null)
  groupId: integer("group_id").references(() => groups.id), // Optional private group (public if null)
  likeCount: integer("like_count").default(0),
  repostCount: integer("repost_count").default(0),
  replyCount: integer("reply_count").default(0),
  bookmarkCount: integer("bookmark_count").default(0), // Cached bookmark count for ranking
  uniqueReplierCount: integer("unique_replier_count").default(0), // Cached unique repliers for ranking
  helpfulCount: integer("helpful_count").default(0), // Cached count of "helpful" marks (for replies)
  parentId: integer("parent_id").references(() => microblogs.id), // For replies to other microblogs
  detectedLanguage: text("detected_language"), // ISO 639-1 language code (e.g., en, ar, es)
  // New fields for post types and polls
  topic: text("topic").default('OTHER'), // OBSERVATION, QUESTION, NEWS, CULTURE, ENTERTAINMENT, SCRIPTURE, TESTIMONY, PRAYER, OTHER
  postType: text("post_type").default('STANDARD'), // STANDARD or POLL
  pollId: integer("poll_id"), // FK to polls table (set after poll creation)
  sourceUrl: text("source_url"), // For NEWS/CULTURE/ENTERTAINMENT posts with external links
  anonymousNickname: text("anonymous_nickname"), // Optional nickname for anonymous advice posts (e.g., "Struggling Mom")
  anonymousCity: text("anonymous_city"), // Optional city for advice posts to connect with nearby users
  mediaType: text("media_type"), // 'image', 'video', or null
  createdAt: timestamp("created_at").defaultNow(),
} as any);

export const insertMicroblogSchema = createInsertSchema(microblogs).pick({
  content: true,
  imageUrl: true,
  imageUrls: true,
  videoUrl: true,
  gifUrl: true,
  authorId: true,
  communityId: true,
  groupId: true,
  parentId: true,
  topic: true,
  postType: true,
  pollId: true,
  sourceUrl: true,
  anonymousNickname: true,
  anonymousCity: true,
} as any);

// Microblog likes table for tracking user likes
export const microblogLikes = pgTable("microblog_likes", {
  id: serial("id").primaryKey(),
  microblogId: integer("microblog_id").references(() => microblogs.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Composite index for checking if user liked a microblog
  uniqueIndex("idx_microblog_likes_microblog_user").on(table.microblogId, table.userId),
  // Index for batch queries (fetching all likes for multiple microblogs)
  index("idx_microblog_likes_microblog_id").on(table.microblogId),
  // Index for user queries (user's likes)
  index("idx_microblog_likes_user_id").on(table.userId),
]);

export const insertMicroblogLikeSchema = createInsertSchema(microblogLikes).pick({
  microblogId: true,
  userId: true,
} as any);

// Microblog reposts table for tracking user reposts
export const microblogReposts = pgTable("microblog_reposts", {
  id: serial("id").primaryKey(),
  microblogId: integer("microblog_id").references(() => microblogs.id, { onDelete: 'cascade' }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_microblog_reposts_microblog_user").on(table.microblogId, table.userId),
  index("idx_microblog_reposts_microblog_id").on(table.microblogId),
  index("idx_microblog_reposts_user_id").on(table.userId),
]);

export const insertMicroblogRepostSchema = createInsertSchema(microblogReposts).pick({
  microblogId: true,
  userId: true,
} as any);

// Microblog bookmarks table for tracking user bookmarks
export const microblogBookmarks = pgTable("microblog_bookmarks", {
  id: serial("id").primaryKey(),
  microblogId: integer("microblog_id").references(() => microblogs.id, { onDelete: 'cascade' }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_microblog_bookmarks_microblog_user").on(table.microblogId, table.userId),
  index("idx_microblog_bookmarks_microblog_id").on(table.microblogId),
  index("idx_microblog_bookmarks_user_id").on(table.userId),
]);

export const insertMicroblogBookmarkSchema = createInsertSchema(microblogBookmarks).pick({
  microblogId: true,
  userId: true,
} as any);

// ============================================================================
// POLLS SYSTEM
// ============================================================================

// Polls table - stores poll metadata
export const polls = pgTable("polls", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(), // Poll question/title
  endsAt: timestamp("ends_at"), // When voting closes (null = no expiration)
  allowMultiple: boolean("allow_multiple").default(false), // Allow voting for multiple options
  totalVotes: integer("total_votes").default(0), // Cached total vote count
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_polls_ends_at").on(table.endsAt),
]);

export const insertPollSchema = createInsertSchema(polls).pick({
  question: true,
  endsAt: true,
  allowMultiple: true,
} as any);

export type Poll = typeof polls.$inferSelect;
export type InsertPoll = typeof polls.$inferInsert;

// Poll options table - stores the choices for each poll
export const pollOptions = pgTable("poll_options", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").references(() => polls.id, { onDelete: 'cascade' }).notNull(),
  text: text("text").notNull(), // Option text
  orderIndex: integer("order_index").default(0), // Display order
  voteCount: integer("vote_count").default(0), // Cached vote count for this option
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_poll_options_poll").on(table.pollId),
]);

export const insertPollOptionSchema = createInsertSchema(pollOptions).pick({
  pollId: true,
  text: true,
  orderIndex: true,
} as any);

export type PollOption = typeof pollOptions.$inferSelect;
export type InsertPollOption = typeof pollOptions.$inferInsert;

// Poll votes table - tracks who voted for what
export const pollVotes = pgTable("poll_votes", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").references(() => polls.id, { onDelete: 'cascade' }).notNull(),
  optionId: integer("option_id").references(() => pollOptions.id, { onDelete: 'cascade' }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // For single-vote polls: one vote per user per poll
  // For multi-vote: one vote per user per option
  uniqueIndex("idx_poll_votes_user_option").on(table.pollId, table.optionId, table.userId),
  index("idx_poll_votes_poll").on(table.pollId),
  index("idx_poll_votes_user").on(table.userId),
]);

export const insertPollVoteSchema = createInsertSchema(pollVotes).pick({
  pollId: true,
  optionId: true,
  userId: true,
} as any);

export type PollVote = typeof pollVotes.$inferSelect;
export type InsertPollVote = typeof pollVotes.$inferInsert;

// ============================================================================
// END POLLS SYSTEM
// ============================================================================

// Post bookmarks table for tracking user bookmarks
export const postBookmarks = pgTable("post_bookmarks", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
} as any);

export const insertPostBookmarkSchema = createInsertSchema(postBookmarks).pick({
  postId: true,
  userId: true,
} as any);

// Hashtags table
export const hashtags = pgTable("hashtags", {
  id: serial("id").primaryKey(),
  tag: text("tag").notNull().unique(),
  displayTag: text("display_tag").notNull(),
  trendingScore: integer("trending_score").default(0),
  usageCount: integer("usage_count").default(0),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_hashtags_trending").on(table.trendingScore),
  index("idx_hashtags_tag").on(table.tag),
]);

export const insertHashtagSchema = createInsertSchema(hashtags).pick({
  tag: true,
  displayTag: true,
} as any);

export type Hashtag = typeof hashtags.$inferSelect;
export type InsertHashtag = typeof hashtags.$inferInsert;

// Microblog-Hashtag junction table
export const microblogHashtags = pgTable("microblog_hashtags", {
  id: serial("id").primaryKey(),
  microblogId: integer("microblog_id")
    .references(() => microblogs.id, { onDelete: 'cascade' })
    .notNull(),
  hashtagId: integer("hashtag_id")
    .references(() => hashtags.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_microblog_hashtag_unique").on(table.microblogId, table.hashtagId),
  index("idx_microblog_hashtags_microblog").on(table.microblogId),
  index("idx_microblog_hashtags_hashtag").on(table.hashtagId),
]);

export type MicroblogHashtag = typeof microblogHashtags.$inferSelect;
export type InsertMicroblogHashtag = typeof microblogHashtags.$inferInsert;

// Keywords table (similar to hashtags, but for extracted keywords without # symbol)
export const keywords = pgTable("keywords", {
  id: serial("id").primaryKey(),
  keyword: text("keyword").notNull().unique(),
  displayKeyword: text("display_keyword").notNull(),
  trendingScore: integer("trending_score").default(0),
  usageCount: integer("usage_count").default(0),
  lastUsedAt: timestamp("last_used_at"),
  isProperNoun: boolean("is_proper_noun").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_keywords_trending").on(table.trendingScore),
  index("idx_keywords_keyword").on(table.keyword),
]);

export const insertKeywordSchema = createInsertSchema(keywords).pick({
  keyword: true,
  displayKeyword: true,
  isProperNoun: true,
} as any);

export type Keyword = typeof keywords.$inferSelect;
export type InsertKeyword = typeof keywords.$inferInsert;

// Microblog-Keyword junction table
export const microblogKeywords = pgTable("microblog_keywords", {
  id: serial("id").primaryKey(),
  microblogId: integer("microblog_id")
    .references(() => microblogs.id, { onDelete: 'cascade' })
    .notNull(),
  keywordId: integer("keyword_id")
    .references(() => keywords.id, { onDelete: 'cascade' })
    .notNull(),
  frequency: integer("frequency").default(1),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_microblog_keyword_unique").on(table.microblogId, table.keywordId),
  index("idx_microblog_keywords_microblog").on(table.microblogId),
  index("idx_microblog_keywords_keyword").on(table.keywordId),
]);

export type MicroblogKeyword = typeof microblogKeywords.$inferSelect;
export type InsertMicroblogKeyword = typeof microblogKeywords.$inferInsert;

export type InsertMicroblog = typeof microblogs.$inferInsert;
export type Microblog = typeof microblogs.$inferSelect;

export type InsertMicroblogLike = typeof microblogLikes.$inferInsert;
export type MicroblogLike = typeof microblogLikes.$inferSelect;

export type InsertMicroblogRepost = typeof microblogReposts.$inferInsert;
export type MicroblogRepost = typeof microblogReposts.$inferSelect;

export type InsertMicroblogBookmark = typeof microblogBookmarks.$inferInsert;
export type MicroblogBookmark = typeof microblogBookmarks.$inferSelect;

export type InsertPostBookmark = typeof postBookmarks.$inferInsert;
export type PostBookmark = typeof postBookmarks.$inferSelect;

// Duplicate type definitions removed - they're already defined earlier in the file

// ========================
// COMMUNITY EVENTS
// ========================
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category"), // Event type: Sunday Service, Worship, Bible Study, Prayer Meeting, Activity, etc.
  location: text("location"), // General location name
  address: text("address"), // Full street address
  city: text("city"), // City
  state: text("state"), // State or province
  zipCode: text("zip_code"), // Postal/ZIP code
  isVirtual: boolean("is_virtual").default(false),
  isPublic: boolean("is_public").default(false), // Allow events to be publicly visible
  showOnMap: boolean("show_on_map").default(true), // Whether to display the event on maps
  virtualMeetingUrl: text("virtual_meeting_url"),
  eventDate: date("event_date").notNull(),
  eventEndDate: date("event_end_date"), // For multi-day events (e.g., conferences)
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  imageUrl: text("image_url"),
  imagePosition: text("image_position").default('center'), // Focal point for card display: top, center, bottom
  targetGender: text("target_gender"), // Target audience gender: men, women, or null (all)
  targetAgeGroup: text("target_age_group"), // Target audience age group: kids, teens, young_adults, adults, seniors, or null (all ages)
  latitude: text("latitude"), // For map integration
  longitude: text("longitude"), // For map integration
  // Recurring event fields
  recurrenceRule: text("recurrence_rule"), // iCal RRULE format (e.g., FREQ=WEEKLY;BYDAY=SU)
  recurrenceEndDate: timestamp("recurrence_end_date"), // When recurrence stops
  parentEventId: integer("parent_event_id"), // Self-reference for recurrence instances
  communityId: integer("community_id").references(() => communities.id), // Nullable - admin can create events for "The Connection" without a community
  groupId: integer("group_id").references(() => groups.id),
  organizationId: integer("organization_id").references(() => organizations.id, { onDelete: 'set null' }), // Nullable - for org-owned events
  creatorId: integer("creator_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  // deletedAt: timestamp("deleted_at"), // Not in actual DB table
} as any);

export const insertEventSchema = createInsertSchema(events).pick({
  title: true,
  description: true,
  category: true,
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
  eventEndDate: true,
  startTime: true,
  endTime: true,
  imageUrl: true,
  imagePosition: true,
  targetGender: true,
  targetAgeGroup: true,
  latitude: true,
  longitude: true,
  communityId: true,
  groupId: true,
  organizationId: true,
  creatorId: true,
} as any);

export const eventRsvps = pgTable(
  "event_rsvps",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id").notNull().references(() => events.id),
    userId: integer("user_id").notNull().references(() => users.id),
    status: text("status").notNull(), // going, maybe, not_going
    createdAt: timestamp("created_at").defaultNow(),
    confirmedAt: timestamp("confirmed_at"), // null = not confirmed, set = confirmed attendance (shows on profile)
  },
  (table) => [
    uniqueIndex("event_rsvps_event_user_idx").on(table.eventId, table.userId),
  ],
);

export const insertEventRsvpSchema = createInsertSchema(eventRsvps).pick({
  eventId: true,
  userId: true,
  status: true,
} as any);

// Event bookmarks table for tracking user bookmarks on events
export const eventBookmarks = pgTable("event_bookmarks", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id, { onDelete: 'cascade' }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("event_bookmarks_event_user_idx").on(table.eventId, table.userId),
]);

export const insertEventBookmarkSchema = createInsertSchema(eventBookmarks).pick({
  eventId: true,
  userId: true,
} as any);

export type InsertEventBookmark = typeof eventBookmarks.$inferInsert;
export type EventBookmark = typeof eventBookmarks.$inferSelect;

// Event invitations table for inviting users to events
export const eventInvitations = pgTable("event_invitations", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id, { onDelete: 'cascade' }).notNull(),
  inviterId: integer("inviter_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  inviteeId: integer("invitee_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'accepted', 'declined'
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
}, (table) => [
  uniqueIndex("event_invitations_unique_idx").on(table.eventId, table.inviteeId),
]);

export const insertEventInvitationSchema = createInsertSchema(eventInvitations).pick({
  eventId: true,
  inviterId: true,
  inviteeId: true,
  status: true,
} as any);

export type EventInvitation = typeof eventInvitations.$inferSelect;
export type InsertEventInvitation = typeof eventInvitations.$inferInsert;

// ========================
// PRAYER REQUESTS
// ========================
export const prayerRequests = pgTable("prayer_requests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isAnonymous: boolean("is_anonymous").default(false),
  privacyLevel: text("privacy_level").notNull(), // public, friends-only, group-only, community-only, organization-only
  groupId: integer("group_id").references(() => groups.id),
  communityId: integer("community_id").references(() => communities.id),
  organizationId: integer("organization_id").references(() => organizations.id, { onDelete: 'set null' }), // Nullable - for org-owned prayer requests
  authorId: integer("author_id").notNull().references(() => users.id),
  prayerCount: integer("prayer_count").default(0),
  isAnswered: boolean("is_answered").default(false),
  answeredDescription: text("answered_description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
} as any);

export const insertPrayerRequestSchema = createInsertSchema(prayerRequests).pick({
  title: true,
  content: true,
  isAnonymous: true,
  privacyLevel: true,
  groupId: true,
  communityId: true,
  organizationId: true,
  authorId: true,
} as any);

export const prayers = pgTable("prayers", {
  id: serial("id").primaryKey(),
  prayerRequestId: integer("prayer_request_id").notNull().references(() => prayerRequests.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
} as any);

export const insertPrayerSchema = createInsertSchema(prayers).pick({
  prayerRequestId: true,
  userId: true,
} as any);

// ========================
// MENTORSHIP PROGRAM
// ========================
export const mentorProfiles = pgTable("mentor_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  spiritualGifts: text("spiritual_gifts").array(),
  areasOfExpertise: text("areas_of_expertise").array(),
  yearsOfFaith: integer("years_of_faith"),
  shortBio: text("short_bio").notNull(),
  availability: text("availability").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
} as any);

export const insertMentorProfileSchema = createInsertSchema(mentorProfiles).pick({
  userId: true,
  spiritualGifts: true,
  areasOfExpertise: true,
  yearsOfFaith: true,
  shortBio: true,
  availability: true,
} as any);

export const mentorshipRequests = pgTable("mentorship_requests", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id").notNull().references(() => users.id),
  menteeId: integer("mentee_id").notNull().references(() => users.id),
  message: text("message"),
  status: text("status").notNull(), // pending, accepted, declined
  createdAt: timestamp("created_at").defaultNow(),
} as any);

export const insertMentorshipRequestSchema = createInsertSchema(mentorshipRequests).pick({
  mentorId: true,
  menteeId: true,
  message: true,
  status: true,
} as any);

export const mentorshipRelationships = pgTable("mentorship_relationships", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id").notNull().references(() => users.id),
  menteeId: integer("mentee_id").notNull().references(() => users.id),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  goals: jsonb("goals"),
} as any);

export const insertMentorshipRelationshipSchema = createInsertSchema(mentorshipRelationships).pick({
  mentorId: true,
  menteeId: true,
  goals: true,
} as any);

// ========================
// BIBLE STUDY TOOLS
// ========================
export const bibleReadingPlans = pgTable("bible_reading_plans", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  duration: integer("duration").notNull(), // days
  readings: jsonb("readings").notNull(), // Array of daily readings
  creatorId: integer("creator_id").references(() => users.id),
  groupId: integer("group_id").references(() => groups.id),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
} as any);

export const insertBibleReadingPlanSchema = createInsertSchema(bibleReadingPlans).pick({
  title: true,
  description: true,
  duration: true,
  readings: true,
  creatorId: true,
  groupId: true,
  isPublic: true,
} as any);

export const bibleReadingProgress = pgTable("bible_reading_progress", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull().references(() => bibleReadingPlans.id),
  userId: integer("user_id").notNull().references(() => users.id),
  currentDay: integer("current_day").default(1),
  completedDays: jsonb("completed_days").default([]),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
} as any);

export const insertBibleReadingProgressSchema = createInsertSchema(bibleReadingProgress).pick({
  planId: true,
  userId: true,
} as any);

export const bibleStudyNotes = pgTable("bible_study_notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  groupId: integer("group_id").references(() => groups.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  passage: text("passage"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
} as any);

export const insertBibleStudyNotesSchema = createInsertSchema(bibleStudyNotes).pick({
  userId: true,
  groupId: true,
  title: true,
  content: true,
  passage: true,
  isPublic: true,
} as any);

export const verseMemorization = pgTable("verse_memorization", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  verse: text("verse").notNull(),
  reference: text("reference").notNull(),
  startDate: timestamp("start_date").defaultNow(),
  masteredDate: timestamp("mastered_date"),
  reviewDates: jsonb("review_dates").default([]),
  reminderFrequency: integer("reminder_frequency"), // days
} as any);

export const insertVerseMemorizationSchema = createInsertSchema(verseMemorization).pick({
  userId: true,
  verse: true,
  reference: true,
  reminderFrequency: true,
} as any);

// ========================
// CONTENT RECOMMENDATIONS
// ========================
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  interests: jsonb("interests").default([]),
  favoriteTopics: jsonb("favorite_topics").default([]),
  engagementHistory: jsonb("engagement_history").default([]),
  preferredLanguages: jsonb("preferred_languages").default(['en']), // Array of ISO 639-1 codes
  languageEngagement: jsonb("language_engagement").default({}), // {"en": 45, "ar": 12, "es": 3}
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
} as any);

export const contentRecommendations = pgTable("content_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  contentType: text("content_type").notNull(), // 'post', 'microblog', 'apologetics', 'bible_study', etc.
  contentId: integer("content_id").notNull(),
  score: integer("score").notNull(),
  reason: text("reason"),
  isViewed: boolean("is_viewed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
} as any);

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).pick({
  userId: true,
  interests: true,
  favoriteTopics: true,
} as any);

export const insertContentRecommendationSchema = createInsertSchema(contentRecommendations).pick({
  userId: true,
  contentType: true,
  contentId: true,
  score: true,
  reason: true,
} as any);

// ========================
// COMMUNITY CHALLENGES
// ========================
export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // prayer, service, bible-reading
  duration: integer("duration").notNull(), // days
  goals: jsonb("goals").notNull(),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  groupId: integer("group_id").references(() => groups.id),
  communityId: integer("community_id").references(() => communities.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
} as any);

export const insertChallengeSchema = createInsertSchema(challenges).pick({
  title: true,
  description: true,
  type: true,
  duration: true,
  goals: true,
  creatorId: true,
  groupId: true,
  communityId: true,
  startDate: true,
  endDate: true,
} as any);

export const challengeParticipants = pgTable("challenge_participants", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id),
  userId: integer("user_id").notNull().references(() => users.id),
  progress: jsonb("progress").default({}),
  isCompleted: boolean("is_completed").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
  completedAt: timestamp("completed_at"),
} as any);

export const insertChallengeParticipantSchema = createInsertSchema(challengeParticipants).pick({
  challengeId: true,
  userId: true,
} as any);

export const challengeTestimonials = pgTable("challenge_testimonials", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
} as any);

export const insertChallengeTestimonialSchema = createInsertSchema(challengeTestimonials).pick({
  challengeId: true,
  userId: true,
  content: true,
} as any);

// ========================
// RESOURCE SHARING
// ========================
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // book, podcast, video, article
  url: text("url"),
  author: text("author"),
  imageUrl: text("image_url"),
  tags: text("tags").array(),
  averageRating: integer("average_rating").default(0),
  submitterId: integer("submitter_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
} as any);

export const insertResourceSchema = createInsertSchema(resources).pick({
  title: true,
  description: true,
  type: true,
  url: true,
  author: true,
  imageUrl: true,
  tags: true,
  submitterId: true,
} as any);

export const resourceRatings = pgTable("resource_ratings", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").notNull().references(() => resources.id),
  userId: integer("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow(),
} as any);

export const insertResourceRatingSchema = createInsertSchema(resourceRatings).pick({
  resourceId: true,
  userId: true,
  rating: true,
  review: true,
} as any);

export const resourceCollections = pgTable("resource_collections", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
} as any);

export const insertResourceCollectionSchema = createInsertSchema(resourceCollections).pick({
  title: true,
  description: true,
  creatorId: true,
  isPublic: true,
} as any);

export const collectionResources = pgTable("collection_resources", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id").notNull().references(() => resourceCollections.id),
  resourceId: integer("resource_id").notNull().references(() => resources.id),
  addedAt: timestamp("added_at").defaultNow(),
} as any);

export const insertCollectionResourceSchema = createInsertSchema(collectionResources).pick({
  collectionId: true,
  resourceId: true,
} as any);

// ========================
// COMMUNITY SERVICE
// ========================
export const serviceProjects = pgTable("service_projects", {
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
  createdAt: timestamp("created_at").defaultNow(),
} as any);

export const insertServiceProjectSchema = createInsertSchema(serviceProjects).pick({
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
  imageUrl: true,
} as any);

export const serviceVolunteers = pgTable("service_volunteers", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => serviceProjects.id),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").notNull(), // signed-up, confirmed, attended, cancelled
  hoursServed: integer("hours_served"),
  createdAt: timestamp("created_at").defaultNow(),
} as any);

export const insertServiceVolunteerSchema = createInsertSchema(serviceVolunteers).pick({
  projectId: true,
  userId: true,
  status: true,
} as any);

export const serviceTestimonials = pgTable("service_testimonials", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => serviceProjects.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
} as any);

export const insertServiceTestimonialSchema = createInsertSchema(serviceTestimonials).pick({
  projectId: true,
  userId: true,
  content: true,
  imageUrl: true,
} as any);

// Type exports for all community features
export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

export type EventRsvp = typeof eventRsvps.$inferSelect;
export type InsertEventRsvp = typeof eventRsvps.$inferInsert;

export type PrayerRequest = typeof prayerRequests.$inferSelect;
export type InsertPrayerRequest = typeof prayerRequests.$inferInsert;

export type Prayer = typeof prayers.$inferSelect;
export type InsertPrayer = typeof prayers.$inferInsert;

export type MentorProfile = typeof mentorProfiles.$inferSelect;
export type InsertMentorProfile = typeof mentorProfiles.$inferInsert;

export type MentorshipRequest = typeof mentorshipRequests.$inferSelect;
export type InsertMentorshipRequest = typeof mentorshipRequests.$inferInsert;

export type MentorshipRelationship = typeof mentorshipRelationships.$inferSelect;
export type InsertMentorshipRelationship = typeof mentorshipRelationships.$inferInsert;

export type BibleReadingPlan = typeof bibleReadingPlans.$inferSelect;
export type InsertBibleReadingPlan = typeof bibleReadingPlans.$inferInsert;

export type BibleReadingProgress = typeof bibleReadingProgress.$inferSelect;
export type InsertBibleReadingProgress = typeof bibleReadingProgress.$inferInsert;

export type BibleStudyNote = typeof bibleStudyNotes.$inferSelect;
export type InsertBibleStudyNote = typeof bibleStudyNotes.$inferInsert;

export type VerseMemorization = typeof verseMemorization.$inferSelect;
export type InsertVerseMemorization = typeof verseMemorization.$inferInsert;

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;

// Messages table for private messaging between users
export const messages = pgTable("messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  senderId: integer("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: integer("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),
} as any);

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
} as any);

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof insertMessageSchema._input;

// Message Reactions table for heart/like reactions on DMs
export const messageReactions = pgTable("message_reactions", {
  id: serial("id").primaryKey(),
  messageId: text("message_id").notNull(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reaction: text("reaction").notNull().default("heart"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type MessageReaction = typeof messageReactions.$inferSelect;
export type InsertMessageReaction = typeof messageReactions.$inferInsert;

export type ContentRecommendation = typeof contentRecommendations.$inferSelect;
export type InsertContentRecommendation = typeof contentRecommendations.$inferInsert;

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = typeof challenges.$inferInsert;

export type ChallengeParticipant = typeof challengeParticipants.$inferSelect;
export type InsertChallengeParticipant = typeof challengeParticipants.$inferInsert;

export type ChallengeTestimonial = typeof challengeTestimonials.$inferSelect;
export type InsertChallengeTestimonial = typeof challengeTestimonials.$inferInsert;

export type Resource = typeof resources.$inferSelect;
export type InsertResource = typeof resources.$inferInsert;

export type ResourceRating = typeof resourceRatings.$inferSelect;
export type InsertResourceRating = typeof resourceRatings.$inferInsert;

export type ResourceCollection = typeof resourceCollections.$inferSelect;
export type InsertResourceCollection = typeof resourceCollections.$inferInsert;

export type CollectionResource = typeof collectionResources.$inferSelect;
export type InsertCollectionResource = typeof collectionResources.$inferInsert;

export type ServiceProject = typeof serviceProjects.$inferSelect;
export type InsertServiceProject = typeof serviceProjects.$inferInsert;

export type ServiceVolunteer = typeof serviceVolunteers.$inferSelect;
export type InsertServiceVolunteer = typeof serviceVolunteers.$inferInsert;

export type ServiceTestimonial = typeof serviceTestimonials.$inferSelect;
export type InsertServiceTestimonial = typeof serviceTestimonials.$inferInsert;

// Content Moderation System Tables
export const contentReports = pgTable("content_reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").notNull().references(() => users.id),
  contentType: text("content_type").notNull(), // 'post', 'microblog', 'comment', 'event', 'prayer_request'
  contentId: integer("content_id").notNull(),
  reason: text("reason").notNull(), // 'spam', 'harassment', 'inappropriate', 'hate_speech', 'false_info', 'other'
  description: text("description"),
  status: text("status").default("pending"), // 'pending', 'reviewing', 'resolved', 'dismissed'
  moderatorId: integer("moderator_id").references(() => users.id),
  moderatorNotes: text("moderator_notes"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Backwards-compatible alias: some parts of the codebase import `userReports`.
// Backwards-compatible table for user reports (legacy consumers)
export const userReports = pgTable("user_reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").references(() => users.id),
  reportedUserId: integer("reported_user_id").references(() => users.id),
  reason: text("reason").notNull(),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
} as any);

export const insertUserReportSchema = createInsertSchema(userReports).omit({
  id: true,
  createdAt: true,
  deletedAt: true,
} as any);

export type UserReport = typeof userReports.$inferSelect;
export type InsertUserReport = typeof userReports.$inferInsert;


// Push tokens table (used for push notification delivery)
export const pushTokens = pgTable("push_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  platform: text("platform").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsed: timestamp("last_used").defaultNow(),
} as any);

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  data: jsonb("data"),
  category: text("category").default('feed'),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
} as any);

export type PushToken = typeof pushTokens.$inferSelect;
export type Notification = typeof notifications.$inferSelect;

export const insertContentReportSchema = createInsertSchema(contentReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
  moderatorId: true,
  moderatorNotes: true,
} as any);

export const userBlocks = pgTable("user_blocks", {
  id: serial("id").primaryKey(),
  blockerId: integer("blocker_id").notNull().references(() => users.id),
  blockedId: integer("blocked_id").notNull().references(() => users.id),
  reason: text("reason"), // 'harassment', 'spam', 'inappropriate', 'other'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserBlockSchema = createInsertSchema(userBlocks).omit({
  id: true,
  createdAt: true,
} as any);

// Muted conversations - users can mute notifications for specific conversations
export const mutedConversations = pgTable("muted_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  mutedUserId: integer("muted_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueMute: uniqueIndex("muted_conversations_unique_idx").on(table.userId, table.mutedUserId),
}));

export const insertMutedConversationSchema = createInsertSchema(mutedConversations).omit({
  id: true,
  createdAt: true,
} as any);

// Hidden suggestions - users dismissed from friend suggestions
export const hiddenSuggestions = pgTable("hidden_suggestions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  hiddenUserId: integer("hidden_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertHiddenSuggestionSchema = createInsertSchema(hiddenSuggestions).omit({
  id: true,
  createdAt: true,
} as any);

export const moderationActions = pgTable("moderation_actions", {
  id: serial("id").primaryKey(),
  moderatorId: integer("moderator_id").notNull().references(() => users.id),
  contentType: text("content_type").notNull(),
  contentId: integer("content_id").notNull(),
  action: text("action").notNull(), // 'warn', 'hide', 'delete', 'ban_user'
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertModerationActionSchema = createInsertSchema(moderationActions).omit({
  id: true,
  createdAt: true,
} as any);

export const moderationSettings = pgTable("moderation_settings", {
  id: serial("id").primaryKey(),
  autoModerateEnabled: boolean("auto_moderate_enabled").default(true),
  profanityFilterEnabled: boolean("profanity_filter_enabled").default(true),
  spamDetectionEnabled: boolean("spam_detection_enabled").default(true),
  reviewThreshold: integer("review_threshold").default(3), // Number of reports before auto-hide
  contactEmail: text("contact_email").default("support@theconnection.app"),
  responseTimeSlaHours: integer("response_time_sla_hours").default(24),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertModerationSettingsSchema = createInsertSchema(moderationSettings).omit({
  id: true,
  updatedAt: true,
} as any);

// Audit logs table for security tracking
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // null for failed login attempts
  username: text("username"), // Store username for failed login attempts
  action: text("action").notNull(), // 'login', 'logout', 'register', 'password_change', 'admin_action', etc.
  entityType: text("entity_type"), // 'user', 'community', 'post', etc.
  entityId: integer("entity_id"), // ID of affected entity
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  status: text("status").notNull(), // 'success', 'failure', 'blocked'
  details: jsonb("details"), // Additional context in JSON format
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
} as any);

// User Reputation System
export const userReputation = pgTable("user_reputation", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  reputationScore: integer("reputation_score").default(100), // Starts at 100
  trustLevel: integer("trust_level").default(1), // 1-5, higher is better
  totalReports: integer("total_reports").default(0),
  validReports: integer("valid_reports").default(0), // Reports against them that were confirmed
  falseReports: integer("false_reports").default(0), // Reports against them that were dismissed
  contentCreated: integer("content_created").default(0),
  contentRemoved: integer("content_removed").default(0),
  helpfulFlags: integer("helpful_flags").default(0), // Reports they filed that were confirmed
  warnings: integer("warnings").default(0),
  suspensions: integer("suspensions").default(0),
  lastViolation: timestamp("last_violation"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserReputationSchema = createInsertSchema(userReputation).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as any);

// Reputation History (track changes over time)
export const reputationHistory = pgTable("reputation_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  change: integer("change").notNull(), // +/- amount
  reason: text("reason").notNull(), // 'content_approved', 'content_removed', 'helpful_flag', etc.
  contentType: text("content_type"), // 'post', 'comment', etc.
  contentId: integer("content_id"),
  moderatorId: integer("moderator_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReputationHistorySchema = createInsertSchema(reputationHistory).omit({
  id: true,
  createdAt: true,
} as any);

// Type exports for content moderation
export type ContentReport = typeof contentReports.$inferSelect;
export type InsertContentReport = typeof contentReports.$inferInsert;

export type UserBlock = typeof userBlocks.$inferSelect;
export type InsertUserBlock = typeof userBlocks.$inferInsert;

export type ModerationAction = typeof moderationActions.$inferSelect;
export type InsertModerationAction = typeof moderationActions.$inferInsert;

export type ModerationSettings = typeof moderationSettings.$inferSelect;
export type InsertModerationSettings = typeof moderationSettings.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

export type UserReputation = typeof userReputation.$inferSelect;
export type InsertUserReputation = typeof userReputation.$inferInsert;

export type ReputationHistory = typeof reputationHistory.$inferSelect;
export type InsertReputationHistory = typeof reputationHistory.$inferInsert;

// ============================================================================
// PRIVATE Q&A INBOX SYSTEM (Apologetics/Polemics)
// ============================================================================

// User Permissions - controls access to inbox and admin features
export const userPermissions = pgTable("user_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  permission: text("permission").notNull(), // 'inbox_access', 'manage_experts'
  grantedBy: integer("granted_by").references(() => users.id),
  grantedAt: timestamp("granted_at").defaultNow(),
} as any, (table) => ({
  uniqueUserPermission: uniqueIndex("user_permissions_unique_idx").on(table.userId, table.permission),
}));

export const insertUserPermissionSchema = createInsertSchema(userPermissions).pick({
  userId: true,
  permission: true,
  grantedBy: true,
} as any);

// Q&A Areas - categories for questions (Evidence, Theology, History, Objections, Perspectives)
export const qaAreas = pgTable("qa_areas", {
  id: serial("id").primaryKey(),
  domain: text("domain").notNull(), // 'apologetics' or 'polemics'
  name: text("name").notNull(), // Evidence, Theology, etc.
  slug: text("slug").notNull(),
  description: text("description"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
} as any, (table) => ({
  uniqueDomainSlug: uniqueIndex("qa_areas_domain_slug_idx").on(table.domain, table.slug),
}));

export const insertQaAreaSchema = createInsertSchema(qaAreas).pick({
  domain: true,
  name: true,
  slug: true,
  description: true,
  order: true,
} as any);

// Q&A Tags - specific topics within areas (Manuscripts, Resurrection, Trinity, etc.)
export const qaTags = pgTable("qa_tags", {
  id: serial("id").primaryKey(),
  areaId: integer("area_id").notNull().references(() => qaAreas.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
} as any, (table) => ({
  uniqueAreaSlug: uniqueIndex("qa_tags_area_slug_idx").on(table.areaId, table.slug),
}));

export const insertQaTagSchema = createInsertSchema(qaTags).pick({
  areaId: true,
  name: true,
  slug: true,
  description: true,
  order: true,
} as any);

// Q&A Library Posts - Wikipedia-style curated articles/entries
// Author access restricted to verified apologists and user 19
export const qaLibraryPosts = pgTable("qa_library_posts", {
  id: serial("id").primaryKey(),
  domain: text("domain").notNull(), // 'apologetics' or 'polemics'
  areaId: integer("area_id").references(() => qaAreas.id, { onDelete: 'set null' }),
  tagId: integer("tag_id").references(() => qaTags.id, { onDelete: 'set null' }),
  title: text("title").notNull(),
  summary: text("summary"),
  tldr: text("tldr"), // Quick answer (2-3 sentences) for GotQuestions UX
  keyPoints: jsonb("key_points").default(sql`'[]'::jsonb`), // 3-5 bullet points
  scriptureRefs: jsonb("scripture_refs").default(sql`'[]'::jsonb`), // Scripture references
  bodyMarkdown: text("body_markdown").notNull(),
  perspectives: text("perspectives").array().default(sql`'{}'::text[]`),
  sources: jsonb("sources").default(sql`'[]'::jsonb`),
  authorUserId: integer("author_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  authorDisplayName: text("author_display_name").notNull().default("Connection Research Team"),
  status: text("status").notNull().default("draft"), // draft, published, archived
  viewCount: integer("view_count").notNull().default(0), // Track article views for trending
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  publishedAt: timestamp("published_at"),
  // Rubric evaluation fields
  rubricVersion: text("rubric_version"),
  rubricScore: integer("rubric_score"),
  rubricReport: jsonb("rubric_report"),
  rubricPassedAt: timestamp("rubric_passed_at"),
  rubricReviewedBy: integer("rubric_reviewed_by").references(() => users.id, { onDelete: 'set null' }),
  rubricOverrideReason: text("rubric_override_reason"),
} as any, (table) => ({
  domainAreaTagIdx: index("qa_library_posts_domain_area_tag_idx").on(table.domain, table.areaId, table.tagId),
  statusPublishedIdx: index("qa_library_posts_status_published_idx").on(table.status, table.publishedAt),
  authorIdx: index("qa_library_posts_author_idx").on(table.authorUserId),
  domainIdx: index("qa_library_posts_domain_idx").on(table.domain),
}));

export const insertQaLibraryPostSchema = createInsertSchema(qaLibraryPosts).pick({
  domain: true,
  areaId: true,
  tagId: true,
  title: true,
  summary: true,
  tldr: true,
  keyPoints: true,
  scriptureRefs: true,
  bodyMarkdown: true,
  perspectives: true,
  sources: true,
  authorUserId: true,
  authorDisplayName: true,
  status: true,
} as any);

export const updateQaLibraryPostSchema = createInsertSchema(qaLibraryPosts).pick({
  areaId: true,
  tagId: true,
  title: true,
  summary: true,
  tldr: true,
  keyPoints: true,
  scriptureRefs: true,
  bodyMarkdown: true,
  perspectives: true,
  sources: true,
  status: true,
} as any).partial();

export type QaLibraryPost = typeof qaLibraryPosts.$inferSelect;
export type InsertQaLibraryPost = typeof qaLibraryPosts.$inferInsert;

// Q&A Library Contributions - Multi-apologist collaboration on library posts
// Only qualified apologists can propose, only user 19 can approve/reject
export const qaLibraryContributions = pgTable("qa_library_contributions", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => qaLibraryPosts.id, { onDelete: 'cascade' }),
  contributorUserId: integer("contributor_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text("type").notNull(), // 'edit_suggestion' | 'additional_perspective' | 'add_sources' | 'clarification'
  payload: jsonb("payload").notNull(), // Type-specific data
  status: text("status").notNull().default("pending"), // 'pending' | 'approved' | 'rejected'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedByUserId: integer("reviewed_by_user_id").references(() => users.id, { onDelete: 'set null' }),
} as any, (table) => ({
  postIdIdx: index("qa_library_contributions_post_id_idx").on(table.postId),
  contributorIdx: index("qa_library_contributions_contributor_idx").on(table.contributorUserId),
  statusIdx: index("qa_library_contributions_status_idx").on(table.status, table.createdAt),
  reviewerIdx: index("qa_library_contributions_reviewer_idx").on(table.reviewedByUserId),
}));

export const insertQaLibraryContributionSchema = createInsertSchema(qaLibraryContributions).pick({
  postId: true,
  contributorUserId: true,
  type: true,
  payload: true,
} as any);

export type QaLibraryContribution = typeof qaLibraryContributions.$inferSelect;
export type InsertQaLibraryContribution = typeof qaLibraryContributions.$inferInsert;

// Apologist Profiles - expert profiles for both public Q&A and private inbox
// NOTE: Verification status comes from users.isVerifiedApologeticsAnswerer (canonical)
export const apologistProfiles = pgTable("apologist_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  title: text("title"), // Dr., Rev., etc.
  credentialsShort: text("credentials_short"), // PhD Theology
  bioLong: text("bio_long"),
  verificationStatus: text("verification_status").notNull().default("none"), // none, internal, pending (NOT 'verified' - use users.isVerifiedApologeticsAnswerer)
  inboxEnabled: boolean("inbox_enabled").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
} as any);

export const insertApologistProfileSchema = createInsertSchema(apologistProfiles).pick({
  userId: true,
  title: true,
  credentialsShort: true,
  bioLong: true,
  verificationStatus: true,
  inboxEnabled: true,
} as any);

// Apologist Expertise - maps experts to areas and tags they can answer
export const apologistExpertise = pgTable("apologist_expertise", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  areaId: integer("area_id").notNull().references(() => qaAreas.id, { onDelete: 'cascade' }),
  tagId: integer("tag_id").references(() => qaTags.id, { onDelete: 'cascade' }), // null = area-level expertise
  level: text("level").notNull().default("secondary"), // 'primary' or 'secondary'
  createdAt: timestamp("created_at").defaultNow(),
} as any, (table) => ({
  uniqueExpertise: uniqueIndex("apologist_expertise_unique_idx").on(table.userId, table.areaId, table.tagId),
}));

export const insertApologistExpertiseSchema = createInsertSchema(apologistExpertise).pick({
  userId: true,
  areaId: true,
  tagId: true,
  level: true,
} as any);

// User Questions - private questions submitted by users
export const userQuestions = pgTable("user_questions", {
  id: serial("id").primaryKey(),
  askerUserId: integer("asker_user_id").notNull().references(() => users.id),
  domain: text("domain").notNull(), // 'apologetics' or 'polemics'
  areaId: integer("area_id").notNull().references(() => qaAreas.id),
  tagId: integer("tag_id").notNull().references(() => qaTags.id),
  questionText: text("question_text").notNull(),
  status: text("status").notNull().default("new"), // 'new', 'routed', 'answered', 'closed'
  publishedPostId: integer("published_post_id").references(() => qaLibraryPosts.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
} as any);

export const insertUserQuestionSchema = createInsertSchema(userQuestions).pick({
  askerUserId: true,
  domain: true,
  areaId: true,
  tagId: true,
  questionText: true,
  status: true,
} as any);

// Question Assignments - routes questions to experts
export const questionAssignments = pgTable("question_assignments", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull().references(() => userQuestions.id, { onDelete: 'cascade' }),
  assignedToUserId: integer("assigned_to_user_id").notNull().references(() => users.id),
  assignedByUserId: integer("assigned_by_user_id").references(() => users.id),
  status: text("status").notNull().default("assigned"), // 'assigned', 'accepted', 'declined', 'answered'
  reason: text("reason"), // reason for decline or notes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
} as any);

export const insertQuestionAssignmentSchema = createInsertSchema(questionAssignments).pick({
  questionId: true,
  assignedToUserId: true,
  assignedByUserId: true,
  status: true,
  reason: true,
} as any);

// Question Messages - threaded conversation between asker and answerer
export const questionMessages = pgTable("question_messages", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull().references(() => userQuestions.id, { onDelete: 'cascade' }),
  senderUserId: integer("sender_user_id").notNull().references(() => users.id),
  body: text("body").notNull(), // markdown allowed
  createdAt: timestamp("created_at").defaultNow(),
} as any);

export const insertQuestionMessageSchema = createInsertSchema(questionMessages).pick({
  questionId: true,
  senderUserId: true,
  body: true,
} as any);

// Clergy Verification Requests - organizations can vouch for pastors/priests
export const clergyVerificationRequests = pgTable("clergy_verification_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  requestedAt: timestamp("requested_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedByUserId: integer("reviewed_by_user_id").references(() => users.id),
  notes: text("notes"), // Optional notes from reviewer
} as any);

export const insertClergyVerificationRequestSchema = createInsertSchema(clergyVerificationRequests).pick({
  userId: true,
  organizationId: true,
  status: true,
  notes: true,
} as any);

// Type exports for Clergy Verification
export type ClergyVerificationRequest = typeof clergyVerificationRequests.$inferSelect;
export type InsertClergyVerificationRequest = typeof clergyVerificationRequests.$inferInsert;

// Type exports for Q&A Inbox system
export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = typeof userPermissions.$inferInsert;

export type QaArea = typeof qaAreas.$inferSelect;
export type InsertQaArea = typeof qaAreas.$inferInsert;

export type QaTag = typeof qaTags.$inferSelect;
export type InsertQaTag = typeof qaTags.$inferInsert;

export type ApologistProfile = typeof apologistProfiles.$inferSelect;
export type InsertApologistProfile = typeof apologistProfiles.$inferInsert;

export type ApologistExpertise = typeof apologistExpertise.$inferSelect;
export type InsertApologistExpertise = typeof apologistExpertise.$inferInsert;

export type UserQuestion = typeof userQuestions.$inferSelect;
export type InsertUserQuestion = typeof userQuestions.$inferInsert;

export type QuestionAssignment = typeof questionAssignments.$inferSelect;
export type InsertQuestionAssignment = typeof questionAssignments.$inferInsert;

export type QuestionMessage = typeof questionMessages.$inferSelect;
export type InsertQuestionMessage = typeof questionMessages.$inferInsert;

// ============================================================================
// ORGANIZATIONS - Extended Features
// ============================================================================

// Organization Billing - Manages subscription tier and billing status
// Tier enforcement is server-only; clients receive only boolean capabilities
export const orgBilling = pgTable("org_billing", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }).unique(),
  tier: text("tier").default("free"), // free, stewardship, partner
  status: text("status").default("inactive"), // inactive, trialing, active, past_due, canceled
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_org_billing_org").on(table.organizationId),
]);

export const insertOrgBillingSchema = createInsertSchema(orgBilling).pick({
  organizationId: true,
  tier: true,
  status: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  currentPeriodStart: true,
  currentPeriodEnd: true,
} as any).extend({
  tier: z.enum(ORG_TIER_VALUES),
  status: z.enum(ORG_BILLING_STATUSES),
});

export type OrgBilling = typeof orgBilling.$inferSelect;
export type InsertOrgBilling = typeof orgBilling.$inferInsert;


// Organization Membership Requests - Attendee requesting to become member
export const orgMembershipRequests = pgTable("org_membership_requests", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text("status").default("pending"), // pending, approved, declined
  requestedAt: timestamp("requested_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedByUserId: integer("reviewed_by_user_id").references(() => users.id),
  notes: text("notes"),
}, (table) => [
  // Only one pending request per user per org
  index("idx_org_membership_requests_org_user").on(table.organizationId, table.userId),
]);

export const insertOrgMembershipRequestSchema = createInsertSchema(orgMembershipRequests).pick({
  organizationId: true,
  userId: true,
  status: true,
  notes: true,
} as any);

export type OrgMembershipRequest = typeof orgMembershipRequests.$inferSelect;
export type InsertOrgMembershipRequest = typeof orgMembershipRequests.$inferInsert;

// Organization Meeting Requests - Pastoral care/appointment requests
export const orgMeetingRequests = pgTable("org_meeting_requests", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  requesterId: integer("requester_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  reason: text("reason").notNull(),
  status: text("status").default("new"), // new, in_progress, closed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  closedAt: timestamp("closed_at"),
  closedByUserId: integer("closed_by_user_id").references(() => users.id),
  notes: text("notes"), // Internal notes from staff
}, (table) => [
  index("idx_org_meeting_requests_org").on(table.organizationId),
  index("idx_org_meeting_requests_status").on(table.status),
  index("idx_org_meeting_requests_created").on(table.createdAt),
]);

export const insertOrgMeetingRequestSchema = createInsertSchema(orgMeetingRequests).pick({
  organizationId: true,
  requesterId: true,
  reason: true,
  status: true,
  notes: true,
} as any);

export type OrgMeetingRequest = typeof orgMeetingRequests.$inferSelect;
export type InsertOrgMeetingRequest = typeof orgMeetingRequests.$inferInsert;

// Ordination Programs - Configurable ordination tracks with form schemas
export const ordinationPrograms = pgTable("ordination_programs", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  enabled: boolean("enabled").default(true),
  title: text("title").notNull(),
  description: text("description"),
  formSchema: jsonb("form_schema"), // JSON schema for application form
  schemaVersion: integer("schema_version").default(1),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ordination_programs_org").on(table.organizationId),
]);

export const insertOrdinationProgramSchema = createInsertSchema(ordinationPrograms).pick({
  organizationId: true,
  enabled: true,
  title: true,
  description: true,
  formSchema: true,
  schemaVersion: true,
} as any);

export type OrdinationProgram = typeof ordinationPrograms.$inferSelect;
export type InsertOrdinationProgram = typeof ordinationPrograms.$inferInsert;

// Ordination Applications - User applications with schema snapshot
export const ordinationApplications = pgTable("ordination_applications", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull().references(() => ordinationPrograms.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text("status").default("pending"), // pending, under_review, approved, rejected
  answers: jsonb("answers").notNull(), // User's form responses
  programSchemaVersion: integer("program_schema_version").notNull(), // Version at time of submission
  programSchemaSnapshot: jsonb("program_schema_snapshot").notNull(), // Snapshot of form schema at submission
  submittedAt: timestamp("submitted_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ordination_applications_program").on(table.programId),
  index("idx_ordination_applications_user").on(table.userId),
  index("idx_ordination_applications_status").on(table.status),
]);

export const insertOrdinationApplicationSchema = createInsertSchema(ordinationApplications).pick({
  programId: true,
  userId: true,
  status: true,
  answers: true,
  programSchemaVersion: true,
  programSchemaSnapshot: true,
} as any);

export type OrdinationApplication = typeof ordinationApplications.$inferSelect;
export type InsertOrdinationApplication = typeof ordinationApplications.$inferInsert;

// Ordination Reviews - Review decisions on applications
export const ordinationReviews = pgTable("ordination_reviews", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => ordinationApplications.id, { onDelete: 'cascade' }),
  reviewerUserId: integer("reviewer_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  decision: text("decision").notNull(), // approve, reject, request_info
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ordination_reviews_application").on(table.applicationId),
]);

export const insertOrdinationReviewSchema = createInsertSchema(ordinationReviews).pick({
  applicationId: true,
  reviewerUserId: true,
  decision: true,
  notes: true,
} as any);

export type OrdinationReview = typeof ordinationReviews.$inferSelect;
export type InsertOrdinationReview = typeof ordinationReviews.$inferInsert;

// Organization Activity Logs - Audit trail for admin actions
// Metadata should NOT include sensitive data (emails, tokens, etc.)
export const organizationActivityLogs = pgTable("organization_activity_logs", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  actorId: integer("actor_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: text("action").notNull(), // e.g., "member.added", "settings.updated", "event.created"
  targetType: text("target_type"), // e.g., "user", "event", "community"
  targetId: integer("target_id"),
  metadata: jsonb("metadata"), // Safe metadata only, no PII
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_org_activity_org_created").on(table.organizationId, table.createdAt),
  index("idx_org_activity_created").on(table.createdAt),
]);

export const insertOrganizationActivityLogSchema = createInsertSchema(organizationActivityLogs).pick({
  organizationId: true,
  actorId: true,
  action: true,
  targetType: true,
  targetId: true,
  metadata: true,
} as any);

export type OrganizationActivityLog = typeof organizationActivityLogs.$inferSelect;
export type InsertOrganizationActivityLog = typeof organizationActivityLogs.$inferInsert;

// =============================================================================
// SERMONS (Org Video Library with Mux)
// =============================================================================

// Sermons table - org-owned video content
export const sermons = pgTable("sermons", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  creatorId: integer("creator_id").notNull().references(() => users.id),

  // Content metadata
  title: text("title").notNull(),
  description: text("description"),
  speaker: text("speaker"),
  sermonDate: date("sermon_date"),
  series: text("series"),

  // Mux video integration
  muxAssetId: text("mux_asset_id"),
  muxPlaybackId: text("mux_playback_id"),
  muxUploadId: text("mux_upload_id"),
  duration: integer("duration"), // seconds
  thumbnailUrl: text("thumbnail_url"),
  status: text("status").default("pending"), // pending|processing|ready|error

  // Visibility and privacy
  privacyLevel: text("privacy_level").default("public"), // public|members|unlisted
  viewCount: integer("view_count").default(0),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"), // Soft delete
  publishedAt: timestamp("published_at"),
}, (table) => [
  index("idx_sermons_org").on(table.organizationId),
  index("idx_sermons_status").on(table.status),
  index("idx_sermons_published").on(table.publishedAt),
]);

export const insertSermonSchema = createInsertSchema(sermons).pick({
  organizationId: true,
  creatorId: true,
  title: true,
  description: true,
  speaker: true,
  sermonDate: true,
  series: true,
  muxAssetId: true,
  muxPlaybackId: true,
  muxUploadId: true,
  duration: true,
  thumbnailUrl: true,
  status: true,
  privacyLevel: true,
  publishedAt: true,
} as any);

export type Sermon = typeof sermons.$inferSelect;
export type InsertSermon = typeof sermons.$inferInsert;

// Sermon views - analytics for video consumption
export const sermonViews = pgTable("sermon_views", {
  id: serial("id").primaryKey(),
  sermonId: integer("sermon_id").notNull().references(() => sermons.id, { onDelete: 'cascade' }),
  userId: integer("user_id").references(() => users.id),
  watchDuration: integer("watch_duration"), // seconds
  completed: boolean("completed").default(false),
  viewedAt: timestamp("viewed_at").defaultNow(),
}, (table) => [
  index("idx_sermon_views_sermon").on(table.sermonId),
  index("idx_sermon_views_user").on(table.userId),
]);

export type SermonView = typeof sermonViews.$inferSelect;
export type InsertSermonView = typeof sermonViews.$inferInsert;

// ============================================
// GAMIFICATION SYSTEM - Subtle contributor recognition
// ============================================

// Contributor scores - tracks quality contributions for Top Contributor status
export const contributorScores = pgTable("contributor_scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  contextType: text("context_type").notNull(), // 'global_advice' or 'community'
  contextId: integer("context_id"), // NULL for global, community_id for per-community
  score: integer("score").default(0),
  upvotesReceived: integer("upvotes_received").default(0),
  helpfulMarksReceived: integer("helpful_marks_received").default(0),
  repliesGiven: integer("replies_given").default(0),
  postsWithZeroEngagement: integer("posts_with_zero_engagement").default(0),
  isTopContributor: boolean("is_top_contributor").default(false),
  percentile: decimal("percentile", { precision: 5, scale: 2 }),
  lastCalculatedAt: timestamp("last_calculated_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Each user has one score per context
  uniqueIndex("idx_contributor_scores_user_context").on(table.userId, table.contextType, table.contextId),
  // Fast lookup of top contributors
  index("idx_contributor_scores_top").on(table.contextType, table.contextId).where(sql`is_top_contributor = TRUE`),
  index("idx_contributor_scores_user").on(table.userId),
]);

export const insertContributorScoreSchema = createInsertSchema(contributorScores).pick({
  userId: true,
  contextType: true,
  contextId: true,
  score: true,
  upvotesReceived: true,
  helpfulMarksReceived: true,
  repliesGiven: true,
  postsWithZeroEngagement: true,
  isTopContributor: true,
  percentile: true,
  lastCalculatedAt: true,
} as any);

export type ContributorScore = typeof contributorScores.$inferSelect;
export type InsertContributorScore = typeof contributorScores.$inferInsert;

// Helpful marks - any user can mark ONE reply per question as helpful
export const helpfulMarks = pgTable("helpful_marks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  questionId: integer("question_id").references(() => microblogs.id, { onDelete: 'cascade' }).notNull(),
  replyId: integer("reply_id").references(() => microblogs.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Each user can mark ONE reply per question
  uniqueIndex("idx_helpful_marks_user_question").on(table.userId, table.questionId),
  // Fast lookup of marks for a reply
  index("idx_helpful_marks_reply").on(table.replyId),
  // Fast lookup of marks for a question
  index("idx_helpful_marks_question").on(table.questionId),
]);

export const insertHelpfulMarkSchema = createInsertSchema(helpfulMarks).pick({
  userId: true,
  questionId: true,
  replyId: true,
} as any);

export type HelpfulMark = typeof helpfulMarks.$inferSelect;
export type InsertHelpfulMark = typeof helpfulMarks.$inferInsert;

// ========================
// SENTRY ALERTS
// ========================
export const sentryAlerts = pgTable("sentry_alerts", {
  id: serial("id").primaryKey(),
  sentryEventId: text("sentry_event_id"),
  resource: text("resource").notNull(), // 'issue', 'event_alert', 'metric_alert'
  action: text("action").notNull(), // 'created', 'resolved', 'triggered', etc.
  title: text("title").notNull(),
  message: text("message"),
  level: text("level"), // 'error', 'warning', 'info', 'fatal'
  sentryUrl: text("sentry_url"),
  project: text("project"),
  payload: jsonb("payload"),
  isDismissed: boolean("is_dismissed").default(false),
  dismissedBy: integer("dismissed_by").references(() => users.id),
  dismissedAt: timestamp("dismissed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_sentry_alerts_resource").on(table.resource),
  index("idx_sentry_alerts_created_at").on(table.createdAt),
  index("idx_sentry_alerts_is_dismissed").on(table.isDismissed),
]);

export const insertSentryAlertSchema = createInsertSchema(sentryAlerts).pick({
  sentryEventId: true,
  resource: true,
  action: true,
  title: true,
  message: true,
  level: true,
  sentryUrl: true,
  project: true,
  payload: true,
} as any);

export type SentryAlert = typeof sentryAlerts.$inferSelect;
export type InsertSentryAlert = typeof sentryAlerts.$inferInsert;

// Magic codes table - persisted login codes (replaces in-memory store)
export const magicCodes = pgTable("magic_codes", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  email: text("email").notNull(),
  codeHash: text("code_hash").notNull(), // SHA-256 hash of the code
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_magic_codes_token").on(table.token),
  index("idx_magic_codes_expires_at").on(table.expiresAt),
]);

export type MagicCode = typeof magicCodes.$inferSelect;
export type InsertMagicCode = typeof magicCodes.$inferInsert;

// ============================================================================
// FEATURES 13-20: Advanced Search, Moderation, Analytics, User Features, etc.
// ============================================================================

// Search History - tracks user search queries for suggestions
export const searchHistory = pgTable("search_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  query: text("query").notNull(),
  searchType: text("search_type").notNull().default("all"), // 'all', 'users', 'events', 'communities'
  resultCount: integer("result_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_search_history_user").on(table.userId),
  index("idx_search_history_query").on(table.query),
  index("idx_search_history_created").on(table.createdAt),
]);

export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = typeof searchHistory.$inferInsert;

// User Suspensions - ban/suspension system with expiry and appeals
export const userSuspensions = pgTable("user_suspensions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  adminId: integer("admin_id").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  type: text("type").notNull(), // 'warn', 'suspend', 'ban'
  expiresAt: timestamp("expires_at"), // null = permanent
  appealText: text("appeal_text"),
  appealStatus: text("appeal_status"), // 'pending', 'approved', 'denied'
  appealedAt: timestamp("appealed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_user_suspensions_user").on(table.userId),
  index("idx_user_suspensions_expires").on(table.expiresAt),
  index("idx_user_suspensions_type").on(table.type),
]);

export type UserSuspension = typeof userSuspensions.$inferSelect;
export type InsertUserSuspension = typeof userSuspensions.$inferInsert;

// Event Check-ins - QR code based attendance tracking
export const eventCheckins = pgTable("event_checkins", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  checkedInAt: timestamp("checked_in_at").defaultNow(),
  method: text("method").notNull().default("manual"), // 'qr', 'manual'
}, (table) => [
  uniqueIndex("event_checkins_event_user_idx").on(table.eventId, table.userId),
  index("idx_event_checkins_event").on(table.eventId),
]);

export type EventCheckin = typeof eventCheckins.$inferSelect;
export type InsertEventCheckin = typeof eventCheckins.$inferInsert;

// Analytics Events - lightweight event tracking for platform analytics
export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(), // 'page_view', 'login', 'signup', 'post_created', 'event_rsvp', 'community_join', 'search', etc.
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
  metadata: jsonb("metadata"), // Additional context
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_analytics_events_type").on(table.eventType),
  index("idx_analytics_events_user").on(table.userId),
  index("idx_analytics_events_created").on(table.createdAt),
]);

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

// Community Roles - custom role-based permissions for communities
export const communityRoles = pgTable("community_roles", {
  id: serial("id").primaryKey(),
  communityId: integer("community_id").notNull().references(() => communities.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  permissions: jsonb("permissions").notNull().default('[]'), // Array of permission strings
  color: text("color"), // Hex color for role display
  position: integer("position").notNull().default(0), // Higher = more authority
  isDefault: boolean("is_default").default(false), // Default role for new members
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_community_roles_community").on(table.communityId),
  uniqueIndex("community_roles_name_unique_idx").on(table.communityId, table.name),
]);

export type CommunityRole = typeof communityRoles.$inferSelect;
export type InsertCommunityRole = typeof communityRoles.$inferInsert;

// Event Templates - reusable event configurations
export const eventTemplates = pgTable("event_templates", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  communityId: integer("community_id").references(() => communities.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  templateData: jsonb("template_data").notNull(), // { title, description, category, duration, location, settings, etc. }
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_event_templates_creator").on(table.creatorId),
  index("idx_event_templates_community").on(table.communityId),
]);

export type EventTemplate = typeof eventTemplates.$inferSelect;
export type InsertEventTemplate = typeof eventTemplates.$inferInsert;
