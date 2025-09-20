import { useState, useRef, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Repeat, Share2, MoreHorizontal, Bookmark, Eye } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { Microblog, User } from "@shared/schema";
import { Button } from "./ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import MobileModernButton from "./mobile-modern-button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { apiRequest } from "../lib/api";
import { getInitials } from "../lib/utils";
import ShareButtons from "./share-buttons";
import TouchFeedback from "./mobile-touch-feedback";
import SwipeHandler from "./mobile-swipe-handler";

interface MobileMicroblogPostProps {
  post: Microblog & {
    author?: User;
    isLiked?: boolean;
    likeCount?: number;
    commentCount?: number;
    viewCount?: number;
  };
  showControls?: boolean;
  isAuthenticated?: boolean;
  isDetailView?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

/**
 * MobileMicroblogPost - A mobile-optimized version of the microblog post component
 * Designed for smaller screens with touch-friendly targets and streamlined UI
 */
export default function MobileMicroblogPost({ 
  post, 
  showControls = true, 
  isAuthenticated = false,
  isDetailView = false,
  onSwipeLeft,
  onSwipeRight
}: MobileMicroblogPostProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const toggleLikeMutation = useMutation({
    mutationFn: async (liked: boolean) => {
      if (liked) {
        await apiRequest(`/api/microblogs/${post.id}/like`, {
          method: "DELETE"
        });
      } else {
        await apiRequest(`/api/microblogs/${post.id}/like`, {
          method: "POST"
        });
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
                likeCount: (p.likeCount || 0) + (liked ? -1 : 1),
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
          likeCount: (oldData.likeCount || 0) + (liked ? -1 : 1),
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

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };
  
  const postUrl = `/microblogs/${post.id}`;

  // Format content with clickable links, hashtags, and mentions
  const formatContent = (content: string) => {
    // Format URLs, hashtags and mentions similar to desktop, but optimized for touch
    const urlPattern = /https?:\/\/[^\s]+/g;
    const hashtagPattern = /#(\w+)/g;
    const mentionPattern = /@(\w+)/g;

    let formattedContent = content;
    
    // Replace URLs with clickable links
    formattedContent = formattedContent.replace(urlPattern, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary hover:opacity-80 active:opacity-60">${url}</a>`;
    });
    
    // Replace hashtags with links
    formattedContent = formattedContent.replace(hashtagPattern, (match, tag) => {
      return `<a href="/tags/${tag}" class="text-primary hover:opacity-80 active:opacity-60">${match}</a>`;
    });
    
    // Replace @mentions with links
    formattedContent = formattedContent.replace(mentionPattern, (match, username) => {
      return `<a href="/users/${username}" class="text-primary hover:opacity-80 active:opacity-60">${match}</a>`;
    });
    
    return formattedContent;
  };
  
  // Optimized for mobile touch and tap targets
  return (
    <div className="border-b  border/10 px-2 py-3 bg-background active:bg-secondary/5 transition-colors duration-150">
      <div className="flex gap-3">
        <Link href={`/users/${post.authorId}`}>
          <Avatar className="h-10 w-10 cursor-pointer border  border/20">
            {post.author?.avatarUrl ? (
              <AvatarImage src={post.author.avatarUrl} alt={post.author.displayName || "User"} />
            ) : (
              <AvatarFallback>{getInitials(post.author?.displayName || "User")}</AvatarFallback>
            )}
          </Avatar>
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center">
                <Link href={`/users/${post.authorId}`}>
                  <span className="text-sm font-semibold cursor-pointer truncate max-w-[120px]">
                    {post.author?.displayName || "User"}
                  </span>
                </Link>
                <span className="text-xs text-muted-foreground ml-1.5">
                  @{post.author?.username || "user"}
                </span>
              </div>
              <span className="text-xs text-muted-foreground -mt-0.5">
                {formatDate(post.createdAt as Date)}
              </span>
            </div>

            {/* Mobile dropdown menu */}
            <div className="-mr-2 -mt-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full text-muted-foreground"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                    <span className="sr-only">Post options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleShare}>
                    Share post
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigator.clipboard.writeText(`${window.location.origin}${postUrl}`)}>
                    Copy link
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
          </div>
          
          {post.parentId && !isDetailView && (
            <div className="text-xs text-muted-foreground mb-1">
              Replying to a post
            </div>
          )}
          
          <Link href={postUrl}>
            <div 
              className="mt-1.5 text-sm text-foreground whitespace-pre-wrap break-words leading-5"
              dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
            ></div>
          </Link>
          
          {post.imageUrl && !imageError && (
            <div className="mt-3 relative overflow-hidden rounded-lg">
              {!imageLoaded && (
                <div className="bg-muted animate-pulse rounded-lg w-full h-40 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Loading image...</span>
                </div>
              )}
              <Link href={postUrl}>
                <img 
                  ref={imageRef}
                  src={post.imageUrl} 
                  alt="Post attachment" 
                  className={`rounded-lg w-full object-cover border  border/10 ${imageLoaded ? 'block' : 'hidden'}`}
                  loading="lazy"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  style={{ maxHeight: '250px' }}
                />
              </Link>
            </div>
          )}
          
          {/* Mobile-optimized controls with larger touch targets */}
          {showControls && (
            <div className="flex justify-between mt-3 w-full max-w-full px-2">
              <Link href={`/microblogs/${post.id}`}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground h-9 rounded-full px-3 hover:bg-secondary/30"
                >
                  <MessageCircle className="h-4 w-4 mr-1.5" />
                  <span className="text-xs">{post.replyCount || 0}</span>
                </Button>
              </Link>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground h-9 rounded-full px-3 hover:bg-emerald-50/30 hover:text-emerald-600"
                disabled={!isAuthenticated}
              >
                <Repeat className="h-4 w-4 mr-1.5" />
                <span className="text-xs">{post.repostCount || 0}</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLikeToggle}
                className={`h-9 rounded-full px-3 hover:bg-pink-50/30 
                  ${post.isLiked ? "text-pink-500" : "text-muted-foreground hover:text-pink-500"}`}
                disabled={toggleLikeMutation.isPending}
              >
                <Heart className={`h-4 w-4 mr-1.5 transition-colors duration-200 ${post.isLiked ? "fill-pink-500" : ""}`} />
                <span className="text-xs">{post.likeCount || 0}</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground h-9 rounded-full px-3 hover:bg-blue-50/30 hover:text-blue-500" 
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {isSharing && (
        <Sheet onOpenChange={(open) => !open && setIsSharing(false)}>
          <SheetTrigger asChild>
            <div className="hidden">
              {/* This is just to make the sheet open automatically - we need the trigger for accessibility */}
              <button>Share</button>
            </div>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-xl">
            <div className="pt-2 pb-6">
              <h4 className="text-base font-medium mb-3 text-center">Share this post</h4>
              <div className="w-full">
                <ShareButtons 
                  url={`${window.location.origin}${postUrl}`} 
                  title={`${post.author?.displayName || "User"}: ${post.content.substring(0, 30)}...`} 
                  large={true}
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}