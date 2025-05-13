import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Microblog, User } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import MainLayout from "@/components/layouts/main-layout";
import MicroblogPost from "@/components/microblog-post";
import MicroblogComposer from "@/components/microblog-composer";

export default function MicroblogsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("latest");
  
  const { data: microblogs, isLoading } = useQuery<(Microblog & { author?: User; isLiked?: boolean })[]>({
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
  
  const isAuthenticated = !!user;
  
  return (
    <MainLayout currentPath="/microblogs">
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
    </MainLayout>
  );
}