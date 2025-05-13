import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, MapPin, Clock, Users, ChevronRight, PlusCircle, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

interface Event {
  id: number;
  title: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string | null;
  latitude: string | null;
  longitude: string | null;
  isPublic: boolean;
  communityId: number | null;
  groupId: number | null;
  creatorId: number;
  createdAt: Date | null;
}

export default function EventsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"all" | "public" | "nearby">("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [coordinates, setCoordinates] = useState({ latitude: "", longitude: "" });
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Get events based on selected view mode
  const { data: events = [], isLoading } = useQuery({
    queryKey: [viewMode === "all" ? "/api/events" : `/api/events/${viewMode}`],
    queryFn: async () => {
      let endpoint = "/api/events";
      if (viewMode === "public") {
        endpoint = "/api/events/public";
      } else if (viewMode === "nearby" && coordinates.latitude && coordinates.longitude) {
        endpoint = `/api/events/nearby?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&radius=10`;
      }
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    },
    enabled: !(viewMode === "nearby" && (!coordinates.latitude || !coordinates.longitude))
  });

  // Form state for event creation
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    eventDate: format(new Date(), "yyyy-MM-dd"),
    startTime: "12:00",
    endTime: "13:00",
    location: "",
    isPublic: true,
    communityId: null as number | null,
    groupId: null as number | null
  });

  // Get user's geolocation for nearby events
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Unavailable",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive"
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString()
        });
        setIsGettingLocation(false);
        toast({
          title: "Location Found",
          description: "Now showing events near your location."
        });
      },
      (error) => {
        setIsGettingLocation(false);
        toast({
          title: "Location Error",
          description: error.message,
          variant: "destructive"
        });
      }
    );
  };

  // Effect to automatically request location when nearby view is selected
  useEffect(() => {
    if (viewMode === "nearby" && !coordinates.latitude && !coordinates.longitude) {
      getUserLocation();
    }
  }, [viewMode]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewEvent({ ...newEvent, [name]: value });
  };

  // Handle switch/checkbox change
  const handleSwitchChange = (checked: boolean) => {
    setNewEvent({ ...newEvent, isPublic: checked });
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Include coordinates if using location
      let eventData = { ...newEvent };
      
      // Send API request to create event
      const response = await apiRequest("POST", "/api/events", eventData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create event");
      }

      // Show success message
      toast({
        title: "Event Created",
        description: "Your event has been successfully created."
      });

      // Reset form and close dialog
      setNewEvent({
        title: "",
        description: "",
        eventDate: format(new Date(), "yyyy-MM-dd"),
        startTime: "12:00",
        endTime: "13:00",
        location: "",
        isPublic: true,
        communityId: null,
        groupId: null
      });

      // Invalidate queries to refresh event lists
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/public"] });
      if (coordinates.latitude && coordinates.longitude) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/events/nearby?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&radius=10`] 
        });
      }

      setIsCreateDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMMM d, yyyy");
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Community Events</h1>
          <p className="text-muted-foreground mt-1">Discover upcoming events in our Christian community</p>
        </div>
        
        {user && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <PlusCircle size={16} />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>
                  Create a new event for the community. Fill out the form below with your event details.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={newEvent.title}
                    onChange={handleInputChange}
                    placeholder="Bible Study Group"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={newEvent.description}
                    onChange={handleInputChange}
                    placeholder="Join us for our weekly Bible study where we will discuss..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="eventDate">Date</Label>
                    <Input
                      id="eventDate"
                      name="eventDate"
                      type="date"
                      value={newEvent.eventDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      value={newEvent.location}
                      onChange={handleInputChange}
                      placeholder="Community Center"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      name="startTime"
                      type="time"
                      value={newEvent.startTime}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      name="endTime"
                      type="time"
                      value={newEvent.endTime}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label htmlFor="isPublic" className="flex-grow">Make event public</Label>
                  <Switch
                    id="isPublic"
                    checked={newEvent.isPublic}
                    onCheckedChange={handleSwitchChange}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>Create Event</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <RadioGroup 
          defaultValue="all" 
          className="flex space-x-2"
          value={viewMode}
          onValueChange={(value) => setViewMode(value as "all" | "public" | "nearby")}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="all" />
            <Label htmlFor="all">All Events</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="public" id="public" />
            <Label htmlFor="public">Public Events</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="nearby" id="nearby" />
            <Label htmlFor="nearby">Events Near Me</Label>
          </div>
        </RadioGroup>
        
        {viewMode === "nearby" && (
          <Button 
            variant="outline" 
            onClick={getUserLocation} 
            disabled={isGettingLocation}
            className="ml-auto"
          >
            {isGettingLocation ? 'Getting location...' : 'Update My Location'}
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-pulse flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-primary/30"></div>
            <div className="h-4 w-40 bg-primary/30 rounded"></div>
          </div>
        </div>
      ) : events.length > 0 ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event: Event) => (
            <Card key={event.id} className="overflow-hidden transition-all hover:shadow-md">
              <CardHeader className="bg-primary/5 pb-2">
                <CardTitle className="line-clamp-1">{event.title}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <CalendarDays size={14} />
                  {formatDate(event.eventDate)}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{event.description}</p>
                
                <div className="space-y-2 text-sm">
                  {event.location && (
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-muted-foreground mt-0.5" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-2">
                    <Clock size={16} className="text-muted-foreground mt-0.5" />
                    <span>{event.startTime} - {event.endTime}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                      {event.isPublic ? 'Public' : 'Private'}
                    </div>
                    
                    {event.communityId && (
                      <div className="px-2 py-0.5 text-xs rounded-full bg-secondary/10 text-secondary">
                        Community
                      </div>
                    )}
                    
                    {event.groupId && (
                      <div className="px-2 py-0.5 text-xs rounded-full bg-secondary/10 text-secondary">
                        Group
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between border-t pt-4">
                <Link href={`/events/${event.id}`}>
                  <Button variant="ghost" size="sm" className="gap-1">
                    View Details
                    <ChevronRight size={14} />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 bg-muted/20 rounded-lg text-center">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <CalendarDays size={32} className="text-primary" />
          </div>
          <h3 className="text-xl font-medium">No events found</h3>
          <p className="text-muted-foreground mt-1 mb-4 max-w-md">
            {viewMode === "nearby" 
              ? "There are no events scheduled near your current location." 
              : "There are no events scheduled at this time."}
          </p>
          {user && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Create an Event
            </Button>
          )}
        </div>
      )}
    </div>
  );
}