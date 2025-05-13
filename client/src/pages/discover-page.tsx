import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layouts/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Community, User, Post } from "@shared/schema";
import PostCard from "@/components/post-card";
import { Separator } from "@/components/ui/separator";
import { Search, Heart, Users, Compass } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function DiscoverPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  
  // Fetch communities
  const { data: communities, isLoading: isLoadingCommunities } = useQuery<Community[]>({
    queryKey: ['/api/communities'],
  });
  
  // Function to get community icon with updated styling
  const getCommunityIcon = (iconName: string, iconColor: string) => {
    let icon;
    let colorClass = '';
    
    switch (iconColor) {
      case 'primary':
        colorClass = 'bg-primary/10 text-primary';
        break;
      case 'secondary':
        colorClass = 'bg-secondary/20 text-secondary-foreground';
        break;
      case 'accent':
        colorClass = 'bg-accent/20 text-accent-foreground';
        break;
      case 'red':
        colorClass = 'bg-destructive/10 text-destructive';
        break;
      default:
        colorClass = 'bg-muted text-muted-foreground';
    }
    
    switch (iconName) {
      case 'pray':
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M12 2v1" />
            <path d="M12 21v-1" />
            <path d="M3.3 7.8c-.4-1 .1-2 1-2.4 1-.4 2 .1 2.4 1 .4 1-.1 2-1 2.4-1 .4-2-.1-2.4-1Z" />
            <path d="M20.7 16.2c-.4-1 .1-2 1-2.4 1-.4 2 .1 2.4 1 .4 1-.1 2-1 2.4-1 .4-2-.1-2.4-1Z" />
            <path d="M3.3 16.2c-.4-1 .1-2 1-2.4 1-.4 2 .1 2.4 1 .4 1-.1 2-1 2.4-1 .4-2-.1-2.4-1Z" />
            <path d="M20.7 7.8c-.4-1 .1-2 1-2.4 1-.4 2 .1 2.4 1 .4 1-.1 2-1 2.4-1 .4-2-.1-2.4-1Z" />
            <path d="M9 15.9a4 4 0 0 0 6 0" />
            <path d="M17 10c.7-.7.7-1.3 0-2" />
            <path d="M7 8c-.7.7-.7 1.3 0 2" />
          </svg>
        );
        break;
      case 'book':
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
        );
        break;
      case 'church':
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="m2 22 10-10 10 10" />
            <path d="M4 15v7" />
            <path d="M20 15v7" />
            <path d="M12 9v3" />
            <path d="M12 3a6 6 0 0 1 1 3.142c0 .64-.057 1.11-.172 1.415-.114.306-.242.483-.242.483L12 9l-.586-.96s-.128-.177-.242-.483C11.057 7.252 11 6.782 11 6.142A6 6 0 0 1 12 3Z" />
          </svg>
        );
        break;
      case 'heart':
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        );
        break;
      default:
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
    }
    
    return (
      <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center`}>
        {icon}
      </div>
    );
  };

  // Filter communities based on search term
  const filteredCommunities = communities?.filter(community => 
    community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    community.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    community.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Popular categories with beautiful badges
  const categories = [
    { id: 1, name: "Bible Study", color: "bg-primary/10 text-primary hover:bg-primary/20" },
    { id: 2, name: "Prayer", color: "bg-secondary/20 text-secondary-foreground hover:bg-secondary/30" },
    { id: 3, name: "Testimony", color: "bg-accent/20 text-accent-foreground hover:bg-accent/30" },
    { id: 4, name: "Worship", color: "bg-pink-100 text-pink-700 hover:bg-pink-200" },
    { id: 5, name: "Family", color: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
    { id: 6, name: "Relationships", color: "bg-purple-100 text-purple-700 hover:bg-purple-200" },
    { id: 7, name: "College", color: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
    { id: 8, name: "Mental Health", color: "bg-teal-100 text-teal-700 hover:bg-teal-200" }
  ];

  // Featured communities
  const featuredCommunities = communities?.slice(0, 4) || [];

  return (
    <MainLayout>
      <div className="flex-1 space-y-6">
        {/* Hero Banner */}
        <Card className="overflow-hidden border-secondary/20">
          <div className="bg-gradient-to-r from-primary/30 via-secondary/20 to-accent/20 p-6 md:p-8">
            <div className="max-w-xl">
              <h1 className="text-2xl md:text-3xl font-bold mb-3">Discover Your Community</h1>
              <p className="text-foreground/80 mb-6">
                Explore faith-focused communities where you can connect, share, and grow with others on the same journey.
              </p>
              
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search communities, topics, or interests..."
                  className="pl-10 py-6 bg-white/90 backdrop-blur-sm border-none shadow-lg rounded-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-5 w-5" />
              </div>
            </div>
          </div>
        </Card>

        {/* Category Pills */}
        <div className="py-2 overflow-x-auto scrollbar-hide">
          <div className="flex space-x-2 min-w-max">
            {categories.map(category => (
              <Badge key={category.id} className={`px-4 py-1.5 ${category.color} transition-colors cursor-pointer text-sm`}>
                {category.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="communities" className="w-full">
          <TabsList className="mb-4 bg-muted/50 p-1">
            <TabsTrigger value="communities" className="data-[state=active]:bg-background data-[state=active]:text-primary">
              <Heart className="mr-2 h-4 w-4" />
              Communities
            </TabsTrigger>
            <TabsTrigger value="trending" className="data-[state=active]:bg-background data-[state=active]:text-primary">
              <Compass className="mr-2 h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="groups" className="data-[state=active]:bg-background data-[state=active]:text-primary">
              <Users className="mr-2 h-4 w-4" />
              Private Groups
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="communities" className="space-y-6">
            {/* Featured Communities */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Featured Communities</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {featuredCommunities.map(community => (
                  <Card key={community.id} className="card-hover overflow-hidden border-secondary/20">
                    <div className="h-20 bg-gradient-to-r from-primary/20 to-secondary/30" />
                    <CardContent className="pt-0 relative p-4">
                      <div className="flex justify-center">
                        <div className="-mt-10 rounded-full border-4 border-background">
                          {getCommunityIcon(community.iconName, community.iconColor)}
                        </div>
                      </div>
                      <div className="text-center mt-3">
                        <Link href={`/community/${community.slug}`}>
                          <h3 className="font-semibold hover:text-primary transition-colors">r/{community.slug}</h3>
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {community.description || `A community focused on ${community.name}`}
                        </p>
                        <div className="mt-4">
                          <Button variant="outline" className="rounded-full border-primary/20 hover:border-primary/50 hover:bg-primary/5 w-full">
                            Join
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* All Communities */}
            <div>
              <h2 className="text-xl font-semibold mb-4">All Communities</h2>
              {isLoadingCommunities ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-full bg-muted"></div>
                          <div className="space-y-2">
                            <div className="h-4 w-40 bg-muted rounded"></div>
                            <div className="h-3 w-64 bg-muted rounded"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredCommunities && filteredCommunities.length > 0 ? (
                <div className="space-y-3">
                  {filteredCommunities.map(community => (
                    <Card key={community.id} className="card-hover overflow-hidden border-secondary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center">
                          {getCommunityIcon(community.iconName, community.iconColor)}
                          <div className="ml-4 flex-1">
                            <div className="flex items-center justify-between">
                              <Link href={`/community/${community.slug}`}>
                                <h3 className="font-semibold hover:text-primary transition-colors">r/{community.slug}</h3>
                              </Link>
                              <Button variant="outline" size="sm" className="rounded-full text-xs h-8 px-4">
                                Join
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {community.description || `A community focused on ${community.name}`}
                            </p>
                            <div className="flex items-center mt-2 text-xs text-muted-foreground">
                              <Users className="h-3 w-3 mr-1" />
                              <span>1.2k members</span>
                              <span className="mx-2">•</span>
                              <span>20 posts today</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed border-secondary/40">
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No communities found matching your search.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="trending">
            <Card className="border-secondary/20">
              <CardHeader>
                <CardTitle>Trending Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground pb-4">Discover what's trending across all communities right now.</p>
                
                {/* We would typically fetch trending posts here */}
                <div className="space-y-4">
                  <Card className="animate-pulse border-secondary/20">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-muted"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-4 w-4/5 bg-muted rounded"></div>
                          <div className="h-3 w-3/5 bg-muted rounded"></div>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="h-4 w-full bg-muted rounded"></div>
                        <div className="h-4 w-full bg-muted rounded"></div>
                        <div className="h-4 w-2/3 bg-muted rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="animate-pulse border-secondary/20">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-muted"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-4 w-4/5 bg-muted rounded"></div>
                          <div className="h-3 w-3/5 bg-muted rounded"></div>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="h-4 w-full bg-muted rounded"></div>
                        <div className="h-4 w-full bg-muted rounded"></div>
                        <div className="h-4 w-2/3 bg-muted rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="groups">
            <Card className="border-secondary/20">
              <CardHeader>
                <CardTitle>Private Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                    <Lock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Sign in to view your groups</h3>
                  <p className="text-muted-foreground mb-4">
                    Join private Bible study groups and family discussions
                  </p>
                  <Link href="/auth">
                    <Button className="rounded-full px-8">Sign In</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

// Missing import
function Lock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}