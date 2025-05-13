import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import MainLayout from "@/components/layouts/main-layout";
import { User, Post } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PostCard from "@/components/post-card";
import { format } from "date-fns";
import { Edit3, User as UserIcon, MessageSquare, BookmarkIcon, Settings } from "lucide-react";

// Profile update schema
const profileSchema = z.object({
  displayName: z.string().optional(),
  bio: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: userPosts, isLoading: isLoadingPosts } = useQuery<Post[]>({
    queryKey: ["/api/posts", { authorId: user?.id }],
    enabled: !!user,
  });
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      bio: user?.bio || "",
    },
  });
  
  // Update form values when user data changes
  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName || "",
        bio: user.bio || "",
      });
    }
  }, [user, form]);
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PATCH", `/api/users/${user!.id}`, data);
      return await res.json();
    },
    onSuccess: (updatedUser: User) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };
  
  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };
  
  if (!user) {
    return (
      <MainLayout>
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">Profile not available</h1>
              <p className="text-neutral-600 mb-6">
                Please sign in to view your profile.
              </p>
              <Button asChild>
                <a href="/auth">Sign In</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex-1">
        <Card className="mb-8">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="w-24 h-24 text-2xl font-bold">
                <AvatarFallback className="bg-primary-100 text-primary-800">
                  {getInitials(user.username)}
                </AvatarFallback>
              </Avatar>
              
              {isEditing ? (
                <div className="flex-1">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your display name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell us a bit about yourself"
                                {...field}
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              ) : (
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-2xl font-bold">
                        {user.displayName || user.username}
                      </h1>
                      <p className="text-neutral-500">@{user.username}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                  
                  <div className="mt-4">
                    {user.bio ? (
                      <p className="text-neutral-700">{user.bio}</p>
                    ) : (
                      <p className="text-neutral-500 italic">No bio provided</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-4 text-sm text-neutral-500">
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 mr-1" />
                      <span>Joined {user.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : 'recently'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="posts">
          <TabsList className="mb-6">
            <TabsTrigger value="posts" className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center">
              <BookmarkIcon className="h-4 w-4 mr-2" />
              Saved
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts">
            {isLoadingPosts ? (
              // Loading skeletons
              Array.from({ length: 2 }).map((_, index) => (
                <Card key={index} className="mb-6">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <Skeleton className="w-10 h-10 rounded-full mr-3" />
                      <div>
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-40 mt-1" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-2/3 mb-6" />
                    <div className="flex space-x-4">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                {userPosts && userPosts.length > 0 ? (
                  userPosts.map((post) => (
                    <PostCard 
                      key={post.id} 
                      post={{
                        ...post,
                        author: user,
                      }} 
                    />
                  ))
                ) : (
                  <Card className="p-8 text-center">
                    <CardContent>
                      <h3 className="text-xl font-semibold mb-3">No posts yet</h3>
                      <p className="text-neutral-600 mb-6">
                        You haven't created any posts. Share your thoughts or questions with the community!
                      </p>
                      <Button asChild>
                        <a href="/submit">Create Post</a>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="saved">
            <Card className="p-8 text-center">
              <CardContent>
                <h3 className="text-xl font-semibold mb-3">Saved Posts</h3>
                <p className="text-neutral-600">
                  Bookmarked posts will appear here for easy access.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account preferences and privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Email Notifications</h3>
                  <div className="flex items-center mb-2">
                    <input 
                      type="checkbox" 
                      id="notif-comments" 
                      className="h-4 w-4 mr-2" 
                      defaultChecked 
                    />
                    <label htmlFor="notif-comments" className="text-sm">
                      Notify me when someone comments on my post
                    </label>
                  </div>
                  <div className="flex items-center mb-2">
                    <input 
                      type="checkbox" 
                      id="notif-replies" 
                      className="h-4 w-4 mr-2" 
                      defaultChecked 
                    />
                    <label htmlFor="notif-replies" className="text-sm">
                      Notify me when someone replies to my comment
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="notif-groups" 
                      className="h-4 w-4 mr-2" 
                      defaultChecked 
                    />
                    <label htmlFor="notif-groups" className="text-sm">
                      Notify me about activity in my groups
                    </label>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-2">Privacy</h3>
                  <div className="flex items-center mb-2">
                    <input 
                      type="checkbox" 
                      id="privacy-profile" 
                      className="h-4 w-4 mr-2" 
                      defaultChecked 
                    />
                    <label htmlFor="privacy-profile" className="text-sm">
                      Show my profile to registered users only
                    </label>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-2">Account Security</h3>
                  <Button variant="outline">Change Password</Button>
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Settings</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Right Sidebar */}
      <aside className="hidden lg:block w-80 space-y-6 sticky top-24 self-start">
        <Card>
          <CardHeader className="bg-neutral-50 border-b border-neutral-200">
            <CardTitle className="text-neutral-800">Activity Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 text-sm">Posts</span>
                <span className="font-medium">{userPosts?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 text-sm">Comments</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 text-sm">Groups</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 text-sm">Account Age</span>
                <span className="font-medium">
                  {user.createdAt 
                    ? `${Math.round((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days` 
                    : 'New'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="bg-neutral-50 border-b border-neutral-200">
            <CardTitle className="text-neutral-800">Scripture of the Day</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <blockquote className="italic text-neutral-700 bg-neutral-50 p-4 rounded border-l-4 border-primary">
              "Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight."
              <footer className="mt-2 text-sm font-medium">Proverbs 3:5-6</footer>
            </blockquote>
          </CardContent>
        </Card>
      </aside>
    </MainLayout>
  );
}
