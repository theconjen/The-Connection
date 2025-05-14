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
      <div className="flex flex-col md:flex-row gap-4">
        {/* View Mode Radio Group */}
        <RadioGroup 
          defaultValue="all" 
          className="flex space-x-2"
          value={viewMode}
          onValueChange={(value) => onViewModeChange(value as "all" | "public" | "nearby")}
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
        
        {/* Display Mode Tabs (List/Map) */}
        <div className="ml-auto">
          <TabsList>
            <TabsTrigger 
              value="list" 
              onClick={() => setDisplayMode("list")}
              className={displayMode === "list" ? "bg-primary text-primary-foreground" : ""}
            >
              <List size={16} className="mr-1" /> List
            </TabsTrigger>
            <TabsTrigger 
              value="map" 
              onClick={() => setDisplayMode("map")}
              className={displayMode === "map" ? "bg-primary text-primary-foreground" : ""}
            >
              <Map size={16} className="mr-1" /> Map
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      {/* Location Update Button for Nearby Mode */}
      {viewMode === "nearby" && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <Button 
            variant="outline" 
            onClick={getUserLocation} 
            disabled={isGettingLocation}
            className="flex-shrink-0"
          >
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
                <SelectTrigger className="w-[120px]">
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
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Input
            placeholder="Filter by city..."
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-pulse flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-primary/30"></div>
            <div className="h-4 w-40 bg-primary/30 rounded"></div>
          </div>
        </div>
      ) : displayMode === "map" ? (
        /* Map View Mode */
        <EventsMap events={filteredEvents} />
      ) : filteredEvents.length > 0 ? (
        /* List View Mode with Events */
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
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
                      <div>
                        <div>{event.location}</div>
                        {event.address && <div>{event.address}</div>}
                        {(event.city || event.state) && (
                          <div>
                            {event.city}{event.city && event.state ? ', ' : ''}
                            {event.state} {event.zipCode}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-2">
                    <Clock size={16} className="text-muted-foreground mt-0.5" />
                    <span>{event.startTime} - {event.endTime}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3">
                    <div className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                      {event.isPublic ? 'Public' : 'Private'}
                    </div>
                    
                    {event.isVirtual && (
                      <div className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                        Virtual
                      </div>
                    )}
                    
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
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-12 bg-muted/20 rounded-lg text-center">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <CalendarDays size={32} className="text-primary" />
          </div>
          <h3 className="text-xl font-medium">No events found</h3>
          <p className="text-muted-foreground mt-2 max-w-md">
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