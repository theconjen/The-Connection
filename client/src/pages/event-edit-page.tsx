import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  CalendarDays,
  MapPin,
  Clock,
  ArrowLeft,
  Save,
  Image as ImageIcon,
  X,
  Users,
  Megaphone
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useAuth } from "../hooks/use-auth";
import { Link, useLocation, useParams } from "wouter";
import type { Event, EventRsvp } from "@connection/shared/mobile-web/types";

export default function EventEditPage() {
  const [, setLocation] = useLocation();
  const params = useParams() as { id?: string };
  const eventId = parseInt(params.id || "0");
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAttendeesDialogOpen, setIsAttendeesDialogOpen] = useState(false);
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventDate: "",
    startTime: "",
    endTime: "",
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
    imageUrl: "",
  });

  // Fetch event details
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
    enabled: !!eventId,
  });

  // Fetch RSVPs for the event
  const { data: rsvps = [] } = useQuery({
    queryKey: [`/api/events/${eventId}/rsvps`],
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}/rsvps`);
      if (!response.ok) throw new Error("Failed to fetch RSVPs");
      return response.json();
    },
    enabled: !!event,
  });

  // Populate form when event data loads
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || "",
        description: event.description || "",
        eventDate: event.eventDate ? format(new Date(event.eventDate), "yyyy-MM-dd") : "",
        startTime: event.startTime || "",
        endTime: event.endTime || "",
        location: event.location || "",
        address: event.address || "",
        city: event.city || "",
        state: event.state || "",
        zipCode: event.zipCode || "",
        latitude: event.latitude || "",
        longitude: event.longitude || "",
        isVirtual: event.isVirtual || false,
        isPublic: event.isPublic !== false,
        showOnMap: event.showOnMap !== false,
        virtualMeetingUrl: event.virtualMeetingUrl || "",
        imageUrl: event.imageUrl || "",
      });
      if (event.imageUrl) {
        setImagePreview(event.imageUrl);
      }
    }
  }, [event]);

  // Check if user is the creator
  const isCreator = user && event && event.creatorId === user.id;

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/events/${eventId}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update event");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Event Updated",
        description: "Your changes have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setLocation(`/events/${eventId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update event",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle switch changes
  const handleSwitchChange = (field: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [field]: checked }));
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, imageUrl: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let imageUrl = formData.imageUrl;

      // Upload new image if selected
      if (imageFile) {
        const formDataUpload = new FormData();
        formDataUpload.append("image", imageFile);

        const uploadResponse = await fetch("/api/upload/event-image", {
          method: "POST",
          body: formDataUpload,
          credentials: "include",
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          imageUrl = uploadResult.url;
        } else {
          console.error("Failed to upload image");
        }
      }

      await updateEventMutation.mutateAsync({
        ...formData,
        imageUrl,
      });
    } catch (error) {
      // Error handled in mutation
    } finally {
      setIsSaving(false);
    }
  };

  // Send announcement to attendees
  const handleSendAnnouncement = async () => {
    if (!announcementMessage.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter an announcement message.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingAnnouncement(true);
    try {
      const response = await apiRequest("POST", `/api/events/${eventId}/announce`, {
        message: announcementMessage,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send announcement");
      }

      const result = await response.json();
      toast({
        title: "Announcement Sent",
        description: `Message sent to ${result.recipientCount} attendee(s).`,
      });
      setAnnouncementMessage("");
      setIsAnnouncementDialogOpen(false);
    } catch (error) {
      toast({
        title: "Failed to send announcement",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSendingAnnouncement(false);
    }
  };

  // Group RSVPs by status
  const going = rsvps.filter((rsvp: EventRsvp) => rsvp.status === "going");
  const maybe = rsvps.filter((rsvp: EventRsvp) => rsvp.status === "maybe");
  const notGoing = rsvps.filter((rsvp: EventRsvp) => rsvp.status === "not_going");

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
          <p className="text-muted-foreground mb-4">
            The event you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/events">Back to Events</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!isCreator) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            Only the event creator can edit this event.
          </p>
          <Button asChild>
            <Link href={`/events/${eventId}`}>Back to Event</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="gap-2">
          <Link href={`/events/${eventId}`}>
            <ArrowLeft size={16} />
            Back to Event
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Event</h1>
        <p className="text-muted-foreground">Update your event details</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
                <CardDescription>Basic information about your event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter event title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your event..."
                    rows={4}
                  />
                </div>

                {/* Event Flyer/Image */}
                <div className="space-y-2">
                  <Label>Event Flyer / Image</Label>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Event flyer preview"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveImage}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-32 border-dashed"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon size={24} className="text-muted-foreground" />
                        <span className="text-muted-foreground">Click to upload flyer</span>
                      </div>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays size={20} />
                  Date & Time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventDate">Date</Label>
                    <Input
                      id="eventDate"
                      name="eventDate"
                      type="date"
                      value={formData.eventDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      name="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      name="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin size={20} />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isVirtual">Virtual Event</Label>
                  <Switch
                    id="isVirtual"
                    checked={formData.isVirtual}
                    onCheckedChange={(checked) => handleSwitchChange("isVirtual", checked)}
                  />
                </div>

                {formData.isVirtual ? (
                  <div className="space-y-2">
                    <Label htmlFor="virtualMeetingUrl">Meeting URL</Label>
                    <Input
                      id="virtualMeetingUrl"
                      name="virtualMeetingUrl"
                      value={formData.virtualMeetingUrl}
                      onChange={handleInputChange}
                      placeholder="https://zoom.us/j/..."
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="location">Venue Name</Label>
                      <Input
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="Community Center"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Street Address</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="123 Main St"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="City"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          placeholder="State"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">ZIP</Label>
                        <Input
                          id="zipCode"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          placeholder="ZIP"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="latitude">Latitude</Label>
                        <Input
                          id="latitude"
                          name="latitude"
                          value={formData.latitude}
                          onChange={handleInputChange}
                          placeholder="40.7128"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="longitude">Longitude</Label>
                        <Input
                          id="longitude"
                          name="longitude"
                          value={formData.longitude}
                          onChange={handleInputChange}
                          placeholder="-74.0060"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="showOnMap">Show on Map</Label>
                      <Switch
                        id="showOnMap"
                        checked={formData.showOnMap}
                        onCheckedChange={(checked) => handleSwitchChange("showOnMap", checked)}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Visibility</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isPublic">Public Event</Label>
                    <p className="text-sm text-muted-foreground">
                      {formData.isPublic
                        ? "Anyone can see and join this event"
                        : "Only invited members can see this event"}
                    </p>
                  </div>
                  <Switch
                    id="isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => handleSwitchChange("isPublic", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button type="submit" className="w-full gap-2" disabled={isSaving}>
                  <Save size={16} />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setIsAttendeesDialogOpen(true)}
                >
                  <Users size={16} />
                  View RSVPs ({going.length + maybe.length})
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setIsAnnouncementDialogOpen(true)}
                >
                  <Megaphone size={16} />
                  Send Announcement
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Going</span>
                    <span className="font-medium">{going.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Maybe</span>
                    <span className="font-medium">{maybe.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Not Going</span>
                    <span className="font-medium">{notGoing.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Attendees Dialog */}
      <Dialog open={isAttendeesDialogOpen} onOpenChange={setIsAttendeesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Event RSVPs</DialogTitle>
            <DialogDescription>People who have responded to this event</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="going">
            <TabsList className="w-full">
              <TabsTrigger value="going" className="flex-1">
                Going ({going.length})
              </TabsTrigger>
              <TabsTrigger value="maybe" className="flex-1">
                Maybe ({maybe.length})
              </TabsTrigger>
              <TabsTrigger value="notgoing" className="flex-1">
                Can't Go ({notGoing.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="going" className="mt-4 max-h-64 overflow-y-auto">
              {going.length > 0 ? (
                <div className="space-y-3">
                  {going.map((rsvp: EventRsvp & { user?: any }) => (
                    <div key={rsvp.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={rsvp.user?.avatarUrl || ""} />
                        <AvatarFallback>{rsvp.user?.displayName?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{rsvp.user?.displayName || "User"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No one yet</p>
              )}
            </TabsContent>
            <TabsContent value="maybe" className="mt-4 max-h-64 overflow-y-auto">
              {maybe.length > 0 ? (
                <div className="space-y-3">
                  {maybe.map((rsvp: EventRsvp & { user?: any }) => (
                    <div key={rsvp.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={rsvp.user?.avatarUrl || ""} />
                        <AvatarFallback>{rsvp.user?.displayName?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{rsvp.user?.displayName || "User"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No one yet</p>
              )}
            </TabsContent>
            <TabsContent value="notgoing" className="mt-4 max-h-64 overflow-y-auto">
              {notGoing.length > 0 ? (
                <div className="space-y-3">
                  {notGoing.map((rsvp: EventRsvp & { user?: any }) => (
                    <div key={rsvp.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={rsvp.user?.avatarUrl || ""} />
                        <AvatarFallback>{rsvp.user?.displayName?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{rsvp.user?.displayName || "User"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No one yet</p>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Announcement Dialog */}
      <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Announcement</DialogTitle>
            <DialogDescription>
              Send a message to all attendees who RSVP'd "Going" or "Maybe"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={announcementMessage}
              onChange={(e) => setAnnouncementMessage(e.target.value)}
              placeholder="Type your announcement message..."
              rows={4}
              maxLength={500}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {announcementMessage.length}/500 characters
              </span>
              <span className="text-xs text-muted-foreground">
                Will be sent to {going.length + maybe.length} attendee(s)
              </span>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsAnnouncementDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendAnnouncement}
                disabled={isSendingAnnouncement || !announcementMessage.trim()}
              >
                {isSendingAnnouncement ? "Sending..." : "Send Announcement"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
