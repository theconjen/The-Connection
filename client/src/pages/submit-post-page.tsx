import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import MainLayout from "../components/layouts/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { Skeleton } from "../components/ui/skeleton";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Community, Group, InsertPost } from "@connection/shared/schema";
import { useAuth } from "../hooks/use-auth";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { Loader2 } from "lucide-react";

// Post creation form schema
const postFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(300, "Title cannot exceed 300 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  imageUrl: z.string().optional(),
  communityId: z.coerce.number().optional(),
  groupId: z.coerce.number().optional(),
  includeScripture: z.boolean().default(false),
});
type PostFormInput = z.input<typeof postFormSchema>;
type PostFormValues = z.output<typeof postFormSchema>;

export default function SubmitPostPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [scripture, setScripture] = useState("");
  
  // Fetch communities
  const { data: communities, isLoading: isLoadingCommunities } = useQuery<Community[]>({
    queryKey: ['/api/communities'],
  });
  
  // Fetch user's groups
  const { data: groups, isLoading: isLoadingGroups } = useQuery<Group[]>({
    queryKey: ['/api/communities'],
    enabled: !!user,
  });
  
  const form = useForm<PostFormInput, undefined, PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: "",
      content: "",
      imageUrl: "",
      communityId: undefined,
      groupId: undefined,
      includeScripture: false,
    } satisfies PostFormInput,
  });
  
  const createPostMutation = useMutation({
    mutationFn: async (data: PostFormValues) => {
      // Include scripture if checked
      let content = data.content;
      if (data.includeScripture && scripture) {
        content += `\n\n${scripture}`;
      }
      
      // Remove any field that is empty or undefined
      const postData: any = {
        title: data.title,
        content,
        authorId: user!.id,
      };
      
      const d = data as any;
      if (d.imageUrl) postData.imageUrl = d.imageUrl;
      if (d.communityId) postData.communityId = d.communityId;
      if (d.groupId) postData.groupId = d.groupId;
      
      const res = await apiRequest("POST", "/api/posts", postData);
      return await res.json();
    },
    onSuccess: (newPost) => {
      toast({
        title: "Post Created",
        description: "Your post has been created successfully!",
      });
      
      navigate(`/posts/${newPost.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Post Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: PostFormValues) => {
    createPostMutation.mutate(data);
  };
  
  const handleScriptureSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    
    if (value === "john316") {
      setScripture("\"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.\" - John 3:16");
    } else if (value === "proverbs3") {
      setScripture("\"Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.\" - Proverbs 3:5-6");
    } else if (value === "psalm23") {
      setScripture("\"The LORD is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.\" - Psalm 23:1-3");
    } else if (value === "romans828") {
      setScripture("\"And we know that in all things God works for the good of those who love him, who have been called according to his purpose.\" - Romans 8:28");
    } else {
      setScripture("");
    }
  };

  return (
    <MainLayout>
      <div className="flex-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create a Post</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="communityId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Community</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value?.toString()}
                            disabled={isLoadingCommunities}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a community" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingCommunities ? (
                                <div className="p-2">
                                  <Skeleton className="h-4 w-full" />
                                </div>
                              ) : (
                                communities?.map((community) => (
                                  <SelectItem 
                                    key={community.id} 
                                    value={community.id.toString()}
                                  >
                                    r/{community.slug}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="groupId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Private Group (Optional)</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value?.toString()}
                            disabled={isLoadingGroups || !user}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a private group" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingGroups ? (
                                <div className="p-2">
                                  <Skeleton className="h-4 w-full" />
                                </div>
                              ) : groups && groups.length > 0 ? (
                                groups.map((group) => (
                                  <SelectItem 
                                    key={group.id} 
                                    value={group.id.toString()}
                                  >
                                    {group.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <div className="p-2 text-sm text-neutral-500">
                                  You have no private groups
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your post title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Share your thoughts, questions, or insights..." 
                            className="min-h-[200px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/your-image.jpg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="includeScripture"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Include Scripture</FormLabel>
                          <p className="text-sm text-neutral-500">
                            Add a Bible verse to your post
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("includeScripture") && (
                    <div>
                      <FormLabel>Select Scripture</FormLabel>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        onChange={handleScriptureSelection}
                      >
                        <option value="">Select a verse</option>
                        <option value="john316">John 3:16</option>
                        <option value="proverbs3">Proverbs 3:5-6</option>
                        <option value="psalm23">Psalm 23:1-3</option>
                        <option value="romans828">Romans 8:28</option>
                      </select>
                      
                      {scripture && (
                        <div className="mt-2 p-4 bg-neutral-50 border-l-4 border-primary rounded italic">
                          {scripture}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate("/")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createPostMutation.isPending}
                  >
                    {createPostMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Post"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      
      {/* Right Sidebar */}
      <aside className="hidden lg:block w-80 space-y-6 sticky top-24 self-start">
        <Card>
          <CardHeader className="bg-neutral-50 border-b border-neutral-200">
            <CardTitle className="text-neutral-800">Posting Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ul className="space-y-3 text-sm">
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 mt-1 mr-2 h-4 w-4">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <span>Be respectful and thoughtful in your posts.</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 mt-1 mr-2 h-4 w-4">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <span>Include relevant details to encourage meaningful discussion.</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 mt-1 mr-2 h-4 w-4">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <span>Cite Scripture references when applicable.</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 mt-1 mr-2 h-4 w-4">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <span>Keep content appropriate and edifying.</span>
              </li>
            </ul>
            
            <div className="mt-4 p-3 bg-neutral-50 border rounded text-sm text-neutral-700">
              <p className="italic">
                "Let your conversation be always full of grace, seasoned with salt, so that you may know how to answer everyone." - Colossians 4:6
              </p>
            </div>
          </CardContent>
        </Card>
      </aside>
    </MainLayout>
  );
}
