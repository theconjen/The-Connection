/**
 * Public Post Preview Page
 * Route: /p/:postId
 *
 * Shows a public preview of a post without requiring login.
 * Includes CTAs to open in app or download the app.
 */

import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Heart,
  MessageCircle,
  ExternalLink,
  Share2,
  Loader2,
  AlertCircle,
  FileText
} from "lucide-react";
import { OpenInAppBanner, openInApp, getStoreUrl } from "@/components/OpenInAppBanner";
import { formatDistanceToNow, parseISO } from "date-fns";

interface PostPreview {
  id: number;
  title: string;
  contentPreview: string;
  fullContent: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  imageUrl: string | null;
  shareUrl: string;
}

export default function PostPreviewPage() {
  const { postId } = useParams<{ postId: string }>();
  const [, navigate] = useLocation();
  const [preview, setPreview] = useState<PostPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPreview() {
      try {
        setLoading(true);
        const response = await fetch(`/api/public/posts/${postId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Post not found");
          } else {
            setError("Failed to load post");
          }
          return;
        }
        const data = await response.json();
        setPreview(data);

        // Update page title
        const title = data.title || `Post by ${data.authorName}`;
        document.title = `${title} | The Connection`;
      } catch (err) {
        setError("Failed to load post");
      } finally {
        setLoading(false);
      }
    }

    if (postId) {
      fetchPreview();
    }
  }, [postId]);

  const handleOpenInApp = () => {
    openInApp(`/posts/${postId}`);
  };

  const handleGetApp = () => {
    window.open(getStoreUrl(), '_blank');
  };

  const handleShare = async () => {
    if (navigator.share && preview) {
      try {
        await navigator.share({
          title: preview.title || `Post by ${preview.authorName}`,
          text: preview.contentPreview,
          url: preview.shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    }
  };

  const handleViewOnWeb = () => {
    navigate(`/posts/${postId}`);
  };

  const handleViewProfile = () => {
    if (preview?.authorUsername) {
      openInApp(`/profile/${preview.authorUsername}`);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Post Not Found</h2>
            <p className="text-muted-foreground mb-6">
              This post may have been deleted or the link is incorrect.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => openInApp('/posts')} className="gap-2">
                <FileText className="h-4 w-4" />
                Browse Posts in App
              </Button>
              <Button variant="outline" onClick={handleGetApp} className="gap-2">
                Get The Connection App
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Open in App Banner */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-3xl mx-auto px-4 py-3">
          <OpenInAppBanner
            deepLinkPath={`/posts/${preview.id}`}
            title="View Full Post"
            description="Like, comment, and engage with the community"
          />
        </div>
      </div>

      {/* Post Content */}
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            {/* Author Info */}
            <div className="flex items-center gap-3 mb-4">
              <button onClick={handleViewProfile} className="flex-shrink-0">
                <Avatar className="h-12 w-12 border-2 border-primary/10">
                  <AvatarImage src={preview.authorAvatar || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {getInitials(preview.authorName)}
                  </AvatarFallback>
                </Avatar>
              </button>
              <div className="flex-1 min-w-0">
                <button
                  onClick={handleViewProfile}
                  className="font-semibold text-foreground hover:underline text-left block"
                >
                  {preview.authorName}
                </button>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {preview.authorUsername && (
                    <>
                      <span>@{preview.authorUsername}</span>
                      <span>•</span>
                    </>
                  )}
                  <span>{formatTimeAgo(preview.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Title */}
            {preview.title && (
              <h1 className="text-2xl font-bold mb-4 text-foreground">
                {preview.title}
              </h1>
            )}

            {/* Post Image */}
            {preview.imageUrl && (
              <div className="mb-4 rounded-lg overflow-hidden bg-muted">
                <img
                  src={preview.imageUrl}
                  alt=""
                  className="w-full object-cover max-h-[500px]"
                />
              </div>
            )}

            {/* Content */}
            <div className="prose prose-sm max-w-none text-foreground mb-6">
              <p className="whitespace-pre-wrap">{preview.fullContent}</p>
            </div>

            <Separator className="mb-4" />

            {/* Engagement Stats */}
            <div className="flex items-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                <span>{preview.likeCount} likes</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <span>{preview.commentCount} comments</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="mt-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <h3 className="text-xl font-semibold mb-2">
              Join the Conversation
            </h3>
            <p className="text-muted-foreground mb-6">
              Like this post, leave a comment, and connect with the author
              and community in The Connection app.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleOpenInApp} size="lg" className="gap-2 flex-1">
                <ExternalLink className="h-4 w-4" />
                Open in App
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleViewOnWeb}
                className="gap-2 flex-1"
              >
                Continue on Web
              </Button>
            </div>

            {/* Share Button */}
            {navigator.share && (
              <Button
                variant="ghost"
                onClick={handleShare}
                className="w-full mt-4 gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share This Post
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 mt-12">
        <div className="container max-w-3xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            The Connection - A Christian Community Platform
          </p>
          <Button variant="outline" size="sm" onClick={handleGetApp}>
            Download the App
          </Button>
        </div>
      </footer>
    </div>
  );
}
