import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { CalendarDays, MapPin, Clock, Users, ChevronRight, PlusCircle, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { format } from "date-fns";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useAuth } from "../hooks/use-auth";
import { Link } from "wouter";
import EventsList from "../components/events/EventsList";
import type { Event } from "@shared/mobile-web/types";

export default function EventsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"all" | "public" | "nearby">("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [coordinates, setCoordinates] = useState({ latitude: "", longitude: "" });
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Get events based on selected view mode
  const { data: events = [], isLoading } = useQuery({
    queryKey: [viewMode === "all" ? "/events" : `/events/${viewMode}`],
    queryFn: async () => {
      let endpoint = "/events";
      if (viewMode === "public") {
        endpoint = "/events/public";
      } else if (viewMode === "nearby" && coordinates.latitude && coordinates.longitude) {
        endpoint = `/events/nearby?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&radius=10`;
      }
      const response = await apiRequest(endpoint);
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
  const response = await apiRequest("POST", "/events", eventData);
      
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
      queryClient.invalidateQueries({ queryKey: ["/events"] });
      queryClient.invalidateQueries({ queryKey: ["/events/public"] });
      if (coordinates.latitude && coordinates.longitude) {
        queryClient.invalidateQueries({ 
          queryKey: [`/events/nearby?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&radius=10`] 
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
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8 pb-6 border-b">
        <div>
          <h1 className="text-3xl font-medium tracking-tight mb-2">Community Events</h1>
          <p className="text-muted-foreground max-w-2xl text-balance">
            Connect with believers through meaningful gatherings. Browse and join events hosted by our Christian community around the world.
          </p>
        </div>
        
        {user && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm md:self-start">
                <PlusCircle size={16} />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden">
              <div className="bg-primary/5 py-4 px-6 border-b">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-medium tracking-tight">Create New Event</DialogTitle>
                  <DialogDescription className="text-muted-foreground mt-1">
                    Fill out the form below with your event details to share with the community.
                  </DialogDescription>
                </DialogHeader>
              </div>
              
              <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label htmlFor="title" className="font-medium">Event Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={newEvent.title}
                    onChange={handleInputChange}
                    placeholder="Bible Study Group"
                    className="bg-card border-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="font-medium">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={newEvent.description}
                    onChange={handleInputChange}
                    placeholder="Join us for our weekly Bible study where we will discuss..."
                    rows={3}
                    className="bg-card border-input resize-none"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-background/50 rounded-lg p-4 border  border/80">
                  <div className="space-y-2">
                    <Label htmlFor="eventDate" className="flex items-center gap-2 font-medium">
                      <CalendarDays size={16} className="text-primary" />
                      Date
                    </Label>
                    <Input
                      id="eventDate"
                      name="eventDate"
                      type="date"
                      value={newEvent.eventDate}
                      onChange={handleInputChange}
                      className="bg-card border-input"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="startTime" className="flex items-center gap-2 font-medium">
                        <Clock size={16} className="text-primary" />
                        Start
                      </Label>
                      <Input
                        id="startTime"
                        name="startTime"
                        type="time"
                        value={newEvent.startTime}
                        onChange={handleInputChange}
                        className="bg-card border-input"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="endTime" className="font-medium">End</Label>
                      <Input
                        id="endTime"
                        name="endTime"
                        type="time"
                        value={newEvent.endTime}
                        onChange={handleInputChange}
                        className="bg-card border-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Event Type Selection */}
                <div className="flex items-center justify-between bg-background/50 rounded-lg p-4 border  border/80">
                  <Label htmlFor="isVirtual" className="font-medium flex items-center gap-2">
                    {newEvent.isVirtual ? (
                      <div className="text-secondary flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-video"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
                        Virtual Event
                      </div>
                    ) : (
                      <div className="text-accent flex items-center gap-2">
                        <MapPin size={18} />
                        In-Person Event
                      </div>
                    )}
                  </Label>
                  <Switch
                    id="isVirtual"
                    checked={newEvent.isVirtual}
                    onCheckedChange={(checked) => handleSwitchChange('isVirtual', checked)}
                  />
                </div>
                
                {/* Virtual Meeting URL (only shown if virtual) */}
                {newEvent.isVirtual && (
                  <div className="space-y-2 p-4 bg-secondary/5 rounded-lg border border-secondary/20">
                    <Label htmlFor="virtualMeetingUrl" className="font-medium">Meeting URL</Label>
                    <Input
                      id="virtualMeetingUrl"
                      name="virtualMeetingUrl"
                      value={newEvent.virtualMeetingUrl}
                      onChange={handleInputChange}
                      placeholder="https://zoom.us/j/123456789"
                      className="bg-card border-input"
                    />
                  </div>
                )}

                {/* Physical Location Details (only shown if not virtual) */}
                {!newEvent.isVirtual && (
                  <div className="space-y-4 p-4 bg-accent/5 rounded-lg border border-accent/20">
                    <div className="space-y-2">
                      <Label htmlFor="location" className="font-medium">Location Name</Label>
                      <Input
                        id="location"
                        name="location"
                        value={newEvent.location}
                        onChange={handleInputChange}
                        placeholder="Community Center"
                        className="bg-card border-input"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address" className="font-medium">Street Address</Label>
                      <Input
                        id="address"
                        name="address"
                        value={newEvent.address}
                        onChange={handleInputChange}
                        placeholder="123 Main St"
                        className="bg-card border-input"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="font-medium">City</Label>
                        <Input
                          id="city"
                          name="city"
                          value={newEvent.city}
                          onChange={handleInputChange}
                          placeholder="New York"
                          className="bg-card border-input"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="state" className="font-medium">State</Label>
                          <Input
                            id="state"
                            name="state"
                            value={newEvent.state}
                            onChange={handleInputChange}
                            placeholder="NY"
                            className="bg-card border-input"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="zipCode" className="font-medium">Zip Code</Label>
                          <Input
                            id="zipCode"
                            name="zipCode"
                            value={newEvent.zipCode}
                            onChange={handleInputChange}
                            placeholder="10001"
                            className="bg-card border-input"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground font-medium flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-8-4.5-8-11.8a8 8 0 0 1 16 0c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
                        Map Coordinates
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="latitude" className="text-xs text-muted-foreground">Latitude</Label>
                          <Input
                            id="latitude"
                            name="latitude"
                            value={newEvent.latitude}
                            onChange={handleInputChange}
                            placeholder="40.7128"
                            className="bg-card border-input"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="longitude" className="text-xs text-muted-foreground">Longitude</Label>
                          <Input
                            id="longitude"
                            name="longitude"
                            onChange={handleInputChange}
                            value={newEvent.longitude}
                            placeholder="-74.0060"
                            className="bg-card border-input"
                          />
                        </div>
                      </div>
                    
                      {/* Show on Map Option */}
                      <div className="flex items-center justify-between pt-2">
                        <Label htmlFor="showOnMap" className="text-sm flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z"/><path d="M3 7h18"/><path d="M14 12a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v4h8v-4Z"/></svg>
                          Show on worldwide map
                        </Label>
                        <Switch
                          id="showOnMap"
                          checked={newEvent.showOnMap}
                          onCheckedChange={(checked) => handleSwitchChange('showOnMap', checked)}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Public/Private Setting */}
                <div className="flex items-center justify-between bg-background/50 rounded-lg p-4 border  border/80">
                  <Label htmlFor="isPublic" className="font-medium flex items-center gap-2">
                    {newEvent.isPublic ? (
                      <div className="text-primary flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        Public Event
                      </div>
                    ) : (
                      <div className="text-muted-foreground flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12a5 5 0 0 0 5 5 5 5 0 0 0 5-5 5 5 0 0 0-5-5 5 5 0 0 0-5 5Z"/><path d="M7 12h10"/><path d="M12 7v10"/><path d="M7 9H2"/><path d="M7 15H2"/><path d="M22 17a5 5 0 0 0-5-5"/><path d="M17 22v-5"/><path d="M22 12a10 10 0 0 0-10-10"/><path d="M12 12v-5"/></svg>
                        Private Event
                      </div>
                    )}
                  </Label>
                  <Switch
                    id="isPublic"
                    checked={newEvent.isPublic}
                    onCheckedChange={(checked) => handleSwitchChange('isPublic', checked)}
                  />
                </div>
              </div>
              
              <DialogFooter className="px-6 py-4 bg-muted/20 border-t">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Create Event
                </Button>
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