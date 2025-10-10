import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth } from '../hooks/use-auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Map, Users, Calendar, Pin, Info, Clock } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import type { Community, Event } from '@shared/mobile-web/types';

// Type definitions
// Using shared Community and Event types

export default function NearMe() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [filters, setFilters] = useState({
    city: '',
    state: '',
    radius: '25',
    interests: [] as string[]
  });
  const [showMap, setShowMap] = useState(false);

  // Get current user location from profile if available
  useEffect(() => {
    if (user) {
      if (user.city) {
        setFilters(prev => ({ ...prev, city: user.city || '' }));
      }
      if (user.state) {
        setFilters(prev => ({ ...prev, state: user.state || '' }));
      }
    }
  }, [user]);

  // Fetch communities based on location
  const fetchCommunities = async () => {
    if (!filters.city && !filters.state) {
      toast({
        title: "Location Required",
        description: "Please enter a city or state to find communities near you.",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingCommunities(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.city) params.append('city', filters.city);
      if (filters.state) params.append('state', filters.state);
      if (filters.radius) params.append('radius', filters.radius);
      if (filters.interests.length > 0) params.append('interests', filters.interests.join(','));

      const response = await fetch(`/api/search/communities?${params.toString()}`);
      const data = await response.json();
      
      if (data.results) {
        setCommunities(data.results);
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
      toast({
        title: "Error",
        description: "Failed to fetch communities. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingCommunities(false);
    }
  };

  // Fetch events based on location
  const fetchEvents = async () => {
    if (!filters.city && !filters.state) {
      toast({
        title: "Location Required",
        description: "Please enter a city or state to find events near you.",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingEvents(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.city) params.append('city', filters.city);
      if (filters.state) params.append('state', filters.state);
      if (filters.radius) params.append('radius', filters.radius);

      const response = await fetch(`/api/events/nearby?${params.toString()}`);
      const data = await response.json();
      
      if (data.results) {
        setEvents(data.results);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to fetch events. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Fetch all data
  const handleSearch = () => {
    fetchCommunities();
    fetchEvents();
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Toggle interests
  const toggleInterest = (interest: string) => {
    setFilters(prev => {
      if (prev.interests.includes(interest)) {
        return { ...prev, interests: prev.interests.filter(i => i !== interest) };
      } else {
        return { ...prev, interests: [...prev.interests, interest] };
      }
    });
  };

  // Format date for display
  const formatDate = (dateStr: string, timeStr: string) => {
    const date = new Date(`${dateStr}T${timeStr}`);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <h1 className="text-3xl font-bold mb-4">Find Christians Near You</h1>
        <p className="mb-8 text-center max-w-md">
          Connect with believers in your area who share your interests and faith.
        </p>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/login">Log In</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    );
  }

  const INTERESTS = [
    // Creative interests
    'writing', 'art', 'music', 'photography', 'filmmaking', 
    // Professional interests
    'entrepreneurship', 'business', 'marketing', 'tech', 'startups',
    // Fitness interests
    'fitness', 'running', 'yoga', 'sports', 'hiking',
    // Educational interests
    'college', 'graduate-school', 'study-groups', 'academic',
    // Traditional Christian interests
    'bible-study', 'prayer', 'worship', 'missions', 'community-service'
  ];

  const US_STATES = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", 
    "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", 
    "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", 
    "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", 
    "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", 
    "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", 
    "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Find Christians Near You</h1>
        <p className="text-muted-foreground mt-2">
          Connect with believers in your area who share your faith and interests
        </p>
      </div>

      {/* Search Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Search Filters</CardTitle>
          <CardDescription>
            Find communities and events in your area
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <label htmlFor="city" className="text-sm font-medium">City</label>
              <Input 
                id="city" 
                name="city"
                placeholder="Enter your city" 
                value={filters.city}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="state" className="text-sm font-medium">State</label>
              <Select onValueChange={(value) => handleSelectChange('state', value)} value={filters.state}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="radius" className="text-sm font-medium">Search Radius (miles)</label>
              <Select onValueChange={(value) => handleSelectChange('radius', value)} value={filters.radius}>
                <SelectTrigger>
                  <SelectValue placeholder="Search radius" />
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
            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full">
                Search
              </Button>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <label className="text-sm font-medium">Filter by Interests</label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(interest => (
                <Badge 
                  key={interest}
                  variant={filters.interests.includes(interest) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleInterest(interest)}
                >
                  {interest.replace('-', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toggle Map View */}
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          onClick={() => setShowMap(!showMap)}
          className="flex items-center gap-2"
        >
          <Map className="h-4 w-4" />
          {showMap ? "Hide Map" : "Show Map"}
        </Button>
      </div>

      {/* Map View (placeholder) */}
      {showMap && (
        <Card className="mb-8">
          <CardContent className="p-0">
            <div className="bg-slate-100 text-center p-16">
              <p className="text-muted-foreground">Map view will display communities and events here</p>
              <p className="text-sm text-muted-foreground mt-2">(Map integration to be implemented)</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Communities Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Users className="h-6 w-6" />
            Communities Near You
          </h2>
          
          {isLoadingCommunities ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : communities.length > 0 ? (
            <div className="space-y-4">
              {communities.map(community => (
                <Card key={community.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{community.name}</CardTitle>
                      {community.isLocalCommunity && (
                        <Badge variant="secondary" className="ml-2">Local</Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <Pin className="h-3 w-3" />
                      {community.city}, {community.state}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-gray-700 line-clamp-2">{community.description}</p>
                    
                    {community.interestTags && community.interestTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {community.interestTags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag.replace('-', ' ')}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {community.memberCount || 0} members
                    </div>
                    <Button size="sm" asChild>
                      <Link href={`/communities/${community.slug}`}>View</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-slate-50 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Info className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-center text-muted-foreground">
                  No communities found in this area.
                </p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/communities">Start a Community</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Events Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Events Near You
          </h2>
          
          {isLoadingEvents ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-4">
              {events.map(event => (
                <Card key={event.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Pin className="h-3 w-3" />
                      {event.city}, {event.state}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-gray-700 line-clamp-2">{event.description}</p>
                    
                    <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(event.eventDate, event.startTime)}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {event.attendeeCount || 0} attending
                    </div>
                    <Button size="sm" asChild>
                      <Link href={`/events/${event.id}`}>View</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-slate-50 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Info className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-center text-muted-foreground">
                  No events found in this area.
                </p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/events/create">Create an Event</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="mt-12 text-center">
        <Button asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}