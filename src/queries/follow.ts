import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { followAPI } from '../lib/apiClient';

export interface UserProfile {
  user: {
    id: number;
    username: string;
    displayName?: string;
    bio?: string;
    profileImageUrl?: string;
    location?: string;
    denomination?: string;
    homeChurch?: string;
    favoriteBibleVerse?: string;
    testimony?: string;
    interests?: string;
    createdAt: string;
  };
  stats: {
    followersCount: number;
    followingCount: number;
    communitiesCount: number;
    postsCount: number; // Total posts (forum + microblogs)
    eventsCount: number; // Events attended
    forumPostsCount: number; // Just forum posts
    feedPostsCount: number; // Just microblogs (feed posts)
  };
  communities: any[];
  recentPosts: any[];
  recentMicroblogs: any[];
}

export interface UserWithFollowDate {
  id: number;
  username: string;
  displayName?: string;
  profileImageUrl?: string;
  followedAt: string;
}

// Get user profile with stats
export const useUserProfile = (userId: number) => {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => followAPI.getUserProfile(userId),
    enabled: !!userId,
  });
};

// Get user's followers
export const useFollowers = (userId: number) => {
  return useQuery<UserWithFollowDate[]>({
    queryKey: ['followers', userId],
    queryFn: () => followAPI.getFollowers(userId),
    enabled: !!userId,
  });
};

// Get users being followed
export const useFollowing = (userId: number) => {
  return useQuery<UserWithFollowDate[]>({
    queryKey: ['following', userId],
    queryFn: () => followAPI.getFollowing(userId),
    enabled: !!userId,
  });
};

// Check follow status
export const useFollowStatus = (userId: number) => {
  return useQuery<{ isFollowing: boolean }>({
    queryKey: ['follow-status', userId],
    queryFn: () => followAPI.getFollowStatus(userId),
    enabled: !!userId,
  });
};

// Follow user mutation
export const useFollowUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => followAPI.followUser(userId),
    onSuccess: (_, userId) => {
      // Invalidate follow status and lists
      queryClient.invalidateQueries({ queryKey: ['follow-status', userId] });
      queryClient.invalidateQueries({ queryKey: ['followers', userId] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });
    },
  });
};

// Unfollow user mutation
export const useUnfollowUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => followAPI.unfollowUser(userId),
    onSuccess: (_, userId) => {
      // Invalidate follow status and lists
      queryClient.invalidateQueries({ queryKey: ['follow-status', userId] });
      queryClient.invalidateQueries({ queryKey: ['followers', userId] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });
    },
  });
};
