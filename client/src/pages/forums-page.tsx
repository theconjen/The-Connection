import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PostCard from "../components/post-card";
import FeedFilters from "../components/feed-filters";
import ApologeticsResourceCard from "../components/apologetics-resource";
import PrivateGroupsList from "../components/private-groups-list";
import CommunityGuidelines from "../components/community-guidelines";
import { Post, User, Community } from "@connection/shared/schema";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { useMediaQuery } from "../hooks/use-media-query";
import { RecommendedForYou } from "../components/RecommendedForYou";
import { useAuth } from "../hooks/use-auth";

interface ForumsPageProps {
  isGuest?: boolean;
}

export default function ForumsPage({ isGuest = false }: ForumsPageProps) {
  const [filter, setFilter] = useState<string>("popular");
  const [page, setPage] = useState(1);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { user } = useAuth();
  
  const { data: posts, isLoading, isFetching } = useQuery<(Post & { author?: User; community?: Community })[]>({
    queryKey: ["/api/posts", { filter, page }],
  });

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setPage(1); // Reset to first page when changing filters
  };

  const handleLoadMore = () => {
    setPage(prevPage => prevPage + 1);
  };

  return (
    <div className={`container mx-auto px-4 py-6`}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Community Forums</h1>
        <p className="text-muted-foreground">Discover and engage with discussions from the Christian community</p>
      </div>
      
      <div className={`flex ${isMobile ? 'flex-col' : 'md:flex-row gap-6'}`}>
        {/* Main Feed Area */}
        <div className="flex-1">
          {/* Recommended Content Section */}
          {user && (
            <div className="mb-6">
              <RecommendedForYou section="forums" maxItems={4} showHeader={true} />
            </div>
          )}
          
          <FeedFilters onFilterChange={handleFilterChange} currentFilter={filter} />

          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-neutral-200 mb-6 p-6">
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
              </div>
            ))
          ) : (
            <>
              {posts && posts.map((post, index) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  featured={index === 0 && page === 1} 
                />
              ))}

              {posts && posts.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 mb-6 p-10 text-center">
                  <h3 className="text-xl font-semibold mb-3">No Posts Found</h3>
                  <p className="text-neutral-600 mb-4">
                    There are no posts to display at the moment.
                  </p>
                </div>
              )}

              <div className="text-center py-4">
                <Button 
                  className="bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100 font-medium" 
                  onClick={handleLoadMore}
                  disabled={isFetching}
                >
                  {isFetching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Right Sidebar (Desktop only) */}
        {!isMobile && (
          <aside className="hidden md:block w-80 space-y-6 sticky top-24 self-start">
            <ApologeticsResourceCard />
            <PrivateGroupsList />
            <CommunityGuidelines />
          </aside>
        )}
      </div>
    </div>
  );
}