/**
 * Account Data Export Service (GDPR compliance)
 * Collects all user data and returns as JSON bundle
 */

import { db } from '../db';
import {
  users,
  posts,
  comments,
  microblogs,
  messages,
  prayerRequests,
  eventRsvps,
  events,
  communityMembers,
  communities,
  userFollows,
  microblogLikes,
  microblogBookmarks,
} from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function exportUserData(userId: number) {
  const [
    user,
    userPosts,
    userComments,
    userMicroblogs,
    sentMessages,
    receivedMessages,
    userPrayers,
    userRsvps,
    userCommunities,
    userFollowing,
    userFollowers,
    userLikes,
    userBookmarks,
  ] = await Promise.all([
    // Profile
    db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      displayName: users.displayName,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      city: users.city,
      state: users.state,
      location: users.location,
      denomination: users.denomination,
      homeChurch: users.homeChurch,
      favoriteBibleVerse: users.favoriteBibleVerse,
      testimony: users.testimony,
      interests: users.interests,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1),

    // Posts
    db.select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(eq(posts.authorId, userId)),

    // Comments
    db.select({
      id: comments.id,
      content: comments.content,
      postId: comments.postId,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .where(eq(comments.authorId, userId)),

    // Microblogs
    db.select({
      id: microblogs.id,
      content: microblogs.content,
      imageUrl: microblogs.imageUrl,
      createdAt: microblogs.createdAt,
    })
    .from(microblogs)
    .where(eq(microblogs.authorId, userId)),

    // Sent messages
    db.select({
      id: messages.id,
      receiverId: messages.receiverId,
      content: messages.content,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.senderId, userId)),

    // Received messages
    db.select({
      id: messages.id,
      senderId: messages.senderId,
      content: messages.content,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.receiverId, userId)),

    // Prayer requests
    db.select({
      id: prayerRequests.id,
      title: prayerRequests.title,
      content: prayerRequests.content,
      isAnonymous: prayerRequests.isAnonymous,
      createdAt: prayerRequests.createdAt,
    })
    .from(prayerRequests)
    .where(eq(prayerRequests.authorId, userId)),

    // Event RSVPs
    db.select({
      eventId: eventRsvps.eventId,
      status: eventRsvps.status,
      createdAt: eventRsvps.createdAt,
    })
    .from(eventRsvps)
    .where(eq(eventRsvps.userId, userId)),

    // Community memberships
    db.select({
      communityId: communityMembers.communityId,
      role: communityMembers.role,
      joinedAt: communityMembers.joinedAt,
    })
    .from(communityMembers)
    .where(eq(communityMembers.userId, userId)),

    // Following
    db.select({
      followingId: userFollows.followingId,
      createdAt: userFollows.createdAt,
    })
    .from(userFollows)
    .where(eq(userFollows.followerId, userId)),

    // Followers
    db.select({
      followerId: userFollows.followerId,
      createdAt: userFollows.createdAt,
    })
    .from(userFollows)
    .where(eq(userFollows.followingId, userId)),

    // Likes
    db.select({
      microblogId: microblogLikes.microblogId,
      createdAt: microblogLikes.createdAt,
    })
    .from(microblogLikes)
    .where(eq(microblogLikes.userId, userId)),

    // Bookmarks
    db.select({
      microblogId: microblogBookmarks.microblogId,
      createdAt: microblogBookmarks.createdAt,
    })
    .from(microblogBookmarks)
    .where(eq(microblogBookmarks.userId, userId)),
  ]);

  return {
    exportDate: new Date().toISOString(),
    profile: user[0] || null,
    posts: userPosts,
    comments: userComments,
    microblogs: userMicroblogs,
    messages: {
      sent: sentMessages,
      received: receivedMessages,
    },
    prayerRequests: userPrayers,
    eventRsvps: userRsvps,
    communities: userCommunities,
    social: {
      following: userFollowing,
      followers: userFollowers,
    },
    likes: userLikes,
    bookmarks: userBookmarks,
  };
}
