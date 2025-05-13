import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import MainLayout from "@/components/layouts/main-layout";
import PostCard from "@/components/post-card";
import FeedFilters from "@/components/feed-filters";
import ApologeticsResourceCard from "@/components/apologetics-resource";
import PrivateGroupsList from "@/components/private-groups-list";
import CommunityGuidelines from "@/components/community-guidelines";
import { Post, User, Community } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function CommunityPage() {
  const [, params] = useRoute("/community/:slug");
  const slug = params?.slug || "";
  const [filter, setFilter] = useState<string>("popular");
  
  const { data: community, isLoading: isLoadingCommunity } = useQuery<Community>({
    queryKey: [`/api/communities/${slug}`],
    enabled: !!slug,
  });
  
  const { data: posts, isLoading: isLoadingPosts, isFetching } = useQuery<(Post & { author?: User; community?: Community })[]>({
    queryKey: ["/api/posts", { community: slug, filter }],
    enabled: !!slug,
  });
  
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
  };
  
  const getCommunityIcon = (iconName: string, iconColor: string) => {
    let icon;
    let colorClass = '';
    
    switch (iconColor) {
      case 'primary':
        colorClass = 'bg-primary-100 text-primary-600';
        break;
      case 'secondary':
        colorClass = 'bg-green-100 text-green-600';
        break;
      case 'accent':
        colorClass = 'bg-amber-100 text-amber-600';
        break;
      case 'red':
        colorClass = 'bg-red-100 text-red-500';
        break;
      default:
        colorClass = 'bg-neutral-100 text-neutral-600';
    }
    
    switch (iconName) {
      case 'pray':
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
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
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
        );
        break;
      case 'church':
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
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
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        );
        break;
      default:
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
    }
    
    return (
      <div className={`w-20 h-20 rounded-full ${colorClass} flex items-center justify-center mr-6`}>
        {icon}
      </div>
    );
  };

  return (
    <MainLayout>
      {/* Main Content Area */}
      <div className="flex-1">
        {/* Community Header */}
        {isLoadingCommunity ? (
          <Card className="bg-white mb-6">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Skeleton className="w-20 h-20 rounded-full mr-6" />
                <div>
                  <Skeleton className="h-8 w-48 mb-2" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-24 mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : community ? (
          <Card className="bg-white mb-6">
            <CardContent className="p-6">
              <div className="flex items-center">
                {getCommunityIcon(community.iconName, community.iconColor)}
                <div>
                  <h1 className="text-2xl font-bold mb-1">r/{community.slug}</h1>
                  <p className="text-neutral-600">{community.description}</p>
                  <p className="text-sm text-neutral-500 mt-1">{community.memberCount} members</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white mb-6">
            <CardContent className="p-6 text-center">
              <h1 className="text-xl font-medium">Community not found</h1>
              <p className="text-neutral-600 mt-2">The community you're looking for doesn't exist or has been removed.</p>
            </CardContent>
          </Card>
        )}

        {/* Feed Filters */}
        <FeedFilters onFilterChange={handleFilterChange} currentFilter={filter} />

        {/* Posts */}
        {isLoadingPosts ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, index) => (
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
            {posts && posts.length > 0 ? (
              posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <Card className="mb-6 p-10 text-center">
                <CardContent>
                  <h3 className="text-xl font-semibold mb-3">No Posts Yet</h3>
                  <p className="text-neutral-600 mb-4">
                    Be the first to share something in this community!
                  </p>
                  <Button className="bg-primary hover:bg-primary-700">
                    Create Post
                  </Button>
                </CardContent>
              </Card>
            )}

            {posts && posts.length > 0 && (
              <div className="text-center py-4">
                <Button 
                  variant="outline"
                  className="border border-neutral-300 text-neutral-700 hover:bg-neutral-100 font-medium" 
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
            )}
          </>
        )}
      </div>

      {/* Right Sidebar */}
      <aside className="hidden lg:block w-80 space-y-6 sticky top-24 self-start">
        <ApologeticsResourceCard />
        <PrivateGroupsList />
        <CommunityGuidelines />
      </aside>
    </MainLayout>
  );
}
