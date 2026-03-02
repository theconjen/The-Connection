/**
 * Public Event Preview Page
 * Route: /e/:eventId
 *
 * Shows a public preview of an event without requiring login.
 * Includes CTAs to open in app, RSVP, or download the app.
 */

import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Video,
  ExternalLink,
  Share2,
  Loader2,
  AlertCircle
} from "lucide-react";
import { OpenInAppBanner, openInApp, getStoreUrl } from "@/components/OpenInAppBanner";
import { JsonLd } from "@/components/seo/json-ld";
import { format, parseISO } from "date-fns";

interface EventPreview {
  id: number;
  title: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  startsAt: string;
  endsAt: string;
  locationDisplay: string;
  city: string;
  state: string;
  isVirtual: boolean;
  isOnline: boolean;
  hostName: string;
  category: string;
  imageUrl: string | null;
  showAddress: boolean;
  address: string | null;
  shareUrl: string;
}

export default function EventPreviewPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [preview, setPreview] = useState<EventPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPreview() {
      try {
        setLoading(true);
        const response = await fetch(`/api/public/events/${eventId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Event not found");
          } else {
            setError("Failed to load event");
          }
          return;
        }
        const data = await response.json();
        setPreview(data);

        // Update page title
        document.title = `${data.title} | The Connection`;
      } catch (err) {
        setError("Failed to load event");
      } finally {
        setLoading(false);
      }
    }

    if (eventId) {
      fetchPreview();
    }
  }, [eventId]);

  const handleOpenInApp = () => {
    openInApp(`/events/${eventId}`);
  };

  const handleGetApp = () => {
    window.open(getStoreUrl(), '_blank');
  };

  const handleRSVP = () => {
    // Deep link to app's RSVP flow
    openInApp(`/events/${eventId}/rsvp`);
  };

  const handleShare = async () => {
    if (navigator.share && preview) {
      try {
        await navigator.share({
          title: preview.title,
          text: `Join me at ${preview.title}`,
          url: preview.shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    }
  };

  const formatEventDate = () => {
    if (!preview) return "";
    try {
      if (preview.eventDate) {
        const date = parseISO(preview.eventDate);
        return format(date, "EEEE, MMMM d, yyyy");
      }
      if (preview.startsAt) {
        const date = parseISO(preview.startsAt);
        return format(date, "EEEE, MMMM d, yyyy");
      }
    } catch {
      return preview.eventDate || "";
    }
    return "";
  };

  const formatEventTime = () => {
    if (!preview) return "";
    try {
      if (preview.startTime && preview.endTime) {
        return `${preview.startTime} - ${preview.endTime}`;
      }
      if (preview.startsAt) {
        const start = parseISO(preview.startsAt);
        const startStr = format(start, "h:mm a");
        if (preview.endsAt) {
          const end = parseISO(preview.endsAt);
          return `${startStr} - ${format(end, "h:mm a")}`;
        }
        return startStr;
      }
    } catch {
      return preview.startTime || "";
    }
    return "";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading event...</p>
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
            <h2 className="text-xl font-semibold mb-2">Event Not Found</h2>
            <p className="text-muted-foreground mb-6">
              This event may have been cancelled or the link is incorrect.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => openInApp('/events')} className="gap-2">
                <Calendar className="h-4 w-4" />
                Browse Events in App
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

  const isOnline = preview.isVirtual || preview.isOnline;

  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: preview.title,
    description: preview.description || undefined,
    startDate: preview.startsAt || preview.eventDate,
    ...(preview.endsAt && { endDate: preview.endsAt }),
    ...(preview.imageUrl && { image: preview.imageUrl }),
    eventAttendanceMode: isOnline
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: isOnline
      ? { "@type": "VirtualLocation", url: preview.shareUrl }
      : {
          "@type": "Place",
          name: preview.locationDisplay || "TBD",
          address: {
            "@type": "PostalAddress",
            ...(preview.address && { streetAddress: preview.address }),
            ...(preview.city && { addressLocality: preview.city }),
            ...(preview.state && { addressRegion: preview.state }),
          },
        },
    organizer: {
      "@type": "Person",
      name: preview.hostName,
    },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Event JSON-LD */}
      <JsonLd data={eventJsonLd} />

      {/* Open in App Banner */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-3xl mx-auto px-4 py-3">
          <OpenInAppBanner
            deepLinkPath={`/events/${preview.id}`}
            title="RSVP to This Event"
            description="Join the event and connect with other attendees"
          />
        </div>
      </div>

      {/* Event Content */}
      <div className="container max-w-3xl mx-auto px-4 py-8">
        {/* Event Image */}
        {preview.imageUrl && (
          <div className="mb-6 rounded-xl overflow-hidden aspect-video bg-muted">
            <img
              src={preview.imageUrl}
              alt={preview.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Category & Type Badges */}
        <div className="flex gap-2 mb-4">
          {preview.category && (
            <Badge variant="secondary">{preview.category}</Badge>
          )}
          {isOnline && (
            <Badge variant="outline" className="gap-1">
              <Video className="h-3 w-3" />
              Online Event
            </Badge>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
          {preview.title}
        </h1>

        {/* Host */}
        <div className="flex items-center gap-2 text-muted-foreground mb-6">
          <User className="h-4 w-4" />
          <span>Hosted by {preview.hostName}</span>
        </div>

        <Separator className="mb-6" />

        {/* Event Details */}
        <div className="grid gap-6 mb-8">
          {/* Date & Time */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {formatEventDate()}
                  </h3>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatEventTime()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  {isOnline ? (
                    <Video className="h-6 w-6 text-primary" />
                  ) : (
                    <MapPin className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {isOnline ? "Online Event" : preview.locationDisplay || "Location TBD"}
                  </h3>
                  {preview.showAddress && preview.address && (
                    <p className="text-muted-foreground text-sm mt-1">
                      {preview.address}
                    </p>
                  )}
                  {!isOnline && !preview.showAddress && (
                    <p className="text-muted-foreground text-sm mt-1">
                      Full address available after RSVP
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        {preview.description && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">About This Event</h2>
            <div className="prose prose-sm max-w-none text-foreground">
              <p className="whitespace-pre-wrap">{preview.description}</p>
            </div>
          </div>
        )}

        {/* CTA Section */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Join This Event</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              RSVP to get event updates, connect with other attendees,
              and receive the full event details including location.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleRSVP} size="lg" className="gap-2 flex-1">
                <ExternalLink className="h-4 w-4" />
                RSVP in App
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
                Share This Event
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
