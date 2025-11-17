import { useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";
import { Post, User, Community } from "@connection/shared/schema";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import ShareButtons from "./share-buttons";
import { BookmarkIcon, MessageSquare, ArrowUpIcon, Share2 } from "lucide-react";
import { Button } from "./ui/button";
import { ContentActions } from './moderation/ContentActions';

interface PostCardProps {
  post: Post & {
    author?: User;
    community?: Community;
  };
  featured?: boolean;
}

export default function PostCard({ post, featured = false }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const qc = queryClient;
  
  const upvoteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/posts/${post.id}/upvote`);
      return await res.json();
    },
    onSuccess: (updatedPost) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      if (post.communityId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/posts", { community: post.community?.slug }] 
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Could not upvote the post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpvote = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upvote posts.",
        variant: "default",
      });
      return;
    }
    
    upvoteMutation.mutate();
  };

  const getCommunityIcon = (iconName: string, iconColor: string) => {
    let icon;
    let colorClass = '';
    
    switch (iconColor) {
      case 'primary':
        colorClass = 'bg-primary/10 text-primary';
        break;
      case 'secondary':
        colorClass = 'bg-secondary/20 text-secondary-foreground';
        break;
      case 'accent':
        colorClass = 'bg-accent/20 text-accent-foreground';
        break;
      case 'red':
        colorClass = 'bg-destructive/10 text-destructive';
        break;
      default:
        colorClass = 'bg-muted text-muted-foreground';
    }
    
    switch (iconName) {
      case 'pray':
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
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
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
        );
        break;
      case 'church':
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
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
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        );
        break;
      default:
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
    }
    
    return (
      <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center`}>
        {icon}
      </div>
    );
  };

  const formatTimeSince = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return format(date, 'MMM d, yyyy');
  };

  return (
    <Card className={`mb-6 ${featured ? 'overflow-hidden' : ''} card-hover border-secondary/20 shadow-sm`}>
      {featured && post.imageUrl && (
        <div className="w-full h-56 overflow-hidden">
          <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}
      
      <CardContent className={`${featured ? 'p-6' : 'p-6'}`}>
        <div className="flex items-center mb-4">
          <div className="ml-auto">
            <ContentActions
              contentId={post.id}
              contentType="post"
              authorId={post.author?.id || 0}
              authorName={post.author?.username || 'unknown'}
              currentUserId={user?.id}
              onBlockStatusChange={(userId, isBlocked) => {
                // Invalidate queries so blocked user's content disappears
                qc.invalidateQueries();
                toast({ title: isBlocked ? 'User blocked' : 'User unblocked', description: isBlocked ? 'This user is now blocked.' : 'User unblocked.' });
              }}
            />
          </div>
          {post.community && (
            <>
              {getCommunityIcon(post.community.iconName, post.community.iconColor)}
              <div className="ml-3">
                <Link href={`/community/${post.community.slug}`} 
                  className="font-medium text-foreground hover:text-primary transition-colors"
                >
                  <span className="inline-flex items-center">
                    r/{post.community.slug}
                    {featured && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary/40 text-secondary-foreground">
                        Featured
                      </span>
                    )}
                  </span>
                </Link>
                <div className="text-xs text-muted-foreground">
                  Posted by{' '}
                  <Link href={`/user/${post.author?.username || 'anonymous'}`} 
                    className="hover:text-primary transition-colors"
                  >
                    u/{post.author?.username || 'anonymous'}
                  </Link>
                  {' • '}
                  {post.createdAt ? formatTimeSince(new Date(post.createdAt)) : 'recently'}
                </div>
              </div>
            </>
          )}
        </div>
        
        <Link href={`/posts/${post.id}`}>
          <h2 className="text-xl font-semibold mb-3 hover:text-primary transition-colors group">
            {post.title}
            <span className="inline-block w-0 group-hover:w-full h-0.5 bg-primary/30 transition-all duration-300 mt-0.5"></span>
          </h2>
        </Link>
        
        <div className="text-foreground/90 mb-6">
          {post.content.length > 300 ? (
            <>
              <p>{post.content.substring(0, 300)}...</p>
              <Link href={`/posts/${post.id}`} 
                className="text-primary hover:text-primary/80 mt-2 inline-flex items-center gap-1 font-medium"
              >
                Read more
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </Link>
            </>
          ) : (
            <p>{post.content}</p>
          )}
          
          {!featured && post.imageUrl && (
            <div className="mt-4">
              <img src={post.imageUrl} alt={post.title} className="rounded-lg max-h-96 object-cover shadow-sm" />
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4 text-sm border-t border-secondary/10 pt-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors rounded-full"
            onClick={handleUpvote}
          >
            <ArrowUpIcon className="mr-1 h-4 w-4" />
            <span>{post.upvotes}</span>
          </Button>
          
          <Link href={`/posts/${post.id}`}>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors rounded-full"
            >
              <MessageSquare className="mr-1 h-4 w-4" />
              <span>{post.commentCount} comments</span>
            </Button>
          </Link>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors rounded-full"
            onClick={() => setIsShareOpen(!isShareOpen)}
          >
            <Share2 className="mr-1 h-4 w-4" />
            <span>Share</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors rounded-full"
          >
            <BookmarkIcon className="mr-1 h-4 w-4" />
            <span>Save</span>
          </Button>
        </div>
        
        {isShareOpen && (
          <div className="mt-4 p-4 border border-secondary/20 rounded-lg bg-secondary/5">
            <h3 className="text-sm font-medium mb-3 text-foreground">Share this post:</h3>
            <ShareButtons url={`/posts/${post.id}`} title={post.title} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
