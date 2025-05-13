import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Repeat, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Microblog, User } from "@shared/schema";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import ShareButtons from "./share-buttons";
import { getInitials } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface MicroblogPostProps {
  post: Microblog & {
    author?: User;
    isLiked?: boolean;
  };
  showControls?: boolean;
  isAuthenticated?: boolean;
  isDetailView?: boolean;
}

export function MicroblogPost({ 
  post, 
  showControls = true, 
  isAuthenticated = false,
  isDetailView = false
}: MicroblogPostProps) {
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
    <Card className="mb-4 overflow-hidden shadow-sm hover:shadow">
      <CardContent className="pt-4">
        <div className="flex gap-3">
          <Link href={`/users/${post.authorId}`}>
            <Avatar className="cursor-pointer">
              {post.author?.avatarUrl ? (
                <AvatarImage src={post.author.avatarUrl} alt={post.author.displayName || "User"} />
              ) : (
                <AvatarFallback>{getInitials(post.author?.displayName || "User")}</AvatarFallback>
              )}
            </Avatar>
          </Link>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Link href={`/users/${post.authorId}`}>
                <h3 className="text-sm font-semibold cursor-pointer hover:underline">
                  {post.author?.displayName || "User"}
                </h3>
              </Link>
              <span className="text-xs text-muted-foreground">
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
            
            <div className="mt-1 whitespace-pre-wrap">{post.content}</div>
            
            {post.imageUrl && (
              <div className="mt-3">
                <img 
                  src={post.imageUrl} 
                  alt="Post attachment" 
                  className="rounded-md max-h-96 w-auto object-contain" 
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      {showControls && (
        <CardFooter className="py-2 px-6 border-t">
          <div className="flex justify-between w-full">
            <Link href={`/microblogs/${post.id}`}>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <MessageCircle className="h-4 w-4 mr-1" />
                <span>{post.replyCount || 0}</span>
              </Button>
            </Link>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground"
              disabled={!isAuthenticated}
            >
              <Repeat className="h-4 w-4 mr-1" />
              <span>{post.repostCount || 0}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLikeToggle}
              className={`${post.isLiked ? "text-pink-500" : "text-muted-foreground"}`}
              disabled={toggleLikeMutation.isPending}
            >
              <Heart className={`h-4 w-4 mr-1 ${post.isLiked ? "fill-pink-500" : ""}`} />
              <span>{post.likeCount || 0}</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      )}
      
      {isSharing && (
        <div className="p-3 border-t">
          <ShareButtons url={`${window.location.origin}${postUrl}`} title={`Microblog post by ${post.author?.displayName || "User"}`} />
        </div>
      )}
    </Card>
  );
}

export default MicroblogPost;