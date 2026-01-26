import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useAuth, AuthContextType } from "../hooks/use-auth";
import { Organization } from "@connection/shared/schema";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Switch } from "../components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { useToast } from "../hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  User,
  Bell,
  Shield,
  Eye,
  Mail,
  Lock,
  Building,
  Palette,
  Globe,
  Church,
  BookOpen,
  Heart,
  Sparkles
} from "lucide-react";

interface UserProfile {
  id: number;
  username: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  interestTags: string[];
  profileVisibility?: 'public' | 'private' | 'friends';
  showLocation?: boolean;
  showInterests?: boolean;
  // Faith Journey fields
  denomination: string | null;
  homeChurch: string | null;
  favoriteBibleVerse: string | null;
  testimony: string | null;
  interests: string | null;
}

interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  profileVisibility: 'public' | 'private' | 'friends';
  showLocation: boolean;
  showInterests: boolean;
}

export default function SettingsPage() {
  const { user, logout } = useAuth() as AuthContextType;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [privacySaving, setPrivacySaving] = useState(false);

  const [profileData, setProfileData] = useState({
    displayName: "",
    bio: "",
    city: "",
    state: "",
    zipCode: "",
    email: "",
    // Faith Journey fields
    denomination: "",
    homeChurch: "",
    favoriteBibleVerse: "",
    testimony: "",
    interests: "",
  });

  // Fetch current user settings on component mount
  useEffect(() => {
    if (user) {
      setProfileData({
        displayName: user.displayName || "",
        bio: user.bio || "",
        city: user.city || "",
        state: user.state || "",
        zipCode: user.zipCode || "",
        email: user.email || "",
        // Faith Journey fields
        denomination: (user as any).denomination || "",
        homeChurch: (user as any).homeChurch || "",
        favoriteBibleVerse: (user as any).favoriteBibleVerse || "",
        testimony: (user as any).testimony || "",
        interests: (user as any).interests || "",
      });
      setPreferences(prev => ({
        ...prev,
        profileVisibility: (user.profileVisibility as UserPreferences['profileVisibility']) || "public",
        showLocation: user.showLocation ?? true,
        showInterests: user.showInterests ?? true,
      }));
    }
  }, [user]);

  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    pushNotifications: false,
    profileVisibility: 'public',
    showLocation: true,
    showInterests: true,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const { data: userOrganizations } = useQuery<{ organization: Organization; role: string; joinedAt: string; }[]>({
    queryKey: ["/api/organizations"],
    queryFn: async () => {
      try {
        const response = await apiRequest("/api/organizations");
        return response.json();
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.startsWith("401") || error.message.startsWith("403")) {
            return [];
          }
        }
        throw error;
      }
    },
    enabled: !!user,
  });

  const hasOrganizationAccess = (userOrganizations?.length ?? 0) > 0;

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/user/${user?.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/user/change-password", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({
        title: "Success",
        description: "Password updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    },
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await updateProfileMutation.mutateAsync(profileData);
    } catch (error) {
      // Error handling is done in the mutation
    } finally {
      setLoading(false);
    }
  };

  // Alternative simple save function matching your style
  async function handleSave() {
    setLoading(true);
    try {
      const response = await apiRequest("/api/user/settings", {
        method: "PUT",
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error("Failed to update settings");
      }

      toast({
        title: "Success",
        description: "Settings updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handlePrivacySave = async () => {
    setPrivacySaving(true);
    try {
      const response = await apiRequest("/api/user/settings", {
        method: "PUT",
        body: JSON.stringify({
          profileVisibility: preferences.profileVisibility,
          showLocation: preferences.showLocation,
          showInterests: preferences.showInterests,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update privacy settings");
      }

      toast({
        title: "Privacy settings updated",
        description: "Your visibility preferences have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update privacy settings",
        variant: "destructive",
      });
    } finally {
      setPrivacySaving(false);
    }
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    updatePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const handleDeleteAccount = async () => {
    if (deleting) {
      return;
    }

    const confirmed = window.confirm(
      "This will permanently delete your account and all associated data. This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    const password = window.prompt("Please enter your password to confirm account deletion.");

    if (!password) {
      toast({
        title: "Password required",
        description: "Please enter your password to delete your account.",
        variant: "destructive",
      });
      return;
    }

    setDeleting(true);

    try {
      await apiRequest("/api/user/account", {
        method: "DELETE",
        body: JSON.stringify({ password }),
      });

      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });

      logout();
      window.location.assign("/");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error
          ? error.message
          : "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h1>
          <p className="text-gray-600">You need to be logged in to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
        <p className="text-gray-600">Manage your account preferences and security settings</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className={`grid w-full ${hasOrganizationAccess ? "grid-cols-5" : "grid-cols-4"}`}>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Security
          </TabsTrigger>
          {hasOrganizationAccess && (
            <TabsTrigger value="organization" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Church
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your public profile information and location details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={user.avatarUrl || undefined} />
                    <AvatarFallback className="text-lg">
                      {user.displayName?.charAt(0) || user.username.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{user.displayName || user.username}</h3>
                    <p className="text-gray-600">{user.email}</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Change Avatar
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                      placeholder="Your display name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell others about yourself"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={profileData.city}
                      onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Your city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={profileData.state}
                      onChange={(e) => setProfileData(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="State"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={profileData.zipCode}
                      onChange={(e) => setProfileData(prev => ({ ...prev, zipCode: e.target.value }))}
                      placeholder="ZIP"
                    />
                  </div>
                </div>

                {/* Faith Journey Section */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Church className="w-5 h-5 text-primary" />
                    Faith Journey
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Share your faith background to help others connect with you
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="denomination">Denomination / Tradition</Label>
                      <Input
                        id="denomination"
                        value={profileData.denomination}
                        onChange={(e) => setProfileData(prev => ({ ...prev, denomination: e.target.value }))}
                        placeholder="e.g., Baptist, Presbyterian, Non-denominational"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="homeChurch">Home Church</Label>
                      <Input
                        id="homeChurch"
                        value={profileData.homeChurch}
                        onChange={(e) => setProfileData(prev => ({ ...prev, homeChurch: e.target.value }))}
                        placeholder="Your local church"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label htmlFor="favoriteBibleVerse" className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Favorite Bible Verse
                    </Label>
                    <Input
                      id="favoriteBibleVerse"
                      value={profileData.favoriteBibleVerse}
                      onChange={(e) => setProfileData(prev => ({ ...prev, favoriteBibleVerse: e.target.value }))}
                      placeholder="e.g., John 3:16, Philippians 4:13"
                    />
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label htmlFor="testimony" className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Brief Testimony
                    </Label>
                    <Textarea
                      id="testimony"
                      value={profileData.testimony}
                      onChange={(e) => setProfileData(prev => ({ ...prev, testimony: e.target.value }))}
                      placeholder="Share a brief version of your faith journey..."
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {profileData.testimony.length}/500 characters
                    </p>
                  </div>
                </div>

                {/* Interests Section */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Interests & Hobbies
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="interests">Interests</Label>
                    <Input
                      id="interests"
                      value={profileData.interests}
                      onChange={(e) => setProfileData(prev => ({ ...prev, interests: e.target.value }))}
                      placeholder="e.g., Music, Hiking, Bible Study, Coffee (comma-separated)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate multiple interests with commas
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Profile"}
                  </Button>
                  <Button type="button" onClick={handleSave} disabled={loading} variant="outline">
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={logout}
                  >
                    Log Out
                  </Button>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <a href="/privacy" target="_blank" rel="noopener" className="text-primary hover:underline mr-4">Privacy Policy</a>
                  <a href="/terms" target="_blank" rel="noopener" className="text-primary hover:underline">Terms of Service</a>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-base font-medium">Email Notifications</div>
                  <div className="text-sm text-gray-600">
                    Receive notifications via email
                  </div>
                </div>
                <Switch
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-base font-medium">Push Notifications</div>
                  <div className="text-sm text-gray-600">
                    Receive browser push notifications
                  </div>
                </div>
                <Switch
                  checked={preferences.pushNotifications}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, pushNotifications: checked }))
                  }
                />
              </div>

              <Button>Save Notification Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Privacy Settings
              </CardTitle>
              <CardDescription>
                Control who can see your information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="profile-visibility">Profile Visibility</Label>
                <Select
                  value={preferences.profileVisibility}
                  onValueChange={(value) =>
                    setPreferences((prev) => ({
                      ...prev,
                      profileVisibility: value as UserPreferences["profileVisibility"],
                    }))
                  }
                >
                  <SelectTrigger id="profile-visibility">
                    <SelectValue placeholder="Select who can view your profile" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - anyone can view your profile</SelectItem>
                    <SelectItem value="friends">Friends only - only approved connections</SelectItem>
                    <SelectItem value="private">Private - only you can view</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Choose how visible your profile, posts, and activity should be to others.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-base font-medium">Show Location</div>
                  <div className="text-sm text-gray-600">
                    Display your city and state on your profile
                  </div>
                </div>
                <Switch
                  checked={preferences.showLocation}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, showLocation: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-base font-medium">Show Interests</div>
                  <div className="text-sm text-gray-600">
                    Display your interests and topics on your profile
                  </div>
                </div>
                <Switch
                  checked={preferences.showInterests}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, showInterests: checked }))
                  }
                />
              </div>

              <Button onClick={handlePrivacySave} disabled={privacySaving}>
                {privacySaving ? "Saving..." : "Save Privacy Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your account password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                </div>

                <Button type="submit" disabled={updatePasswordMutation.isPending}>
                  {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible account actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete Account"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {hasOrganizationAccess && (
          <TabsContent value="organization" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Church Account
                </CardTitle>
                <CardDescription>
                  Manage your church or organization account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8">
                  <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Church Account</h3>
                  <p className="text-gray-600 mb-4">
                    Create a church account to access advanced features like member management,
                    event planning, and premium tools.
                  </p>
                  <Button>
                    Create Church Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
