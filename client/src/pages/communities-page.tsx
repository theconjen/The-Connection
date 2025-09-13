import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Users, Plus, Lock, Briefcase, Activity, GraduationCap, Palette, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertCommunityObjectSchema, type InsertCommunity } from "@shared/schema";

interface Community {
  id: number;
  name: string;
  description: string;
  slug: string;
  iconName: string;
  iconColor: string;
  memberCount: number | null;
  isPrivate: boolean | null;
  hasPrivateWall: boolean | null;
  hasPublicWall: boolean | null;
  createdAt: Date | null;
  createdBy: number | null;
}

// Community form schema with frontend validation
const createCommunitySchema = insertCommunityObjectSchema.omit({ createdBy: true, slug: true }).extend({
  name: z.string().min(1, "Community name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
  iconName: z.string().default("users"),
  iconColor: z.string().default("#3b82f6"),
  isPrivate: z.boolean().default(false),
  hasPrivateWall: z.boolean().default(true),
  hasPublicWall: z.boolean().default(true),
}).refine((data) => data.hasPrivateWall || data.hasPublicWall, {
  message: "At least one wall (private or public) must be enabled",
  path: ["hasPublicWall"], // Show error on public wall field
});

type CreateCommunityForm = z.infer<typeof createCommunitySchema>;

export default function CommunitiesPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  
  // Debounce search query for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Form setup with validation
  const form = useForm<CreateCommunityForm>({
    resolver: zodResolver(createCommunitySchema),
    defaultValues: {
      name: "",
      description: "",
      iconName: "users",
      iconColor: "#3b82f6",
      isPrivate: false,
      hasPrivateWall: true,
      hasPublicWall: true,
    },
  });
  
  // Fetch communities with search support
  const { data: communities, isLoading, error } = useQuery<Community[]>({
    queryKey: ['/api/communities', debouncedSearchQuery],
    queryFn: async () => {
      const searchParam = debouncedSearchQuery ? `?search=${encodeURIComponent(debouncedSearchQuery)}` : '';
      const response = await fetch(`/api/communities${searchParam}`);
      if (!response.ok) {
        throw new Error('Failed to fetch communities');
      }
      return response.json();
    },
  });
  
  // Create community mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateCommunityForm) => {
      const payload: InsertCommunity = {
        ...data,
        slug: data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        createdBy: undefined, // Will be set by backend
      };
      
      const res = await apiRequest("POST", "/api/communities", payload);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create community');
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/communities'] });
      toast({
        title: "Community created",
        description: `"${data.name}" has been created successfully.`,
      });
      setOpen(false);
      form.reset();
      navigate(`/community/${data.slug}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create community",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleCreateCommunity = (data: CreateCommunityForm) => {
    createMutation.mutate(data);
  };
  
  const handleDialogClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      form.reset();
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading communities...</span>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-2">Error Loading Communities</h2>
          <p className="text-muted-foreground mb-4">
            {(error as Error)?.message || "Failed to load communities."}
          </p>
        </div>
      </div>
    );
  }
  
  // Featured interest-based categories
  const interestCategories = [
    {
      title: "Christian Creatives",
      description: "Connect with writers, artists, musicians, and other creative Christians.",
      icon: <Palette className="h-6 w-6 text-pink-600" />,
      link: "/groups/creatives",
      color: "bg-pink-50"
    },
    {
      title: "Christian Entrepreneurs",
      description: "Network with business owners and startup founders who share your faith.",
      icon: <Briefcase className="h-6 w-6 text-amber-600" />,
      link: "/groups/entrepreneurs",
      color: "bg-amber-50"
    },
    {
      title: "Christian Fitness",
      description: "Find workout partners, sports teams, and wellness groups for believers.",
      icon: <Activity className="h-6 w-6 text-emerald-600" />,
      link: "/groups/fitness",
      color: "bg-emerald-50"
    },
    {
      title: "College Students",
      description: "Connect with other Christian students at your university or in your city.",
      icon: <GraduationCap className="h-6 w-6 text-indigo-600" />,
      link: "/groups/college",
      color: "bg-indigo-50"
    }
  ];

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Communities</h1>
          <p className="text-muted-foreground mt-1">
            Join or create communities to connect with others
          </p>
        </div>
        
        {user && (
          <Dialog open={open} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Community
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Community</DialogTitle>
                <DialogDescription>
                  Create a new community for people to join and connect.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateCommunity)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Community Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Bible Study Group"
                            data-testid="input-community-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="A community for those interested in studying the Bible together"
                            data-testid="input-community-description"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Community Privacy Setting */}
                  <FormField
                    control={form.control}
                    name="isPrivate"
                    render={({ field }) => (
                      <FormItem className="p-4 border rounded-lg bg-muted/30">
                        <div className="flex items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-private-community"
                            />
                          </FormControl>
                          <FormLabel className="font-semibold">Invite Only Community</FormLabel>
                        </div>
                        <p className="text-sm text-muted-foreground ml-6">
                          {field.value 
                            ? "Only people with invitations can join this community. You can invite members after creation."
                            : "Anyone can discover and join this community freely."}
                        </p>
                      </FormItem>
                    )}
                  />
                  
                  {/* Wall Settings */}
                  <div className="grid gap-3">
                    <Label className="font-semibold">Community Wall Settings</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="hasPublicWall"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center space-x-2">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-public-wall"
                                />
                              </FormControl>
                              <FormLabel>Public Wall</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="hasPrivateWall"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center space-x-2">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-private-wall"
                                />
                              </FormControl>
                              <FormLabel>Private Wall</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Show wall validation error */}
                    {form.formState.errors.hasPublicWall && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.hasPublicWall.message}
                      </p>
                    )}
                    
                    <p className="text-sm text-muted-foreground">
                      Wall settings control where members can post content within the community.
                    </p>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="submit"
                      disabled={createMutation.isPending}
                      data-testid="button-create-community"
                    >
                      {createMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Community"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {/* Search Section */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
            data-testid="input-search-communities"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
              onClick={() => setSearchQuery("")}
              data-testid="button-clear-search"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        {debouncedSearchQuery && (
          <p className="text-sm text-muted-foreground mt-2">
            Searching for: <span className="font-medium">"{debouncedSearchQuery}"</span>
          </p>
        )}
      </div>
      
      {/* Interest-based categories section */}
      <div className="mb-10">
        <div className="flex items-center mb-5">
          <h2 className="text-2xl font-semibold">Interest-Based Communities</h2>
          <div className="ml-3 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
            New
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {interestCategories.map((category, index) => (
            <Card 
              key={index} 
              className={`cursor-pointer hover:shadow-md transition-shadow ${category.color} border-none`}
              onClick={() => navigate(category.link)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  {category.icon}
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{category.description}</p>
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  variant="outline" 
                  className="w-full bg-white/70"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(category.link);
                  }}
                >
                  Explore
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Divider */}
      <div className="border-t my-8"></div>
      
      {/* All Communities section */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">All Communities</h2>
      </div>
      
      {!communities || communities.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          {debouncedSearchQuery ? (
            <>
              <h2 className="text-2xl font-bold mb-2">No Communities Found</h2>
              <p className="text-muted-foreground mb-4">
                No communities match your search for "{debouncedSearchQuery}". Try a different search term.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery("")}
                data-testid="button-clear-search-results"
              >
                Clear Search
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-2">No Communities Yet</h2>
              <p className="text-muted-foreground mb-4">
                Be the first to create a community!
              </p>
              
              {user ? (
                <Button onClick={() => setOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Community
                </Button>
              ) : (
                <Button onClick={() => navigate('/auth')}>
                  Sign In to Create
                </Button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {communities.map((community: Community) => (
            <Card 
              key={community.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/community/${community.slug}`)}
            >
              <CardHeader className="pb-2 md:pb-2 p-4 md:p-6">
                <CardTitle className="flex items-center justify-between text-lg md:text-xl">
                  <span>{community.name}</span>
                  <div className="flex items-center gap-1">
                    {community.isPrivate && (
                      <span title="Invite Only">
                        <Lock className="h-4 w-4 text-red-500" />
                      </span>
                    )}
                    {community.hasPrivateWall && (
                      <span title="Has Private Wall">
                        <Lock className="h-4 w-4 text-amber-500" />
                      </span>
                    )}
                  </div>
                </CardTitle>
                <CardDescription className="line-clamp-2 text-sm">
                  {community.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="px-4 md:px-6 py-2">
                <div className="flex items-center text-muted-foreground text-sm">
                  <Users className="mr-1 h-4 w-4 flex-shrink-0" />
                  <span>{community.memberCount || 0} members</span>
                </div>
              </CardContent>
              
              <CardFooter className="px-4 md:px-6 py-4">
                <Button 
                  variant="secondary"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/c/${community.slug}`);
                  }}
                >
                  View Community
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}