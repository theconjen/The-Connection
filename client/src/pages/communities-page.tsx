import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../hooks/use-auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Loader2, Users, Plus, Lock, Briefcase, Activity, GraduationCap, Palette, Search, X, BookOpen, Heart, Music, Camera, Coffee, Globe, Star, Home, MessageCircle, Calendar, Map, Shield, Zap, Target, Compass, Sparkles } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { apiRequest, queryClient } from "../lib/queryClient";
import { insertCommunityObjectSchema, type InsertCommunity } from "@connection/shared/schema";
import { IconPicker } from "../components/ui/icon-picker";
import { ColorPicker } from "../components/ui/color-picker";
import type { Community } from '@connection/shared/mobile-web/types';


// Community form schema with frontend validation
// Cast to any to allow extending the generated schema in the UI layer while we
// align the shared/schema with frontend fields. This is a small compatibility
// shim to unblock TypeScript errors; remove the cast once schemas are synced.
const createCommunitySchema = z.object({
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

type CreateCommunityFormInput = z.input<typeof createCommunitySchema>;
type CreateCommunityForm = z.output<typeof createCommunitySchema>;

export default function CommunitiesPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "popular" | "public" | "private">("all");
  
  // Debounce search query for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Form setup with validation
  const form = useForm<CreateCommunityFormInput, undefined, CreateCommunityForm>({
    // Cast schema to any to work around Zod version/type differences between
    // @hookform/resolvers and the installed zod types.
    resolver: zodResolver(createCommunitySchema as any),
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
      navigate(`/communities/${data.slug}`);
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
  
  // Color rotation system for community cards (fallback for communities without stored colors)
  const communityColors = [
    { bg: "bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/50 dark:to-pink-800/60", iconColor: "text-pink-600 dark:text-pink-200" },
    { bg: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/60", iconColor: "text-blue-600 dark:text-blue-200" },
    { bg: "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/50 dark:to-emerald-800/60", iconColor: "text-emerald-600 dark:text-emerald-200" },
    { bg: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/50 dark:to-amber-800/60", iconColor: "text-amber-600 dark:text-amber-200" },
    { bg: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/50 dark:to-purple-800/60", iconColor: "text-purple-600 dark:text-purple-200" },
    { bg: "bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/50 dark:to-indigo-800/60", iconColor: "text-indigo-600 dark:text-indigo-200" },
    { bg: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/50 dark:to-green-800/60", iconColor: "text-green-600 dark:text-green-200" },
    { bg: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/50 dark:to-orange-800/60", iconColor: "text-orange-600 dark:text-orange-200" },
    { bg: "bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/50 dark:to-teal-800/60", iconColor: "text-teal-600 dark:text-teal-200" },
    { bg: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/50 dark:to-red-800/60", iconColor: "text-red-600 dark:text-red-200" },
  ];

  // Utility functions for color handling
  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const createGradientFromHex = (hex: string): React.CSSProperties => {
    const rgb = hexToRgb(hex);
    if (!rgb) {
      return {
        backgroundImage: 'linear-gradient(to bottom right, rgba(156, 163, 175, 0.14), rgba(156, 163, 175, 0.26))',
        backgroundBlendMode: 'multiply'
      };
    }

    // Create lighter versions for gradient background while allowing dark mode overlays
    const lightAlpha = 0.14;
    const mediumAlpha = 0.26;

    return {
      backgroundImage: `linear-gradient(to bottom right, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${lightAlpha}), rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${mediumAlpha}))`,
      backgroundBlendMode: 'multiply'
    };
  };

  const isValidHexColor = (hex: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
  };

  // Icon mapping for communities based on iconName
  const getIconComponent = (iconName: string, colorStyle: string | object) => {
    const iconProps = typeof colorStyle === 'string' 
      ? { className: `h-6 w-6 ${colorStyle}` }
      : { className: 'h-6 w-6', style: colorStyle };
    
    switch (iconName.toLowerCase()) {
      case 'users': return <Users {...iconProps} />;
      case 'bookopen':
      case 'book': return <BookOpen {...iconProps} />;
      case 'heart': return <Heart {...iconProps} />;
      case 'music': return <Music {...iconProps} />;
      case 'camera': return <Camera {...iconProps} />;
      case 'coffee': return <Coffee {...iconProps} />;
      case 'globe': return <Globe {...iconProps} />;
      case 'star': return <Star {...iconProps} />;
      case 'home': return <Home {...iconProps} />;
      case 'messagecircle':
      case 'message': return <MessageCircle {...iconProps} />;
      case 'calendar': return <Calendar {...iconProps} />;
      case 'map': return <Map {...iconProps} />;
      case 'shield': return <Shield {...iconProps} />;
      case 'zap': return <Zap {...iconProps} />;
      case 'target': return <Target {...iconProps} />;
      case 'palette': return <Palette {...iconProps} />;
      case 'briefcase': return <Briefcase {...iconProps} />;
      case 'activity': return <Activity {...iconProps} />;
      case 'graduationcap': return <GraduationCap {...iconProps} />;
      default: return <Users {...iconProps} />;
    }
  };

  // Helper function to get color scheme for a community
  const getCommunityColorScheme = (community: Community) => {
    // Use stored colors if available and valid
    if (community.iconColor && isValidHexColor(community.iconColor)) {
      return {
        bg: null, // Will use inline style
        bgStyle: createGradientFromHex(community.iconColor),
        iconStyle: { color: community.iconColor },
        iconColor: undefined, // Ensure this property exists
        isCustom: true
      };
    }
    
    // Fall back to rotation system for communities without stored colors
    const fallbackScheme = communityColors[community.id % communityColors.length];
    return {
      bg: fallbackScheme.bg,
      bgStyle: null,
      iconColor: fallbackScheme.iconColor,
      iconStyle: undefined, // Ensure this property exists
      isCustom: false
    };
  };

  // Featured interest-based categories
  const interestCategories = [
    {
      title: "Christian Creatives",
      description: "Connect with writers, artists, musicians, and other creative Christians.",
      icon: <Palette className="h-6 w-6 text-pink-600 dark:text-pink-200" />,
      link: "/communities/prayer-requests",
      color: "bg-pink-50 dark:bg-pink-900/40 border border-pink-100 dark:border-pink-800/60"
    },
    {
      title: "Christian Entrepreneurs",
      description: "Network with business owners and startup founders who share your faith.",
      icon: <Briefcase className="h-6 w-6 text-amber-600 dark:text-amber-200" />,
      link: "/communities/bible-study",
      color: "bg-amber-50 dark:bg-amber-900/40 border border-amber-100 dark:border-amber-800/60"
    },
    {
      title: "Christian Fitness",
      description: "Find workout partners, sports teams, and wellness groups for believers.",
      icon: <Activity className="h-6 w-6 text-emerald-600 dark:text-emerald-200" />,
      link: "/communities/theology",
      color: "bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-800/60"
    },
    {
      title: "College Students",
      description: "Connect with other Christian students at your university or in your city.",
      icon: <GraduationCap className="h-6 w-6 text-indigo-600 dark:text-indigo-200" />,
      link: "/communities/christian-life",
      color: "bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800/60"
    }
  ];

  const filteredCommunities = useMemo(() => {
    if (!communities) return [];

    let results = [...communities];

    if (activeFilter === "popular") {
      results = results.sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0));
    }

    if (activeFilter === "public") {
      results = results.filter((community) => !community.isPrivate);
    }

    if (activeFilter === "private") {
      results = results.filter((community) => community.isPrivate);
    }

    return results;
  }, [communities, activeFilter]);

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-500 via-blue-500 to-sky-500 text-white p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                Made for connecting on mobile
              </div>
              <div>
                <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Communities</h1>
                <p className="text-white/90 mt-1 max-w-2xl">
                  Discover groups that feel native to your phone. Join, create, and explore conversations that matter to you.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm">
                  <Users className="h-4 w-4" />
                  {communities?.length || "0"} active communities
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm">
                  <Compass className="h-4 w-4" />
                  Curated for your interests
                </div>
              </div>
            </div>

            {user && (
              <Dialog open={open} onOpenChange={handleDialogClose}>
                <DialogTrigger asChild>
                  <Button size="lg" className="bg-white text-indigo-600 hover:bg-white/90 hover:text-indigo-700 shadow-sm">
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
                  
                  {/* Icon and Color Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="iconName"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <IconPicker
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={createMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="iconColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <ColorPicker
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={createMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
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
                        {form.formState.errors.hasPublicWall?.message as unknown as string}
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
      </div>

      <div className="space-y-10">
        {/* Search + filters */}
        <Card className="border-none shadow-sm bg-white/80 dark:bg-slate-900/70">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search communities"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 h-11 rounded-xl bg-slate-100 border-0 shadow-inner dark:bg-slate-800"
                  data-testid="input-search-communities"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                    onClick={() => setSearchQuery("")}
                    data-testid="button-clear-search"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {debouncedSearchQuery && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Searching for <span className="font-medium">"{debouncedSearchQuery}"</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
                {[{ key: "all", label: "For you" }, { key: "popular", label: "Popular" }, { key: "public", label: "Open" }, { key: "private", label: "Invite only" }].map((filter) => (
                  <Button
                    key={filter.key}
                    variant={activeFilter === filter.key ? "default" : "outline"}
                    className={`rounded-full border ${activeFilter === filter.key ? "bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900" : "bg-white/70 dark:bg-slate-800"}`}
                    onClick={() => setActiveFilter(filter.key as typeof activeFilter)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                Browse curated lists that feel closer to a native feed.
              </div>
              {!user && (
                <Button className="rounded-full" variant="ghost" onClick={() => navigate('/auth')}>
                  Sign in to create your own
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Interest-based categories section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Interest-based picks</h2>
              <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium dark:bg-primary/20 dark:text-primary-foreground">
                Fresh
              </div>
            </div>
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => navigate('/discover')}>
              See more
            </Button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
            {interestCategories.map((category, index) => (
              <Card
                key={index}
                className={`min-w-[260px] sm:min-w-[240px] cursor-pointer hover:-translate-y-0.5 transition-transform ${category.color} text-slate-900 dark:text-slate-100 backdrop-blur-sm`}
                onClick={() => navigate(category.link)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-white/60 flex items-center justify-center shadow-sm">
                      {category.icon}
                    </div>
                    <CardTitle className="text-lg leading-tight">{category.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-slate-800 dark:text-slate-100/90 leading-relaxed">{category.description}</p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button
                    variant="outline"
                    className="w-full rounded-full bg-white/80 text-slate-900 hover:bg-white dark:bg-slate-900/60 dark:text-slate-50 dark:hover:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
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

        {/* All Communities section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">All communities</h2>
            <div className="text-sm text-muted-foreground">Tap into groups that feel like native threads.</div>
          </div>

          {filteredCommunities.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-white/80 dark:bg-slate-900/70 shadow-sm border border-slate-200/70 dark:border-slate-800">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              {debouncedSearchQuery || activeFilter !== "all" ? (
                <>
                  <h2 className="text-2xl font-bold mb-2">No Communities Found</h2>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search or filters to see more groups.
                  </p>
                  <div className="flex flex-col gap-3 items-center sm:flex-row sm:justify-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                        setActiveFilter("all");
                      }}
                      data-testid="button-clear-search-results"
                    >
                      Clear search & filters
                    </Button>
                    {user && (
                      <Button onClick={() => setOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Community
                      </Button>
                    )}
                  </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {filteredCommunities.map((community: Community) => {
                const colorScheme = getCommunityColorScheme(community);
                const communityIcon = getIconComponent(
                  community.iconName || 'users',
                  (colorScheme.isCustom ? colorScheme.iconStyle : colorScheme.iconColor) || 'text-slate-700 dark:text-slate-200'
                );

                const cardProps = colorScheme.isCustom && colorScheme.bgStyle
                  ? { style: colorScheme.bgStyle }
                  : {};
                const cardBaseClass = "cursor-pointer hover:-translate-y-0.5 transition-transform text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800 backdrop-blur-sm";
                const cardClassName = colorScheme.isCustom
                  ? `${cardBaseClass} bg-white/90 dark:bg-slate-900/60`
                  : `${cardBaseClass} ${colorScheme.bg}`;

                return (
                  <Card
                    key={community.id}
                    className={cardClassName}
                    {...cardProps}
                    onClick={() => navigate(`/communities/${community.slug}`)}
                  >
                    <CardHeader className="pb-1">
                      <div className="flex items-start gap-3">
                        <div className="h-11 w-11 rounded-2xl bg-white/70 dark:bg-slate-900/70 flex items-center justify-center shadow-sm">
                          {communityIcon}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-lg leading-tight">{community.name}</CardTitle>
                            <div className="flex gap-2">
                              {community.isPrivate && <span className="rounded-full bg-white/60 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-slate-800/90 dark:text-amber-200">Invite only</span>}
                              {community.hasPrivateWall && <span className="rounded-full bg-white/60 px-3 py-1 text-xs font-medium text-sky-700 dark:bg-slate-800/90 dark:text-sky-200">Private wall</span>}
                            </div>
                          </div>
                          <p className="text-sm text-gray-800 dark:text-slate-100/90 line-clamp-2">{community.description}</p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-2">
                      <div className="flex items-center justify-between text-sm text-gray-700 dark:text-slate-300">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 flex-shrink-0" />
                          <span>{community.memberCount || 0} members</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full bg-white/80 hover:bg-white/90 dark:bg-slate-900/60 dark:hover:bg-slate-900/50"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/communities/${community.slug}`);
                          }}
                        >
                          Explore
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {user && (
        <Button
          className="fixed bottom-6 right-5 h-12 w-12 rounded-full shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white sm:hidden"
          size="icon"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-5 w-5" />
        </Button>
      )}
      </div>
    </div>
  );
}
