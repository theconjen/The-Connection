import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "../../hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Plus,
  Filter,
  Grid3X3,
  List,
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  HelpCircle,
  Loader2,
  Send,
  Eye,
  Settings,
  Trash,
  Edit,
} from "lucide-react";
import { format, formatDistance, isAfter, isBefore, isSameDay } from "date-fns";
import { useToast } from "../../hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Community, Event } from "@shared/mobile-web/types";

// Utility functions for event handling
const isEventPast = (startDateTime: string): boolean => {
  return isBefore(new Date(startDateTime), new Date());
};

const isEventUpcoming = (startDateTime: string): boolean => {
  return isAfter(new Date(startDateTime), new Date());
};

const formatEventTime = (startDateTime: string, endDateTime?: string): string => {
  const start = format(new Date(startDateTime), "h:mm a");
  if (endDateTime) {
    const end = format(new Date(endDateTime), "h:mm a");
    return `${start} - ${end}`;
  }
  return start;
};

const formatEventDate = (startDateTime: string): string => {
  return format(new Date(startDateTime), "MMM d, yyyy 'at' h:mm a");
};

interface CommunityEventsProps {
  community: Community;
  isMember: boolean;
  isOwner: boolean;
  isModerator: boolean;
}

type ViewMode = "grid" | "list" | "calendar";
type EventFilter = "all" | "upcoming" | "past" | "attending" | "hosting";

export function CommunityEvents({ community, isMember, isOwner, isModerator }: CommunityEventsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filter, setFilter] = useState<EventFilter>("upcoming");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  
  // Form state for creating events
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    location: "",
    isOnline: false,
    maxAttendees: "",
    tags: "",
  });

  // Fetch community events
  const {
    data: events = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Event[]>({
    queryKey: [`/api/events`, community.id, filter],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/events?communityId=${community.id}&filter=${filter}`);
      return response.json();
    },
    enabled: isMember || !community.isPrivate,
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await apiRequest("POST", "/api/events", {
        ...eventData,
        communityId: community.id,
        createdBy: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events`, community.id] });
      setNewEvent({
        title: "",
        description: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        location: "",
        isOnline: false,
        maxAttendees: "",
        tags: "",
      });
      setShowCreateEvent(false);
      toast({
        title: "Event created",
        description: "Your event has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create event",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // RSVP mutation
  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: number; status: "attending" | "maybe" | "declined" }) => {
      const response = await apiRequest("PATCH", `/api/events/${eventId}/rsvp`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events`, community.id] });
      toast({
        title: "RSVP updated",
        description: "Your attendance status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update RSVP",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateEvent = () => {
    if (!newEvent.title.trim() || !newEvent.description.trim() || !newEvent.startDate || !newEvent.startTime) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const startDateTime = new Date(`${newEvent.startDate}T${newEvent.startTime}`);
    const endDateTime = newEvent.endDate && newEvent.endTime 
      ? new Date(`${newEvent.endDate}T${newEvent.endTime}`)
      : undefined;

    createEventMutation.mutate({
      title: newEvent.title,
      description: newEvent.description,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime?.toISOString(),
      location: newEvent.location || undefined,
      isOnline: newEvent.isOnline,
      maxAttendees: newEvent.maxAttendees ? parseInt(newEvent.maxAttendees) : undefined,
      tags: newEvent.tags.split(",").map(tag => tag.trim()).filter(Boolean),
    });
  };

  const handleRSVP = (eventId: number, status: "attending" | "maybe" | "declined") => {
    rsvpMutation.mutate({ eventId, status });
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy 'at' h:mm a");
  };

  const formatEventTime = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      if (isSameDay(start, end)) {
        return `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;
      } else {
        return `${format(start, "MMM d h:mm a")} - ${format(end, "MMM d h:mm a")}`;
      }
    }
    return format(start, "h:mm a");
  };

  const isEventPast = (dateString: string) => {
    return isBefore(new Date(dateString), new Date());
  };

  const isEventUpcoming = (dateString: string) => {
    return isAfter(new Date(dateString), new Date());
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.startDateTime), date));
  };

  const getRSVPIcon = (status?: string) => {
    switch (status) {
      case "attending": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "maybe": return <HelpCircle className="h-4 w-4 text-yellow-600" />;
      case "declined": return <XCircle className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  const getRSVPText = (status?: string) => {
    switch (status) {
      case "attending": return "Going";
      case "maybe": return "Maybe";
      case "declined": return "Can't go";
      default: return "RSVP";
    }
  };

  if (!isMember && community.isPrivate) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto mb-6 p-4 rounded-full bg-amber-50 dark:bg-amber-900/20 w-fit">
          <CalendarDays className="h-12 w-12 text-amber-600 dark:text-amber-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Private Events</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          This community's events are private. Join the community to see and attend events.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Events Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Community Events</h2>
          <p className="text-muted-foreground">Upcoming gatherings and activities</p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Create Event Button */}
          {(isMember && (isOwner || isModerator)) && (
            <Dialog open={showCreateEvent} onOpenChange={setShowCreateEvent}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-event">
                  <Plus className="h-4 w-4 mr-2" />
                  New Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Community Event</DialogTitle>
                  <DialogDescription>
                    Plan a new event for the {community.name} community
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Event Title *</label>
                    <Input
                      placeholder="What's the event called?"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      data-testid="input-event-title"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Description *</label>
                    <Textarea
                      placeholder="Describe your event..."
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      className="min-h-24 resize-none"
                      data-testid="textarea-event-description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Start Date *</label>
                      <Input
                        type="date"
                        value={newEvent.startDate}
                        onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                        data-testid="input-start-date"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Start Time *</label>
                      <Input
                        type="time"
                        value={newEvent.startTime}
                        onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                        data-testid="input-start-time"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">End Date</label>
                      <Input
                        type="date"
                        value={newEvent.endDate}
                        onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">End Time</label>
                      <Input
                        type="time"
                        value={newEvent.endTime}
                        onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Location</label>
                    <Input
                      placeholder="Where is the event?"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    />
                    <div className="flex items-center mt-2">
                      <input
                        type="checkbox"
                        id="isOnline"
                        checked={newEvent.isOnline}
                        onChange={(e) => setNewEvent({ ...newEvent, isOnline: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor="isOnline" className="text-sm">This is an online event</label>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Max Attendees</label>
                    <Input
                      type="number"
                      placeholder="Leave blank for unlimited"
                      value={newEvent.maxAttendees}
                      onChange={(e) => setNewEvent({ ...newEvent, maxAttendees: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Tags</label>
                    <Input
                      placeholder="fellowship, worship, study (comma-separated)"
                      value={newEvent.tags}
                      onChange={(e) => setNewEvent({ ...newEvent, tags: e.target.value })}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateEvent(false)}
                    disabled={createEventMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateEvent}
                    disabled={createEventMutation.isPending}
                    data-testid="button-submit-event"
                  >
                    {createEventMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Create Event
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(value) => setFilter(value as EventFilter)}>
        <TabsList>
          <TabsTrigger value="all">All Events</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          {isMember && (
            <>
              <TabsTrigger value="attending">Attending</TabsTrigger>
              {(isOwner || isModerator) && <TabsTrigger value="hosting">Hosting</TabsTrigger>}
            </>
          )}
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {/* Calendar View */}
          {viewMode === "calendar" && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  modifiers={{
                    hasEvent: (date) => getEventsForDate(date).length > 0
                  }}
                  modifiersStyles={{
                    hasEvent: { 
                      backgroundColor: 'hsl(var(--primary))', 
                      color: 'hsl(var(--primary-foreground))',
                      fontWeight: 'bold'
                    }
                  }}
                  className="rounded-md border"
                />
              </div>
              <div className="lg:col-span-2">
                <h3 className="font-semibold mb-4">
                  Events on {format(selectedDate, "MMMM d, yyyy")}
                </h3>
                {getEventsForDate(selectedDate).length === 0 ? (
                  <p className="text-muted-foreground">No events scheduled for this date.</p>
                ) : (
                  <div className="space-y-4">
                    {getEventsForDate(selectedDate).map((event) => (
                      <EventCard key={event.id} event={event} onRSVP={handleRSVP} isMember={isMember} compact />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded w-full"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : events.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No events found</h3>
                  <p className="text-muted-foreground mb-4">
                    {filter === "upcoming" ? "No upcoming events scheduled." : `No ${filter} events.`}
                  </p>
                  {(isMember && (isOwner || isModerator)) && filter === "upcoming" && (
                    <Button onClick={() => setShowCreateEvent(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Event
                    </Button>
                  )}
                </div>
              ) : (
                events.map((event) => (
                  <EventCard key={event.id} event={event} onRSVP={handleRSVP} isMember={isMember} />
                ))
              )}
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="flex items-center space-x-4 p-6">
                      <div className="w-16 h-16 bg-muted rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                        <div className="h-3 bg-muted rounded w-1/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : events.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No events found</h3>
                    <p className="text-muted-foreground">No events match your current filter.</p>
                  </CardContent>
                </Card>
              ) : (
                events.map((event) => (
                  <EventCard key={event.id} event={event} onRSVP={handleRSVP} isMember={isMember} list />
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Event Card Component
function EventCard({ 
  event, 
  onRSVP, 
  isMember, 
  compact = false, 
  list = false 
}: { 
  event: Event; 
  onRSVP: (eventId: number, status: "attending" | "maybe" | "declined") => void; 
  isMember: boolean; 
  compact?: boolean; 
  list?: boolean; 
}) {
  const isPast = isEventPast(event.startDateTime);
  const isUpcoming = isEventUpcoming(event.startDateTime);

  if (list) {
    return (
      <Card className={`overflow-hidden ${isPast ? 'opacity-75' : ''}`} data-testid={`event-${event.id}`}>
        <CardContent className="flex items-center space-x-6 p-6">
          {/* Date Block */}
          <div className="text-center bg-primary/10 p-4 rounded-lg min-w-[80px]">
            <div className="text-2xl font-bold text-primary">
              {format(new Date(event.startDateTime), "d")}
            </div>
            <div className="text-sm text-muted-foreground uppercase">
              {format(new Date(event.startDateTime), "MMM")}
            </div>
          </div>

          {/* Event Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{event.title}</h3>
                <div className="flex items-center text-sm text-muted-foreground space-x-4 mt-1">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatEventTime(event.startDateTime, event.endDateTime)}
                  </div>
                  {event.location && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {event.location}
                    </div>
                  )}
                  {event.isOnline && (
                    <Badge variant="secondary">Online</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {event.description}
                </p>
              </div>

              {/* RSVP Section */}
              {isMember && !isPast && (
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant={event.userRsvp?.status === "attending" ? "default" : "outline"}
                    size="sm"
                    onClick={() => onRSVP(event.id, "attending")}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Going
                  </Button>
                  <Button
                    variant={event.userRsvp?.status === "maybe" ? "default" : "outline"}
                    size="sm"
                    onClick={() => onRSVP(event.id, "maybe")}
                  >
                    <HelpCircle className="h-4 w-4 mr-1" />
                    Maybe
                  </Button>
                  <Button
                    variant={event.userRsvp?.status === "declined" ? "default" : "outline"}
                    size="sm"
                    onClick={() => onRSVP(event.id, "declined")}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Can't Go
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden ${isPast ? 'opacity-75' : ''} ${compact ? 'h-fit' : ''}`} data-testid={`event-${event.id}`}>
      {event.imageUrl && (
        <div className="aspect-video overflow-hidden">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader className={compact ? "pb-2" : ""}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="line-clamp-2">{event.title}</CardTitle>
            <div className="flex items-center text-sm text-muted-foreground space-x-2 mt-2">
              <Clock className="h-4 w-4" />
              <span>{formatEventDate(event.startDateTime)}</span>
            </div>
          </div>
          {isPast && (
            <Badge variant="secondary">Past</Badge>
          )}
          {event.isOnline && (
            <Badge variant="outline">Online</Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className={compact ? "pt-0" : ""}>
        {!compact && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
            {event.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-muted-foreground space-x-4">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>{event.attendeeCount} attending</span>
            </div>
            {event.location && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="truncate max-w-24">{event.location}</span>
              </div>
            )}
          </div>

          {isMember && !isPast && !compact && (
            <Select onValueChange={(status: "attending" | "maybe" | "declined") => onRSVP(event.id, status)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="RSVP" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="attending">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Going
                  </div>
                </SelectItem>
                <SelectItem value="maybe">
                  <div className="flex items-center">
                    <HelpCircle className="h-4 w-4 mr-2 text-yellow-600" />
                    Maybe
                  </div>
                </SelectItem>
                <SelectItem value="declined">
                  <div className="flex items-center">
                    <XCircle className="h-4 w-4 mr-2 text-red-600" />
                    Can't Go
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {event.tags && event.tags.length > 0 && !compact && (
          <div className="flex flex-wrap gap-1 mt-3">
            {event.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}