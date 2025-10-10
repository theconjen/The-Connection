import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { CalendarDays, MapPin, Clock, Users, ArrowLeft, Share2, Edit, Trash2, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { 
  FacebookShareButton, TwitterShareButton, WhatsappShareButton, EmailShareButton,
  FacebookIcon, TwitterIcon, WhatsappIcon, EmailIcon,
  LinkedinShareButton, LinkedinIcon
} from "react-share";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
} from "../components/ui/dialog";
import { format } from "date-fns";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useAuth } from "../hooks/use-auth";
import { Link, useLocation, useParams } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Separator } from "../components/ui/separator";
import type { Event, EventRsvp } from '@shared/mobile-web/types';

export default function EventDetailPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const eventId = parseInt(params.id);
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState("");

  // Get event details
  const { data: event, isLoading: isLoadingEvent } = useQuery({
    queryKey: [`/api/events/${eventId}`],
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Event not found");
        }
        throw new Error("Failed to fetch event");
      }
      return response.json();
    },
  });

  // Get RSVPs for the event
  const { data: rsvps = [], isLoading: isLoadingRsvps } = useQuery({
    queryKey: [`/api/events/${eventId}/rsvps`],
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}/rsvps`);
      if (!response.ok) throw new Error("Failed to fetch RSVPs");
      return response.json();
    },
    enabled: !!event,
  });

  // Get user's RSVP status if logged in
  const { data: userRsvp, isLoading: isLoadingUserRsvp } = useQuery({
    queryKey: [`/api/events/${eventId}/rsvp`],
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}/rsvp`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch your RSVP");
      }
      return response.json();
    },
    enabled: !!user && !!event,
  });

  // Update RSVP status when we get the user's RSVP
  useEffect(() => {
    if (userRsvp) {
      setRsvpStatus(userRsvp.status);
    }
  }, [userRsvp]);

  // Set share URL when component mounts
  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  // Create RSVP mutation
  const createRsvpMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest("POST", `/api/events/${eventId}/rsvp`, { status });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to RSVP");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "RSVP Successful",
        description: "Your RSVP has been recorded.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/rsvps`] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/rsvp`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to RSVP",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update RSVP mutation
  const updateRsvpMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest("PATCH", `/api/events/${eventId}/rsvp`, { status });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update RSVP");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "RSVP Updated",
        description: "Your RSVP has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/rsvps`] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/rsvp`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update RSVP",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/events/${eventId}`, {});
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete event");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Event Deleted",
        description: "The event has been successfully deleted.",
      });
      setLocation("/events");
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/public"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete event",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle RSVP action
  const handleRsvp = (status: string) => {
    setRsvpStatus(status);
    if (userRsvp) {
      updateRsvpMutation.mutate(status);
    } else {
      createRsvpMutation.mutate(status);
    }
  };

  // Handle share event
  const handleShare = () => {
    setIsShareDialogOpen(true);
  };
  
  // Handle copy link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copied",
        description: "Event link copied to clipboard",
      });
    } catch (error) {
      console.error("Error copying link:", error);
      toast({
        title: "Copy Failed",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "EEEE, MMMM d, yyyy");
    } catch (e) {
      return dateStr;
    }
  };

  if (isLoadingEvent) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-2/3 bg-primary/20 rounded"></div>
          <div className="h-4 w-1/3 bg-primary/20 rounded"></div>
          <div className="h-64 bg-primary/10 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
          <p className="text-muted-foreground mb-4">The event you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link href="/events">Back to Events</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Group RSVPs by status
  const going = rsvps.filter((rsvp: EventRsvp) => rsvp.status === "going");
  const maybe = rsvps.filter((rsvp: EventRsvp) => rsvp.status === "maybe");
  const notGoing = rsvps.filter((rsvp: EventRsvp) => rsvp.status === "not_going");

  const isCreator = user && event.creatorId === user.id;

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Button asChild variant="ghost" className="gap-2">
          <Link href="/events">
            <ArrowLeft size={16} />
            Back to Events
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="bg-primary/5 pb-2">
              <div className="flex justify-between">
                <div>
                  <CardTitle className="text-2xl">{event.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <CalendarDays size={14} />
                    {formatDate(event.eventDate)}
                  </CardDescription>
                </div>

                <div className="flex items-start gap-2">
                  <Button variant="ghost" size="icon" onClick={handleShare}>
                    <Share2 size={18} />
                  </Button>

                  {isCreator && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="5" r="1" />
                            <circle cx="12" cy="19" r="1" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/events/${event.id}/edit`} className="flex items-center gap-2 cursor-pointer">
                            <Edit size={14} />
                            Edit Event
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="flex items-center gap-2 text-destructive cursor-pointer"
                          onClick={() => setIsDeleteAlertOpen(true)}
                        >
                          <Trash2 size={14} />
                          Delete Event
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-start gap-2">
                      <Clock size={18} className="text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">Time</div>
                        <div>{event.startTime} - {event.endTime}</div>
                      </div>
                    </div>

                    {event.location && (
                      <div className="flex items-start gap-2">
                        <MapPin size={18} className="text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium text-sm">Location</div>
                          <div>{event.location}</div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      <Users size={18} className="text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">Attendees</div>
                        <div>{going.length} Going · {maybe.length} Maybe</div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-2">About this event</h3>
                  <p className="whitespace-pre-line text-muted-foreground">{event.description}</p>
                </div>

                {(event.latitude && event.longitude) && (
                  <div>
                    <h3 className="font-medium mb-2">Location</h3>
                    <div className="h-64 bg-muted rounded-md overflow-hidden">
                      <iframe
                        title="Event Location"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        src={`https://www.google.com/maps/embed/v1/place?key=REPLACE_WITH_YOUR_API_KEY&q=${event.latitude},${event.longitude}`}
                        allowFullScreen
                      ></iframe>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      <MapPin size={14} className="inline mr-1" />
                      {event.location || `${event.latitude}, ${event.longitude}`}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="mb-6 sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg">Your RSVP</CardTitle>
              <CardDescription>Let the host know if you'll be attending</CardDescription>
            </CardHeader>
            <CardContent>
              {user ? (
                <div className="space-y-2">
                  <Button
                    onClick={() => handleRsvp("going")}
                    variant={rsvpStatus === "going" ? "default" : "outline"}
                    className="w-full justify-start"
                  >
                    ✓ Going
                  </Button>
                  <Button
                    onClick={() => handleRsvp("maybe")}
                    variant={rsvpStatus === "maybe" ? "default" : "outline"}
                    className="w-full justify-start"
                  >
                    ? Maybe
                  </Button>
                  <Button
                    onClick={() => handleRsvp("not_going")}
                    variant={rsvpStatus === "not_going" ? "default" : "outline"}
                    className="w-full justify-start"
                  >
                    ✗ Not Going
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">Sign in to RSVP to this event</p>
                  <Button asChild>
                    <Link href="/auth">Sign In</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attendees</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="going">
                <TabsList className="w-full">
                  <TabsTrigger value="going" className="flex-1">
                    Going ({going.length})
                  </TabsTrigger>
                  <TabsTrigger value="maybe" className="flex-1">
                    Maybe ({maybe.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="going" className="mt-4">
                  {going.length > 0 ? (
                    <div className="space-y-4">
                      {going.map((rsvp: EventRsvp) => (
                        <div key={rsvp.id} className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={rsvp.user?.avatarUrl || ""} alt={rsvp.user?.displayName} />
                            <AvatarFallback>{rsvp.user?.displayName?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{rsvp.user?.displayName || "User"}</div>
                            <div className="text-xs text-muted-foreground">@{rsvp.user?.username}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No one has RSVP'd as going yet</p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="maybe" className="mt-4">
                  {maybe.length > 0 ? (
                    <div className="space-y-4">
                      {maybe.map((rsvp: EventRsvp) => (
                        <div key={rsvp.id} className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={rsvp.user?.avatarUrl || ""} alt={rsvp.user?.displayName} />
                            <AvatarFallback>{rsvp.user?.displayName?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{rsvp.user?.displayName || "User"}</div>
                            <div className="text-xs text-muted-foreground">@{rsvp.user?.username}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No one has RSVP'd as maybe yet</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Event Alert Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event and remove all RSVPs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteEventMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Social Media Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share This Event</DialogTitle>
            <DialogDescription>
              Share this event with your friends and community
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col space-y-4 py-4">
            <div className="flex justify-center space-x-4">
              <FacebookShareButton 
                url={shareUrl}>
                <FacebookIcon size={48} round />
              </FacebookShareButton>
              
              <TwitterShareButton 
                url={shareUrl} 
                title={`Join me at ${event?.title || 'this event'}!`}
                hashtags={['TheConnection', 'ChristianEvents']}>
                <TwitterIcon size={48} round />
              </TwitterShareButton>
              
              <WhatsappShareButton 
                url={shareUrl} 
                title={`Join me at ${event?.title || 'this event'}!`}>
                <WhatsappIcon size={48} round />
              </WhatsappShareButton>
              
              <LinkedinShareButton
                url={shareUrl}
                title={`${event?.title || 'Christian Event'}`}
                summary={`Join me at this event on The Connection platform: ${event?.title || 'Christian Event'}`}>
                <LinkedinIcon size={48} round />
              </LinkedinShareButton>
              
              <EmailShareButton 
                url={shareUrl} 
                subject={`Invitation: ${event?.title || 'Event'}`} 
                body={`I'd like to invite you to ${event?.title || 'this event'}. Check it out here:`}>
                <EmailIcon size={48} round />
              </EmailShareButton>
            </div>
            
            <div className="flex items-center justify-between space-x-2 bg-muted p-2 rounded-md">
              <div className="truncate text-sm text-muted-foreground">{shareUrl}</div>
              <Button variant="secondary" size="sm" onClick={handleCopyLink}>
                Copy Link
              </Button>
            </div>
            
            <div className="text-center text-sm text-muted-foreground mt-2">
              Event details will be shared when using these links
            </div>
          </div>
          
          <DialogClose asChild>
            <Button variant="outline" className="mt-2">
              Close
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
}