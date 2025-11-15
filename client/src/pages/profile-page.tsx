import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Edit, Camera, MapPin, Calendar, Mail, MessageSquare, Heart, Users, ExternalLink } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { PhotoUploader } from "../components/PhotoUploader";
import { Link } from "wouter";
import type { User as UserType } from "@connection/shared/schema";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserType>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user data
  const { data: user, isLoading } = useQuery<UserType>({
    queryKey: ["/api/user"],
  });

  // Get user's communities
  const { data: userCommunities, isLoading: communitiesLoading } = useQuery({
    queryKey: ["/api/users", user?.id, "communities"],
    enabled: !!user?.id,
  });

  // Get user's posts
  const { data: userPosts, isLoading: postsLoading } = useQuery({
    queryKey: ["/api/users", user?.id, "posts"],
    enabled: !!user?.id,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (userData: Partial<UserType>) => {
      const response = await apiRequest("PATCH", `/api/user/${user?.id}`, userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "There was an error updating your profile.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    setFormData({
      displayName: user?.displayName || "",
      bio: user?.bio || "",
      city: user?.city || "",
      state: user?.state || "",
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };

  const handleAvatarUpload = (photoUrl: string) => {
    // Avatar upload is handled by PhotoUploader component
    // It automatically updates the user's avatar in the database
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="bg-gray-200 h-48 w-full rounded-lg mb-6"></div>
          <div className="bg-gray-200 h-6 w-1/3 rounded mb-4"></div>
          <div className="bg-gray-200 h-4 w-2/3 rounded mb-2"></div>
          <div className="bg-gray-200 h-4 w-1/2 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">User not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Avatar Section */}
            <div className="relative">
              <Avatar className="w-32 h-32">
                <AvatarImage 
                  src={user.avatarUrl || undefined} 
                  alt={user.displayName || user.username}
                />
                <AvatarFallback className="text-2xl">
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              
              {/* Photo Upload Overlay */}
              <div className="absolute -bottom-2 -right-2">
                <PhotoUploader
                  uploadType="avatar"
                  onUploadSuccess={handleAvatarUpload}
                  buttonClassName="h-10 w-10 rounded-full p-0"
                >
                  <Camera className="h-4 w-4" />
                </PhotoUploader>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 space-y-4">
              {!isEditing ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        {user.displayName || user.username}
                      </h1>
                      {user.displayName && (
                        <p className="text-lg text-gray-500">@{user.username}</p>
                      )}
                    </div>
                    <Button onClick={handleEdit} variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>

                  {user.bio && (
                    <p className="text-gray-700 leading-relaxed">{user.bio}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    {user.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </div>
                    )}
                    
                    {(user.city || user.state) && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {[user.city, user.state].filter(Boolean).join(", ")}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {user.isAdmin && (
                      <Badge variant="secondary">Administrator</Badge>
                    )}
                    {user.isVerifiedApologeticsAnswerer && (
                      <Badge variant="default">Verified Apologist</Badge>
                    )}
                  </div>
                </>
              ) : (
                /* Edit Form */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Display Name</label>
                    <Input
                      value={formData.displayName || ""}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      placeholder="Your display name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Bio</label>
                    <Textarea
                      value={formData.bio || ""}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell others about yourself..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">City</label>
                      <Input
                        value={formData.city || ""}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Your city"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">State</label>
                      <Input
                        value={formData.state || ""}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="Your state"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSave}
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button onClick={handleCancel} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Communities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {communitiesLoading ? "..." : userCommunities?.length || 0}
            </p>
            <p className="text-sm text-gray-500">Joined communities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prayer Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {postsLoading ? "..." : userPosts?.filter(post => post.type === 'prayer_request')?.length || 0}
            </p>
            <p className="text-sm text-gray-500">Prayers shared</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              {postsLoading ? "..." : userPosts?.length || 0}
            </p>
            <p className="text-sm text-gray-500">Posts created</p>
          </CardContent>
        </Card>
      </div>

      {/* User's Communities Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Users className="h-5 w-5" />
            My Communities
          </CardTitle>
        </CardHeader>
        <CardContent>
          {communitiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse">Loading communities...</div>
            </div>
          ) : userCommunities?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userCommunities.map((community: any) => (
                <Card key={community.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-${community.iconColor}-500 flex items-center justify-center text-white font-bold`}>
                        {community.iconName || community.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <Link href={`/communities/${community.slug}`}>
                          <h3 className="font-semibold hover:text-blue-600 cursor-pointer" data-testid={`community-link-${community.id}`}>
                            {community.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {community.memberCount} members
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </div>
                    {community.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{community.description}</p>
                    )}
                    {community.isLocalCommunity && community.city && (
                      <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {community.city}, {community.state}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>You haven't joined any communities yet.</p>
              <Link href="/communities">
                <Button variant="outline" className="mt-3" data-testid="explore-communities-button">
                  Explore Communities
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User's Personal Posts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            My Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {postsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse">Loading posts...</div>
            </div>
          ) : userPosts?.length > 0 ? (
            <div className="space-y-4">
              {userPosts.slice(0, 10).map((post: any) => (
                <Card key={`${post.type}-${post.id}`} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={
                            post.type === 'forum_post' ? 'default' :
                            post.type === 'microblog' ? 'secondary' :
                            post.type === 'prayer_request' ? 'outline' : 'secondary'
                          }>
                            {post.type === 'forum_post' ? 'Forum Post' :
                             post.type === 'microblog' ? 'Microblog' :
                             post.type === 'prayer_request' ? 'Prayer Request' :
                             post.type === 'community_wall_post' ? 'Community Post' : 'Post'}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <Link href={post.link}>
                          <h3 className="font-semibold hover:text-blue-600 cursor-pointer mb-1" data-testid={`post-link-${post.type}-${post.id}`}>
                            {post.title}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{post.content}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {post.engagementCount} interactions
                          </span>
                          {post.type === 'prayer_request' && (
                            <span className="text-green-600">🙏 {post.prayerCount || 0} prayers</span>
                          )}
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              ))}
              {userPosts.length > 10 && (
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-500">Showing 10 of {userPosts.length} posts</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>You haven't created any posts yet.</p>
              <div className="flex gap-2 justify-center mt-3">
                <Link href="/microblogs">
                  <Button variant="outline" size="sm" data-testid="create-microblog-button">
                    Share a Thought
                  </Button>
                </Link>
                <Link href="/prayer-requests">
                  <Button variant="outline" size="sm" data-testid="create-prayer-request-button">
                    Request Prayer
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}