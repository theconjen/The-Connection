/**
 * Public Apologetics Preview Page
 * Route: /a/:slugOrId
 *
 * Shows a public preview of an apologetics article without requiring login.
 * Includes CTAs to open in app or download the app.
 */

import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  CheckCircle,
  ExternalLink,
  Share2,
  Loader2,
  AlertCircle
} from "lucide-react";
import { OpenInAppBanner, openInApp, getStoreUrl } from "@/components/OpenInAppBanner";

interface ApologeticsPreview {
  id: number;
  slug: string;
  title: string;
  quickAnswer: string;
  keyPointsPreview: string[];
  keyPointsTotal: number;
  sourcesCount: number;
  hasVerifiedSources: boolean;
  category: string;
  authorDisplayName: string;
  updatedAt: string;
  ogImageUrl: string | null;
  shareUrl: string;
}

export default function ApologeticsPreviewPage() {
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const [, navigate] = useLocation();
  const [preview, setPreview] = useState<ApologeticsPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPreview() {
      try {
        setLoading(true);
        const response = await fetch(`/api/public/apologetics/${slugOrId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Article not found");
          } else {
            setError("Failed to load article");
          }
          return;
        }
        const data = await response.json();
        setPreview(data);

        // Update page title
        document.title = `${data.title} | The Connection`;
      } catch (err) {
        setError("Failed to load article");
      } finally {
        setLoading(false);
      }
    }

    if (slugOrId) {
      fetchPreview();
    }
  }, [slugOrId]);

  const handleOpenInApp = () => {
    openInApp(`/apologetics/${preview?.id || slugOrId}`);
  };

  const handleGetApp = () => {
    window.open(getStoreUrl(), '_blank');
  };

  const handleShare = async () => {
    if (navigator.share && preview) {
      try {
        await navigator.share({
          title: preview.title,
          text: preview.quickAnswer.substring(0, 100) + "...",
          url: preview.shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    }
  };

  const handleReadMore = () => {
    navigate(`/apologetics/${preview?.id || slugOrId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading article...</p>
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
            <h2 className="text-xl font-semibold mb-2">Article Not Found</h2>
            <p className="text-muted-foreground mb-6">
              This article may have been removed or the link is incorrect.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={handleOpenInApp} className="gap-2">
                <BookOpen className="h-4 w-4" />
                Browse Apologetics in App
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
            deepLinkPath={`/apologetics/${preview.id}`}
            title="Read the Full Article"
            description="Get all key points and verified sources in the app"
          />
        </div>
      </div>

      {/* Article Preview */}
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <article>
          {/* Category Badge */}
          <div className="mb-4">
            <Badge variant="secondary" className="text-sm">
              {preview.category || "Apologetics"}
            </Badge>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            {preview.title}
          </h1>

          {/* Author & Date */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <span>By {preview.authorDisplayName}</span>
            <span>•</span>
            <span>
              Updated {new Date(preview.updatedAt).toLocaleDateString()}
            </span>
          </div>

          <Separator className="mb-6" />

          {/* Quick Answer */}
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Quick Answer
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">
                {preview.quickAnswer}
              </p>
            </CardContent>
          </Card>

          {/* Key Points Preview */}
          {preview.keyPointsPreview.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Key Points</h2>
              <ul className="space-y-3">
                {preview.keyPointsPreview.map((point, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{point}</span>
                  </li>
                ))}
              </ul>

              {preview.keyPointsTotal > preview.keyPointsPreview.length && (
                <p className="mt-4 text-sm text-muted-foreground">
                  + {preview.keyPointsTotal - preview.keyPointsPreview.length} more key points in the full article
                </p>
              )}
            </div>
          )}

          {/* Sources */}
          {preview.hasVerifiedSources && (
            <Card className="mb-8">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-muted-foreground">
                    {preview.sourcesCount} verified source{preview.sourcesCount !== 1 ? 's' : ''} cited
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* CTA Section */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold mb-2">
                Continue Reading
              </h3>
              <p className="text-muted-foreground mb-6">
                Access the complete article with all key points, Scripture references,
                and verified sources in The Connection app.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleOpenInApp} size="lg" className="gap-2 flex-1">
                  <ExternalLink className="h-4 w-4" />
                  Open in App
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleReadMore}
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
                  Share This Article
                </Button>
              )}
            </CardContent>
          </Card>
        </article>
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
