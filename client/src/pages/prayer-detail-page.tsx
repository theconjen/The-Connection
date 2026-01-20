/**
 * Prayer Request Detail Page
 *
 * Shell page for viewing prayer request details.
 * Full functionality is available in the mobile app.
 */

import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Heart, Loader2 } from "lucide-react";
import AppShellPage from "../components/app-shell-page";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";

interface PrayerRequest {
  id: number;
  content: string;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  prayerCount?: number;
}

export default function PrayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [prayer, setPrayer] = useState<PrayerRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrayer() {
      try {
        const response = await fetch(`/api/prayer-requests/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Prayer request not found");
          } else {
            setError("Failed to load prayer request");
          }
          return;
        }
        const data = await response.json();
        setPrayer(data);
      } catch (err) {
        setError("Failed to load prayer request");
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      fetchPrayer();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !prayer) {
    return (
      <AppShellPage
        title="Prayer Request"
        description={error || "This prayer request could not be found."}
        deepLinkPath={`prayers/${id}`}
        icon={<Heart className="h-8 w-8 text-primary" />}
      />
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate("/prayer-requests")}
      >
        &larr; Back to Prayer Requests
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={prayer.user?.avatarUrl} />
              <AvatarFallback>
                {prayer.user?.displayName?.[0] || prayer.user?.username?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">
                {prayer.user?.displayName || prayer.user?.username || "Anonymous"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {new Date(prayer.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-foreground whitespace-pre-wrap">{prayer.content}</p>

          {prayer.prayerCount !== undefined && (
            <div className="mt-4 pt-4 border-t flex items-center gap-2 text-muted-foreground">
              <Heart className="h-4 w-4" />
              <span>{prayer.prayerCount} people praying</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <p className="text-muted-foreground mb-3">
          Want to pray for this request? Get the full experience in the app.
        </p>
        <Button
          onClick={() => {
            window.location.href = `theconnection://prayers/${id}`;
          }}
        >
          Open in App
        </Button>
      </div>
    </div>
  );
}
