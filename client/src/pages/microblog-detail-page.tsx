import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "../hooks/use-auth";
import { Microblog, User } from "@connection/shared/schema";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "../components/ui/button";
import { useMediaQuery } from "../hooks/use-media-query";
import MicroblogPost from "../components/microblog-post";
import MicroblogComposer from "../components/microblog-composer";
import MobileMicroblogPost from "../components/mobile-microblog-post";
import MobileMicroblogComposer from "../components/mobile-microblog-composer";
import MobileModernButton from "../components/mobile-modern-button";
import TouchFeedback from "../components/mobile-touch-feedback";

export default function MicroblogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const postId = parseInt(id);
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  const { data: post, isLoading: postLoading } = useQuery<Microblog & { author?: User; isLiked?: boolean }>({
    queryKey: ['/api/microblogs', postId],
    queryFn: async () => {
      const response = await fetch(`/api/microblogs/${postId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch microblog post');
      }
      
      const post = await response.json();
      
      // Fetch author data
      let author = null;
      try {
        const authorRes = await fetch(`/api/users/${post.authorId}`);
        if (authorRes.ok) {
          author = await authorRes.json();
        }
      } catch (error) {
        console.error('Error fetching author:', error);
      }
      
      // Check if user has liked this post
      let isLiked = false;
      if (user) {
        try {
          const likedRes = await fetch(`/api/users/${user.id}/liked-microblogs`);
          if (likedRes.ok) {
            const likedPostIds = await likedRes.json();
            isLiked = likedPostIds.includes(post.id);
          }
        } catch (error) {
          console.error('Error checking liked status:', error);
        }
      }
      
      return {
        ...post,
        author,
        isLiked
      };
    },
    enabled: !isNaN(postId),
  });
  
  const { data: replies, isLoading: repliesLoading } = useQuery<(Microblog & { author?: User; isLiked?: boolean })[]>({
    queryKey: ['/api/microblogs', postId, 'replies'],
    queryFn: async () => {
      const response = await fetch(`/api/microblogs/${postId}/replies`);
      if (!response.ok) {
        throw new Error('Failed to fetch replies');
      }
      
      const replies = await response.json();
      
      // Fetch authors for each reply
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
      
      // Combine replies with authors and liked status
      return replies.map((reply: Microblog, index: number) => ({
        ...reply,
        author: authors[index],
        isLiked: likedPostIds.includes(reply.id),
      }));
    },
    enabled: !isNaN(postId),
  });
  
  const isLoading = postLoading || repliesLoading;
  const isAuthenticated = !!user && !authLoading;
  
  if (isMobile) {
    return (
      <>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : post ? (
          <div>
            <MobileMicroblogPost 
              post={post} 
              isAuthenticated={isAuthenticated}
              isDetailView={true}
            />
            
            <div className="border-t border-secondary/10 mt-2 pt-3">
              <h2 className="text-lg font-semibold mb-2 px-3">Replies</h2>
              
              <MobileMicroblogComposer 
                parentId={post.id}
                minimized={false}
                onSuccess={() => {
                  // This will refresh the replies list
                  window.location.reload();
                }}
              />
              
              {replies && replies.length > 0 ? (
                <div>
                  {replies.map((reply) => (
                    <MobileMicroblogPost 
                      key={reply.id} 
                      post={reply} 
                      isAuthenticated={isAuthenticated}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
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
      </>
    );
  }
  
  // Desktop version
  return (
    <div className="container max-w-3xl py-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1" 
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : post ? (
        <div>
          <MicroblogPost 
            post={post} 
            isAuthenticated={isAuthenticated}
            isDetailView={true}
          />
          
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Replies</h2>
            
            <MicroblogComposer 
              parentId={post.id}
              onSuccess={() => {
                // This will refresh the replies list
                window.location.reload();
              }}
            />
            
            {replies && replies.length > 0 ? (
              <div className="mt-6">
                {replies.map((reply) => (
                  <MicroblogPost 
                    key={reply.id} 
                    post={reply} 
                    isAuthenticated={isAuthenticated}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
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
  );
}