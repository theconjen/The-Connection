var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  apologeticsAnswers: () => apologeticsAnswers,
  apologeticsQuestions: () => apologeticsQuestions,
  apologeticsResources: () => apologeticsResources,
  apologeticsTopics: () => apologeticsTopics,
  apologistScholarApplications: () => apologistScholarApplications,
  bibleReadingPlans: () => bibleReadingPlans,
  bibleReadingProgress: () => bibleReadingProgress,
  bibleStudyNotes: () => bibleStudyNotes,
  challengeParticipants: () => challengeParticipants,
  challengeTestimonials: () => challengeTestimonials,
  challenges: () => challenges,
  chatMessages: () => chatMessages,
  collectionResources: () => collectionResources,
  comments: () => comments,
  communities: () => communities,
  communityChatRooms: () => communityChatRooms,
  communityInvitations: () => communityInvitations,
  communityMembers: () => communityMembers,
  communityWallPosts: () => communityWallPosts,
  contentRecommendations: () => contentRecommendations,
  contentReports: () => contentReports,
  creatorTiers: () => creatorTiers,
  eventRsvps: () => eventRsvps,
  events: () => events,
  groupMembers: () => groupMembers,
  groups: () => groups,
  insertApologeticsAnswerSchema: () => insertApologeticsAnswerSchema,
  insertApologeticsQuestionSchema: () => insertApologeticsQuestionSchema,
  insertApologeticsResourceSchema: () => insertApologeticsResourceSchema,
  insertApologeticsTopicSchema: () => insertApologeticsTopicSchema,
  insertApologistScholarApplicationSchema: () => insertApologistScholarApplicationSchema,
  insertBibleReadingPlanSchema: () => insertBibleReadingPlanSchema,
  insertBibleReadingProgressSchema: () => insertBibleReadingProgressSchema,
  insertBibleStudyNotesSchema: () => insertBibleStudyNotesSchema,
  insertChallengeParticipantSchema: () => insertChallengeParticipantSchema,
  insertChallengeSchema: () => insertChallengeSchema,
  insertChallengeTestimonialSchema: () => insertChallengeTestimonialSchema,
  insertChatMessageSchema: () => insertChatMessageSchema,
  insertCollectionResourceSchema: () => insertCollectionResourceSchema,
  insertCommentSchema: () => insertCommentSchema,
  insertCommunityChatRoomSchema: () => insertCommunityChatRoomSchema,
  insertCommunityInvitationSchema: () => insertCommunityInvitationSchema,
  insertCommunityMemberSchema: () => insertCommunityMemberSchema,
  insertCommunityObjectSchema: () => insertCommunityObjectSchema,
  insertCommunitySchema: () => insertCommunitySchema,
  insertCommunityWallPostSchema: () => insertCommunityWallPostSchema,
  insertContentRecommendationSchema: () => insertContentRecommendationSchema,
  insertContentReportSchema: () => insertContentReportSchema,
  insertCreatorTierSchema: () => insertCreatorTierSchema,
  insertEventRsvpSchema: () => insertEventRsvpSchema,
  insertEventSchema: () => insertEventSchema,
  insertGroupMemberSchema: () => insertGroupMemberSchema,
  insertGroupSchema: () => insertGroupSchema,
  insertLivestreamGiftSchema: () => insertLivestreamGiftSchema,
  insertLivestreamSchema: () => insertLivestreamSchema,
  insertLivestreamerApplicationSchema: () => insertLivestreamerApplicationSchema,
  insertMentorProfileSchema: () => insertMentorProfileSchema,
  insertMentorshipRelationshipSchema: () => insertMentorshipRelationshipSchema,
  insertMentorshipRequestSchema: () => insertMentorshipRequestSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertMicroblogLikeSchema: () => insertMicroblogLikeSchema,
  insertMicroblogSchema: () => insertMicroblogSchema,
  insertModerationActionSchema: () => insertModerationActionSchema,
  insertModerationSettingsSchema: () => insertModerationSettingsSchema,
  insertOrganizationSchema: () => insertOrganizationSchema,
  insertOrganizationUserSchema: () => insertOrganizationUserSchema,
  insertPostSchema: () => insertPostSchema,
  insertPrayerRequestSchema: () => insertPrayerRequestSchema,
  insertPrayerSchema: () => insertPrayerSchema,
  insertResourceCollectionSchema: () => insertResourceCollectionSchema,
  insertResourceRatingSchema: () => insertResourceRatingSchema,
  insertResourceSchema: () => insertResourceSchema,
  insertServiceProjectSchema: () => insertServiceProjectSchema,
  insertServiceTestimonialSchema: () => insertServiceTestimonialSchema,
  insertServiceVolunteerSchema: () => insertServiceVolunteerSchema,
  insertUserBlockSchema: () => insertUserBlockSchema,
  insertUserCreatorTierSchema: () => insertUserCreatorTierSchema,
  insertUserFollowSchema: () => insertUserFollowSchema,
  insertUserInteractionSchema: () => insertUserInteractionSchema,
  insertUserPreferencesSchema: () => insertUserPreferencesSchema,
  insertUserSchema: () => insertUserSchema,
  insertVerseMemorizationSchema: () => insertVerseMemorizationSchema,
  insertVirtualGiftSchema: () => insertVirtualGiftSchema,
  livestreamGifts: () => livestreamGifts,
  livestreamerApplications: () => livestreamerApplications,
  livestreams: () => livestreams,
  mentorProfiles: () => mentorProfiles,
  mentorshipRelationships: () => mentorshipRelationships,
  mentorshipRequests: () => mentorshipRequests,
  messages: () => messages,
  microblogLikes: () => microblogLikes,
  microblogs: () => microblogs,
  moderationActions: () => moderationActions,
  moderationSettings: () => moderationSettings,
  organizationUsers: () => organizationUsers,
  organizations: () => organizations,
  posts: () => posts,
  prayerRequests: () => prayerRequests,
  prayers: () => prayers,
  resourceCollections: () => resourceCollections,
  resourceRatings: () => resourceRatings,
  resources: () => resources,
  serviceProjects: () => serviceProjects,
  serviceTestimonials: () => serviceTestimonials,
  serviceVolunteers: () => serviceVolunteers,
  sessions: () => sessions,
  userBlocks: () => userBlocks,
  userCreatorTiers: () => userCreatorTiers,
  userFollows: () => userFollows,
  userInteractions: () => userInteractions,
  userPreferences: () => userPreferences,
  users: () => users,
  verseMemorization: () => verseMemorization,
  virtualGifts: () => virtualGifts
});
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date, time, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var sessions, users, insertUserSchema, organizations, insertOrganizationSchema, organizationUsers, insertOrganizationUserSchema, communities, insertCommunityObjectSchema, insertCommunitySchema, communityMembers, insertCommunityMemberSchema, communityInvitations, insertCommunityInvitationSchema, userFollows, insertUserFollowSchema, userInteractions, insertUserInteractionSchema, communityChatRooms, insertCommunityChatRoomSchema, chatMessages, insertChatMessageSchema, communityWallPosts, insertCommunityWallPostSchema, groups, insertGroupSchema, groupMembers, insertGroupMemberSchema, posts, insertPostSchema, comments, insertCommentSchema, apologeticsResources, insertApologeticsResourceSchema, apologeticsTopics, insertApologeticsTopicSchema, apologeticsQuestions, insertApologeticsQuestionSchema, apologeticsAnswers, insertApologeticsAnswerSchema, livestreams, insertLivestreamSchema, livestreamerApplications, insertLivestreamerApplicationSchema, creatorTiers, insertCreatorTierSchema, userCreatorTiers, insertUserCreatorTierSchema, virtualGifts, insertVirtualGiftSchema, livestreamGifts, insertLivestreamGiftSchema, apologistScholarApplications, insertApologistScholarApplicationSchema, microblogs, insertMicroblogSchema, microblogLikes, insertMicroblogLikeSchema, events, insertEventSchema, eventRsvps, insertEventRsvpSchema, prayerRequests, insertPrayerRequestSchema, prayers, insertPrayerSchema, mentorProfiles, insertMentorProfileSchema, mentorshipRequests, insertMentorshipRequestSchema, mentorshipRelationships, insertMentorshipRelationshipSchema, bibleReadingPlans, insertBibleReadingPlanSchema, bibleReadingProgress, insertBibleReadingProgressSchema, bibleStudyNotes, insertBibleStudyNotesSchema, verseMemorization, insertVerseMemorizationSchema, userPreferences, contentRecommendations, insertUserPreferencesSchema, insertContentRecommendationSchema, challenges, insertChallengeSchema, challengeParticipants, insertChallengeParticipantSchema, challengeTestimonials, insertChallengeTestimonialSchema, resources, insertResourceSchema, resourceRatings, insertResourceRatingSchema, resourceCollections, insertResourceCollectionSchema, collectionResources, insertCollectionResourceSchema, serviceProjects, insertServiceProjectSchema, serviceVolunteers, insertServiceVolunteerSchema, serviceTestimonials, insertServiceTestimonialSchema, messages, insertMessageSchema, contentReports, insertContentReportSchema, userBlocks, insertUserBlockSchema, moderationActions, insertModerationActionSchema, moderationSettings, insertModerationSettingsSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    sessions = pgTable(
      "sessions",
      {
        sid: varchar("sid").primaryKey(),
        sess: jsonb("sess").notNull(),
        expire: timestamp("expire").notNull()
      },
      (table) => [index("IDX_session_expire").on(table.expire)]
    );
    users = pgTable("users", {
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
    insertUserSchema = createInsertSchema(users).omit({
      id: true,
      isVerifiedApologeticsAnswerer: true,
      createdAt: true,
      updatedAt: true
    });
    organizations = pgTable("organizations", {
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
    insertOrganizationSchema = createInsertSchema(organizations).pick({
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
    organizationUsers = pgTable("organization_users", {
      id: serial("id").primaryKey(),
      organizationId: integer("organization_id").notNull().references(() => organizations.id),
      userId: integer("user_id").notNull().references(() => users.id),
      role: text("role").default("member"),
      // admin, pastor, leader, member
      joinedAt: timestamp("joined_at").defaultNow()
    });
    insertOrganizationUserSchema = createInsertSchema(organizationUsers).pick({
      organizationId: true,
      userId: true,
      role: true
    });
    communities = pgTable("communities", {
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
    insertCommunityObjectSchema = createInsertSchema(communities).omit({
      id: true,
      memberCount: true,
      createdAt: true
    });
    insertCommunitySchema = insertCommunityObjectSchema.refine((data) => data.name && data.name.trim().length > 0, {
      message: "Community name is required and cannot be empty",
      path: ["name"]
    }).refine((data) => data.hasPrivateWall || data.hasPublicWall, {
      message: "At least one wall (private or public) must be enabled",
      path: ["hasPublicWall"]
    });
    communityMembers = pgTable("community_members", {
      id: serial("id").primaryKey(),
      communityId: integer("community_id").references(() => communities.id).notNull(),
      userId: integer("user_id").references(() => users.id).notNull(),
      role: text("role").notNull().default("member"),
      // "owner", "moderator", "member"
      joinedAt: timestamp("joined_at").defaultNow()
    });
    insertCommunityMemberSchema = createInsertSchema(communityMembers).pick({
      communityId: true,
      userId: true,
      role: true
    });
    communityInvitations = pgTable("community_invitations", {
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
    insertCommunityInvitationSchema = createInsertSchema(communityInvitations).pick({
      communityId: true,
      inviterUserId: true,
      inviteeEmail: true,
      inviteeUserId: true,
      status: true,
      token: true,
      expiresAt: true
    });
    userFollows = pgTable("user_follows", {
      id: serial("id").primaryKey(),
      followerId: integer("follower_id").references(() => users.id).notNull(),
      followingId: integer("following_id").references(() => users.id).notNull(),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertUserFollowSchema = createInsertSchema(userFollows).pick({
      followerId: true,
      followingId: true
    });
    userInteractions = pgTable("user_interactions", {
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
    insertUserInteractionSchema = createInsertSchema(userInteractions).pick({
      userId: true,
      contentId: true,
      contentType: true,
      interactionType: true,
      interactionStrength: true
    });
    communityChatRooms = pgTable("community_chat_rooms", {
      id: serial("id").primaryKey(),
      communityId: integer("community_id").references(() => communities.id).notNull(),
      name: text("name").notNull(),
      description: text("description"),
      isPrivate: boolean("is_private").default(false),
      createdAt: timestamp("created_at").defaultNow(),
      createdBy: integer("created_by").references(() => users.id).notNull()
    });
    insertCommunityChatRoomSchema = createInsertSchema(communityChatRooms).pick({
      communityId: true,
      name: true,
      description: true,
      isPrivate: true,
      createdBy: true
    });
    chatMessages = pgTable("chat_messages", {
      id: serial("id").primaryKey(),
      content: text("content").notNull(),
      chatRoomId: integer("chat_room_id").references(() => communityChatRooms.id).notNull(),
      senderId: integer("sender_id").references(() => users.id).notNull(),
      isSystemMessage: boolean("is_system_message").default(false),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertChatMessageSchema = createInsertSchema(chatMessages).pick({
      content: true,
      chatRoomId: true,
      senderId: true,
      isSystemMessage: true
    });
    communityWallPosts = pgTable("community_wall_posts", {
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
    insertCommunityWallPostSchema = createInsertSchema(communityWallPosts).pick({
      communityId: true,
      authorId: true,
      content: true,
      imageUrl: true,
      isPrivate: true
    });
    groups = pgTable("groups", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      description: text("description").notNull(),
      iconName: text("icon_name").notNull(),
      iconColor: text("icon_color").notNull(),
      isPrivate: boolean("is_private").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      createdBy: integer("created_by").references(() => users.id)
    });
    insertGroupSchema = createInsertSchema(groups).pick({
      name: true,
      description: true,
      iconName: true,
      iconColor: true,
      isPrivate: true,
      createdBy: true
    });
    groupMembers = pgTable("group_members", {
      id: serial("id").primaryKey(),
      groupId: integer("group_id").references(() => groups.id).notNull(),
      userId: integer("user_id").references(() => users.id).notNull(),
      isAdmin: boolean("is_admin").default(false),
      joinedAt: timestamp("joined_at").defaultNow()
    });
    insertGroupMemberSchema = createInsertSchema(groupMembers).pick({
      groupId: true,
      userId: true,
      isAdmin: true
    });
    posts = pgTable("posts", {
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
    insertPostSchema = createInsertSchema(posts).pick({
      title: true,
      content: true,
      imageUrl: true,
      communityId: true,
      groupId: true,
      authorId: true
    });
    comments = pgTable("comments", {
      id: serial("id").primaryKey(),
      content: text("content").notNull(),
      postId: integer("post_id").notNull(),
      authorId: integer("author_id"),
      parentId: integer("parent_id"),
      upvotes: integer("upvotes").default(0),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertCommentSchema = createInsertSchema(comments).pick({
      content: true,
      postId: true,
      authorId: true,
      parentId: true
    });
    apologeticsResources = pgTable("apologetics_resources", {
      id: serial("id").primaryKey(),
      title: text("title").notNull(),
      description: text("description").notNull(),
      type: text("type").notNull(),
      // book, video, podcast, etc.
      iconName: text("icon_name").notNull(),
      url: text("url"),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertApologeticsResourceSchema = createInsertSchema(apologeticsResources).pick({
      title: true,
      description: true,
      type: true,
      iconName: true,
      url: true
    });
    apologeticsTopics = pgTable("apologetics_topics", {
      id: serial("id").primaryKey(),
      name: text("name").notNull().unique(),
      description: text("description").notNull(),
      iconName: text("icon_name").notNull(),
      slug: text("slug").notNull().unique(),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertApologeticsTopicSchema = createInsertSchema(apologeticsTopics).pick({
      name: true,
      description: true,
      iconName: true,
      slug: true
    });
    apologeticsQuestions = pgTable("apologetics_questions", {
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
    insertApologeticsQuestionSchema = createInsertSchema(apologeticsQuestions).pick({
      title: true,
      content: true,
      authorId: true,
      topicId: true,
      status: true
    });
    apologeticsAnswers = pgTable("apologetics_answers", {
      id: serial("id").primaryKey(),
      content: text("content").notNull(),
      questionId: integer("question_id").references(() => apologeticsQuestions.id).notNull(),
      authorId: integer("author_id").references(() => users.id).notNull(),
      isVerifiedAnswer: boolean("is_verified_answer").default(false),
      upvotes: integer("upvotes").default(0),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertApologeticsAnswerSchema = createInsertSchema(apologeticsAnswers).pick({
      content: true,
      questionId: true,
      authorId: true,
      isVerifiedAnswer: true
    });
    livestreams = pgTable("livestreams", {
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
    insertLivestreamSchema = createInsertSchema(livestreams).pick({
      title: true,
      description: true,
      hostId: true,
      thumbnail: true,
      status: true,
      scheduledFor: true,
      duration: true,
      tags: true
    });
    livestreamerApplications = pgTable("livestreamer_applications", {
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
    insertLivestreamerApplicationSchema = createInsertSchema(livestreamerApplications).pick({
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
    creatorTiers = pgTable("creator_tiers", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      description: text("description").notNull(),
      requirements: text("requirements").notNull(),
      benefits: text("benefits").notNull(),
      iconName: text("icon_name").notNull(),
      order: integer("order").notNull(),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertCreatorTierSchema = createInsertSchema(creatorTiers).pick({
      name: true,
      description: true,
      requirements: true,
      benefits: true,
      iconName: true,
      order: true
    });
    userCreatorTiers = pgTable("user_creator_tiers", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").references(() => users.id).notNull(),
      tierId: integer("tier_id").references(() => creatorTiers.id).notNull(),
      assignedAt: timestamp("assigned_at").defaultNow(),
      validUntil: timestamp("valid_until")
    });
    insertUserCreatorTierSchema = createInsertSchema(userCreatorTiers).pick({
      userId: true,
      tierId: true,
      validUntil: true
    });
    virtualGifts = pgTable("virtual_gifts", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      description: text("description").notNull(),
      iconName: text("icon_name").notNull(),
      value: integer("value").notNull(),
      // Value in platform points/currency
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertVirtualGiftSchema = createInsertSchema(virtualGifts).pick({
      name: true,
      description: true,
      iconName: true,
      value: true,
      isActive: true
    });
    livestreamGifts = pgTable("livestream_gifts", {
      id: serial("id").primaryKey(),
      livestreamId: integer("livestream_id").references(() => livestreams.id).notNull(),
      giftId: integer("gift_id").references(() => virtualGifts.id).notNull(),
      senderId: integer("sender_id").references(() => users.id),
      receiverId: integer("receiver_id").references(() => users.id).notNull(),
      message: text("message"),
      sentAt: timestamp("sent_at").defaultNow()
    });
    insertLivestreamGiftSchema = createInsertSchema(livestreamGifts).pick({
      livestreamId: true,
      giftId: true,
      senderId: true,
      receiverId: true,
      message: true
    });
    apologistScholarApplications = pgTable("apologist_scholar_applications", {
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
    insertApologistScholarApplicationSchema = createInsertSchema(apologistScholarApplications).pick({
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
    microblogs = pgTable("microblogs", {
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
    insertMicroblogSchema = createInsertSchema(microblogs).pick({
      content: true,
      imageUrl: true,
      authorId: true,
      communityId: true,
      groupId: true,
      parentId: true
    });
    microblogLikes = pgTable("microblog_likes", {
      id: serial("id").primaryKey(),
      microblogId: integer("microblog_id").references(() => microblogs.id).notNull(),
      userId: integer("user_id").references(() => users.id).notNull(),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertMicroblogLikeSchema = createInsertSchema(microblogLikes).pick({
      microblogId: true,
      userId: true
    });
    events = pgTable("events", {
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
    insertEventSchema = createInsertSchema(events).pick({
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
    eventRsvps = pgTable("event_rsvps", {
      id: serial("id").primaryKey(),
      eventId: integer("event_id").notNull().references(() => events.id),
      userId: integer("user_id").notNull().references(() => users.id),
      status: text("status").notNull(),
      // attending, maybe, declined
      createdAt: timestamp("created_at").defaultNow()
    });
    insertEventRsvpSchema = createInsertSchema(eventRsvps).pick({
      eventId: true,
      userId: true,
      status: true
    });
    prayerRequests = pgTable("prayer_requests", {
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
    insertPrayerRequestSchema = createInsertSchema(prayerRequests).pick({
      title: true,
      content: true,
      isAnonymous: true,
      privacyLevel: true,
      groupId: true,
      authorId: true
    });
    prayers = pgTable("prayers", {
      id: serial("id").primaryKey(),
      prayerRequestId: integer("prayer_request_id").notNull().references(() => prayerRequests.id),
      userId: integer("user_id").notNull().references(() => users.id),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertPrayerSchema = createInsertSchema(prayers).pick({
      prayerRequestId: true,
      userId: true
    });
    mentorProfiles = pgTable("mentor_profiles", {
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
    insertMentorProfileSchema = createInsertSchema(mentorProfiles).pick({
      userId: true,
      spiritualGifts: true,
      areasOfExpertise: true,
      yearsOfFaith: true,
      shortBio: true,
      availability: true
    });
    mentorshipRequests = pgTable("mentorship_requests", {
      id: serial("id").primaryKey(),
      mentorId: integer("mentor_id").notNull().references(() => users.id),
      menteeId: integer("mentee_id").notNull().references(() => users.id),
      message: text("message"),
      status: text("status").notNull(),
      // pending, accepted, declined
      createdAt: timestamp("created_at").defaultNow()
    });
    insertMentorshipRequestSchema = createInsertSchema(mentorshipRequests).pick({
      mentorId: true,
      menteeId: true,
      message: true,
      status: true
    });
    mentorshipRelationships = pgTable("mentorship_relationships", {
      id: serial("id").primaryKey(),
      mentorId: integer("mentor_id").notNull().references(() => users.id),
      menteeId: integer("mentee_id").notNull().references(() => users.id),
      startDate: timestamp("start_date").defaultNow(),
      endDate: timestamp("end_date"),
      isActive: boolean("is_active").default(true),
      goals: jsonb("goals")
    });
    insertMentorshipRelationshipSchema = createInsertSchema(mentorshipRelationships).pick({
      mentorId: true,
      menteeId: true,
      goals: true
    });
    bibleReadingPlans = pgTable("bible_reading_plans", {
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
    insertBibleReadingPlanSchema = createInsertSchema(bibleReadingPlans).pick({
      title: true,
      description: true,
      duration: true,
      readings: true,
      creatorId: true,
      groupId: true,
      isPublic: true
    });
    bibleReadingProgress = pgTable("bible_reading_progress", {
      id: serial("id").primaryKey(),
      planId: integer("plan_id").notNull().references(() => bibleReadingPlans.id),
      userId: integer("user_id").notNull().references(() => users.id),
      currentDay: integer("current_day").default(1),
      completedDays: jsonb("completed_days").default([]),
      startedAt: timestamp("started_at").defaultNow(),
      completedAt: timestamp("completed_at")
    });
    insertBibleReadingProgressSchema = createInsertSchema(bibleReadingProgress).pick({
      planId: true,
      userId: true
    });
    bibleStudyNotes = pgTable("bible_study_notes", {
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
    insertBibleStudyNotesSchema = createInsertSchema(bibleStudyNotes).pick({
      userId: true,
      groupId: true,
      title: true,
      content: true,
      passage: true,
      isPublic: true
    });
    verseMemorization = pgTable("verse_memorization", {
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
    insertVerseMemorizationSchema = createInsertSchema(verseMemorization).pick({
      userId: true,
      verse: true,
      reference: true,
      reminderFrequency: true
    });
    userPreferences = pgTable("user_preferences", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id),
      interests: jsonb("interests").default([]),
      favoriteTopics: jsonb("favorite_topics").default([]),
      engagementHistory: jsonb("engagement_history").default([]),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    contentRecommendations = pgTable("content_recommendations", {
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
    insertUserPreferencesSchema = createInsertSchema(userPreferences).pick({
      userId: true,
      interests: true,
      favoriteTopics: true
    });
    insertContentRecommendationSchema = createInsertSchema(contentRecommendations).pick({
      userId: true,
      contentType: true,
      contentId: true,
      score: true,
      reason: true
    });
    challenges = pgTable("challenges", {
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
    insertChallengeSchema = createInsertSchema(challenges).pick({
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
    challengeParticipants = pgTable("challenge_participants", {
      id: serial("id").primaryKey(),
      challengeId: integer("challenge_id").notNull().references(() => challenges.id),
      userId: integer("user_id").notNull().references(() => users.id),
      progress: jsonb("progress").default({}),
      isCompleted: boolean("is_completed").default(false),
      joinedAt: timestamp("joined_at").defaultNow(),
      completedAt: timestamp("completed_at")
    });
    insertChallengeParticipantSchema = createInsertSchema(challengeParticipants).pick({
      challengeId: true,
      userId: true
    });
    challengeTestimonials = pgTable("challenge_testimonials", {
      id: serial("id").primaryKey(),
      challengeId: integer("challenge_id").notNull().references(() => challenges.id),
      userId: integer("user_id").notNull().references(() => users.id),
      content: text("content").notNull(),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertChallengeTestimonialSchema = createInsertSchema(challengeTestimonials).pick({
      challengeId: true,
      userId: true,
      content: true
    });
    resources = pgTable("resources", {
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
    insertResourceSchema = createInsertSchema(resources).pick({
      title: true,
      description: true,
      type: true,
      url: true,
      author: true,
      imageUrl: true,
      tags: true,
      submitterId: true
    });
    resourceRatings = pgTable("resource_ratings", {
      id: serial("id").primaryKey(),
      resourceId: integer("resource_id").notNull().references(() => resources.id),
      userId: integer("user_id").notNull().references(() => users.id),
      rating: integer("rating").notNull(),
      review: text("review"),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertResourceRatingSchema = createInsertSchema(resourceRatings).pick({
      resourceId: true,
      userId: true,
      rating: true,
      review: true
    });
    resourceCollections = pgTable("resource_collections", {
      id: serial("id").primaryKey(),
      title: text("title").notNull(),
      description: text("description"),
      creatorId: integer("creator_id").notNull().references(() => users.id),
      isPublic: boolean("is_public").default(true),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertResourceCollectionSchema = createInsertSchema(resourceCollections).pick({
      title: true,
      description: true,
      creatorId: true,
      isPublic: true
    });
    collectionResources = pgTable("collection_resources", {
      id: serial("id").primaryKey(),
      collectionId: integer("collection_id").notNull().references(() => resourceCollections.id),
      resourceId: integer("resource_id").notNull().references(() => resources.id),
      addedAt: timestamp("added_at").defaultNow()
    });
    insertCollectionResourceSchema = createInsertSchema(collectionResources).pick({
      collectionId: true,
      resourceId: true
    });
    serviceProjects = pgTable("service_projects", {
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
    insertServiceProjectSchema = createInsertSchema(serviceProjects).pick({
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
    serviceVolunteers = pgTable("service_volunteers", {
      id: serial("id").primaryKey(),
      projectId: integer("project_id").notNull().references(() => serviceProjects.id),
      userId: integer("user_id").notNull().references(() => users.id),
      status: text("status").notNull(),
      // signed-up, confirmed, attended, cancelled
      hoursServed: integer("hours_served"),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertServiceVolunteerSchema = createInsertSchema(serviceVolunteers).pick({
      projectId: true,
      userId: true,
      status: true
    });
    serviceTestimonials = pgTable("service_testimonials", {
      id: serial("id").primaryKey(),
      projectId: integer("project_id").notNull().references(() => serviceProjects.id),
      userId: integer("user_id").notNull().references(() => users.id),
      content: text("content").notNull(),
      imageUrl: text("image_url"),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertServiceTestimonialSchema = createInsertSchema(serviceTestimonials).pick({
      projectId: true,
      userId: true,
      content: true,
      imageUrl: true
    });
    messages = pgTable("messages", {
      id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
      senderId: integer("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      receiverId: integer("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      content: text("content").notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    insertMessageSchema = createInsertSchema(messages).omit({
      id: true,
      createdAt: true
    });
    contentReports = pgTable("content_reports", {
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
    insertContentReportSchema = createInsertSchema(contentReports).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      resolvedAt: true,
      moderatorId: true,
      moderatorNotes: true
    });
    userBlocks = pgTable("user_blocks", {
      id: serial("id").primaryKey(),
      blockerId: integer("blocker_id").notNull().references(() => users.id),
      blockedId: integer("blocked_id").notNull().references(() => users.id),
      reason: text("reason"),
      // 'harassment', 'spam', 'inappropriate', 'other'
      createdAt: timestamp("created_at").defaultNow()
    });
    insertUserBlockSchema = createInsertSchema(userBlocks).omit({
      id: true,
      createdAt: true
    });
    moderationActions = pgTable("moderation_actions", {
      id: serial("id").primaryKey(),
      moderatorId: integer("moderator_id").notNull().references(() => users.id),
      contentType: text("content_type").notNull(),
      contentId: integer("content_id").notNull(),
      action: text("action").notNull(),
      // 'warn', 'hide', 'delete', 'ban_user'
      reason: text("reason"),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertModerationActionSchema = createInsertSchema(moderationActions).omit({
      id: true,
      createdAt: true
    });
    moderationSettings = pgTable("moderation_settings", {
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
    insertModerationSettingsSchema = createInsertSchema(moderationSettings).omit({
      id: true,
      updatedAt: true
    });
  }
});

// server/db.ts
import { neon, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
var databaseUrl, sql, pool, db, isConnected;
var init_db = __esm({
  "server/db.ts"() {
    init_schema();
    databaseUrl = process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/theconnection";
    if (!databaseUrl) {
      throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
    }
    console.log("Attempting to connect to database...");
    sql = neon(databaseUrl);
    pool = new Pool({ connectionString: databaseUrl });
    db = drizzle(sql, { schema: schema_exports });
    isConnected = true;
  }
});

// server/geocoding.ts
async function geocodeAddress(address, city, state) {
  const mockCoordinates = {
    "New York, NY": { lat: 40.7128, lng: -74.006 },
    "Los Angeles, CA": { lat: 34.0522, lng: -118.2437 },
    "Chicago, IL": { lat: 41.8781, lng: -87.6298 },
    "Houston, TX": { lat: 29.7604, lng: -95.3698 },
    "Phoenix, AZ": { lat: 33.4484, lng: -112.074 },
    "Philadelphia, PA": { lat: 39.9526, lng: -75.1652 },
    "San Antonio, TX": { lat: 29.4241, lng: -98.4936 },
    "San Diego, CA": { lat: 32.7157, lng: -117.1611 },
    "Dallas, TX": { lat: 32.7767, lng: -96.797 },
    "San Jose, CA": { lat: 37.3382, lng: -121.8863 }
  };
  const locationKey = `${city}, ${state}`.toLowerCase();
  for (const [key, coords] of Object.entries(mockCoordinates)) {
    if (key.toLowerCase() === locationKey) {
      return {
        latitude: coords.lat,
        longitude: coords.lng
      };
    }
  }
  for (const [key, coords] of Object.entries(mockCoordinates)) {
    if (key.toLowerCase().includes(city.toLowerCase()) || key.toLowerCase().includes(state.toLowerCase())) {
      return {
        latitude: coords.lat,
        longitude: coords.lng
      };
    }
  }
  return {
    error: `Could not geocode location: ${city}, ${state}`
  };
}
var init_geocoding = __esm({
  "server/geocoding.ts"() {
  }
});

// server/storage.ts
var storage_exports = {};
__export(storage_exports, {
  DbStorage: () => DbStorage,
  MemStorage: () => MemStorage,
  storage: () => storage
});
import { eq, and, or, inArray, like } from "drizzle-orm";
var MemStorage, DbStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    init_schema();
    init_db();
    init_geocoding();
    MemStorage = class {
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
            createdAt: /* @__PURE__ */ new Date()
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
            createdAt: /* @__PURE__ */ new Date()
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
            createdAt: /* @__PURE__ */ new Date()
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
        messages: []
      };
      nextId = 1;
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
        return [...this.data.users];
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
          updatedAt: /* @__PURE__ */ new Date()
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
        return this.data.users.filter((u) => u.isVerifiedApologeticsAnswerer);
      }
      // Community methods
      async getAllCommunities() {
        return [...this.data.communities];
      }
      async searchCommunities(searchTerm) {
        const term = searchTerm.toLowerCase();
        return this.data.communities.filter(
          (c) => c.name.toLowerCase().includes(term) || c.description.toLowerCase().includes(term)
        );
      }
      async getPublicCommunitiesAndUserCommunities(userId, searchQuery) {
        let communities2 = this.data.communities.filter((c) => !c.isPrivate);
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
        return this.data.communities.find((c) => c.id === id);
      }
      async getCommunityBySlug(slug) {
        return this.data.communities.find((c) => c.slug === slug);
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
          createdBy: community.createdBy
        };
        this.data.communities.push(newCommunity);
        return newCommunity;
      }
      async updateCommunity(id, community) {
        const index2 = this.data.communities.findIndex((c) => c.id === id);
        if (index2 === -1) throw new Error("Community not found");
        this.data.communities[index2] = { ...this.data.communities[index2], ...community };
        return this.data.communities[index2];
      }
      async deleteCommunity(id) {
        const index2 = this.data.communities.findIndex((c) => c.id === id);
        if (index2 === -1) return false;
        this.data.communities.splice(index2, 1);
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
        const index2 = this.data.communityInvitations.findIndex((i) => i.id === id);
        if (index2 === -1) return false;
        this.data.communityInvitations.splice(index2, 1);
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
        const index2 = this.data.communityMembers.findIndex((m) => m.communityId === communityId && m.userId === userId);
        if (index2 === -1) return false;
        this.data.communityMembers.splice(index2, 1);
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
        const index2 = this.data.communityChatRooms.findIndex((r) => r.id === id);
        if (index2 === -1) return false;
        this.data.communityChatRooms.splice(index2, 1);
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
        const index2 = this.data.chatMessages.findIndex((m) => m.id === id);
        if (index2 === -1) return false;
        this.data.chatMessages.splice(index2, 1);
        return true;
      }
      // Community wall post methods
      async getCommunityWallPosts(communityId, isPrivate) {
        const posts3 = this.data.communityWallPosts.filter((p) => p.communityId === communityId && (isPrivate === void 0 || p.isPrivate === isPrivate)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((p) => ({
          ...p,
          author: this.data.users.find((u) => u.id === p.authorId)
        }));
        return posts3;
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
        const index2 = this.data.communityWallPosts.findIndex((p) => p.id === id);
        if (index2 === -1) return false;
        this.data.communityWallPosts.splice(index2, 1);
        return true;
      }
      // Post methods
      async getAllPosts(filter) {
        let posts3 = [...this.data.posts];
        if (filter === "top") {
          posts3.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
        } else if (filter === "hot") {
          posts3.sort((a, b) => {
            const aScore = (a.upvotes || 0) / Math.max(1, Math.floor((Date.now() - new Date(a.createdAt).getTime()) / (1e3 * 60 * 60)));
            const bScore = (b.upvotes || 0) / Math.max(1, Math.floor((Date.now() - new Date(b.createdAt).getTime()) / (1e3 * 60 * 60)));
            return bScore - aScore;
          });
        } else {
          posts3.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return posts3;
      }
      async getPost(id) {
        return this.data.posts.find((p) => p.id === id);
      }
      async getPostsByCommunitySlug(communitySlug, filter) {
        const community = this.data.communities.find((c) => c.slug === communitySlug);
        if (!community) return [];
        let posts3 = this.data.posts.filter((p) => p.communityId === community.id);
        if (filter === "top") {
          posts3.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
        } else if (filter === "hot") {
          posts3.sort((a, b) => {
            const aScore = (a.upvotes || 0) / Math.max(1, Math.floor((Date.now() - new Date(a.createdAt).getTime()) / (1e3 * 60 * 60)));
            const bScore = (b.upvotes || 0) / Math.max(1, Math.floor((Date.now() - new Date(b.createdAt).getTime()) / (1e3 * 60 * 60)));
            return bScore - aScore;
          });
        } else {
          posts3.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return posts3;
      }
      async getPostsByGroupId(groupId, filter) {
        let posts3 = this.data.posts.filter((p) => p.groupId === groupId);
        if (filter === "top") {
          posts3.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
        } else if (filter === "hot") {
          posts3.sort((a, b) => {
            const aScore = (a.upvotes || 0) / Math.max(1, Math.floor((Date.now() - new Date(a.createdAt).getTime()) / (1e3 * 60 * 60)));
            const bScore = (b.upvotes || 0) / Math.max(1, Math.floor((Date.now() - new Date(b.createdAt).getTime()) / (1e3 * 60 * 60)));
            return bScore - aScore;
          });
        } else {
          posts3.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return posts3;
      }
      async getUserPosts(userId) {
        const posts3 = this.data.posts.filter((p) => p.authorId === userId);
        const microblogs3 = this.data.microblogs.filter((m) => m.authorId === userId);
        const wallPosts = this.data.communityWallPosts.filter((p) => p.authorId === userId);
        return [
          ...posts3.map((p) => ({ ...p, type: "post" })),
          ...microblogs3.map((m) => ({ ...m, type: "microblog" })),
          ...wallPosts.map((p) => ({ ...p, type: "wall_post" }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      async createPost(post) {
        const newPost = {
          id: this.nextId++,
          upvotes: 0,
          commentCount: 0,
          createdAt: /* @__PURE__ */ new Date(),
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
        const index2 = this.data.prayerRequests.findIndex((p) => p.id === id);
        if (index2 === -1) return false;
        this.data.prayerRequests.splice(index2, 1);
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
        return [...this.data.events].sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
      }
      async getEvent(id) {
        return this.data.events.find((e) => e.id === id);
      }
      async getUserEvents(userId) {
        return this.data.events.filter((e) => e.creatorId === userId);
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
        const index2 = this.data.events.findIndex((e) => e.id === id);
        if (index2 === -1) return false;
        this.data.events.splice(index2, 1);
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
        const index2 = this.data.eventRsvps.findIndex((r) => r.id === id);
        if (index2 === -1) return false;
        const rsvp = this.data.eventRsvps[index2];
        this.data.eventRsvps.splice(index2, 1);
        const event = this.data.events.find((e) => e.id === rsvp.eventId);
        if (event && event.rsvpCount > 0) {
          event.rsvpCount--;
        }
        return true;
      }
      // Livestream methods
      async getAllLivestreams() {
        return [...this.data.livestreams].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      async createLivestream(livestream) {
        const newLivestream = {
          id: this.nextId++,
          title: livestream.title,
          description: livestream.description || null,
          createdAt: /* @__PURE__ */ new Date(),
          status: "upcoming",
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
        const index2 = this.data.microblogs.findIndex((m) => m.id === id);
        if (index2 === -1) return false;
        this.data.microblogs.splice(index2, 1);
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
        const index2 = this.data.microblogLikes.findIndex((l) => l.microblogId === microblogId && l.userId === userId);
        if (index2 === -1) return false;
        this.data.microblogLikes.splice(index2, 1);
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
      // Bible Reading Plan methods
      async getAllBibleReadingPlans() {
        return [...this.data.bibleReadingPlans];
      }
      async getBibleReadingPlan(id) {
        return this.data.bibleReadingPlans.find((p) => p.id === id);
      }
      async createBibleReadingPlan(plan) {
        const newPlan = {
          id: this.nextId++,
          title: plan.title,
          description: plan.description,
          groupId: plan.groupId,
          duration: plan.duration,
          isPublic: plan.isPublic,
          creatorId: plan.creatorId,
          readings: plan.readings,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.data.bibleReadingPlans.push(newPlan);
        return newPlan;
      }
      // Bible Reading Progress methods
      async getBibleReadingProgress(userId, planId) {
        return this.data.bibleReadingProgress.find((p) => p.userId === userId && p.planId === planId);
      }
      async createBibleReadingProgress(progress) {
        const newProgress = {
          id: this.nextId++,
          currentDay: 1,
          completedDays: "[]",
          startedAt: /* @__PURE__ */ new Date(),
          completedAt: null,
          ...progress
        };
        this.data.bibleReadingProgress.push(newProgress);
        return newProgress;
      }
      async markDayCompleted(progressId, day) {
        const progress = this.data.bibleReadingProgress.find((p) => p.id === progressId);
        if (!progress) throw new Error("Progress not found");
        let completedDays;
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
      async getBibleStudyNotes(userId) {
        return this.data.bibleStudyNotes.filter((n) => n.userId === userId);
      }
      async getBibleStudyNote(id) {
        return this.data.bibleStudyNotes.find((n) => n.id === id);
      }
      async createBibleStudyNote(note) {
        const newNote = {
          id: this.nextId++,
          title: note.title,
          isPublic: note.isPublic,
          groupId: note.groupId,
          userId: note.userId,
          content: note.content,
          passage: note.passage,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
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
        const index2 = this.data.bibleStudyNotes.findIndex((n) => n.id === id);
        if (index2 === -1) return false;
        this.data.bibleStudyNotes.splice(index2, 1);
        return true;
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
        const index2 = this.data.users.findIndex((u) => u.id === userId);
        if (index2 === -1) return false;
        this.data.users.splice(index2, 1);
        return true;
      }
      // Direct Messaging methods
      async getDirectMessages(userId1, userId2) {
        return this.data.messages.filter(
          (m) => m.senderId === userId1 && m.receiverId === userId2 || m.senderId === userId2 && m.receiverId === userId1
        ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
      async createDirectMessage(message) {
        const newMessage = {
          id: crypto.randomUUID(),
          senderId: message.senderId,
          receiverId: message.receiverId,
          content: message.content,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.data.messages.push(newMessage);
        return newMessage;
      }
    };
    DbStorage = class {
      // User methods
      async getUser(id) {
        const result = await db.select().from(users).where(eq(users.id, id));
        return result[0];
      }
      async getUserById(id) {
        return this.getUser(id);
      }
      async getUserByUsername(username) {
        const result = await db.select().from(users).where(eq(users.username, username));
        return result[0];
      }
      async getUserByEmail(email) {
        const result = await db.select().from(users).where(eq(users.email, email));
        return result[0];
      }
      async searchUsers(searchTerm) {
        const term = `%${searchTerm}%`;
        return await db.select().from(users).where(
          or(
            like(users.username, term),
            like(users.email, term),
            like(users.displayName, term)
          )
        );
      }
      async getAllUsers() {
        return await db.select().from(users);
      }
      async updateUser(id, userData) {
        const result = await db.update(users).set(userData).where(eq(users.id, id)).returning();
        if (!result[0]) throw new Error("User not found");
        return result[0];
      }
      async updateUserPreferences(userId, preferences) {
        return {
          id: 1,
          userId,
          interests: preferences.interests || null,
          favoriteTopics: preferences.favoriteTopics || null,
          engagementHistory: preferences.engagementHistory || null,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
      }
      async getUserPreferences(userId) {
        return void 0;
      }
      async createUser(user) {
        const result = await db.insert(users).values(user).returning();
        return result[0];
      }
      async updateUserPassword(userId, hashedPassword) {
        const result = await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId)).returning();
        return result[0];
      }
      async setVerifiedApologeticsAnswerer(userId, isVerified) {
        const result = await db.update(users).set({ isVerifiedApologeticsAnswerer: isVerified }).where(eq(users.id, userId)).returning();
        if (!result[0]) throw new Error("User not found");
        return result[0];
      }
      async getVerifiedApologeticsAnswerers() {
        return await db.select().from(users).where(eq(users.isVerifiedApologeticsAnswerer, true));
      }
      // Community methods - simplified for now
      async getAllCommunities() {
        return await db.select().from(communities);
      }
      async searchCommunities(searchTerm) {
        const term = `%${searchTerm}%`;
        return await db.select().from(communities).where(
          or(
            like(communities.name, term),
            like(communities.description, term)
          )
        );
      }
      async getPublicCommunitiesAndUserCommunities(userId, searchQuery) {
        let whereCondition = eq(communities.isPrivate, false);
        if (searchQuery) {
          const term = `%${searchQuery}%`;
          whereCondition = and(whereCondition, or(like(communities.name, term), like(communities.description, term)));
        }
        const query = db.select().from(communities).where(whereCondition);
        return await query;
      }
      async getCommunity(id) {
        const result = await db.select().from(communities).where(eq(communities.id, id));
        return result[0];
      }
      async getCommunityBySlug(slug) {
        const result = await db.select().from(communities).where(eq(communities.slug, slug));
        return result[0];
      }
      async createCommunity(community) {
        const comm = community;
        let latitude = comm.latitude;
        let longitude = comm.longitude;
        if (!latitude && !longitude && (comm.city || comm.state)) {
          const geocodeResult = await geocodeAddress("", comm.city, comm.state);
          if ("latitude" in geocodeResult) {
            latitude = geocodeResult.latitude.toString();
            longitude = geocodeResult.longitude.toString();
          }
        }
        const communityData = {
          ...community,
          latitude,
          longitude
        };
        const result = await db.insert(communities).values(communityData).returning();
        return result[0];
      }
      async updateCommunity(id, community) {
        const result = await db.update(communities).set(community).where(eq(communities.id, id)).returning();
        if (!result[0]) throw new Error("Community not found");
        return result[0];
      }
      async deleteCommunity(id) {
        const result = await db.delete(communities).where(eq(communities.id, id));
        return result.rowCount > 0;
      }
      // Placeholder implementations for other methods - can be expanded as needed
      async getCommunityMembers(communityId) {
        return [];
      }
      async getCommunityMember(communityId, userId) {
        return void 0;
      }
      async getUserCommunities(userId) {
        return [];
      }
      async addCommunityMember(member) {
        throw new Error("Not implemented");
      }
      async updateCommunityMemberRole(id, role) {
        throw new Error("Not implemented");
      }
      async removeCommunityMember(communityId, userId) {
        return false;
      }
      async isCommunityMember(communityId, userId) {
        return false;
      }
      async isCommunityOwner(communityId, userId) {
        return false;
      }
      async isCommunityModerator(communityId, userId) {
        return false;
      }
      // Community invitation methods
      async createCommunityInvitation(invitation) {
        throw new Error("Not implemented");
      }
      async getCommunityInvitations(communityId) {
        return [];
      }
      async getCommunityInvitationByToken(token) {
        return void 0;
      }
      async getCommunityInvitationById(id) {
        return void 0;
      }
      async updateCommunityInvitationStatus(id, status) {
        throw new Error("Not implemented");
      }
      async deleteCommunityInvitation(id) {
        return false;
      }
      async getCommunityInvitationByEmailAndCommunity(email, communityId) {
        return void 0;
      }
      // Community chat room methods
      async getCommunityRooms(communityId) {
        return [];
      }
      async getPublicCommunityRooms(communityId) {
        return [];
      }
      async getCommunityRoom(id) {
        return void 0;
      }
      async createCommunityRoom(room) {
        throw new Error("Not implemented");
      }
      async updateCommunityRoom(id, data) {
        throw new Error("Not implemented");
      }
      async deleteCommunityRoom(id) {
        return false;
      }
      // Chat message methods
      async getChatMessages(roomId, limit) {
        return [];
      }
      async getChatMessagesAfter(roomId, afterId) {
        return [];
      }
      async createChatMessage(message) {
        throw new Error("Not implemented");
      }
      async deleteChatMessage(id) {
        return false;
      }
      // Community wall post methods
      async getCommunityWallPosts(communityId, isPrivate) {
        return [];
      }
      async getCommunityWallPost(id) {
        return void 0;
      }
      async createCommunityWallPost(post) {
        throw new Error("Not implemented");
      }
      async updateCommunityWallPost(id, data) {
        throw new Error("Not implemented");
      }
      async deleteCommunityWallPost(id) {
        return false;
      }
      // Post methods
      async getAllPosts(filter) {
        return [];
      }
      async getPost(id) {
        return void 0;
      }
      async getPostsByCommunitySlug(communitySlug, filter) {
        return [];
      }
      async getPostsByGroupId(groupId, filter) {
        return [];
      }
      async getUserPosts(userId) {
        return [];
      }
      async createPost(post) {
        throw new Error("Not implemented");
      }
      async upvotePost(id) {
        throw new Error("Not implemented");
      }
      // Comment methods
      async getComment(id) {
        return void 0;
      }
      async getCommentsByPostId(postId) {
        return [];
      }
      async createComment(comment) {
        throw new Error("Not implemented");
      }
      async upvoteComment(id) {
        throw new Error("Not implemented");
      }
      // Group methods
      async getGroup(id) {
        return void 0;
      }
      async getGroupsByUserId(userId) {
        return [];
      }
      async createGroup(group) {
        throw new Error("Not implemented");
      }
      // Group member methods
      async addGroupMember(member) {
        throw new Error("Not implemented");
      }
      async getGroupMembers(groupId) {
        return [];
      }
      async isGroupAdmin(groupId, userId) {
        return false;
      }
      async isGroupMember(groupId, userId) {
        return false;
      }
      // Apologetics resource methods
      async getAllApologeticsResources() {
        return [];
      }
      async getApologeticsResource(id) {
        return void 0;
      }
      async createApologeticsResource(resource) {
        throw new Error("Not implemented");
      }
      // Prayer request methods
      async getPublicPrayerRequests() {
        return [];
      }
      async getAllPrayerRequests(filter) {
        return [];
      }
      async getPrayerRequest(id) {
        return void 0;
      }
      async getUserPrayerRequests(userId) {
        return [];
      }
      async getGroupPrayerRequests(groupId) {
        return [];
      }
      async getPrayerRequestsVisibleToUser(userId) {
        const userGroups = await db.select({ groupId: groupMembers.groupId }).from(groupMembers).where(eq(groupMembers.userId, userId));
        const groupIds = userGroups.map((g) => g.groupId);
        const conditions = [];
        conditions.push(eq(prayerRequests.privacyLevel, "public"));
        if (groupIds.length > 0) {
          conditions.push(and(
            eq(prayerRequests.privacyLevel, "group-only"),
            inArray(prayerRequests.groupId, groupIds)
          ));
        }
        conditions.push(eq(prayerRequests.authorId, userId));
        return await db.select().from(prayerRequests).where(or(...conditions));
      }
      async createPrayerRequest(prayer) {
        throw new Error("Not implemented");
      }
      async updatePrayerRequest(id, prayer) {
        throw new Error("Not implemented");
      }
      async markPrayerRequestAsAnswered(id, description) {
        throw new Error("Not implemented");
      }
      async deletePrayerRequest(id) {
        return false;
      }
      // Prayer methods
      async createPrayer(prayer) {
        throw new Error("Not implemented");
      }
      async getPrayersForRequest(prayerRequestId) {
        return [];
      }
      async getUserPrayedRequests(userId) {
        return [];
      }
      // Apologetics Q&A methods
      async getAllApologeticsTopics() {
        return [];
      }
      async getApologeticsTopic(id) {
        return void 0;
      }
      async getApologeticsTopicBySlug(slug) {
        return void 0;
      }
      async createApologeticsTopic(topic) {
        throw new Error("Not implemented");
      }
      async getAllApologeticsQuestions(filterByStatus) {
        return [];
      }
      async getApologeticsQuestion(id) {
        return void 0;
      }
      async getApologeticsQuestionsByTopic(topicId) {
        return [];
      }
      async createApologeticsQuestion(question) {
        throw new Error("Not implemented");
      }
      async updateApologeticsQuestionStatus(id, status) {
        throw new Error("Not implemented");
      }
      async getApologeticsAnswersByQuestion(questionId) {
        return [];
      }
      async createApologeticsAnswer(answer) {
        throw new Error("Not implemented");
      }
      // Event methods
      async getAllEvents() {
        return [];
      }
      async getEvent(id) {
        return void 0;
      }
      async getUserEvents(userId) {
        return [];
      }
      async createEvent(event) {
        throw new Error("Not implemented");
      }
      async updateEvent(id, data) {
        throw new Error("Not implemented");
      }
      async deleteEvent(id) {
        return false;
      }
      async getNearbyEvents(latitude, longitude, radius) {
        console.warn("getNearbyEvents is not fully implemented in DbStorage. Returning empty array.");
        return [];
      }
      // Event RSVP methods
      async createEventRSVP(rsvp) {
        throw new Error("Not implemented");
      }
      async getEventRSVPs(eventId) {
        return [];
      }
      async getUserEventRSVP(eventId, userId) {
        return void 0;
      }
      async updateEventRSVP(id, status) {
        throw new Error("Not implemented");
      }
      async deleteEventRSVP(id) {
        return false;
      }
      // Livestream methods
      async getAllLivestreams() {
        return [];
      }
      async createLivestream(livestream) {
        const result = await db.insert(livestreams).values(livestream).returning();
        return result[0];
      }
      // Microblog methods
      async getAllMicroblogs() {
        return [];
      }
      async getMicroblog(id) {
        return void 0;
      }
      async getUserMicroblogs(userId) {
        return [];
      }
      async createMicroblog(microblog) {
        throw new Error("Not implemented");
      }
      async updateMicroblog(id, data) {
        throw new Error("Not implemented");
      }
      async deleteMicroblog(id) {
        return false;
      }
      // Microblog like methods
      async likeMicroblog(microblogId, userId) {
        throw new Error("Not implemented");
      }
      async unlikeMicroblog(microblogId, userId) {
        return false;
      }
      async getUserLikedMicroblogs(userId) {
        return [];
      }
      // Livestreamer application methods
      async getLivestreamerApplicationByUserId(userId) {
        return void 0;
      }
      async getPendingLivestreamerApplications() {
        return [];
      }
      async createLivestreamerApplication(application) {
        throw new Error("Not implemented");
      }
      async updateLivestreamerApplication(id, status, reviewNotes, reviewerId) {
        throw new Error("Not implemented");
      }
      async isApprovedLivestreamer(userId) {
        return false;
      }
      // Apologist Scholar application methods
      async getApologistScholarApplicationByUserId(userId) {
        return void 0;
      }
      async getPendingApologistScholarApplications() {
        return [];
      }
      async createApologistScholarApplication(application) {
        throw new Error("Not implemented");
      }
      async updateApologistScholarApplication(id, status, reviewNotes, reviewerId) {
        throw new Error("Not implemented");
      }
      // Bible Reading Plan methods
      async getAllBibleReadingPlans() {
        return [];
      }
      async getBibleReadingPlan(id) {
        return void 0;
      }
      async createBibleReadingPlan(plan) {
        throw new Error("Not implemented");
      }
      // Bible Reading Progress methods
      async getBibleReadingProgress(userId, planId) {
        return void 0;
      }
      async createBibleReadingProgress(progress) {
        throw new Error("Not implemented");
      }
      async markDayCompleted(progressId, day) {
        throw new Error("Not implemented");
      }
      // Bible Study Note methods
      async getBibleStudyNotes(userId) {
        return [];
      }
      async getBibleStudyNote(id) {
        return void 0;
      }
      async createBibleStudyNote(note) {
        throw new Error("Not implemented");
      }
      async updateBibleStudyNote(id, data) {
        throw new Error("Not implemented");
      }
      async deleteBibleStudyNote(id) {
        return false;
      }
      // Admin methods
      async getAllLivestreamerApplications() {
        return await db.select().from(livestreamerApplications);
      }
      async getAllApologistScholarApplications() {
        return await db.select().from(apologistScholarApplications);
      }
      async getLivestreamerApplicationStats() {
        const all = await db.select().from(livestreamerApplications);
        return {
          total: all.length,
          pending: all.filter((a) => a.status === "pending").length,
          approved: all.filter((a) => a.status === "approved").length,
          rejected: all.filter((a) => a.status === "rejected").length
        };
      }
      async updateLivestreamerApplicationStatus(id, status, reviewNotes) {
        const result = await db.update(livestreamerApplications).set({
          status,
          reviewNotes: reviewNotes || null,
          reviewedAt: /* @__PURE__ */ new Date()
        }).where(eq(livestreamerApplications.id, id)).returning();
        if (!result[0]) throw new Error("Application not found");
        return result[0];
      }
      async deleteUser(userId) {
        const result = await db.delete(users).where(eq(users.id, userId));
        return result.rowCount > 0;
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
    };
    storage = process.env.USE_DB === "true" ? new DbStorage() : new MemStorage();
  }
});

// server/config/domain.ts
function getFullUrl(path3) {
  const formattedPath = path3.startsWith("/") ? path3 : `/${path3}`;
  return `${BASE_URL}${formattedPath}`;
}
var APP_DOMAIN, BASE_URL, EMAIL_FROM, APP_URLS;
var init_domain = __esm({
  "server/config/domain.ts"() {
    APP_DOMAIN = process.env.APP_DOMAIN || "www.theconnection.app";
    BASE_URL = `https://${APP_DOMAIN}`;
    EMAIL_FROM = process.env.AWS_SES_FROM_EMAIL || `The Connection <noreply@${APP_DOMAIN}>`;
    APP_URLS = {
      // Auth
      AUTH: getFullUrl("/auth"),
      RESET_PASSWORD: getFullUrl("/reset-password"),
      // Admin
      ADMIN_DASHBOARD: getFullUrl("/admin"),
      ADMIN_LIVESTREAMER_APPLICATIONS: getFullUrl("/admin/livestreamer-applications"),
      ADMIN_APOLOGIST_APPLICATIONS: getFullUrl("/admin/apologist-scholar-applications"),
      // User features
      LIVESTREAMS: getFullUrl("/livestreams"),
      LIVESTREAM_CREATE: getFullUrl("/livestreams/create"),
      LIVESTREAMER_APPLICATION: getFullUrl("/livestreamer-application"),
      APOLOGETICS_QUESTIONS: getFullUrl("/apologetics/questions"),
      APOLOGIST_APPLICATION: getFullUrl("/apologist-scholar-application")
    };
  }
});

// server/email-templates.ts
var email_templates_exports = {};
__export(email_templates_exports, {
  setupApologistScholarApplicationNotificationTemplate: () => setupApologistScholarApplicationNotificationTemplate,
  setupApplicationNotificationTemplate: () => setupApplicationNotificationTemplate,
  setupApplicationStatusUpdateTemplate: () => setupApplicationStatusUpdateTemplate
});
async function setupApplicationNotificationTemplate() {
  const templateName = DEFAULT_TEMPLATES.APPLICATION_NOTIFICATION;
  const subjectPart = "New Livestreamer Application: {{applicantName}}";
  const htmlPart = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #6d28d9; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">The Connection</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <h2>New Livestreamer Application</h2>
        <p>A new application to become a livestreamer has been submitted and requires your review.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #6d28d9;">Application Details</h3>
          <p><strong>Applicant:</strong> {{applicantName}}</p>
          <p><strong>Email:</strong> {{applicantEmail}}</p>
          <p><strong>Ministry Name:</strong> {{ministryName}}</p>
          <p><strong>Application ID:</strong> {{applicationId}}</p>
          <p><strong>Submitted On:</strong> {{applicationDate}}</p>
        </div>
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="{{reviewLink}}" style="background-color: #6d28d9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Review Application</a>
        </div>
        
        <p style="margin-top: 20px;">Please review this application at your earliest convenience.</p>
      </div>
    </div>
  `;
  try {
    const template = await getEmailTemplate(templateName);
    if (template) {
      return updateEmailTemplate({
        TemplateName: templateName,
        SubjectPart: subjectPart,
        HtmlPart: htmlPart
      });
    } else {
      return createEmailTemplate({
        TemplateName: templateName,
        SubjectPart: subjectPart,
        HtmlPart: htmlPart
      });
    }
  } catch (error) {
    console.error(`Error setting up ${templateName}:`, error);
    return false;
  }
}
async function setupApologistScholarApplicationNotificationTemplate() {
  return setupApplicationNotificationTemplate();
}
async function setupApplicationStatusUpdateTemplate() {
  const templateName = DEFAULT_TEMPLATES.APPLICATION_STATUS_UPDATE;
  const subjectPart = "Your Livestreamer Application Status: {{status}}";
  const htmlPart = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #6d28d9; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">The Connection</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <h2>Livestreamer Application Update</h2>
        <p>Hello {{applicantName}},</p>
        <p>Your application to become a livestreamer for {{ministryName}} has been <strong>{{status}}</strong>.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #6d28d9;">Review Notes</h3>
          <p>{{reviewNotes}}</p>
        </div>
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="{{platformLink}}" style="background-color: #6d28d9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Visit Platform</a>
        </div>
        
        <p style="margin-top: 20px;">Thank you for your interest in contributing to our community.</p>
        
        <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
          This email was sent to {{email}}.<br>
          You're receiving this email because you submitted a livestreamer application.
        </p>
      </div>
    </div>
  `;
  try {
    const template = await getEmailTemplate(templateName);
    if (template) {
      return updateEmailTemplate({
        TemplateName: templateName,
        SubjectPart: subjectPart,
        HtmlPart: htmlPart
      });
    } else {
      return createEmailTemplate({
        TemplateName: templateName,
        SubjectPart: subjectPart,
        HtmlPart: htmlPart
      });
    }
  } catch (error) {
    console.error(`Error setting up ${templateName}:`, error);
    return false;
  }
}
var init_email_templates = __esm({
  "server/email-templates.ts"() {
    init_email();
  }
});

// server/email.ts
import {
  SESClient,
  SendEmailCommand,
  CreateTemplateCommand,
  UpdateTemplateCommand,
  DeleteTemplateCommand,
  ListTemplatesCommand,
  GetTemplateCommand,
  SendTemplatedEmailCommand
} from "@aws-sdk/client-ses";
async function sendEmail(params) {
  if (forceMockMode || !emailFunctionalityEnabled) {
    console.log("\u{1F4E7} [MOCK] Would have sent email to:", params.to);
    console.log("\u{1F4E7} [MOCK] Email subject:", params.subject);
    if (process.env.NODE_ENV !== "production") {
      console.log("\u{1F4E7} [MOCK] Email content (Text):", params.text?.substring(0, 100) + (params.text && params.text.length > 100 ? "..." : ""));
      console.log("\u{1F4E7} [MOCK] Email content (HTML):", params.html?.substring(0, 100) + (params.html && params.html.length > 100 ? "..." : ""));
    }
    return true;
  }
  try {
    const sendEmailCommand = new SendEmailCommand({
      Destination: {
        ToAddresses: [params.to]
      },
      Message: {
        Body: {
          ...params.html && {
            Html: {
              Charset: "UTF-8",
              Data: params.html
            }
          },
          ...params.text && {
            Text: {
              Charset: "UTF-8",
              Data: params.text
            }
          }
        },
        Subject: {
          Charset: "UTF-8",
          Data: params.subject
        }
      },
      Source: params.from
    });
    const response = await sesClient.send(sendEmailCommand);
    console.log(`Email sent successfully to ${params.to}`, response.MessageId);
    return true;
  } catch (error) {
    console.error("AWS SES email error:", error);
    console.log("Failed to send email to:", params.to);
    console.log("Email subject:", params.subject);
    if (process.env.NODE_ENV !== "production" && process.env.MOCK_EMAIL_SUCCESS === "true") {
      console.log("MOCK_EMAIL_SUCCESS is enabled - simulating successful email delivery");
      return true;
    }
    return false;
  }
}
async function createEmailTemplate(params) {
  if (forceMockMode || !emailFunctionalityEnabled) {
    console.log("\u{1F4E7} [MOCK] Would have created template:", params.TemplateName);
    return true;
  }
  try {
    const createTemplateCommand = new CreateTemplateCommand({
      Template: {
        TemplateName: params.TemplateName,
        SubjectPart: params.SubjectPart,
        TextPart: params.TextPart,
        HtmlPart: params.HtmlPart
      }
    });
    await sesClient.send(createTemplateCommand);
    console.log("Email template created:", params.TemplateName);
    return true;
  } catch (error) {
    console.error("Error creating email template:", error);
    return false;
  }
}
async function updateEmailTemplate(params) {
  if (forceMockMode || !emailFunctionalityEnabled) {
    console.log("\u{1F4E7} [MOCK] Would have updated template:", params.TemplateName);
    return true;
  }
  try {
    const updateTemplateCommand = new UpdateTemplateCommand({
      Template: {
        TemplateName: params.TemplateName,
        SubjectPart: params.SubjectPart,
        TextPart: params.TextPart,
        HtmlPart: params.HtmlPart
      }
    });
    await sesClient.send(updateTemplateCommand);
    console.log("Email template updated:", params.TemplateName);
    return true;
  } catch (error) {
    console.error("Error updating email template:", error);
    return false;
  }
}
async function listEmailTemplates() {
  if (forceMockMode || !emailFunctionalityEnabled) {
    console.log("\u{1F4E7} [MOCK] Would have listed templates.");
    return Object.values(DEFAULT_TEMPLATES);
  }
  try {
    const listTemplatesCommand = new ListTemplatesCommand({});
    const response = await sesClient.send(listTemplatesCommand);
    return (response.TemplatesMetadata || []).map((template) => template.Name || "");
  } catch (error) {
    console.error("Error listing email templates:", error);
    return [];
  }
}
async function getEmailTemplate(templateName) {
  if (forceMockMode || !emailFunctionalityEnabled) {
    console.log("\u{1F4E7} [MOCK] Would have retrieved template:", templateName);
    return {
      TemplateName: templateName,
      SubjectPart: `Mock subject for ${templateName}`,
      TextPart: `Mock text content for ${templateName}`,
      HtmlPart: `<div>Mock HTML content for ${templateName}</div>`
    };
  }
  try {
    const getTemplateCommand = new GetTemplateCommand({
      TemplateName: templateName
    });
    const response = await sesClient.send(getTemplateCommand);
    return response.Template || null;
  } catch (error) {
    console.error("Error getting email template:", error);
    return null;
  }
}
async function sendTemplatedEmail(params) {
  const { to, from, templateName, templateData } = params;
  if (forceMockMode || !emailFunctionalityEnabled) {
    console.log("\u{1F4E7} [MOCK] Would have sent templated email to:", to);
    console.log("\u{1F4E7} [MOCK] Template:", templateName);
    console.log("\u{1F4E7} [MOCK] Template data:", JSON.stringify(templateData));
    return true;
  }
  try {
    const sendTemplatedEmailCommand = new SendTemplatedEmailCommand({
      Destination: {
        ToAddresses: [to]
      },
      Source: from,
      Template: templateName,
      TemplateData: JSON.stringify(templateData)
    });
    const response = await sesClient.send(sendTemplatedEmailCommand);
    console.log(`Templated email sent successfully to ${to}`, response.MessageId);
    return true;
  } catch (error) {
    console.error("Error sending templated email:", error);
    return false;
  }
}
async function initializeEmailTemplates() {
  console.log("Initializing email templates...");
  console.log(`Email functionality enabled: ${emailFunctionalityEnabled}`);
  console.log(`Using AWS Region: ${awsRegion}`);
  console.log(`Forced mock mode: ${forceMockMode}`);
  if (forceMockMode) {
    console.log("\u{1F4A1} Running in FORCED MOCK MODE - skipping actual AWS SES template setup");
    console.log("\u2713 Welcome template setup complete (mock)");
    console.log("\u2713 Password reset template setup complete (mock)");
    console.log("\u2713 Notification template setup complete (mock)");
    console.log("\u2713 Livestream invite template setup complete (mock)");
    console.log("\u2713 Application notification template setup complete (mock)");
    console.log("\u2713 Application status update template setup complete (mock)");
    console.log("\u2713 Community invitation template setup complete (mock)");
    console.log("\u2713 All email templates successfully initialized in mock mode.");
    return;
  }
  if (!emailFunctionalityEnabled) {
    console.log("Email functionality disabled. Skipping template initialization.");
    console.log("Email templates initialized in mock mode.");
    return;
  }
  try {
    try {
      const listResult = await listEmailTemplates();
      console.log(`Found ${listResult.length} existing email templates`);
    } catch (error) {
      console.error("Error testing AWS SES credentials:", error);
      console.log("Email template initialization aborted due to credential issues.");
      console.log("Email templates initialized in fallback mode.");
      return;
    }
    await setupWelcomeTemplate();
    console.log("\u2713 Welcome template setup complete");
    await setupPasswordResetTemplate();
    console.log("\u2713 Password reset template setup complete");
    await setupNotificationTemplate();
    console.log("\u2713 Notification template setup complete");
    await setupLivestreamInviteTemplate();
    console.log("\u2713 Livestream invite template setup complete");
    const { setupApplicationNotificationTemplate: setupApplicationNotificationTemplate2, setupApplicationStatusUpdateTemplate: setupApplicationStatusUpdateTemplate2 } = await Promise.resolve().then(() => (init_email_templates(), email_templates_exports));
    await setupApplicationNotificationTemplate2();
    console.log("\u2713 Application notification template setup complete");
    await setupApplicationStatusUpdateTemplate2();
    console.log("\u2713 Application status update template setup complete");
    await setupCommunityInvitationTemplate();
    console.log("\u2713 Community invitation template setup complete");
    console.log("\u2713 All email templates successfully initialized.");
  } catch (error) {
    console.error("Error initializing email templates:", error);
    console.log("Email templates initialized with errors.");
  }
}
async function setupWelcomeTemplate() {
  const templateName = DEFAULT_TEMPLATES.WELCOME;
  const subjectPart = "Welcome to The Connection!";
  const htmlPart = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #6d28d9; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">The Connection</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <h2>Welcome, {{name}}!</h2>
        <p>Thank you for joining The Connection, a Christian community platform for spiritual growth, apologetics, and Bible study.</p>
        <p>Here's what you can do:</p>
        <ul>
          <li>Join communities based on your interests</li>
          <li>Participate in discussions about faith</li>
          <li>Access apologetics resources</li>
          <li>Watch and participate in livestreams</li>
          <li>Form or join private groups for Bible study</li>
        </ul>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <div style="margin-top: 30px; text-align: center;">
          <a href="${BASE_URL}/auth" style="background-color: #6d28d9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Sign In Now</a>
        </div>
        <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
          This email was sent to {{email}}. If you did not create this account, please disregard this email.
        </p>
      </div>
    </div>
  `;
  try {
    const template = await getEmailTemplate(templateName);
    if (template) {
      return updateEmailTemplate({
        TemplateName: templateName,
        SubjectPart: subjectPart,
        HtmlPart: htmlPart
      });
    } else {
      return createEmailTemplate({
        TemplateName: templateName,
        SubjectPart: subjectPart,
        HtmlPart: htmlPart
      });
    }
  } catch (error) {
    console.error("Error setting up welcome template:", error);
    return false;
  }
}
async function setupPasswordResetTemplate() {
  const templateName = DEFAULT_TEMPLATES.PASSWORD_RESET;
  const subjectPart = "Reset Your Password - The Connection";
  const htmlPart = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #6d28d9; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">The Connection</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <h2>Password Reset Request</h2>
        <p>Hello {{name}},</p>
        <p>We received a request to reset your password for your account at The Connection. To complete this process, please click the button below.</p>
        <p>This link will expire in 24 hours.</p>
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="{{resetLink}}" style="background-color: #6d28d9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a>
        </div>
        
        <p style="margin-top: 20px;">If you did not request a password reset, please ignore this email or contact our support team if you have concerns.</p>
        
        <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
          This email was sent to {{email}}. 
        </p>
      </div>
    </div>
  `;
  try {
    const template = await getEmailTemplate(templateName);
    if (template) {
      return updateEmailTemplate({
        TemplateName: templateName,
        SubjectPart: subjectPart,
        HtmlPart: htmlPart
      });
    } else {
      return createEmailTemplate({
        TemplateName: templateName,
        SubjectPart: subjectPart,
        HtmlPart: htmlPart
      });
    }
  } catch (error) {
    console.error("Error setting up password reset template:", error);
    return false;
  }
}
async function setupNotificationTemplate() {
  const templateName = DEFAULT_TEMPLATES.NOTIFICATION;
  const subjectPart = "{{subject}}";
  const htmlPart = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #6d28d9; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">The Connection</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <h2>{{title}}</h2>
        <p>Hello {{name}},</p>
        <p>{{message}}</p>
        
        {{#if actionUrl}}
        <div style="margin-top: 30px; text-align: center;">
          <a href="{{actionUrl}}" style="background-color: #6d28d9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">{{actionText}}</a>
        </div>
        {{/if}}
        
        <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
          This email was sent to {{email}}.<br>
          You're receiving this email because you have an account on The Connection.
        </p>
      </div>
    </div>
  `;
  try {
    const template = await getEmailTemplate(templateName);
    if (template) {
      return updateEmailTemplate({
        TemplateName: templateName,
        SubjectPart: subjectPart,
        HtmlPart: htmlPart
      });
    } else {
      return createEmailTemplate({
        TemplateName: templateName,
        SubjectPart: subjectPart,
        HtmlPart: htmlPart
      });
    }
  } catch (error) {
    console.error("Error setting up notification template:", error);
    return false;
  }
}
async function setupLivestreamInviteTemplate() {
  const templateName = DEFAULT_TEMPLATES.LIVESTREAM_INVITE;
  const subjectPart = "You're Invited: {{streamTitle}} - Live on The Connection";
  const htmlPart = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #6d28d9; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">The Connection</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <h2>You're Invited to a Livestream</h2>
        <p>Hello {{name}},</p>
        <p>{{hostName}} has invited you to join their upcoming livestream:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #6d28d9;">{{streamTitle}}</h3>
          <p style="margin-bottom: 5px;"><strong>When:</strong> {{streamDate}} at {{streamTime}}</p>
          <p style="margin-top: 0;"><strong>Description:</strong> {{streamDescription}}</p>
        </div>
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="{{streamUrl}}" style="background-color: #6d28d9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Join Livestream</a>
        </div>
        
        <p style="margin-top: 20px;">Don't miss out on this opportunity to connect and grow in your faith journey!</p>
        
        <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
          This email was sent to {{email}}.<br>
          You're receiving this invitation because you're a member of The Connection community.
        </p>
      </div>
    </div>
  `;
  try {
    const template = await getEmailTemplate(templateName);
    if (template) {
      return updateEmailTemplate({
        TemplateName: templateName,
        SubjectPart: subjectPart,
        HtmlPart: htmlPart
      });
    } else {
      return createEmailTemplate({
        TemplateName: templateName,
        SubjectPart: subjectPart,
        HtmlPart: htmlPart
      });
    }
  } catch (error) {
    console.error("Error setting up livestream invite template:", error);
    return false;
  }
}
async function sendWelcomeEmail(email, displayName = "") {
  const name = displayName || email.split("@")[0];
  const from = EMAIL_FROM;
  const template = await getEmailTemplate(DEFAULT_TEMPLATES.WELCOME);
  if (template) {
    return sendTemplatedEmail({
      to: email,
      from,
      templateName: DEFAULT_TEMPLATES.WELCOME,
      templateData: {
        name,
        email
      }
    });
  } else {
    return sendEmail({
      to: email,
      from,
      subject: "Welcome to The Connection!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #6d28d9; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">The Connection</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <h2>Welcome, ${name}!</h2>
            <p>Thank you for joining The Connection, a Christian community platform for spiritual growth, apologetics, and Bible study.</p>
            <p>Here's what you can do:</p>
            <ul>
              <li>Join communities based on your interests</li>
              <li>Participate in discussions about faith</li>
              <li>Access apologetics resources</li>
              <li>Watch and participate in livestreams</li>
              <li>Form or join private groups for Bible study</li>
            </ul>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <div style="margin-top: 30px; text-align: center;">
              <a href="${BASE_URL}/auth" style="background-color: #6d28d9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Sign In Now</a>
            </div>
            <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
              This email was sent to ${email}. If you did not create this account, please disregard this email.
            </p>
          </div>
        </div>
      `
    });
  }
}
async function setupCommunityInvitationTemplate() {
  const templateName = DEFAULT_TEMPLATES.COMMUNITY_INVITATION;
  const subjectPart = `You're invited to join "{{communityName}}" - The Connection`;
  const htmlPart = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #6d28d9; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">The Connection</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <h2>You've Been Invited!</h2>
        <p>Hello {{recipientName}},</p>
        <p>{{inviterName}} has invited you to join the private community <strong>"{{communityName}}"</strong> on The Connection.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #6d28d9;">{{communityName}}</h3>
          <p style="margin: 5px 0;"><strong>Description:</strong> {{communityDescription}}</p>
          <p style="margin: 5px 0;"><strong>Invited by:</strong> {{inviterName}}</p>
          <p style="margin: 5px 0; font-size: 14px; color: #666;"><strong>Invitation expires:</strong> {{expirationDate}}</p>
        </div>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="{{invitationUrl}}" style="background-color: #6d28d9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Join Community</a>
        </div>
        
        <p style="margin-top: 20px;">This is a private community, so you'll need to use this special invitation link to join. Click the button above to accept the invitation and become a member.</p>
        
        <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
          This invitation was sent to {{email}} by {{inviterName}}.<br>
          If you don't want to join this community, you can safely ignore this email.<br>
          This invitation will expire on {{expirationDate}}.
        </p>
      </div>
    </div>
  `;
  try {
    const template = await getEmailTemplate(templateName);
    if (template) {
      return updateEmailTemplate({
        TemplateName: templateName,
        SubjectPart: subjectPart,
        HtmlPart: htmlPart
      });
    } else {
      return createEmailTemplate({
        TemplateName: templateName,
        SubjectPart: subjectPart,
        HtmlPart: htmlPart
      });
    }
  } catch (error) {
    console.error(`Error setting up ${templateName}:`, error);
    return false;
  }
}
async function sendCommunityInvitationEmail(params, name, p0, token) {
  const recipientName = params.recipientName || params.email.split("@")[0];
  const from = EMAIL_FROM;
  const template = await getEmailTemplate(DEFAULT_TEMPLATES.COMMUNITY_INVITATION);
  if (template) {
    return sendTemplatedEmail({
      to: params.email,
      from,
      templateName: DEFAULT_TEMPLATES.COMMUNITY_INVITATION,
      templateData: {
        recipientName,
        email: params.email,
        inviterName: params.inviterName,
        communityName: params.communityName,
        communityDescription: params.communityDescription,
        invitationUrl: params.invitationUrl,
        expirationDate: params.expirationDate
      }
    });
  } else {
    return sendEmail({
      to: params.email,
      from,
      subject: `You're invited to join "${params.communityName}" - The Connection`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #6d28d9; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">The Connection</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <h2>You've Been Invited!</h2>
            <p>Hello ${recipientName},</p>
            <p>${params.inviterName} has invited you to join the private community <strong>"${params.communityName}"</strong> on The Connection.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #6d28d9;">${params.communityName}</h3>
              <p style="margin: 5px 0;"><strong>Description:</strong> ${params.communityDescription}</p>
              <p style="margin: 5px 0;"><strong>Invited by:</strong> ${params.inviterName}</p>
              <p style="margin: 5px 0; font-size: 14px; color: #666;"><strong>Invitation expires:</strong> ${params.expirationDate}</p>
            </div>
            
            <div style="margin: 30px 0; text-align: center;">
              <a href="${params.invitationUrl}" style="background-color: #6d28d9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Join Community</a>
            </div>
            
            <p style="margin-top: 20px;">This is a private community, so you'll need to use this special invitation link to join. Click the button above to accept the invitation and become a member.</p>
            
            <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
              This invitation was sent to ${params.email} by ${params.inviterName}.<br>
              If you don't want to join this community, you can safely ignore this email.<br>
              This invitation will expire on ${params.expirationDate}.
            </p>
          </div>
        </div>
      `
    });
  }
}
var emailFunctionalityEnabled, forceMockMode, awsRegion, sesClient, DEFAULT_TEMPLATES;
var init_email = __esm({
  "server/email.ts"() {
    init_domain();
    emailFunctionalityEnabled = false;
    forceMockMode = true;
    console.log("\u{1F4E7} [SETUP] Using hardcoded MOCK MODE for email functionality");
    if (forceMockMode) {
      console.log("\u{1F4E7} Email functionality running in FORCED MOCK MODE. No actual emails will be sent.");
      console.log("\u{1F4E7} All email operations will simulate success for testing purposes.");
    } else if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
      console.warn("\u26A0\uFE0F AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION) not set. Email functionality will be disabled.");
      console.warn("\u26A0\uFE0F Users can still register but won't receive actual emails.");
    } else {
      console.log("\u{1F4E7} Email functionality enabled with AWS SES");
      emailFunctionalityEnabled = true;
    }
    awsRegion = "us-east-1";
    if (process.env.AWS_REGION) {
      const regions = process.env.AWS_REGION.split(",");
      if (regions.length > 0) {
        awsRegion = regions[0].trim();
      }
    }
    sesClient = new SESClient({
      region: awsRegion,
      credentials: emailFunctionalityEnabled ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      } : void 0
    });
    DEFAULT_TEMPLATES = {
      WELCOME: "TheConnection_Welcome",
      PASSWORD_RESET: "TheConnection_PasswordReset",
      NOTIFICATION: "TheConnection_Notification",
      LIVESTREAM_INVITE: "TheConnection_LivestreamInvite",
      APPLICATION_NOTIFICATION: "TheConnection_LivestreamerApplicationNotification",
      APPLICATION_STATUS_UPDATE: "TheConnection_ApplicationStatusUpdate",
      COMMUNITY_INVITATION: "TheConnection_CommunityInvitation"
    };
  }
});

// server/run-migrations-organizations.ts
var run_migrations_organizations_exports = {};
__export(run_migrations_organizations_exports, {
  runOrganizationMigrations: () => runOrganizationMigrations
});
async function runOrganizationMigrations() {
  console.log("\u{1F3DB}\uFE0F [express] Starting organization schema migrations");
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        admin_user_id INTEGER NOT NULL,
        plan TEXT DEFAULT 'free',
        website TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        phone TEXT,
        denomination TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("\u2705 Organizations table created/verified");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS organization_users (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("\u2705 Organization users table created/verified");
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_organization_users_org_id ON organization_users(organization_id);
    `);
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_organization_users_user_id ON organization_users(user_id);
    `);
    console.log("\u2705 Organization indexes created");
    console.log("\u{1F3DB}\uFE0F [express] Organization migrations completed successfully");
  } catch (error) {
    console.error("\u274C Organization migration failed:", error);
    throw error;
  }
}
var init_run_migrations_organizations = __esm({
  "server/run-migrations-organizations.ts"() {
    init_db();
  }
});

// server/index.ts
import "dotenv/config";
import express3 from "express";

// server/routes.ts
import { Server as SocketIOServer } from "socket.io";

// server/auth.ts
init_storage();
init_email();
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
}
function isAdmin(req, res, next) {
  if (req.session && req.session.userId && req.session.isAdmin === true) {
    return next();
  }
  return res.status(403).json({ message: "Unauthorized: Admin access required" });
}
function setupAuth(app2) {
  app2.post("/api/register", async (req, res) => {
    try {
      const { username, email, password, displayName } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({
          message: "Username, email, and password are required"
        });
      }
      if (password.length < 6) {
        return res.status(400).json({
          message: "Password must be at least 6 characters long"
        });
      }
      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email address already in use" });
      }
      console.log(`[REGISTRATION] Creating user with data:`, { username, email, displayName: displayName || username });
      const user = await storage.createUser({
        username,
        email,
        password,
        // Store plaintext password for testing
        displayName: displayName || username,
        isAdmin: false
      });
      console.log(`[REGISTRATION] User created successfully:`, {
        id: user.id,
        username: user.username,
        idType: typeof user.id,
        userObject: JSON.stringify(user, null, 2)
      });
      try {
        await sendWelcomeEmail(user.email, user.displayName || username);
      } catch (error) {
        console.error("Failed to send welcome email:", error);
      }
      if (!req.session) {
        console.error("[REGISTRATION] No session available on request");
        return res.status(500).json({ message: "Session initialization failed" });
      }
      console.log(`[REGISTRATION] Before setting session data - Current session:`, {
        sessionID: req.sessionID,
        sessionExists: !!req.session,
        currentUserId: req.session?.userId,
        currentUsername: req.session?.username
      });
      req.session.userId = user.id.toString();
      req.session.username = user.username;
      req.session.isAdmin = user.isAdmin || false;
      console.log(`[REGISTRATION] After setting session data for user ${user.username}:`, {
        userId: req.session.userId,
        username: req.session.username,
        isAdmin: req.session.isAdmin,
        sessionID: req.sessionID,
        userIdType: typeof req.session.userId,
        originalUserId: user.id,
        originalUserIdType: typeof user.id
      });
      req.session.save((err) => {
        if (err) {
          console.error("[REGISTRATION] Session save error:", err);
          return res.status(500).json({ message: "Error creating session" });
        }
        console.log(`[REGISTRATION] Session saved successfully for user ${user.username} (ID: ${user.id}), Session ID: ${req.sessionID}`);
        console.log(`[REGISTRATION] Final session state after save:`, {
          userId: req.session?.userId,
          username: req.session?.username,
          isAdmin: req.session?.isAdmin,
          sessionID: req.sessionID
        });
        const { password: password2, ...userWithoutPassword } = user;
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Error creating user" });
    }
  });
  app2.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      console.log(`Login attempt for username: ${username}`);
      try {
        let user = await storage.getUserByUsername(username);
        if (!user && username.includes("@")) {
          user = await storage.getUserByEmail(username);
        }
        if (!user) {
          console.log(`User not found: ${username}`);
          return res.status(401).json({ message: "Invalid username or password" });
        }
        if (user.password !== password) {
          console.log(`Invalid password for user: ${username}`);
          return res.status(401).json({ message: "Invalid username or password" });
        }
        req.session.userId = user.id.toString();
        req.session.username = user.username;
        req.session.isAdmin = user.isAdmin || false;
        req.session.email = user.email;
        console.log(`Setting session data for user ${username}:`, {
          userId: req.session.userId,
          username: req.session.username,
          sessionID: req.sessionID
        });
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            return res.status(500).json({ message: "Error creating session" });
          }
          console.log(`User logged in successfully: ${username} (ID: ${user.id}), Session saved with ID: ${req.sessionID}`);
          const { password: password2, ...userWithoutPassword } = user;
          return res.status(200).json(userWithoutPassword);
        });
      } catch (error) {
        console.error(`Error retrieving user ${username}:`, error);
        return res.status(500).json({ message: "Database error" });
      }
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/admin-login", async (req, res) => {
    try {
      const admin = await storage.getUserByUsername("admin123");
      if (!admin) {
        return res.status(404).json({ message: "Admin user not found" });
      }
      req.session.userId = admin.id.toString();
      req.session.username = admin.username;
      req.session.isAdmin = true;
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Error creating session" });
        }
        console.log(`Admin login successful: (ID: ${admin.id})`);
        const { password, ...adminWithoutPassword } = admin;
        return res.status(200).json(adminWithoutPassword);
      });
    } catch (error) {
      console.error("Admin login error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/logout", (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Error logging out" });
        }
        res.status(200).json({ message: "Logged out successfully" });
      });
    } else {
      res.status(200).json({ message: "Already logged out" });
    }
  });
  app2.get("/api/user", async (req, res) => {
    try {
      console.log(`/api/user request - SessionID: ${req.sessionID}, Session data:`, {
        hasSession: !!req.session,
        userId: req.session?.userId,
        username: req.session?.username,
        sessionID: req.sessionID
      });
      if (!req.session || !req.session.userId) {
        console.log("Authentication failed - no session or userId");
        return res.status(401).json({ message: "Not authenticated" });
      }
      try {
        const userId = parseInt(String(req.session.userId));
        const user = await storage.getUser(userId);
        if (!user) {
          req.session.destroy((err) => {
            if (err) console.error("Error destroying invalid session:", err);
          });
          return res.status(401).json({ message: "User not found" });
        }
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      } catch (error) {
        console.error(`Error retrieving user ID ${req.session.userId}:`, error);
        return res.status(500).json({ message: "Database error" });
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
}

// server/routes.ts
init_storage();
init_schema();
init_domain();
init_email();

// server/email-notifications.ts
init_email();
init_domain();
async function sendLivestreamerApplicationNotificationEmail(params, fullName, id) {
  try {
    const templateData = {
      applicantName: params.applicantName,
      applicantEmail: params.applicantEmail,
      ministryName: params.ministryName || "Not specified",
      applicationId: params.applicationId.toString(),
      applicationDate: params.applicationDate,
      reviewLink: params.reviewLink
    };
    return await sendTemplatedEmail({
      to: params.email,
      from: `no-reply@${APP_DOMAIN}`,
      templateName: DEFAULT_TEMPLATES.APPLICATION_NOTIFICATION,
      templateData
    });
  } catch (error) {
    console.error("Error sending livestreamer application notification email:", error);
    return false;
  }
}
async function sendApologistScholarApplicationNotificationEmail(params, fullName, id) {
  try {
    const templateData = {
      applicantName: params.applicantName,
      applicantEmail: params.applicantEmail,
      ministryName: params.ministryName || "Not specified",
      applicationId: params.applicationId.toString(),
      applicationDate: params.applicationDate,
      reviewLink: params.reviewLink
    };
    return await sendTemplatedEmail({
      to: params.email,
      from: `no-reply@${APP_DOMAIN}`,
      templateName: DEFAULT_TEMPLATES.APPLICATION_NOTIFICATION,
      templateData
    });
  } catch (error) {
    console.error("Error sending apologist scholar application notification email:", error);
    return false;
  }
}
async function sendApplicationStatusUpdateEmail(params) {
  try {
    const templateData = {
      applicantName: params.applicantName || "Community Member",
      status: params.status,
      ministryName: params.ministryName || "your ministry",
      reviewNotes: params.reviewNotes || "No additional notes provided.",
      platformLink: params.platformLink,
      email: params.email
    };
    return await sendTemplatedEmail({
      to: params.email,
      from: `no-reply@${APP_DOMAIN}`,
      templateName: DEFAULT_TEMPLATES.APPLICATION_STATUS_UPDATE,
      templateData
    });
  } catch (error) {
    console.error("Error sending application status update email:", error);
    return false;
  }
}

// server/routes.ts
import crypto2 from "crypto";

// server/routes/api/auth.ts
init_storage();
import { Router } from "express";
var router = Router();
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    const passwordMatches = password === user.password;
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.isAdmin = user.isAdmin || false;
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ message: "Error saving session" });
      }
      const { password: _, ...userData } = user;
      res.json(userData);
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});
router.post("/admin-login", async (req, res) => {
  try {
    const adminUser = await storage.getUserByUsername("admin123");
    if (!adminUser) {
      return res.status(404).json({ message: "Admin user not found" });
    }
    req.session.userId = adminUser.id;
    req.session.username = adminUser.username;
    req.session.isAdmin = true;
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ message: "Error saving session" });
      }
      const { password: _, ...userData } = adminUser;
      res.json(userData);
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Server error during admin login" });
  }
});
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Error logging out" });
    }
    res.json({ message: "Logged out successfully" });
  });
});
router.get("/user", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  try {
    const userIdNum = typeof req.session.userId === "string" ? parseInt(req.session.userId, 10) : req.session.userId;
    const user = await storage.getUser(userIdNum);
    if (!user) {
      req.session.destroy(() => {
        res.status(401).json({ message: "User not found" });
      });
      return;
    }
    const { password: _, ...userData } = user;
    res.json(userData);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Error fetching user details" });
  }
});
var auth_default = router;

// server/routes/api/admin.ts
import { Router as Router2 } from "express";
init_storage();
var router2 = Router2();
router2.use(isAdmin);
router2.get("/users", async (req, res, next) => {
  try {
    const users2 = await storage.getAllUsers();
    res.json(users2);
  } catch (error) {
    next(error);
  }
});
router2.get("/users/:id", async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});
router2.get("/applications/livestreamer", async (req, res, next) => {
  try {
    const applications = await storage.getAllLivestreamerApplications();
    res.json(applications);
  } catch (error) {
    next(error);
  }
});
router2.get("/apologist-scholar-applications", async (req, res, next) => {
  try {
    const applications = await storage.getAllApologistScholarApplications();
    res.json(applications);
  } catch (error) {
    next(error);
  }
});
router2.get("/livestreamer-applications/stats", async (req, res, next) => {
  try {
    const stats = await storage.getLivestreamerApplicationStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});
router2.patch("/applications/livestreamer/:id", async (req, res, next) => {
  try {
    const { status, reviewNotes } = req.body;
    const applicationId = parseInt(req.params.id);
    if (isNaN(applicationId)) {
      return res.status(400).json({ message: "Invalid application ID" });
    }
    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid application status" });
    }
    const updatedApplication = await storage.updateLivestreamerApplicationStatus(
      applicationId,
      status,
      reviewNotes
    );
    res.json(updatedApplication);
  } catch (error) {
    next(error);
  }
});
router2.delete("/users/:id", async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const currentUserId = typeof req.session?.userId === "string" ? parseInt(req.session.userId) : req.session?.userId;
    if (userId === currentUserId) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }
    await storage.deleteUser(userId);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
});
var admin_default = router2;

// server/routes/api/user.ts
import { Router as Router3 } from "express";
init_storage();
var router3 = Router3();
router3.use(isAuthenticated);
router3.get("/profile", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const resolvedUserId = typeof userId === "number" ? userId : parseInt(String(userId));
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(resolvedUserId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password, ...userData } = user;
    res.json(userData);
  } catch (error) {
    next(error);
  }
});
router3.patch("/profile", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const resolvedUserId = typeof userId === "number" ? userId : parseInt(String(userId));
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { displayName, bio, avatarUrl, email, city, state, zipCode } = req.body;
    const updateData = {};
    if (displayName !== void 0) updateData.displayName = displayName;
    if (bio !== void 0) updateData.bio = bio;
    if (avatarUrl !== void 0) updateData.avatarUrl = avatarUrl;
    if (email !== void 0) updateData.email = email;
    if (city !== void 0) updateData.city = city;
    if (state !== void 0) updateData.state = state;
    if (zipCode !== void 0) updateData.zipCode = zipCode;
    const updatedUser = await storage.updateUser(resolvedUserId, updateData);
    const { password, ...userData } = updatedUser;
    res.json(userData);
  } catch (error) {
    next(error);
  }
});
router3.patch("/:id", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const resolvedUserId = typeof userId === "number" ? userId : parseInt(String(userId));
    const targetUserId = parseInt(req.params.id);
    if (!userId || resolvedUserId !== targetUserId) {
      return res.status(401).json({ message: "Not authorized to update this profile" });
    }
    const { displayName, bio, avatarUrl, email, city, state, zipCode } = req.body;
    const updateData = {};
    if (displayName !== void 0) updateData.displayName = displayName;
    if (bio !== void 0) updateData.bio = bio;
    if (avatarUrl !== void 0) updateData.avatarUrl = avatarUrl;
    if (email !== void 0) updateData.email = email;
    if (city !== void 0) updateData.city = city;
    if (state !== void 0) updateData.state = state;
    if (zipCode !== void 0) updateData.zipCode = zipCode;
    const updatedUser = await storage.updateUser(targetUserId, updateData);
    const { password, ...userData } = updatedUser;
    res.json(userData);
  } catch (error) {
    next(error);
  }
});
router3.get("/communities", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const resolvedUserId = typeof userId === "number" ? userId : parseInt(String(userId));
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const communities2 = await storage.getAllCommunities();
    res.json(communities2);
  } catch (error) {
    next(error);
  }
});
router3.get("/prayer-requests", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const resolvedUserId = typeof userId === "number" ? userId : parseInt(String(userId));
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const prayerRequests2 = await storage.getUserPrayerRequests(resolvedUserId);
    res.json(prayerRequests2);
  } catch (error) {
    next(error);
  }
});
router3.get("/posts", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const resolvedUserId = typeof userId === "number" ? userId : parseInt(String(userId));
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const posts3 = await storage.getAllPosts();
    res.json(posts3);
  } catch (error) {
    next(error);
  }
});
router3.get("/events", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const resolvedUserId = typeof userId === "number" ? userId : parseInt(String(userId));
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const events3 = await storage.getAllEvents();
    res.json(events3);
  } catch (error) {
    next(error);
  }
});
router3.get("/settings", async (req, res) => {
  try {
    const userId = req.session.userId;
    const resolvedUserId = typeof userId === "number" ? userId : parseInt(String(userId));
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(resolvedUserId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password, ...userData } = user;
    res.json(userData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user settings" });
  }
});
router3.put("/settings", async (req, res) => {
  try {
    const userId = req.session.userId;
    const resolvedUserId = typeof userId === "number" ? userId : parseInt(String(userId));
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { displayName, email, bio, city, state, zipCode } = req.body;
    const updateData = {};
    if (displayName !== void 0) updateData.displayName = displayName;
    if (email !== void 0) updateData.email = email;
    if (bio !== void 0) updateData.bio = bio;
    if (city !== void 0) updateData.city = city;
    if (state !== void 0) updateData.state = state;
    if (zipCode !== void 0) updateData.zipCode = zipCode;
    await storage.updateUser(resolvedUserId, updateData);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Error updating user settings" });
  }
});
var user_default = router3;

// server/routes/userSettingsRoutes.ts
init_storage();
import express from "express";
var isAuthenticated2 = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
};
var router4 = express.Router();
router4.use(isAuthenticated2);
router4.get("/settings", async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const resolvedUserId = typeof userId === "number" ? userId : parseInt(String(userId));
    const user = await storage.getUser(resolvedUserId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password, ...userData } = user;
    res.json(userData);
  } catch (error) {
    console.error("Error fetching user settings:", error);
    res.status(500).json({ message: "Error fetching user settings" });
  }
});
router4.put("/settings", async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { displayName, email, bio, city, state, zipCode } = req.body;
    const updateData = {};
    if (displayName !== void 0) updateData.displayName = displayName;
    if (email !== void 0) updateData.email = email;
    if (bio !== void 0) updateData.bio = bio;
    if (city !== void 0) updateData.city = city;
    if (state !== void 0) updateData.state = state;
    if (zipCode !== void 0) updateData.zipCode = zipCode;
    const resolvedUserId2 = typeof userId === "number" ? userId : parseInt(String(userId));
    await storage.updateUser(resolvedUserId2, updateData);
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating user settings:", error);
    res.status(500).json({ message: "Error updating user settings" });
  }
});
var userSettingsRoutes_default = router4;

// server/routes.ts
var generateToken = () => crypto2.randomBytes(32).toString("hex");
function registerRoutes(app2, httpServer2) {
  setupAuth(app2);
  app2.use((req, _res, next) => {
    const raw = req.session.userId;
    if (typeof raw === "string") {
      const n = Number(raw);
      if (Number.isFinite(n) && n > 0) {
        req.session.userId = n;
      } else {
        delete req.session.userId;
      }
    }
    next();
  });
  const io = new SocketIOServer(httpServer2, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    socket.on("join_user_room", (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined room user_${userId}`);
    });
    socket.on("join_room", (roomId) => {
      socket.join(`room_${roomId}`);
      console.log(`User joined room ${roomId}`);
    });
    socket.on("leave_room", (roomId) => {
      socket.leave(`room_${roomId}`);
      console.log(`User left room ${roomId}`);
    });
    socket.on("new_message", async (data) => {
      try {
        const { roomId, content, senderId } = data;
        const newMessage = await storage.createChatMessage({
          chatRoomId: parseInt(roomId),
          senderId: parseInt(senderId),
          content
        });
        const sender = await storage.getUser(parseInt(senderId));
        const messageWithSender = { ...newMessage, sender };
        io.to(`room_${roomId}`).emit("message_received", messageWithSender);
      } catch (error) {
        console.error("Error handling chat message:", error);
      }
    });
    socket.on("send_dm", async (data) => {
      try {
        const { senderId, receiverId, content } = data;
        const newMessage = {
          senderId: parseInt(senderId),
          receiverId: parseInt(receiverId),
          content,
          createdAt: /* @__PURE__ */ new Date()
        };
        io.to(`user_${senderId}`).emit("new_message", newMessage);
        io.to(`user_${receiverId}`).emit("new_message", newMessage);
      } catch (error) {
        console.error("Error handling DM:", error);
      }
    });
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
  app2.use("/api", auth_default);
  app2.use("/api/admin", admin_default);
  function getSessionUserId(req) {
    const raw = req.session?.userId;
    if (raw === void 0 || raw === null) return void 0;
    if (typeof raw === "number") return raw;
    const n = parseInt(String(raw));
    return Number.isFinite(n) ? n : void 0;
  }
  app2.get("/api/user", async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      if (userId === void 0) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userData } = user;
      res.json(userData);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "Error fetching user" });
    }
  });
  app2.use("/api/user", user_default);
  app2.use("/api/user", userSettingsRoutes_default);
  app2.get("/api/users", async (req, res) => {
    try {
      if (req.query.search) {
        const searchTerm = req.query.search;
        const users3 = await storage.searchUsers(searchTerm);
        const sanitizedUsers2 = users3.map((user) => {
          const { password, ...userData } = user;
          return userData;
        });
        return res.json(sanitizedUsers2);
      }
      const users2 = await storage.getAllUsers();
      const sanitizedUsers = users2.map((user) => {
        const { password, ...userData } = user;
        return userData;
      });
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Error fetching users" });
    }
  });
  app2.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userData } = user;
      res.json(userData);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Error fetching user" });
    }
  });
  app2.get("/users/:id/liked-microblogs", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const likedMicroblogs = await storage.getUserLikedMicroblogs(userId);
      res.json(likedMicroblogs);
    } catch (error) {
      console.error("Error fetching liked microblogs:", error);
      res.status(500).json({ message: "Error fetching liked microblogs" });
    }
  });
  app2.get("/api/communities", async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const searchQuery = req.query.search;
      const communities2 = await storage.getPublicCommunitiesAndUserCommunities(userId, searchQuery);
      res.json(communities2);
    } catch (error) {
      console.error("Error fetching communities:", error);
      res.status(500).json({ message: "Error fetching communities" });
    }
  });
  app2.get("/api/communities/:idOrSlug", async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      const isNumeric = /^\d+$/.test(idOrSlug);
      let community;
      if (isNumeric) {
        const communityId = parseInt(idOrSlug);
        community = await storage.getCommunity(communityId);
      } else {
        community = await storage.getCommunityBySlug(idOrSlug);
      }
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      res.json(community);
    } catch (error) {
      console.error("Error fetching community:", error);
      res.status(500).json({ message: "Error fetching community" });
    }
  });
  app2.post("/api/communities", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const validatedData = insertCommunitySchema.parse({
        ...req.body,
        createdBy: userId
      });
      const community = await storage.createCommunity(validatedData);
      await storage.addCommunityMember({
        communityId: community.id,
        userId,
        role: "owner"
      });
      res.status(201).json(community);
    } catch (error) {
      console.error("Error creating community:", error);
      res.status(500).json({ message: "Error creating community" });
    }
  });
  app2.post("/api/communities/:idOrSlug/join", isAuthenticated, async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      let communityId;
      if (/^\d+$/.test(idOrSlug)) {
        communityId = parseInt(idOrSlug);
      } else {
        const community = await storage.getCommunityBySlug(idOrSlug);
        if (!community) {
          return res.status(404).json({ message: "Community not found" });
        }
        communityId = community.id;
      }
      const userId = getSessionUserId(req);
      const isMember = await storage.isCommunityMember(communityId, userId);
      if (isMember) {
        return res.status(400).json({ message: "Already a member of this community" });
      }
      await storage.addCommunityMember({
        communityId,
        userId,
        role: "member"
      });
      res.json({ message: "Successfully joined community" });
    } catch (error) {
      console.error("Error joining community:", error);
      res.status(500).json({ message: "Error joining community" });
    }
  });
  app2.post("/api/communities/:idOrSlug/leave", isAuthenticated, async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      let communityId;
      if (/^\d+$/.test(idOrSlug)) {
        communityId = parseInt(idOrSlug);
      } else {
        const community = await storage.getCommunityBySlug(idOrSlug);
        if (!community) {
          return res.status(404).json({ message: "Community not found" });
        }
        communityId = community.id;
      }
      const userId = getSessionUserId(req);
      await storage.removeCommunityMember(communityId, userId);
      res.json({ message: "Successfully left community" });
    } catch (error) {
      console.error("Error leaving community:", error);
      res.status(500).json({ message: "Error leaving community" });
    }
  });
  app2.get("/api/communities/:idOrSlug/members", async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      let communityId;
      if (/^\d+$/.test(idOrSlug)) {
        communityId = parseInt(idOrSlug);
      } else {
        const community = await storage.getCommunityBySlug(idOrSlug);
        if (!community) {
          return res.status(404).json({ message: "Community not found" });
        }
        communityId = community.id;
      }
      const members = await storage.getCommunityMembers(communityId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching community members:", error);
      res.status(500).json({ message: "Error fetching community members" });
    }
  });
  app2.post("/api/communities/:idOrSlug/invite", isAuthenticated, async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      let communityId;
      if (/^\d+$/.test(idOrSlug)) {
        communityId = parseInt(idOrSlug);
      } else {
        const community2 = await storage.getCommunityBySlug(idOrSlug);
        if (!community2) {
          return res.status(404).json({ message: "Community not found" });
        }
        communityId = community2.id;
      }
      const userId = getSessionUserId(req);
      const { email } = req.body;
      const isModerator = await storage.isCommunityModerator(communityId, userId);
      const isOwner = await storage.isCommunityOwner(communityId, userId);
      if (!isModerator && !isOwner) {
        return res.status(403).json({ message: "Only moderators and owners can invite members" });
      }
      const existingInvitation = await storage.getCommunityInvitationByEmailAndCommunity(email, communityId);
      if (existingInvitation) {
        return res.status(400).json({ message: "Invitation already sent to this email" });
      }
      const token = generateToken();
      const invitation = await storage.createCommunityInvitation({
        communityId,
        inviterUserId: userId,
        inviteeEmail: email,
        token,
        status: "pending",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)
      });
      const community = await storage.getCommunity(communityId);
      const inviter = await storage.getUser(userId);
      try {
        await sendCommunityInvitationEmail(
          email,
          community.name,
          inviter.displayName || inviter.username,
          token
        );
        console.log(`Community invitation email sent to ${email}`);
      } catch (emailError) {
        console.error("Failed to send invitation email:", emailError);
      }
      res.status(201).json(invitation);
    } catch (error) {
      console.error("Error creating community invitation:", error);
      res.status(500).json({ message: "Error creating community invitation" });
    }
  });
  app2.delete("/api/communities/:idOrSlug/members/:userId", isAuthenticated, async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      let communityId;
      if (/^\d+$/.test(idOrSlug)) {
        communityId = parseInt(idOrSlug);
      } else {
        const community = await storage.getCommunityBySlug(idOrSlug);
        if (!community) {
          return res.status(404).json({ message: "Community not found" });
        }
        communityId = community.id;
      }
      const targetUserId = parseInt(req.params.userId);
      const currentUserId = getSessionUserId(req);
      const isModerator = await storage.isCommunityModerator(communityId, currentUserId);
      const isOwner = await storage.isCommunityOwner(communityId, currentUserId);
      if (!isModerator && !isOwner) {
        return res.status(403).json({ message: "Only moderators and owners can remove members" });
      }
      await storage.removeCommunityMember(communityId, targetUserId);
      res.json({ message: "Member removed successfully" });
    } catch (error) {
      console.error("Error removing community member:", error);
      res.status(500).json({ message: "Error removing community member" });
    }
  });
  app2.get("/api/invitations/:token", async (req, res) => {
    try {
      const token = req.params.token;
      const invitation = await storage.getCommunityInvitationByToken(token);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found or expired" });
      }
      if (invitation.status !== "pending") {
        return res.status(400).json({ message: "Invitation already processed" });
      }
      res.json(invitation);
    } catch (error) {
      console.error("Error fetching invitation:", error);
      res.status(500).json({ message: "Error fetching invitation" });
    }
  });
  app2.post("/api/invitations/:token/accept", isAuthenticated, async (req, res) => {
    try {
      const token = req.params.token;
      const userId = getSessionUserId(req);
      const invitation = await storage.getCommunityInvitationByToken(token);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found or expired" });
      }
      if (invitation.status !== "pending") {
        return res.status(400).json({ message: "Invitation already processed" });
      }
      const isMember = await storage.isCommunityMember(invitation.communityId, userId);
      if (isMember) {
        await storage.updateCommunityInvitationStatus(invitation.id, "accepted");
        return res.status(400).json({ message: "Already a member of this community" });
      }
      await storage.addCommunityMember({
        communityId: invitation.communityId,
        userId,
        role: "member"
      });
      await storage.updateCommunityInvitationStatus(invitation.id, "accepted");
      res.json({ message: "Successfully joined community" });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ message: "Error accepting invitation" });
    }
  });
  app2.get("/api/communities/:idOrSlug/chat-rooms", async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      let communityId;
      if (/^\d+$/.test(idOrSlug)) {
        communityId = parseInt(idOrSlug);
      } else {
        const community = await storage.getCommunityBySlug(idOrSlug);
        if (!community) {
          return res.status(404).json({ message: "Community not found" });
        }
        communityId = community.id;
      }
      const userId = getSessionUserId(req);
      if (userId && await storage.isCommunityMember(communityId, userId)) {
        const rooms = await storage.getCommunityRooms(communityId);
        res.json(rooms);
      } else {
        const publicRooms = await storage.getPublicCommunityRooms(communityId);
        res.json(publicRooms);
      }
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
      res.status(500).json({ message: "Error fetching chat rooms" });
    }
  });
  app2.post("/api/communities/:idOrSlug/chat-rooms", isAuthenticated, async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      let communityId;
      if (/^\d+$/.test(idOrSlug)) {
        communityId = parseInt(idOrSlug);
      } else {
        const community = await storage.getCommunityBySlug(idOrSlug);
        if (!community) {
          return res.status(404).json({ message: "Community not found" });
        }
        communityId = community.id;
      }
      const userId = getSessionUserId(req);
      const { name, description, isPrivate } = req.body;
      const isModerator = await storage.isCommunityModerator(communityId, userId);
      const isOwner = await storage.isCommunityOwner(communityId, userId);
      if (!isModerator && !isOwner) {
        return res.status(403).json({ message: "Only moderators and owners can create chat rooms" });
      }
      const room = await storage.createCommunityRoom({
        communityId,
        name,
        description,
        isPrivate: isPrivate || false,
        createdBy: userId
      });
      await storage.createChatMessage({
        roomId: room.id,
        senderId: userId,
        content: `${req.session.username || "A user"} created this chat room`
      });
      res.status(201).json(room);
    } catch (error) {
      console.error("Error creating chat room:", error);
      res.status(500).json({ message: "Error creating chat room" });
    }
  });
  app2.put("/api/chat-rooms/:roomId", isAuthenticated, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const userId = getSessionUserId(req);
      const { name, description, isPrivate } = req.body;
      const room = await storage.getCommunityRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Chat room not found" });
      }
      const isModerator = await storage.isCommunityModerator(room.communityId, userId);
      const isOwner = await storage.isCommunityOwner(room.communityId, userId);
      if (!isModerator && !isOwner) {
        return res.status(403).json({ message: "Only moderators and owners can edit chat rooms" });
      }
      const updatedRoom = await storage.updateCommunityRoom(roomId, {
        name,
        description,
        isPrivate
      });
      res.json(updatedRoom);
    } catch (error) {
      console.error("Error updating chat room:", error);
      res.status(500).json({ message: "Error updating chat room" });
    }
  });
  app2.delete("/api/chat-rooms/:roomId", isAuthenticated, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const userId = getSessionUserId(req);
      const room = await storage.getCommunityRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Chat room not found" });
      }
      const isModerator = await storage.isCommunityModerator(room.communityId, userId);
      const isOwner = await storage.isCommunityOwner(room.communityId, userId);
      if (!isModerator && !isOwner) {
        return res.status(403).json({ message: "Only moderators and owners can delete chat rooms" });
      }
      await storage.deleteCommunityRoom(roomId);
      res.json({ message: "Chat room deleted successfully" });
    } catch (error) {
      console.error("Error deleting chat room:", error);
      res.status(500).json({ message: "Error deleting chat room" });
    }
  });
  app2.get("/api/chat-rooms/:roomId/messages", async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const limit = parseInt(req.query.limit) || 50;
      const after = req.query.after ? parseInt(req.query.after) : void 0;
      let messages2;
      if (after) {
        messages2 = await storage.getChatMessagesAfter(roomId, after);
      } else {
        messages2 = await storage.getChatMessages(roomId, limit);
      }
      res.json(messages2);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Error fetching messages" });
    }
  });
  app2.post("/api/chat-rooms/:roomId/messages", isAuthenticated, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const userId = getSessionUserId(req);
      const { content } = req.body;
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "Message content is required" });
      }
      const message = await storage.createChatMessage({
        roomId,
        senderId: userId,
        content: content.trim()
      });
      const sender = await storage.getUser(userId);
      const messageWithSender = { ...message, sender };
      io.to(`room_${roomId}`).emit("message_received", messageWithSender);
      res.status(201).json(messageWithSender);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Error creating message" });
    }
  });
  app2.get("/api/communities/:idOrSlug/wall", async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      let communityId;
      if (/^\d+$/.test(idOrSlug)) {
        communityId = parseInt(idOrSlug);
      } else {
        const community = await storage.getCommunityBySlug(idOrSlug);
        if (!community) {
          return res.status(404).json({ message: "Community not found" });
        }
        communityId = community.id;
      }
      const posts3 = await storage.getCommunityWallPosts(communityId);
      res.json(posts3);
    } catch (error) {
      console.error("Error fetching wall posts:", error);
      res.status(500).json({ message: "Error fetching wall posts" });
    }
  });
  app2.post("/api/communities/:idOrSlug/wall", isAuthenticated, async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      let communityId;
      if (/^\d+$/.test(idOrSlug)) {
        communityId = parseInt(idOrSlug);
      } else {
        const community = await storage.getCommunityBySlug(idOrSlug);
        if (!community) {
          return res.status(404).json({ message: "Community not found" });
        }
        communityId = community.id;
      }
      const userId = getSessionUserId(req);
      const { content, isPrivate } = req.body;
      const isMember = await storage.isCommunityMember(communityId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Must be a member to post on community wall" });
      }
      const post = await storage.createCommunityWallPost({
        communityId,
        authorId: userId,
        content,
        isPrivate: isPrivate || false
      });
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating wall post:", error);
      res.status(500).json({ message: "Error creating wall post" });
    }
  });
  app2.get("/api/posts", async (req, res) => {
    try {
      const filter = req.query.filter;
      const posts3 = await storage.getAllPosts(filter);
      res.json(posts3);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Error fetching posts" });
    }
  });
  app2.get("/api/posts/:id", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Error fetching post" });
    }
  });
  app2.post("/api/posts", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const validatedData = insertPostSchema.parse({
        ...req.body,
        authorId: userId
      });
      const post = await storage.createPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Error creating post" });
    }
  });
  app2.post("/api/posts/:id/upvote", isAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.upvotePost(postId);
      res.json(post);
    } catch (error) {
      console.error("Error upvoting post:", error);
      res.status(500).json({ message: "Error upvoting post" });
    }
  });
  app2.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const comments3 = await storage.getCommentsByPostId(postId);
      res.json(comments3);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Error fetching comments" });
    }
  });
  app2.post("/api/comments", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const validatedData = insertCommentSchema.parse({
        ...req.body,
        authorId: userId
      });
      const comment = await storage.createComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Error creating comment" });
    }
  });
  app2.post("/api/comments/:id/upvote", isAuthenticated, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const comment = await storage.upvoteComment(commentId);
      res.json(comment);
    } catch (error) {
      console.error("Error upvoting comment:", error);
      res.status(500).json({ message: "Error upvoting comment" });
    }
  });
  app2.get("/api/microblogs", async (req, res) => {
    try {
      const filter = req.query.filter;
      const microblogs3 = await storage.getAllMicroblogs();
      res.json(microblogs3);
    } catch (error) {
      console.error("Error fetching microblogs:", error);
      res.status(500).json({ message: "Error fetching microblogs" });
    }
  });
  app2.get("/api/microblogs/:id", async (req, res) => {
    try {
      const microblogId = parseInt(req.params.id);
      const microblog = await storage.getMicroblog(microblogId);
      if (!microblog) {
        return res.status(404).json({ message: "Microblog not found" });
      }
      res.json(microblog);
    } catch (error) {
      console.error("Error fetching microblog:", error);
      res.status(500).json({ message: "Error fetching microblog" });
    }
  });
  app2.post("/api/microblogs", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const validatedData = insertMicroblogSchema.parse({
        ...req.body,
        authorId: userId
      });
      const microblog = await storage.createMicroblog(validatedData);
      res.status(201).json(microblog);
    } catch (error) {
      console.error("Error creating microblog:", error);
      res.status(500).json({ message: "Error creating microblog" });
    }
  });
  app2.post("/api/microblogs/:id/like", isAuthenticated, async (req, res) => {
    try {
      const microblogId = parseInt(req.params.id);
      const userId = getSessionUserId(req);
      const like2 = await storage.likeMicroblog(microblogId, userId);
      res.status(201).json(like2);
    } catch (error) {
      console.error("Error liking microblog:", error);
      res.status(500).json({ message: "Error liking microblog" });
    }
  });
  app2.delete("/api/microblogs/:id/like", isAuthenticated, async (req, res) => {
    try {
      const microblogId = parseInt(req.params.id);
      const userId = getSessionUserId(req);
      await storage.unlikeMicroblog(microblogId, userId);
      res.json({ message: "Microblog unliked successfully" });
    } catch (error) {
      console.error("Error unliking microblog:", error);
      res.status(500).json({ message: "Error unliking microblog" });
    }
  });
  app2.get("/api/events", async (req, res) => {
    try {
      const filter = req.query.filter;
      const events3 = await storage.getAllEvents();
      res.json(events3);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Error fetching events" });
    }
  });
  app2.get("/api/events/public", async (req, res) => {
    try {
      const allEvents = await storage.getAllEvents();
      const events3 = allEvents.filter((event) => event.isPublic);
      res.json(events3);
    } catch (error) {
      console.error("Error fetching public events:", error);
      res.status(500).json({ message: "Error fetching public events" });
    }
  });
  app2.get("/api/events/nearby", async (req, res) => {
    try {
      const { latitude, longitude, radius } = req.query;
      const events3 = await storage.getAllEvents();
      res.json(events3);
    } catch (error) {
      console.error("Error fetching nearby events:", error);
      res.status(500).json({ message: "Error fetching nearby events" });
    }
  });
  app2.get("/api/events/:id", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Error fetching event" });
    }
  });
  app2.post("/api/events", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const validatedData = insertEventSchema.parse({
        ...req.body,
        organizerId: userId
      });
      const event = await storage.createEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Error creating event" });
    }
  });
  app2.patch("/api/events/:id/rsvp", isAuthenticated, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = getSessionUserId(req);
      const { status } = req.body;
      const rsvp = await storage.updateEventRSVP(eventId, status);
      res.json(rsvp);
    } catch (error) {
      console.error("Error updating RSVP:", error);
      res.status(500).json({ message: "Error updating RSVP" });
    }
  });
  app2.delete("/api/events/:id", isAuthenticated, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = getSessionUserId(req);
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      if (event.organizerId !== userId && !req.session.isAdmin) {
        return res.status(403).json({ message: "Only the organizer or admin can delete this event" });
      }
      await storage.deleteEvent(eventId);
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Error deleting event" });
    }
  });
  app2.get("/api/prayer-requests", async (req, res) => {
    try {
      const prayerRequests2 = await storage.getAllPrayerRequests();
      res.json(prayerRequests2);
    } catch (error) {
      console.error("Error fetching prayer requests:", error);
      res.status(500).json({ message: "Error fetching prayer requests" });
    }
  });
  app2.post("/api/prayer-requests", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const validatedData = insertPrayerRequestSchema.parse({
        ...req.body,
        userId
      });
      const prayerRequest = await storage.createPrayerRequest(validatedData);
      res.status(201).json(prayerRequest);
    } catch (error) {
      console.error("Error creating prayer request:", error);
      res.status(500).json({ message: "Error creating prayer request" });
    }
  });
  app2.post("/api/prayer-requests/:id/pray", isAuthenticated, async (req, res) => {
    try {
      const prayerRequestId = parseInt(req.params.id);
      const userId = getSessionUserId(req);
      const prayer = await storage.createPrayer({
        prayerRequestId,
        userId
      });
      res.status(201).json(prayer);
    } catch (error) {
      console.error("Error recording prayer:", error);
      res.status(500).json({ message: "Error recording prayer" });
    }
  });
  app2.get("/api/apologetics", async (req, res) => {
    try {
      const resources2 = await storage.getAllApologeticsResources();
      res.json(resources2);
    } catch (error) {
      console.error("Error fetching apologetics resources:", error);
      res.status(500).json({ message: "Error fetching apologetics resources" });
    }
  });
  app2.get("/api/apologetics/topics", async (req, res) => {
    try {
      const topics = await storage.getAllApologeticsTopics();
      res.json(topics);
    } catch (error) {
      console.error("Error fetching apologetics topics:", error);
      res.status(500).json({ message: "Error fetching apologetics topics" });
    }
  });
  app2.get("/api/apologetics/questions", async (req, res) => {
    try {
      const questions = await storage.getAllApologeticsQuestions();
      res.json(questions);
    } catch (error) {
      console.error("Error fetching apologetics questions:", error);
      res.status(500).json({ message: "Error fetching apologetics questions" });
    }
  });
  app2.post("/api/apologetics/questions", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const { topicId, title, content } = req.body;
      const question = await storage.createApologeticsQuestion({
        topicId,
        title,
        content,
        askedBy: userId
      });
      res.status(201).json(question);
    } catch (error) {
      console.error("Error creating apologetics question:", error);
      res.status(500).json({ message: "Error creating apologetics question" });
    }
  });
  app2.post("/api/apologetics/answers", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const { questionId, content } = req.body;
      const user = await storage.getUser(userId);
      if (!user?.isVerifiedApologeticsAnswerer && !user?.isAdmin) {
        return res.status(403).json({ message: "Only verified apologetics answerers can submit answers" });
      }
      const answer = await storage.createApologeticsAnswer({
        questionId,
        content,
        answeredBy: userId
      });
      res.status(201).json(answer);
    } catch (error) {
      console.error("Error creating apologetics answer:", error);
      res.status(500).json({ message: "Error creating apologetics answer" });
    }
  });
  app2.get("/api/groups", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const groups3 = await storage.getGroupsByUserId(userId);
      res.json(groups3);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ message: "Error fetching groups" });
    }
  });
  app2.post("/api/groups", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const { name, description, isPrivate } = req.body;
      const group = await storage.createGroup({
        name,
        description,
        createdBy: userId,
        isPrivate: isPrivate || false
      });
      await storage.addGroupMember({
        groupId: group.id,
        userId,
        role: "admin"
      });
      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(500).json({ message: "Error creating group" });
    }
  });
  app2.get("/api/livestreams", async (req, res) => {
    try {
      const livestreams2 = await storage.getAllLivestreams();
      res.json(livestreams2);
    } catch (error) {
      console.error("Error fetching livestreams:", error);
      res.status(500).json({ message: "Error fetching livestreams" });
    }
  });
  app2.post("/api/livestreams", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const { title, description, streamUrl, scheduledFor } = req.body;
      const livestream = await storage.createLivestream({
        title,
        description,
        streamerId: userId,
        streamUrl,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        isLive: false
      });
      res.status(201).json(livestream);
    } catch (error) {
      console.error("Error creating livestream:", error);
      res.status(500).json({ message: "Error creating livestream" });
    }
  });
  app2.post("/api/applications/livestreamer", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const validatedData = insertLivestreamerApplicationSchema.parse({
        ...req.body,
        userId
      });
      const application = await storage.createLivestreamerApplication(validatedData);
      try {
        const user = await storage.getUser(userId);
        const applicantName = user && (user.displayName || user.username) || "Applicant";
        const applicantEmail = user && user.email || EMAIL_FROM;
        const adminDest = process.env.ADMIN_NOTIFICATION_EMAIL || EMAIL_FROM;
        await sendLivestreamerApplicationNotificationEmail({
          email: adminDest,
          applicantName,
          applicantEmail,
          ministryName: validatedData.ministryName || "Not specified",
          applicationId: application.id,
          applicationDate: (/* @__PURE__ */ new Date()).toISOString(),
          reviewLink: `${BASE_URL}/admin/livestreamer-applications/${application.id}`
        }, applicantName, application.id);
      } catch (emailError) {
        console.error("Failed to send application notification email:", emailError);
      }
      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating livestreamer application:", error);
      res.status(500).json({ message: "Error creating livestreamer application" });
    }
  });
  app2.post("/api/applications/apologist-scholar", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const validatedData = insertApologistScholarApplicationSchema.parse({
        ...req.body,
        userId
      });
      const application = await storage.createApologistScholarApplication(validatedData);
      try {
        const user = await storage.getUser(userId);
        const applicantName = validatedData.fullName || user && (user.displayName || user.username) || "Applicant";
        const applicantEmail = user && user.email || EMAIL_FROM;
        const adminDest = process.env.ADMIN_NOTIFICATION_EMAIL || EMAIL_FROM;
        await sendApologistScholarApplicationNotificationEmail({
          email: adminDest,
          applicantName,
          applicantEmail,
          ministryName: "",
          applicationId: application.id,
          applicationDate: (/* @__PURE__ */ new Date()).toISOString(),
          reviewLink: `${BASE_URL}/admin/apologist-scholar-applications/${application.id}`
        }, applicantName, application.id);
      } catch (emailError) {
        console.error("Failed to send application notification email:", emailError);
      }
      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating apologist scholar application:", error);
      res.status(500).json({ message: "Error creating apologist scholar application" });
    }
  });
  app2.post("/api/admin/apologist-scholar-applications/:id/review", isAdmin, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { status, reviewNotes } = req.body;
      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const reviewerId = getSessionUserId(req);
      const application = await storage.updateApologistScholarApplication(
        applicationId,
        status,
        reviewNotes,
        reviewerId
      );
      if (status === "approved") {
        await storage.setVerifiedApologeticsAnswerer(application.userId, true);
      }
      try {
        const emailMessage = status === "approved" ? "We're pleased to inform you that your application to become an apologetics scholar has been approved. You can now answer apologetics questions on our platform." : `Your apologetics scholar application has been reviewed. Status: ${status.toUpperCase()}. ${reviewNotes ? `Reviewer notes: ${reviewNotes}` : ""}`;
        await sendApplicationStatusUpdateEmail({
          email: application.email,
          applicantName: application.fullName || application.applicantName || "Applicant",
          status,
          ministryName: application.ministryName || "",
          reviewNotes: reviewNotes || void 0,
          platformLink: `${BASE_URL}/apologetics/questions`
        });
      } catch (emailError) {
        console.error("Failed to send status update email:", emailError);
      }
      res.json(application);
    } catch (error) {
      console.error("Error reviewing application:", error);
      res.status(500).json({ message: "Error reviewing application" });
    }
  });
  app2.put("/api/admin/livestreamer-applications/:id", isAdmin, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { status, reviewNotes } = req.body;
      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const reviewerId = getSessionUserId(req);
      const application = await storage.updateLivestreamerApplication(
        applicationId,
        status,
        reviewNotes,
        reviewerId
      );
      try {
        const emailMessage = status === "approved" ? "We're pleased to inform you that your application to become a livestreamer has been approved. You can now start creating livestreams on our platform." : `Your livestreamer application has been reviewed. Status: ${status.toUpperCase()}. ${reviewNotes ? `Reviewer notes: ${reviewNotes}` : ""}`;
        await sendApplicationStatusUpdateEmail({
          email: application.email,
          applicantName: application.applicantName || application.fullName || "Applicant",
          status,
          ministryName: application.ministryName || "",
          reviewNotes: reviewNotes || void 0,
          platformLink: status === "approved" ? `${BASE_URL}/livestreams/create` : `${BASE_URL}/livestreamer-application`
        });
      } catch (emailError) {
        console.error("Failed to send status update email:", emailError);
      }
      res.json(application);
    } catch (error) {
      console.error("Error updating application status:", error);
      res.status(500).json({ message: "Error updating application status" });
    }
  });
  app2.get("/api/search/communities", async (req, res) => {
    try {
      const query = req.query.q;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const communities2 = await storage.searchCommunities(query);
      res.json(communities2);
    } catch (error) {
      console.error("Error searching communities:", error);
      res.status(500).json({ message: "Error searching communities" });
    }
  });
  app2.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const { fileName, fileType } = req.body;
      const uploadParams = {
        url: `/api/objects/upload/${fileName}`,
        fields: {
          key: fileName,
          "Content-Type": fileType
        }
      };
      res.json(uploadParams);
    } catch (error) {
      console.error("Error generating upload parameters:", error);
      res.status(500).json({ message: "Error generating upload parameters" });
    }
  });
  app2.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const notifications = [];
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Error fetching notifications" });
    }
  });
  app2.put("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const userId = getSessionUserId(req);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Error marking notification as read" });
    }
  });
  app2.get("/api/user/preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const preferences = await storage.getUserPreferences(userId);
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({ message: "Error fetching user preferences" });
    }
  });
  app2.put("/api/user/preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const preferences = await storage.updateUserPreferences(userId, req.body);
      res.json(preferences);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ message: "Error updating user preferences" });
    }
  });
  app2.post("/api/recommendations/interaction", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const { contentId, contentType, interactionType } = req.body;
      console.log(`Interaction recorded: User ${userId} -> ${interactionType} on ${contentType} ${contentId}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error recording interaction:", error);
      res.status(500).json({ message: "Error recording interaction" });
    }
  });
  app2.get("/api/recommendations/feed", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const limit = parseInt(req.query.limit) || 20;
      const feed = await storage.getAllMicroblogs();
      res.json(feed.slice(0, limit));
    } catch (error) {
      console.error("Error generating personalized feed:", error);
      res.status(500).json({ message: "Error generating personalized feed" });
    }
  });
  app2.get("/api/recommendations/friends-activity", isAuthenticated, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const activity = [];
      res.json(activity);
    } catch (error) {
      console.error("Error fetching friends activity:", error);
      res.status(500).json({ message: "Error fetching friends activity" });
    }
  });
  app2.post("/api/test-email", isAdmin, async (req, res) => {
    try {
      const { email, type } = req.body;
      if (type === "welcome") {
        await sendCommunityInvitationEmail(email, "Test Community", "Admin", "test-token");
      }
      res.json({ message: `Test email sent to ${email}` });
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ message: "Error sending test email" });
    }
  });
  app2.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      version: "1.0.0"
    });
  });
  app2.use((error, req, res, next) => {
    console.error("API Error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors
      });
    }
    res.status(500).json({
      message: "Internal server error",
      ...process.env.NODE_ENV === "development" && { stack: error.stack }
    });
  });
  return httpServer2;
}

// server/vite.ts
import express2 from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "node:url";
import { VitePWA } from "vite-plugin-pwa";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var vite_config_default = defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
        // 5 MB
      },
      manifest: {
        name: "The Connection",
        short_name: "Connection",
        description: "Christian Community Platform",
        theme_color: "#0B132B",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "client", "src", "assets")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: "../dist/public",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["wouter"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"]
        }
      }
    }
  },
  publicDir: "../public"
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
init_email();

// server/migrations/add-locality-interests.ts
init_db();
import { sql as sql3 } from "drizzle-orm";
async function runMigration() {
  try {
    log("Starting migration: Adding locality and interest features");
    await db.execute(sql3`
      ALTER TABLE IF EXISTS users 
      ADD COLUMN IF NOT EXISTS city TEXT,
      ADD COLUMN IF NOT EXISTS state TEXT,
      ADD COLUMN IF NOT EXISTS zip_code TEXT,
      ADD COLUMN IF NOT EXISTS latitude TEXT,
      ADD COLUMN IF NOT EXISTS longitude TEXT,
      ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE
    `);
    log("\u2705 Added locality fields to users table");
    await db.execute(sql3`ALTER TABLE IF EXISTS communities ADD COLUMN IF NOT EXISTS city TEXT`);
    await db.execute(sql3`ALTER TABLE IF EXISTS communities ADD COLUMN IF NOT EXISTS state TEXT`);
    await db.execute(sql3`ALTER TABLE IF EXISTS communities ADD COLUMN IF NOT EXISTS is_local_community BOOLEAN DEFAULT FALSE`);
    await db.execute(sql3`ALTER TABLE IF EXISTS communities ADD COLUMN IF NOT EXISTS latitude TEXT`);
    await db.execute(sql3`ALTER TABLE IF EXISTS communities ADD COLUMN IF NOT EXISTS longitude TEXT`);
    try {
      await db.execute(sql3`ALTER TABLE IF EXISTS communities ADD COLUMN IF NOT EXISTS interest_tags TEXT[]`);
      log("\u2705 Added interest_tags array column");
    } catch (error) {
      log("\u26A0\uFE0F Could not add interest_tags column: " + String(error));
      try {
        await db.execute(sql3`ALTER TABLE IF EXISTS communities ADD COLUMN IF NOT EXISTS interest_tags_json JSONB DEFAULT '[]'`);
        log("\u2705 Added interest_tags_json column as alternative");
      } catch (innerError) {
        log("\u26A0\uFE0F Could not add interest_tags_json column: " + String(innerError));
      }
    }
    log("\u2705 Added interest tags and locality fields to communities table");
    log("Migration completed successfully");
    return true;
  } catch (error) {
    log("\u274C Migration failed: " + String(error));
    return false;
  }
}

// server/run-migrations.ts
init_db();
async function runAllMigrations() {
  if (!isConnected) {
    log("\u274C Database connection not available. Skipping migrations.");
    return false;
  }
  try {
    log("Starting database migrations");
    const localityResult = await runMigration();
    if (!localityResult) {
      log("\u274C Locality and interests migration failed");
      return false;
    }
    log("\u2705 All migrations completed successfully");
    return true;
  } catch (error) {
    log("\u274C Error running migrations: " + String(error));
    return false;
  }
}

// server/index.ts
init_db();
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import connectPgSimple from "connect-pg-simple";
import { createServer } from "http";
dotenv.config();
var app = express3();
var httpServer = createServer(app);
var PgSessionStore = connectPgSimple(session);
var sessionStore = new PgSessionStore({
  pool,
  tableName: "sessions",
  createTableIfMissing: true
});
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || "theconnection-session-secret",
  resave: false,
  saveUninitialized: false,
  name: "sessionId",
  // Explicit session name
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1e3,
    // 30 days
    secure: false,
    // Disable secure for development
    httpOnly: true,
    sameSite: "lax"
    // Allow cross-origin requests in development
  }
}));
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const { storage: storage2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
    const user = await storage2.getUser(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  try {
    await runAllMigrations();
    const { runOrganizationMigrations: runOrganizationMigrations2 } = await Promise.resolve().then(() => (init_run_migrations_organizations(), run_migrations_organizations_exports));
    await runOrganizationMigrations2();
    console.log("\u2705 Database migrations completed");
  } catch (error) {
    console.error("\u274C Error running database migrations:", error);
  }
  try {
    await initializeEmailTemplates();
  } catch (error) {
    console.error("Error initializing email templates:", error);
  }
  const server = await registerRoutes(app, httpServer);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
