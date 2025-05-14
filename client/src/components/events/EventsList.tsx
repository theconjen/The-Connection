import { useState } from 'react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { CalendarDays, ChevronRight, Clock, MapPin, Filter, List, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import EventsMap, { Event } from './EventsMap';

interface EventsListProps {
  events: Event[];
  viewMode: "all" | "public" | "nearby";
  onViewModeChange: (mode: "all" | "public" | "nearby") => void;
  isLoading: boolean;
  getUserLocation: () => void;
  isGettingLocation: boolean;
  coordinates: { latitude: string; longitude: string };
}

export default function EventsList({
  events,
  viewMode,
  onViewModeChange,
  isLoading,
  getUserLocation,
  isGettingLocation,
  coordinates
}: EventsListProps) {
  const [displayMode, setDisplayMode] = useState<"list" | "map">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [radiusInMiles, setRadiusInMiles] = useState("25");

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "EEEE, MMMM d, yyyy");
    } catch (e) {
      return dateStr;
    }
  };

  // Filter events by search term & city
  const filteredEvents = events.filter(event => {
    const matchesSearch = !searchTerm || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCity = !searchCity || 
      (event.city && event.city.toLowerCase().includes(searchCity.toLowerCase()));
    
    return matchesSearch && matchesCity;
  });

  return (
    <div className="space-y-6">
      {/* View Mode & Display Mode Selection */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-card border rounded-lg p-4 shadow-sm">
        {/* View Mode Radio Group */}
        <RadioGroup 
          defaultValue="all" 
          className="flex space-x-4"
          value={viewMode}
          onValueChange={(value) => onViewModeChange(value as "all" | "public" | "nearby")}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="all" className="text-primary" />
            <Label htmlFor="all" className="font-medium text-foreground">All Events</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="public" id="public" className="text-primary" />
            <Label htmlFor="public" className="font-medium text-foreground">Public Events</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="nearby" id="nearby" className="text-primary" />
            <Label htmlFor="nearby" className="font-medium text-foreground">Events Near Me</Label>
          </div>
        </RadioGroup>
        
        {/* Display Mode Toggle Buttons */}
        <div className="ml-auto flex items-center space-x-2">
          <Button
            variant={displayMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setDisplayMode("list")}
            className="flex items-center gap-1.5"
          >
            <List size={16} /> List
          </Button>
          <Button
            variant={displayMode === "map" ? "default" : "outline"}
            size="sm"
            onClick={() => setDisplayMode("map")}
            className="flex items-center gap-1.5"
          >
            <Map size={16} /> Map
          </Button>
        </div>
      </div>

      {/* Location Update Button for Nearby Mode */}
      {viewMode === "nearby" && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-background/60 border rounded-lg p-4">
          <Button 
            variant="outline" 
            onClick={getUserLocation} 
            disabled={isGettingLocation}
            className="flex-shrink-0 flex items-center gap-2"
          >
            <MapPin size={16} />
            {isGettingLocation ? 'Getting location...' : 'Update My Location'}
          </Button>
          
          {coordinates.latitude && coordinates.longitude && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="text-sm text-muted-foreground">
                Search radius:
              </div>
              <Select
                value={radiusInMiles}
                onValueChange={setRadiusInMiles}
              >
                <SelectTrigger className="w-[120px] bg-card border-input">
                  <SelectValue placeholder="Radius" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 miles</SelectItem>
                  <SelectItem value="10">10 miles</SelectItem>
                  <SelectItem value="25">25 miles</SelectItem>
                  <SelectItem value="50">50 miles</SelectItem>
                  <SelectItem value="100">100 miles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Search Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-background/60 border rounded-lg p-4">
        <div className="flex-1">
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card border-input"
          />
        </div>
        <div className="flex-1">
          <Input
            placeholder="Filter by city..."
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            className="w-full bg-card border-input"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-primary/20"></div>
            <div className="h-4 w-48 bg-primary/20 rounded-md"></div>
            <div className="h-3 w-32 bg-primary/10 rounded-md"></div>
          </div>
        </div>
      ) : displayMode === "map" ? (
        /* Map View Mode */
        <div className="border rounded-lg overflow-hidden shadow-sm">
          <EventsMap events={filteredEvents} />
        </div>
      ) : filteredEvents.length > 0 ? (
        /* List View Mode with Events */
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden transition-all hover:shadow-md border-border/80 card-hover">
              <CardHeader className="bg-background pb-2">
                <div className="text-overline flex items-center gap-1 mb-1">
                  <CalendarDays size={14} className="text-primary" />
                  {formatDate(event.eventDate)}
                </div>
                <CardTitle className="line-clamp-1 text-xl">{event.title}</CardTitle>
              </CardHeader>
              
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{event.description}</p>
                
                <div className="space-y-3 text-sm">
                  {event.location && (
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-accent mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">{event.location}</div>
                        {event.address && <div className="text-muted-foreground">{event.address}</div>}
                        {(event.city || event.state) && (
                          <div className="text-muted-foreground">
                            {event.city}{event.city && event.state ? ', ' : ''}
                            {event.state} {event.zipCode}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-2">
                    <Clock size={16} className="text-primary mt-0.5 flex-shrink-0" />
                    <span>{event.startTime} - {event.endTime}</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <div className="px-2.5 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                      {event.isPublic ? 'Public' : 'Private'}
                    </div>
                    
                    {event.isVirtual && (
                      <div className="px-2.5 py-1 text-xs font-medium rounded-full bg-secondary/10 text-secondary">
                        Virtual
                      </div>
                    )}
                    
                    {event.communityId && (
                      <div className="px-2.5 py-1 text-xs font-medium rounded-full bg-accent/10 text-accent">
                        Community
                      </div>
                    )}
                    
                    {event.groupId && (
                      <div className="px-2.5 py-1 text-xs font-medium rounded-full bg-accent/10 text-accent">
                        Group
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between border-t pt-4">
                <Link href={`/events/${event.id}`}>
                  <Button variant="outline" size="sm" className="gap-1 text-primary hover:text-primary hover:bg-primary/5">
                    View Details
                    <ChevronRight size={14} />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 bg-card border rounded-lg text-center">
          <div className="bg-primary/10 p-5 rounded-full mb-5">
            <CalendarDays size={36} className="text-primary" />
          </div>
          <h3 className="text-2xl font-medium mb-2">No events found</h3>
          <p className="text-muted-foreground mt-2 max-w-md px-4">
            {viewMode === "nearby" 
              ? "There are no events near your current location. Try expanding your search radius or check back later."
              : viewMode === "public" 
                ? "There are no public events available. Try creating one yourself!"
                : "No events match your search criteria. Try adjusting your filters or create a new event."
            }
          </p>
        </div>
      )}
    </div>
  );
}