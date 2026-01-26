/**
 * Public Profile Preview Page
 * Route: /u/:username
 *
 * Shows a public preview of a user's profile without requiring login.
 * Includes CTAs to open in app, follow, or download the app.
 */

import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Users,
  FileText,
  MapPin,
  Church,
  Lock,
  ExternalLink,
  Share2,
  Loader2,
  AlertCircle,
  UserPlus
} from "lucide-react";
import { OpenInAppBanner, openInApp, getStoreUrl } from "@/components/OpenInAppBanner";
import { formatDistanceToNow, parseISO } from "date-fns";

interface ProfilePreview {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  isPrivate: boolean;
  churchName: string | null;
  locationDisplay: string | null;
  denomination: string | null;
  counts: {
    posts: number;
    followers: number;
    following: number;
  };
  recentPublicPosts: Array<{
    id: number;
    title: string;
    contentPreview: string;
    createdAt: string;
  }>;
  shareUrl: string;
}

export default function ProfilePreviewPage() {
  const { username } = useParams<{ username: string }>();
  const [preview, setPreview] = useState<ProfilePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPreview() {
      try {
        setLoading(true);
        const response = await fetch(`/api/public/users/${username}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("User not found");
          } else {
            setError("Failed to load profile");
          }
          return;
        }
        const data = await response.json();
        setPreview(data);

        // Update page title
        document.title = `${data.displayName} (@${data.username}) | The Connection`;
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    if (username) {
      fetchPreview();
    }
  }, [username]);

  const handleOpenInApp = () => {
    openInApp(`/profile/${username}`);
  };

  const handleGetApp = () => {
    window.open(getStoreUrl(), '_blank');
  };

  const handleFollow = () => {
    // Deep link to app to follow
    openInApp(`/profile/${username}?action=follow`);
  };

  const handleShare = async () => {
    if (navigator.share && preview) {
      try {
        await navigator.share({
          title: `${preview.displayName} on The Connection`,
          text: preview.bio || `Check out ${preview.displayName}'s profile`,
          url: preview.shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    }
  };

  const handleViewPost = (postId: number) => {
    openInApp(`/posts/${postId}`);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "";
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + "M";
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + "K";
    }
    return count.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading profile...</p>
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
            <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
            <p className="text-muted-foreground mb-6">
              This user may have deactivated their account or the link is incorrect.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => openInApp('/')} className="gap-2">
                <User className="h-4 w-4" />
                Browse The Connection
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
            deepLinkPath={`/profile/${preview.username}`}
            title={`Connect with ${preview.displayName}`}
            description="Follow and message them in the app"
          />
        </div>
      </div>

      {/* Profile Content */}
      <div className="container max-w-3xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <Avatar className="h-24 w-24 border-4 border-primary/10">
                <AvatarImage src={preview.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                  {getInitials(preview.displayName)}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold text-foreground">
                    {preview.displayName}
                  </h1>
                  {preview.isPrivate && (
                    <Badge variant="secondary" className="gap-1 w-fit mx-auto sm:mx-0">
                      <Lock className="h-3 w-3" />
                      Private
                    </Badge>
                  )}
                </div>

                <p className="text-muted-foreground mb-3">
                  @{preview.username}
                </p>

                {/* Stats */}
                <div className="flex justify-center sm:justify-start gap-6 text-sm mb-4">
                  <div className="text-center">
                    <span className="font-semibold text-foreground">
                      {formatCount(preview.counts.posts)}
                    </span>
                    <span className="text-muted-foreground ml-1">posts</span>
                  </div>
                  <div className="text-center">
                    <span className="font-semibold text-foreground">
                      {formatCount(preview.counts.followers)}
                    </span>
                    <span className="text-muted-foreground ml-1">followers</span>
                  </div>
                  <div className="text-center">
                    <span className="font-semibold text-foreground">
                      {formatCount(preview.counts.following)}
                    </span>
                    <span className="text-muted-foreground ml-1">following</span>
                  </div>
                </div>

                {/* Bio */}
                {!preview.isPrivate && preview.bio && (
                  <p className="text-foreground mb-4">{preview.bio}</p>
                )}

                {/* Location & Church */}
                {!preview.isPrivate && (
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {preview.locationDisplay && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {preview.locationDisplay}
                      </span>
                    )}
                    {preview.churchName && (
                      <span className="flex items-center gap-1">
                        <Church className="h-4 w-4" />
                        {preview.churchName}
                      </span>
                    )}
                    {preview.denomination && (
                      <Badge variant="outline">{preview.denomination}</Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Follow CTA */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button onClick={handleFollow} className="gap-2 flex-1">
                <UserPlus className="h-4 w-4" />
                Follow in App
              </Button>
              <Button variant="outline" onClick={handleOpenInApp} className="gap-2 flex-1">
                <ExternalLink className="h-4 w-4" />
                View Full Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Posts */}
        {!preview.isPrivate && preview.recentPublicPosts.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Recent Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {preview.recentPublicPosts.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => handleViewPost(post.id)}
                    className="w-full text-left p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    {post.title && (
                      <h4 className="font-semibold text-foreground mb-1">
                        {post.title}
                      </h4>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.contentPreview}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatTimeAgo(post.createdAt)}
                    </p>
                  </button>
                ))}
              </div>

              {preview.counts.posts > preview.recentPublicPosts.length && (
                <Button
                  variant="ghost"
                  onClick={handleOpenInApp}
                  className="w-full mt-4 text-primary"
                >
                  View all {preview.counts.posts} posts in app
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Private Profile Message */}
        {preview.isPrivate && (
          <Card className="mb-6">
            <CardContent className="pt-6 text-center">
              <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">This Account is Private</h3>
              <p className="text-muted-foreground mb-4">
                Follow {preview.displayName} to see their posts and activity.
              </p>
              <Button onClick={handleFollow} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Request to Follow
              </Button>
            </CardContent>
          </Card>
        )}

        {/* CTA Section */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <h3 className="text-xl font-semibold mb-2">
              Connect with {preview.displayName}
            </h3>
            <p className="text-muted-foreground mb-6">
              Follow, message, and engage with {preview.displayName} and
              thousands of other Christians in The Connection app.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleOpenInApp} size="lg" className="gap-2 flex-1">
                <ExternalLink className="h-4 w-4" />
                Open in App
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleGetApp}
                className="gap-2 flex-1"
              >
                Get the App
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
                Share Profile
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
