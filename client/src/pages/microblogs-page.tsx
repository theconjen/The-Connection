import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Microblog, User } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw } from "lucide-react";
import MicroblogPost from "@/components/microblog-post";
import MicroblogComposer from "@/components/microblog-composer";
import MobileMicroblogPost from "@/components/mobile-microblog-post";
import MobileMicroblogComposer from "@/components/mobile-microblog-composer";
import MobilePullRefresh from "@/components/mobile-pull-refresh";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";

export default function MicroblogsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("latest");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  const { 
    data: microblogs, 
    isLoading, 
    refetch 
  } = useQuery<(Microblog & { author?: User; isLiked?: boolean })[]>({
    queryKey: ['/api/microblogs', activeTab === 'latest' ? 'recent' : 'popular'],
    queryFn: async ({ queryKey }) => {
      const [_, filter] = queryKey;
      const response = await fetch(`/api/microblogs?filter=${filter}`);
      if (!response.ok) {
        throw new Error('Failed to fetch microblogs');
      }
      
      const posts = await response.json();
      
      // Fetch authors for each post
      const authors = await Promise.all(
        posts.map(async (post: Microblog) => {
          try {
            const authorRes = await fetch(`/api/users/${post.authorId}`);
            if (authorRes.ok) {
              return await authorRes.json();
            }
            return null;
          } catch (error) {
            console.error('Error fetching author:', error);
            return null;
          }
        })
      );
      
      // Fetch user's liked posts if authenticated
      let likedPostIds: number[] = [];
      if (user) {
        try {
          const likedRes = await fetch(`/api/users/${user.id}/liked-microblogs`);
          if (likedRes.ok) {
            likedPostIds = await likedRes.json();
          }
        } catch (error) {
          console.error('Error fetching liked posts:', error);
        }
      }
      
      // Combine posts with authors and liked status
      return posts.map((post: Microblog, index: number) => ({
        ...post,
        author: authors[index],
        isLiked: likedPostIds.includes(post.id),
      }));
    },
    enabled: !authLoading,
  });
  
  // Function to handle pull-to-refresh on mobile
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };
  
  // Add pull-to-refresh functionality on mobile
  useEffect(() => {
    if (!isMobile) return;
    
    let startY: number | null = null;
    let isPulling = false;
    
    const touchStart = (e: TouchEvent) => {
      // Only enable pull-to-refresh at the top of the page
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    };
    
    const touchMove = (e: TouchEvent) => {
      if (!isPulling || startY === null) return;
      
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      
      // If pulled down at least 60px, trigger refresh
      if (diff > 60) {
        handleRefresh();
        isPulling = false;
        startY = null;
      }
    };
    
    const touchEnd = () => {
      isPulling = false;
      startY = null;
    };
    
    document.addEventListener('touchstart', touchStart);
    document.addEventListener('touchmove', touchMove);
    document.addEventListener('touchend', touchEnd);
    
    return () => {
      document.removeEventListener('touchstart', touchStart);
      document.removeEventListener('touchmove', touchMove);
      document.removeEventListener('touchend', touchEnd);
    };
  }, [isMobile, refetch]);
  
  const isAuthenticated = !!user;
  
  // Mobile version rendering
  if (isMobile) {
    return (
      <>
        {/* Mobile Tabs */}
        <Tabs defaultValue="latest" className="w-full" onValueChange={setActiveTab}>
          <div className="sticky top-[57px] bg-white/95 backdrop-blur-md z-10 border-b border-secondary/10">
            <TabsList className="grid w-full grid-cols-2 p-1 mb-0">
              <TabsTrigger value="latest" className="text-sm">Latest</TabsTrigger>
              <TabsTrigger value="popular" className="text-sm">Popular</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="latest" className="pt-2 m-0">
            {/* Mobile Composer */}
            <MobileMicroblogComposer />
            
            {/* Refresh indicator */}
            {isRefreshing && (
              <div className="flex justify-center py-2">
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Refreshing...</span>
              </div>
            )}
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : microblogs && microblogs.length > 0 ? (
              <div>
                {microblogs.map((post) => (
                  <MobileMicroblogPost 
                    key={post.id} 
                    post={post} 
                    isAuthenticated={isAuthenticated}
                  />
                ))}
                <div className="py-8 flex justify-center">
                  <Button variant="outline" size="sm" className="text-sm" onClick={handleRefresh}>
                    Load more
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                No posts found. Be the first to post!
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="popular" className="pt-2 m-0">
            {/* Mobile Composer */}
            <MobileMicroblogComposer />
            
            {/* Refresh indicator */}
            {isRefreshing && (
              <div className="flex justify-center py-2">
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Refreshing...</span>
              </div>
            )}
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : microblogs && microblogs.length > 0 ? (
              <div>
                {microblogs.map((post) => (
                  <MobileMicroblogPost 
                    key={post.id} 
                    post={post} 
                    isAuthenticated={isAuthenticated}
                  />
                ))}
                <div className="py-8 flex justify-center">
                  <Button variant="outline" size="sm" className="text-sm" onClick={handleRefresh}>
                    Load more
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                No posts found. Be the first to post!
              </div>
            )}
          </TabsContent>
        </Tabs>
      </>
    );
  }
  
  // Desktop version - unchanged
  return (
    <div className="container max-w-3xl py-6">
      <h1 className="text-3xl font-bold mb-6">Feed</h1>
      
      {/* Composer at the top */}
      <MicroblogComposer />
      
      {/* Tabs for different views */}
      <Tabs defaultValue="latest" className="mb-6" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="latest">Latest</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : microblogs && microblogs.length > 0 ? (
        <div>
          {microblogs.map((post) => (
            <MicroblogPost 
              key={post.id} 
              post={post} 
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground">
          No posts found. Be the first to post!
        </div>
      )}
    </div>
  );
}