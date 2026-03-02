/**
 * User Profile Page
 *
 * Displays a user's public profile. Supports lookup by:
 * - Username: /profile/:username (e.g., /profile/johndoe)
 * - User ID: /user/:id (e.g., /user/123) - for mobile app link compatibility
 */

import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  User,
  MapPin,
  Calendar,
  MessageSquare,
  Users,
  Loader2,
  UserPlus,
  UserMinus,
  Shield,
  Ban,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { JsonLd } from "../components/seo/json-ld";

interface UserProfile {
  id: number;
  username: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  profileImageUrl?: string;
  city?: string;
  state?: string;
  createdAt?: string;
  followerCount?: number;
  followingCount?: number;
  postCount?: number;
  isFollowing?: boolean;
  isBlocked?: boolean;
  isPrivate?: boolean;
}

interface UserProfilePageProps {
  /** If true, lookup by ID instead of username */
  byId?: boolean;
}

export default function UserProfilePage({ byId = false }: UserProfilePageProps) {
  const params = useParams<{ username?: string; id?: string }>();
  const [, navigate] = useLocation();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);

  const identifier = byId ? params.id : params.username;

  // Fetch user profile
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery<UserProfile>({
    queryKey: byId ? ["/api/users/by-id", identifier] : ["/api/users/profile", identifier],
    queryFn: async () => {
      const endpoint = byId
        ? `/api/users/by-id/${identifier}`
        : `/api/users/profile/${identifier}`;
      const res = await fetch(endpoint);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("User not found");
        }
        throw new Error("Failed to load profile");
      }
      return res.json();
    },
    enabled: !!identifier,
  });

  // Fetch user's posts
  const { data: userPosts } = useQuery({
    queryKey: ["/api/users", profile?.id, "posts"],
    queryFn: async () => {
      const res = await fetch(`/api/users/${profile?.id}/posts`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!profile?.id,
  });

  // Fetch user's communities
  const { data: userCommunities } = useQuery({
    queryKey: ["/api/users", profile?.id, "communities"],
    queryFn: async () => {
      const res = await fetch(`/api/users/${profile?.id}/communities`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!profile?.id,
  });

  useEffect(() => {
    if (profile) {
      setIsFollowing(profile.isFollowing || false);
    }
  }, [profile]);

  const handleFollow = async () => {
    if (!profile?.id || !currentUser) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow users.",
        variant: "destructive",
      });
      return;
    }

    try {
      const endpoint = isFollowing
        ? `/api/users/${profile.id}/unfollow`
        : `/api/users/${profile.id}/follow`;
      await apiRequest("POST", endpoint);
      setIsFollowing(!isFollowing);
      toast({
        title: isFollowing ? "Unfollowed" : "Following",
        description: isFollowing
          ? `You unfollowed ${profile.displayName || profile.username}`
          : `You are now following ${profile.displayName || profile.username}`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    }
  };

  const handleMessage = () => {
    if (profile?.id) {
      navigate(`/messages/${profile.id}`);
    }
  };

  // Check if viewing own profile - redirect to /profile
  const isOwnProfile = currentUser && profile && currentUser.id === profile.id;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">User Not Found</h3>
            <p className="text-muted-foreground mb-4">
              This user doesn't exist or their profile is private.
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isOwnProfile) {
    navigate("/profile");
    return null;
  }

  const avatarUrl = profile.profileImageUrl || profile.avatarUrl;
  const joinDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          mainEntity: {
            "@type": "Person",
            name: profile.displayName || profile.username,
            url: `https://theconnection.app/u/${profile.username}`,
            ...(profile.bio && { description: profile.bio }),
            ...(avatarUrl && { image: avatarUrl }),
            interactionStatistic: {
              "@type": "InteractionCounter",
              interactionType: "https://schema.org/FollowAction",
              userInteractionCount: profile.followerCount || 0,
            },
          },
        }}
      />
      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <Avatar className="h-24 w-24 md:h-32 md:w-32">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-2xl">
                  {profile.displayName?.[0] || profile.username[0]}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-2xl font-bold">
                    {profile.displayName || profile.username}
                  </h1>
                  <p className="text-muted-foreground">@{profile.username}</p>
                </div>

                {/* Action Buttons */}
                {currentUser && !isOwnProfile && (
                  <div className="flex gap-2">
                    <Button
                      variant={isFollowing ? "outline" : "default"}
                      size="sm"
                      onClick={handleFollow}
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus className="h-4 w-4 mr-1" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-1" />
                          Follow
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleMessage}>
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Message
                    </Button>
                  </div>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-foreground mb-4">{profile.bio}</p>
              )}

              {/* Meta info */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {(profile.city || profile.state) && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {[profile.city, profile.state].filter(Boolean).join(", ")}
                  </div>
                )}
                {joinDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {joinDate}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-6 mt-4">
                <div className="text-center">
                  <div className="font-bold">{profile.followerCount || 0}</div>
                  <div className="text-sm text-muted-foreground">Followers</div>
                </div>
                <div className="text-center">
                  <div className="font-bold">{profile.followingCount || 0}</div>
                  <div className="text-sm text-muted-foreground">Following</div>
                </div>
                <div className="text-center">
                  <div className="font-bold">{profile.postCount || 0}</div>
                  <div className="text-sm text-muted-foreground">Posts</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="posts">
        <TabsList className="mb-4">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="communities">Communities</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          {!userPosts || userPosts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No posts yet
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {userPosts.map((post: any) => (
                <Card
                  key={post.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => navigate(`/posts/${post.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{post.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-2">
                      {post.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="communities">
          {!userCommunities || userCommunities.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Not a member of any communities yet
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {userCommunities.map((community: any) => (
                <Card
                  key={community.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => navigate(`/communities/${community.slug}`)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{community.name}</span>
                    </div>
                    {community.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {community.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
