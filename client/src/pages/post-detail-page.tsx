import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import MainLayout from "../components/layouts/main-layout";
import { Post, User, Community, Comment, InsertComment, insertCommentSchema } from "@connection/shared/schema";
import { useAuth } from "../hooks/use-auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Skeleton } from "../components/ui/skeleton";
import ShareButtons from "../components/share-buttons";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { z } from "zod/v4";
import { format } from "date-fns";
import {
  ArrowUpIcon,
  MessageSquare,
  Share2,
  BookmarkIcon,
  Link2Icon,
  Loader2,
} from "lucide-react";

// Extend comment schema with validation
const commentFormSchema = insertCommentSchema.extend({
  content: z.string().min(1, "Comment cannot be empty"),
});

export default function PostDetailPage() {
  const [, params] = useRoute("/posts/:id");
  const p = params as any;
  const postId = parseInt(p?.id || "0");
  const { user } = useAuth();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  const [isShareOpen, setIsShareOpen] = useState(false);
  
  // Fetch post data
  const {
    data: post,
    isLoading: isLoadingPost,
  } = useQuery<Post & { author?: User; community?: Community }>({
    queryKey: [`/api/posts/${postId}`],
    enabled: postId > 0,
  });
  
  // Fetch comments
  const {
    data: comments,
    isLoading: isLoadingComments,
  } = useQuery<(Comment & { author?: User })[]>({
    queryKey: [`/api/posts/${postId}/comments`],
    enabled: postId > 0,
  });
  
  // Upvote mutation
  const upvoteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/posts/${postId}/upvote`);
      return await res.json();
    },
    onSuccess: (updatedPost) => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Could not upvote the post. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const data: InsertComment = {
        content,
        postId,
        authorId: user!.id,
      };
      
      const res = await apiRequest("POST", "/api/comments", data);
      return await res.json();
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/comments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}`] });
      toast({
        title: "Comment Added",
        description: "Your comment has been posted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Could not add your comment. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Upvote comment mutation
  const upvoteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const res = await apiRequest("POST", `/api/comments/${commentId}/upvote`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/comments`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Could not upvote the comment. Please try again.",
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
  
  const handleCommentSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add comments.",
        variant: "default",
      });
      return;
    }
    
    if (!commentText.trim()) {
      toast({
        title: "Empty Comment",
        description: "Please enter a comment before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    commentMutation.mutate(commentText);
  };
  
  const handleUpvoteComment = (commentId: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upvote comments.",
        variant: "default",
      });
      return;
    }
    
    upvoteCommentMutation.mutate(commentId);
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
      <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center mr-3`}>
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
  
  const getInitials = (username: string = "") => {
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <MainLayout>
      <div className="flex-1">
        {/* Post Detail */}
        {isLoadingPost ? (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Skeleton className="w-10 h-10 rounded-full mr-3" />
                <div>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-40 mt-1" />
                </div>
              </div>
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-full mb-1" />
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
        ) : post ? (
          <Card className="mb-6 overflow-hidden">
            {post.imageUrl && (
              <div className="w-full h-64 sm:h-80 md:h-96 overflow-hidden">
                <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
              </div>
            )}
            
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                {post.community && getCommunityIcon(post.community.iconName, post.community.iconColor)}
                <div>
                  <a href={`/community/${post.community?.slug}`} className="font-medium hover:text-primary">
                    r/{post.community?.slug}
                  </a>
                  <div className="text-xs text-neutral-500">
                    Posted by{' '}
                    <a href={`/user/${post.author?.username || 'anonymous'}`} className="hover:underline">
                      u/{post.author?.username || 'anonymous'}
                    </a>
                    {' • '}
                    {post.createdAt ? formatTimeSince(new Date(post.createdAt)) : 'recently'}
                  </div>
                </div>
              </div>
              
              <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
              
              <div className="text-neutral-700 mb-6 whitespace-pre-line">
                {post.content}
                
                {/* If content has a scripture quote, we can style it differently */}
                {post.content.includes('John 3:16') && (
                  <blockquote className="scripture border-l-4 border-accent-500 pl-4 py-2 my-4 italic text-neutral-700 bg-neutral-50">
                    "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life." - John 3:16
                  </blockquote>
                )}
              </div>
              
              <div className="flex items-center space-x-4 text-sm border-t pt-4 border-neutral-200">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center text-neutral-500 hover:text-primary"
                  onClick={handleUpvote}
                >
                  <ArrowUpIcon className="mr-1 h-4 w-4" />
                  <span>{post.upvotes}</span>
                </Button>
                
                <Button variant="ghost" size="sm" className="flex items-center text-neutral-500 hover:text-primary">
                  <MessageSquare className="mr-1 h-4 w-4" />
                  <span>{post.commentCount} comments</span>
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center text-neutral-500 hover:text-primary"
                  onClick={() => setIsShareOpen(!isShareOpen)}
                >
                  <Share2 className="mr-1 h-4 w-4" />
                  <span>Share</span>
                </Button>
                
                <Button variant="ghost" size="sm" className="flex items-center text-neutral-500 hover:text-primary">
                  <BookmarkIcon className="mr-1 h-4 w-4" />
                  <span>Save</span>
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center text-neutral-500 hover:text-primary ml-auto"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast({
                      title: "Link Copied",
                      description: "Post link copied to clipboard.",
                    });
                  }}
                >
                  <Link2Icon className="mr-1 h-4 w-4" />
                  <span>Copy Link</span>
                </Button>
              </div>
              
              {isShareOpen && (
                <div className="mt-4 p-4 border rounded-lg">
                  <h3 className="text-sm font-medium mb-3">Share this post:</h3>
                  <ShareButtons url={`/posts/${post.id}`} title={post.title} />
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6 p-8 text-center">
            <CardContent>
              <h1 className="text-xl font-medium mb-2">Post not found</h1>
              <p className="text-neutral-600">
                The post you're looking for doesn't exist or has been removed.
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Comment Form */}
        {post && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add a Comment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCommentSubmit}>
                <Textarea
                  placeholder={user ? "Share your thoughts..." : "Please sign in to comment"}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="mb-4"
                  disabled={!user || commentMutation.isPending}
                />
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={!user || !commentText.trim() || commentMutation.isPending}
                  >
                    {commentMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      "Post Comment"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        
        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle>Comments ({comments?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingComments ? (
              <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex space-x-4">
                    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : comments && comments.length > 0 ? (
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-4">
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarFallback className="bg-neutral-200 text-neutral-700">
                        {getInitials(comment.author?.username)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <span className="font-medium text-sm">
                          {comment.author?.username || "Anonymous"}
                        </span>
                        <span className="text-xs text-neutral-500 ml-2">
                          {comment.createdAt ? formatTimeSince(new Date(comment.createdAt)) : 'recently'}
                        </span>
                      </div>
                      
                      <p className="text-neutral-700 mb-2">{comment.content}</p>
                      
                      <div className="flex items-center space-x-4 text-xs">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-neutral-500 hover:text-primary"
                          onClick={() => handleUpvoteComment(comment.id)}
                        >
                          <ArrowUpIcon className="mr-1 h-3 w-3" />
                          <span>{comment.upvotes}</span>
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-neutral-500 hover:text-primary"
                        >
                          <MessageSquare className="mr-1 h-3 w-3" />
                          <span>Reply</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-neutral-600">No comments yet. Be the first to share your thoughts!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Right sidebar */}
      <aside className="hidden lg:block w-80 space-y-6 sticky top-24 self-start">
        {post?.community && (
          <Card>
            <CardHeader className="bg-neutral-50 border-b border-neutral-200">
              <CardTitle className="text-neutral-800">About r/{post.community.slug}</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-neutral-600 text-sm mb-4">
                {post.community.description}
              </p>
              <div className="flex items-center justify-between text-sm text-neutral-500">
                <div>
                  <span className="font-medium text-neutral-900">{post.community.memberCount}</span> members
                </div>
                <div>
                  {post.community.createdAt && (
                    <span>Created {format(new Date(post.community.createdAt), 'MMM yyyy')}</span>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-neutral-200 bg-neutral-50">
              <Button variant="outline" className="w-full">
                Join Community
              </Button>
            </CardFooter>
          </Card>
        )}
        
        <Card>
          <CardHeader className="bg-neutral-50 border-b border-neutral-200">
            <CardTitle className="text-neutral-800">Community Rules</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ul className="space-y-3 text-sm">
              <li className="flex items-start">
                <span className="font-medium mr-2">1.</span>
                <span>Be respectful and kind to others.</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium mr-2">2.</span>
                <span>No spam or self-promotion.</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium mr-2">3.</span>
                <span>Base discussions on Scripture when possible.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </aside>
    </MainLayout>
  );
}
