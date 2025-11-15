import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/use-auth";
import { Microblog, User } from "@connection/shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Loader2, RefreshCw, PenSquare, Plus } from "lucide-react";
import MicroblogPost from "../components/microblog-post";
import MicroblogComposer from "../components/microblog-composer";
import MobileMicroblogPost from "../components/mobile-microblog-post";
import MobileMicroblogComposer from "../components/mobile-microblog-composer";
import MobilePullRefresh from "../components/mobile-pull-refresh";
import FloatingActionButton from "../components/floating-action-button";
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet";
import { useMediaQuery } from "../hooks/use-media-query";
import { Button } from "../components/ui/button";
import { RecommendedForYou } from "../components/RecommendedForYou";

export default function MicroblogsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("latest");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMobileComposer, setShowMobileComposer] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const composerSheetRef = useRef<HTMLButtonElement>(null);
  
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
  
  // No need for manual pull-to-refresh implementation
  // Since we're using our MobilePullRefresh component
  
  const isAuthenticated = !!user;
  
  // Mobile version rendering
  if (isMobile) {
    return (
      <>
        {/* Mobile Recommendations Section */}
        {user && (
          <div className="p-4">
            <RecommendedForYou section="feed" maxItems={3} showHeader={true} />
          </div>
        )}

        {/* Mobile Tabs */}
        <Tabs defaultValue="latest" className="w-full" onValueChange={setActiveTab}>
          <div className="sticky top-[57px] mobile-nav-modern z-10 p-2">
            <TabsList className="grid w-full grid-cols-2 p-1 mb-0 mobile-modern-card">
              <TabsTrigger value="latest" className="text-sm mobile-text-modern data-[state=active]:bg-primary data-[state=active]:text-white">Latest</TabsTrigger>
              <TabsTrigger value="popular" className="text-sm mobile-text-modern data-[state=active]:bg-primary data-[state=active]:text-white">Popular</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="latest" className="pt-2 m-0">
            <MobilePullRefresh onRefresh={handleRefresh}>
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-sm active-scale touch-target" 
                      onClick={handleRefresh}
                    >
                      Load more
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  No posts found. Be the first to post!
                </div>
              )}
            </MobilePullRefresh>
          </TabsContent>
          
          <TabsContent value="popular" className="pt-2 m-0">
            <MobilePullRefresh onRefresh={handleRefresh}>
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-sm active-scale touch-target" 
                      onClick={handleRefresh}
                    >
                      Load more
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  No posts found. Be the first to post!
                </div>
              )}
            </MobilePullRefresh>
          </TabsContent>
        </Tabs>
        
        {/* Floating Action Button */}
        <FloatingActionButton 
          onClick={() => setShowMobileComposer(true)} 
          icon={<PenSquare className="h-6 w-6 text-white" />}
          label="Create post"
          position="bottom-right"
        />
        
        {/* Mobile Composer Sheet */}
        <Sheet open={showMobileComposer} onOpenChange={setShowMobileComposer}>
          <SheetTrigger asChild>
            <button ref={composerSheetRef} className="hidden">Open composer</button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-xl p-0">
            <div className="flex flex-col h-full">
              <div className="border-b p-3 flex justify-between items-center">
                <h3 className="text-lg font-semibold">Create post</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2" 
                  onClick={() => setShowMobileComposer(false)}
                >
                  Cancel
                </Button>
              </div>
              <div className="flex-1 overflow-auto p-3">
                <MobileMicroblogComposer 
                  onSuccess={() => setShowMobileComposer(false)}
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }
  
  // Desktop version - unchanged
  return (
    <div className="container max-w-3xl py-6">
      <h1 className="text-3xl font-bold mb-6">Feed</h1>
      
      {/* Recommended Content Section */}
      {user && (
        <div className="mb-6">
          <RecommendedForYou section="feed" maxItems={4} showHeader={true} />
        </div>
      )}
      
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