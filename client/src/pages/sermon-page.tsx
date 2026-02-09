/**
 * Sermon Page - Public sermon playback page
 * Displays sermon video with JW Player and sermon details
 */

import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HLSPlayerFallback } from "@/components/video/JWPlayerWrapper";
import { formatDuration, formatDateForDisplay } from "@/lib/utils";
import {
  ArrowLeft,
  Video,
  User,
  Calendar,
  Clock,
  Bookmark,
} from "lucide-react";

interface PlaybackData {
  sermon: {
    id: number;
    title: string;
    description?: string | null;
    speaker?: string | null;
    sermonDate?: string | null;
    series?: string | null;
    thumbnailUrl?: string | null;
    duration?: number | null;
  };
  playback: {
    hlsUrl: string;
    posterUrl?: string | null;
  };
  ads: {
    enabled: boolean;
    tagUrl?: string | null;
  };
}

export default function SermonPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const sermonId = parseInt(id || "0", 10);

  const { data, isLoading, error } = useQuery<PlaybackData>({
    queryKey: ["/api/sermons", sermonId, "playback"],
    queryFn: async () => {
      const response = await fetch(`/api/sermons/${sermonId}/playback`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Sermon not found or not available");
        }
        throw new Error("Failed to load sermon");
      }
      return response.json();
    },
    enabled: !!sermonId,
  });

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <Button variant="ghost" size="sm" className="mb-4" disabled>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Skeleton className="w-full aspect-video mb-6 rounded-lg" />
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-4" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container max-w-4xl py-8">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-bold mb-2">Sermon Not Available</h2>
              <p className="text-muted-foreground mb-4">
                {error instanceof Error ? error.message : "This sermon is not available for playback."}
              </p>
              <Button onClick={() => navigate(-1)}>Go Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { sermon, ads } = data;

  return (
    <div className="container max-w-4xl py-8">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      {/* Video Player */}
      <div className="mb-6">
        <HLSPlayerFallback sermonId={sermonId} className="w-full" />
      </div>

      {/* Sermon Info */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">{sermon.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {sermon.speaker && (
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{sermon.speaker}</span>
              </div>
            )}
            {sermon.sermonDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDateForDisplay(sermon.sermonDate)}</span>
              </div>
            )}
            {sermon.duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(sermon.duration)}</span>
              </div>
            )}
            {sermon.series && (
              <div className="flex items-center gap-1">
                <Bookmark className="h-4 w-4" />
                <span>Series: {sermon.series}</span>
              </div>
            )}
          </div>
        </div>

        {sermon.description && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About This Message</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {sermon.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Sponsored notice for ads */}
        {ads.enabled && (
          <p className="text-xs text-muted-foreground">
            This content may include advertisements.
          </p>
        )}
      </div>
    </div>
  );
}
