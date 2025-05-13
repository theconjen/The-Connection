import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Microblog, User } from "@shared/schema";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import MainLayout from "@/components/layouts/main-layout";
import MicroblogPost from "@/components/microblog-post";
import MicroblogComposer from "@/components/microblog-composer";
import { Button } from "@/components/ui/button";

export default function MicroblogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const microblogId = parseInt(id);
  const { user, isLoading: authLoading } = useAuth();
  
  const { data: microblog, isLoading: postLoading } = useQuery<Microblog & { author?: User; isLiked?: boolean }>({
    queryKey: ['/api/microblogs', microblogId],
    queryFn: async () => {
      const response = await fetch(`/api/microblogs/${microblogId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch microblog');
      }
      
      const post = await response.json();
      
      // Fetch author
      let author = null;
      try {
        const authorRes = await fetch(`/api/users/${post.authorId}`);
        if (authorRes.ok) {
          author = await authorRes.json();
        }
      } catch (error) {
        console.error('Error fetching author:', error);
      }
      
      // Check if user liked this post
      let isLiked = false;
      if (user) {
        try {
          const likedRes = await fetch(`/api/users/${user.id}/liked-microblogs`);
          if (likedRes.ok) {
            const likedPostIds = await likedRes.json();
            isLiked = likedPostIds.includes(post.id);
          }
        } catch (error) {
          console.error('Error fetching liked status:', error);
        }
      }
      
      return {
        ...post,
        author,
        isLiked
      };
    },
    enabled: !isNaN(microblogId) && !authLoading,
  });
  
  const { data: replies, isLoading: repliesLoading } = useQuery<(Microblog & { author?: User; isLiked?: boolean })[]>({
    queryKey: ['/api/microblogs', microblogId, 'replies'],
    queryFn: async () => {
      const response = await fetch(`/api/microblogs/${microblogId}/replies`);
      if (!response.ok) {
        throw new Error('Failed to fetch replies');
      }
      
      const replies = await response.json();
      
      // Fetch authors for replies
      const authors = await Promise.all(
        replies.map(async (reply: Microblog) => {
          try {
            const authorRes = await fetch(`/api/users/${reply.authorId}`);
            if (authorRes.ok) {
              return await authorRes.json();
            }
            return null;
          } catch (error) {
            console.error('Error fetching reply author:', error);
            return null;
          }
        })
      );
      
      // Check if user liked any replies
      let likedReplyIds: number[] = [];
      if (user) {
        try {
          const likedRes = await fetch(`/api/users/${user.id}/liked-microblogs`);
          if (likedRes.ok) {
            likedReplyIds = await likedRes.json();
          }
        } catch (error) {
          console.error('Error fetching liked replies:', error);
        }
      }
      
      // Combine replies with authors and liked status
      return replies.map((reply: Microblog, index: number) => ({
        ...reply,
        author: authors[index],
        isLiked: likedReplyIds.includes(reply.id),
      }));
    },
    enabled: !isNaN(microblogId) && !authLoading,
  });
  
  const isLoading = postLoading || repliesLoading;
  const isAuthenticated = !!user;
  
  if (isNaN(microblogId)) {
    return (
      <MainLayout>
        <div className="container max-w-3xl py-6 text-center">
          <h1 className="text-3xl font-bold mb-6">Invalid Post ID</h1>
          <p className="mb-4">The post ID you're trying to view is invalid.</p>
          <Link href="/microblogs">
            <Button>Back to Feed</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container max-w-3xl py-6">
        <div className="mb-6">
          <Link href="/microblogs">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Feed
            </Button>
          </Link>
          
          <h1 className="text-2xl font-bold">Post</h1>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : microblog ? (
          <div>
            {/* Main post */}
            <MicroblogPost 
              post={microblog} 
              isAuthenticated={isAuthenticated}
              isDetailView={true}
            />
            
            {/* Reply composer */}
            <div className="my-6">
              <h2 className="text-xl font-semibold mb-4">Reply to this post</h2>
              <MicroblogComposer parentId={microblogId} />
            </div>
            
            {/* Replies */}
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Replies</h2>
              
              {replies && replies.length > 0 ? (
                replies.map((reply) => (
                  <MicroblogPost 
                    key={reply.id} 
                    post={reply} 
                    isAuthenticated={isAuthenticated}
                  />
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No replies yet. Be the first to reply!
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            Post not found or has been removed.
          </div>
        )}
      </div>
    </MainLayout>
  );
}