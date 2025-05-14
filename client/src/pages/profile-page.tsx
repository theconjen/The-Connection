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
        <Card className="mb-8 overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-purple-500 via-pink-400 to-purple-300 relative">
            <div className="absolute bottom-4 right-4">
              <Button variant="outline" size="sm" className="bg-white/90 hover:bg-white">
                <Edit3 className="h-4 w-4 mr-1" /> Edit Cover
              </Button>
            </div>
          </div>
          <CardContent className="p-6 md:p-8 relative">
            <div className="flex flex-col md:flex-row items-start gap-6 md:-mt-16">
              <div className="relative">
                <Avatar className="w-24 h-24 text-2xl font-bold border-4 border-white shadow-md">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                    {getInitials(user.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 bg-primary text-white rounded-full p-1 cursor-pointer shadow-sm hover:shadow-md transition-shadow">
                  <Edit3 className="h-4 w-4" />
                </div>
              </div>
              
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
                  
                  <div className="mt-4 flex flex-wrap gap-4">
                    <div className="bg-slate-50 rounded-lg px-4 py-2 flex items-center gap-1 text-sm">
                      <UserIcon className="h-4 w-4 text-primary" />
                      <span>Joined {user.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : 'recently'}</span>
                    </div>
                    
                    <div className="bg-slate-50 rounded-lg px-4 py-2 flex items-center gap-1 text-sm">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span><b>{userPosts?.length || 0}</b> Posts</span>
                    </div>
                    
                    <div className="bg-slate-50 rounded-lg px-4 py-2 flex items-center gap-1 text-sm">
                      <BookmarkIcon className="h-4 w-4 text-primary" />
                      <span><b>0</b> Saved</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-6">
                    <div className="text-xs font-medium bg-purple-100 text-primary rounded-full px-3 py-1">Bible Study</div>
                    <div className="text-xs font-medium bg-purple-100 text-primary rounded-full px-3 py-1">Apologetics</div>
                    <div className="text-xs font-medium bg-purple-100 text-primary rounded-full px-3 py-1">Prayer</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="posts">
          <div className="border-b border-slate-200 mb-6">
            <TabsList className="w-full bg-transparent justify-start gap-1 h-12 mb-0">
              <TabsTrigger 
                value="posts" 
                className="flex items-center data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Posts
              </TabsTrigger>
              <TabsTrigger 
                value="saved" 
                className="flex items-center data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6"
              >
                <BookmarkIcon className="h-4 w-4 mr-2" />
                Saved
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="flex items-center data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>
          
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
        <Card className="shadow-sm">
          <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-50 border-b border-neutral-200 pb-4">
            <CardTitle className="text-primary flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#B366FF" />
              </svg>
              Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 text-sm flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2 text-primary opacity-70" />
                  Posts
                </span>
                <div className="bg-gradient-to-r from-primary to-secondary text-white font-medium rounded-full w-8 h-8 flex items-center justify-center">
                  {userPosts?.length || 0}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 text-sm flex items-center">
                  <svg className="h-4 w-4 mr-2 text-primary opacity-70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="#B366FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Comments
                </span>
                <div className="bg-gradient-to-r from-primary to-secondary text-white font-medium rounded-full w-8 h-8 flex items-center justify-center">
                  0
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 text-sm flex items-center">
                  <svg className="h-4 w-4 mr-2 text-primary opacity-70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="#B366FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="#B366FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="#B366FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="#B366FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Groups
                </span>
                <div className="bg-gradient-to-r from-primary to-secondary text-white font-medium rounded-full w-8 h-8 flex items-center justify-center">
                  0
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 text-sm flex items-center">
                  <svg className="h-4 w-4 mr-2 text-primary opacity-70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2V6" stroke="#B366FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 18V22" stroke="#B366FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4.93 4.93L7.76 7.76" stroke="#B366FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16.24 16.24L19.07 19.07" stroke="#B366FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12H6" stroke="#B366FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18 12H22" stroke="#B366FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4.93 19.07L7.76 16.24" stroke="#B366FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16.24 7.76L19.07 4.93" stroke="#B366FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Account Age
                </span>
                <span className="font-medium text-sm bg-gradient-to-r from-purple-100 to-pink-50 text-primary py-1 px-3 rounded-full">
                  {user.createdAt 
                    ? `${Math.round((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days` 
                    : 'New'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 overflow-hidden border-none shadow-sm">
          <CardHeader className="bg-white/30 backdrop-blur-sm border-b border-white/50">
            <CardTitle className="text-primary flex items-center gap-2">
              <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.75351 5 4.16789 5.47686 3 6.25278V19.2528C4.16789 18.4769 5.75351 18 7.5 18C9.24649 18 10.8321 18.4769 12 19.2528M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.2465 5 19.8321 5.47686 21 6.25278V19.2528C19.8321 18.4769 18.2465 18 16.5 18C14.7535 18 13.1679 18.4769 12 19.2528" stroke="#B366FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Scripture of the Day
            </CardTitle>
          </CardHeader>
          <CardContent className="relative p-6 text-center"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill='%23b366ff' fill-opacity='0.05'%3E%3Cpath d='M0 0h40v40H0V0zm40 40H0v40h40V40zm0-40h40v40H40V0zm40 40H40v40h40V40z'/%3E%3C/g%3E%3C/svg%3E")`,
            }}>
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
