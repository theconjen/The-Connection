import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Edit, Camera, MapPin, Calendar, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PhotoUploader } from "@/components/PhotoUploader";
import type { User as UserType } from "@shared/schema";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserType>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user data
  const { data: user, isLoading } = useQuery<UserType>({
    queryKey: ["/api/user"],
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (userData: Partial<UserType>) => {
      return apiRequest(`/api/users/${user?.id}`, {
        method: "PATCH",
        body: userData,
      });
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
                      Joined {new Date(user.createdAt).toLocaleDateString()}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Communities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">0</p>
            <p className="text-sm text-gray-500">Joined communities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prayer Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">0</p>
            <p className="text-sm text-gray-500">Prayers shared</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">0</p>
            <p className="text-sm text-gray-500">Posts created</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}