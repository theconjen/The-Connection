import { useState, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Repeat, Share2, MoreHorizontal } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { Microblog, User } from "@connection/shared/schema";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import ShareButtons from "./share-buttons";
import { getInitials } from "../lib/utils";
import { apiRequest } from "../lib/queryClient";

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
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  
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
    const now = new Date();
    const postDate = new Date(date);
    const diffInHours = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);
    
    // If less than 24 hours ago, show relative time
    if (diffInHours < 24) {
      return formatDistanceToNow(postDate, { addSuffix: true });
    }
    
    // If this year, show month and day with time
    if (postDate.getFullYear() === now.getFullYear()) {
      return postDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
    
    // If older, show full date with year
    return postDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
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

  const handleImageLoad = () => {
    setImageLoaded(true);
  };
  
  const postUrl = `/microblogs/${post.id}`;

  // Format content with clickable links, hashtags, and mentions
  const formatContent = (content: string) => {
    // URLs
    const urlPattern = /https?:\/\/[^\s]+/g;
    const hashtagPattern = /#(\w+)/g;
    const mentionPattern = /@(\w+)/g;

    let formattedContent = content;
    
    // Replace URLs with clickable links
    formattedContent = formattedContent.replace(urlPattern, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">${url}</a>`;
    });
    
    // Replace hashtags with links
    formattedContent = formattedContent.replace(hashtagPattern, (match, tag) => {
      return `<a href="/tags/${tag}" class="text-primary hover:underline">${match}</a>`;
    });
    
    // Replace @mentions with links
    formattedContent = formattedContent.replace(mentionPattern, (match, username) => {
      return `<a href="/users/${username}" class="text-primary hover:underline">${match}</a>`;
    });
    
    return formattedContent;
  };
  
  return (
    <Card className="mb-4 overflow-hidden shadow-sm hover:shadow transition-shadow duration-200  border/50">
      <CardContent className="pt-4">
        <div className="flex gap-3">
          <Link href={`/users/${post.authorId}`}>
            <Avatar className="cursor-pointer h-10 w-10">
              {post.author?.avatarUrl ? (
                <AvatarImage src={post.author.avatarUrl} alt={post.author.displayName || "User"} />
              ) : (
                <AvatarFallback>{getInitials(post.author?.displayName || "User")}</AvatarFallback>
              )}
            </Avatar>
          </Link>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center min-w-0 flex-wrap">
                <Link href={`/users/${post.authorId}`}>
                  <h3 className="text-sm font-semibold cursor-pointer hover:underline truncate max-w-[140px]">
                    {post.author?.displayName || "User"}
                  </h3>
                </Link>
                <span className="text-xs text-muted-foreground truncate ml-1.5">
                  @{post.author?.username || "user"}
                </span>
                <span className="text-xs text-muted-foreground mx-1.5">·</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(post.createdAt as Date)}
                </span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:bg-background/80 ml-auto"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigator.clipboard.writeText(`${window.location.origin}${postUrl}`)}>
                    Copy link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare}>
                    Share post
                  </DropdownMenuItem>
                  {isAuthenticated && post.authorId === 1 && (
                    <>
                      <DropdownMenuItem>Edit post</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Delete post</DropdownMenuItem>
                    </>
                  )}
                  {isAuthenticated && post.authorId !== 1 && (
                    <DropdownMenuItem>Report post</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {post.parentId && !isDetailView && (
              <div className="text-xs text-muted-foreground mb-1">
                Replying to a post
              </div>
            )}
            
            <Link href={postUrl}>
              <div 
                className="mt-1.5 text-foreground whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
              ></div>
            </Link>
            
            {post.imageUrl && (
              <div className="mt-3 relative overflow-hidden rounded-lg">
                {!imageLoaded && (
                  <div className="bg-muted animate-pulse rounded-lg w-full h-48 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Loading image...</span>
                  </div>
                )}
                <Link href={postUrl}>
                  <img 
                    ref={imageRef}
                    src={post.imageUrl} 
                    alt="Post attachment" 
                    className={`rounded-lg max-h-96 w-full object-cover border  border/10 ${imageLoaded ? 'block' : 'hidden'}`}
                    loading="lazy"
                    onLoad={handleImageLoad}
                  />
                </Link>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      {showControls && (
        <CardFooter className="py-2 px-4 border-t  border/10">
          <div className="flex justify-between w-full">
            <Link href={`/microblogs/${post.id}`}>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-secondary/30">
                <MessageCircle className="h-4 w-4 mr-1.5" />
                <span>{post.replyCount || 0}</span>
              </Button>
            </Link>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50/30"
              disabled={!isAuthenticated}
            >
              <Repeat className="h-4 w-4 mr-1.5" />
              <span>{post.repostCount || 0}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLikeToggle}
              className={`hover:bg-pink-50/30 ${post.isLiked ? "text-pink-500" : "text-muted-foreground hover:text-pink-500"}`}
              disabled={toggleLikeMutation.isPending}
            >
              <Heart className={`h-4 w-4 mr-1.5 transition-all ${post.isLiked ? "fill-pink-500" : ""}`} />
              <span>{post.likeCount || 0}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-blue-500 hover:bg-blue-50/30" 
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 mr-1.5" />
              <span>Share</span>
            </Button>
          </div>
        </CardFooter>
      )}
      
      {isSharing && (
        <div className="p-4 border-t  border/10 bg-secondary/5">
          <h4 className="text-sm font-medium mb-2">Share this post</h4>
          <ShareButtons url={`${window.location.origin}${postUrl}`} title={`Post by ${post.author?.displayName || "User"}: ${post.content.substring(0, 30)}...`} />
        </div>
      )}
    </Card>
  );
}

export default MicroblogPost;