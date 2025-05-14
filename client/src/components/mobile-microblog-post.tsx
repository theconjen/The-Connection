import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Repeat, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Microblog, User } from "@shared/schema";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { getInitials } from "@/lib/utils";
import ShareButtons from "./share-buttons";

interface MobileMicroblogPostProps {
  post: Microblog & {
    author?: User;
    isLiked?: boolean;
  };
  showControls?: boolean;
  isAuthenticated?: boolean;
  isDetailView?: boolean;
}

/**
 * MobileMicroblogPost - A mobile-optimized version of the microblog post component
 * Designed for smaller screens with touch-friendly targets and streamlined UI
 */
export default function MobileMicroblogPost({ 
  post, 
  showControls = true, 
  isAuthenticated = false,
  isDetailView = false
}: MobileMicroblogPostProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  
  const toggleLikeMutation = useMutation({
    mutationFn: async (liked: boolean) => {
      if (liked) {
        await apiRequest("DELETE", `/api/microblogs/${post.id}/like`);
      } else {
        await apiRequest("POST", `/api/microblogs/${post.id}/like`);
      }
    },
    onMutate: (liked) => {
      // Optimistic update
      queryClient.setQueryData(["/api/microblogs"], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((p: any) => 
          p.id === post.id 
            ? { 
                ...p, 
                likeCount: p.likeCount + (liked ? -1 : 1),
                isLiked: !liked 
              } 
            : p
        );
      });
      
      // Also update any detailed view
      queryClient.setQueryData(["/api/microblogs", post.id], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          likeCount: oldData.likeCount + (liked ? -1 : 1),
          isLiked: !liked
        };
      });
    },
    onError: (_, liked) => {
      // Revert optimistic update on error
      toast({
        title: "Error",
        description: liked 
          ? "Failed to unlike post. Please try again." 
          : "Failed to like post. Please try again.",
        variant: "destructive"
      });
      
      queryClient.setQueryData(["/api/microblogs"], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((p: any) => 
          p.id === post.id 
            ? { 
                ...p, 
                likeCount: p.likeCount + (liked ? 1 : -1),
                isLiked: liked 
              } 
            : p
        );
      });
      
      queryClient.setQueryData(["/api/microblogs", post.id], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          likeCount: oldData.likeCount + (liked ? 1 : -1),
          isLiked: liked
        };
      });
    },
    onSettled: () => {
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/microblogs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/microblogs", post.id] });
    }
  });

  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const handleLikeToggle = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like posts",
        variant: "default"
      });
      return;
    }
    
    toggleLikeMutation.mutate(post.isLiked || false);
  };
  
  const handleShare = () => {
    setIsSharing(prev => !prev);
  };
  
  const postUrl = `/microblogs/${post.id}`;
  
  return (
    <div className="border-b border-secondary/10 px-1 py-3">
      <div className="flex gap-3">
        <Link href={`/users/${post.authorId}`}>
          <Avatar className="h-10 w-10 cursor-pointer">
            {post.author?.avatarUrl ? (
              <AvatarImage src={post.author.avatarUrl} alt={post.author.displayName || "User"} />
            ) : (
              <AvatarFallback>{getInitials(post.author?.displayName || "User")}</AvatarFallback>
            )}
          </Avatar>
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <Link href={`/users/${post.authorId}`}>
              <span className="text-sm font-semibold cursor-pointer hover:underline truncate">
                {post.author?.displayName || "User"}
              </span>
            </Link>
            <span className="text-xs text-muted-foreground truncate">
              @{post.author?.username || "user"}
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">
              {formatDate(post.createdAt as Date)}
            </span>
          </div>
          
          {post.parentId && !isDetailView && (
            <div className="text-xs text-muted-foreground mb-1">
              Replying to a post
            </div>
          )}
          
          <Link href={postUrl}>
            <div className="mt-1 whitespace-pre-wrap text-sm active:bg-secondary/5 rounded">
              {post.content}
            </div>
          </Link>
          
          {post.imageUrl && (
            <div className="mt-2">
              <Link href={postUrl}>
                <img 
                  src={post.imageUrl} 
                  alt="Post attachment" 
                  className="rounded-lg max-h-80 w-auto object-contain border border-secondary/10" 
                  loading="lazy"
                />
              </Link>
            </div>
          )}
          
          {/* Mobile-optimized controls with larger touch targets */}
          {showControls && (
            <div className="flex justify-between mt-2 w-full max-w-full">
              <Link href={`/microblogs/${post.id}`}>
                <Button variant="ghost" size="sm" className="text-muted-foreground p-1 h-auto">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  <span className="text-xs">{post.replyCount || 0}</span>
                </Button>
              </Link>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground p-1 h-auto"
                disabled={!isAuthenticated}
              >
                <Repeat className="h-4 w-4 mr-1" />
                <span className="text-xs">{post.repostCount || 0}</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLikeToggle}
                className={`p-1 h-auto ${post.isLiked ? "text-pink-500" : "text-muted-foreground"}`}
                disabled={toggleLikeMutation.isPending}
              >
                <Heart className={`h-4 w-4 mr-1 ${post.isLiked ? "fill-pink-500" : ""}`} />
                <span className="text-xs">{post.likeCount || 0}</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="text-muted-foreground p-1 h-auto" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {isSharing && (
        <div className="p-3 mt-2 border-t border-secondary/10 bg-secondary/5 rounded-lg">
          <ShareButtons url={`${window.location.origin}${postUrl}`} title={`Microblog post by ${post.author?.displayName || "User"}`} />
        </div>
      )}
    </div>
  );
}