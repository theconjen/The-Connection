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
import EventsList from "@/components/events/EventsList";
import { Event } from "@/components/events/EventsMap";

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
    address: "",
    city: "",
    state: "",
    zipCode: "",
    latitude: "",
    longitude: "",
    isVirtual: false,
    isPublic: true,
    showOnMap: true,
    virtualMeetingUrl: "",
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
  const handleSwitchChange = (field: string, checked: boolean) => {
    setNewEvent({ ...newEvent, [field]: checked });
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
        address: "",
        city: "",
        state: "",
        zipCode: "",
        latitude: "",
        longitude: "",
        isVirtual: false,
        isPublic: true,
        showOnMap: true,
        virtualMeetingUrl: "",
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
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        name="startTime"
                        type="time"
                        value={newEvent.startTime}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div>
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
                </div>

                {/* Event Type Selection */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="isVirtual" className="flex-grow">Virtual Event</Label>
                  <Switch
                    id="isVirtual"
                    checked={newEvent.isVirtual}
                    onCheckedChange={(checked) => handleSwitchChange('isVirtual', checked)}
                  />
                </div>
                
                {/* Virtual Meeting URL (only shown if virtual) */}
                {newEvent.isVirtual && (
                  <div className="grid gap-2">
                    <Label htmlFor="virtualMeetingUrl">Meeting URL</Label>
                    <Input
                      id="virtualMeetingUrl"
                      name="virtualMeetingUrl"
                      value={newEvent.virtualMeetingUrl}
                      onChange={handleInputChange}
                      placeholder="https://zoom.us/j/123456789"
                    />
                  </div>
                )}

                {/* Physical Location Details (only shown if not virtual) */}
                {!newEvent.isVirtual && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="location">Location Name</Label>
                      <Input
                        id="location"
                        name="location"
                        value={newEvent.location}
                        onChange={handleInputChange}
                        placeholder="Community Center"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="address">Street Address</Label>
                      <Input
                        id="address"
                        name="address"
                        value={newEvent.address}
                        onChange={handleInputChange}
                        placeholder="123 Main St"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          name="city"
                          value={newEvent.city}
                          onChange={handleInputChange}
                          placeholder="New York"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            name="state"
                            value={newEvent.state}
                            onChange={handleInputChange}
                            placeholder="NY"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="zipCode">Zip Code</Label>
                          <Input
                            id="zipCode"
                            name="zipCode"
                            value={newEvent.zipCode}
                            onChange={handleInputChange}
                            placeholder="10001"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="latitude">Latitude</Label>
                        <Input
                          id="latitude"
                          name="latitude"
                          value={newEvent.latitude}
                          onChange={handleInputChange}
                          placeholder="40.7128"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="longitude">Longitude</Label>
                        <Input
                          id="longitude"
                          name="longitude"
                          onChange={handleInputChange}
                          value={newEvent.longitude}
                          placeholder="-74.0060"
                        />
                      </div>
                    </div>
                    
                    {/* Show on Map Option */}
                    <div className="flex items-center gap-2">
                      <Label htmlFor="showOnMap" className="flex-grow">Show on worldwide map</Label>
                      <Switch
                        id="showOnMap"
                        checked={newEvent.showOnMap}
                        onCheckedChange={(checked) => handleSwitchChange('showOnMap', checked)}
                      />
                    </div>
                  </>
                )}
                
                {/* Public/Private Setting */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="isPublic" className="flex-grow">Make event public</Label>
                  <Switch
                    id="isPublic"
                    checked={newEvent.isPublic}
                    onCheckedChange={(checked) => handleSwitchChange('isPublic', checked)}
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
      
      {/* Using the new EventsList component */}
      <EventsList 
        events={events}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isLoading={isLoading}
        getUserLocation={getUserLocation}
        isGettingLocation={isGettingLocation}
        coordinates={coordinates}
      />
    </div>
  );
}