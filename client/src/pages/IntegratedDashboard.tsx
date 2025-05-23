import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Home, MessageCircle, Users, Calendar, BookOpen, FileHeart, Sparkles, 
  Lightbulb, Tv, Bell, Menu, Search, ChevronRight, PlusCircle, Pin, CalendarDays, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

// Types for data
interface MicroblogPost {
  id: number;
  content: string;
  createdAt: Date | string;
  userId: number;
  likes: number;
  comments: number;
  user?: {
    id: number;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

interface Community {
  id: number;
  name: string;
  description: string;
  slug: string;
  memberCount: number | null;
  isLocalCommunity?: boolean;
  city?: string;
  state?: string;
}

interface Event {
  id: number;
  title: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string | null;
  isVirtual: boolean;
}

interface Forum {
  id: number;
  title: string;
  description: string;
  postsCount: number;
}

// Menubar component
function Menubar() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const menuItems = [
    { icon: <Home className="h-5 w-5" />, label: "Home", path: "/" },
    { icon: <MessageCircle className="h-5 w-5" />, label: "Feed", path: "/microblogs" },
    { icon: <Users className="h-5 w-5" />, label: "Communities", path: "/communities" },
    { icon: <Calendar className="h-5 w-5" />, label: "Events", path: "/events" },
    { icon: <BookOpen className="h-5 w-5" />, label: "Bible Study", path: "/bible-study" },
    { icon: <Sparkles className="h-5 w-5" />, label: "Prayer", path: "/prayer-requests" },
    { icon: <FileHeart className="h-5 w-5" />, label: "Forums", path: "/forums" },
    { icon: <Tv className="h-5 w-5" />, label: "Livestreams", path: "/livestreams" },
    { icon: <Lightbulb className="h-5 w-5" />, label: "Apologetics", path: "/apologetics" },
  ];

  return (
    <div className="px-4 py-2 border-b sticky top-0 bg-background z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {menuItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              <span className="hidden md:inline">{item.label}</span>
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/profile">
              <Avatar className="cursor-pointer">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback>{user.displayName?.charAt(0) || user.username?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Button asChild>
              <Link href="/auth">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Feed component to show microblog posts
function FeedSection() {
  const { data: posts = [], isLoading } = useQuery<MicroblogPost[]>({
    queryKey: ['/api/microblogs'],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Latest Updates</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/microblogs">See All</Link>
        </Button>
      </div>
      
      {posts.slice(0, 5).map(post => (
        <Card key={post.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Avatar>
                <AvatarImage src={post.user?.avatarUrl || undefined} />
                <AvatarFallback>{post.user?.displayName?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold">{post.user?.displayName || "User"}</span>
                  <span className="text-sm text-muted-foreground">@{post.user?.username}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {typeof post.createdAt === 'string' 
                      ? post.createdAt 
                      : format(new Date(post.createdAt), 'MMM d')}
                  </span>
                </div>
                
                <p className="mt-1">{post.content}</p>
                
                <div className="flex items-center gap-4 mt-3">
                  <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
                    💬 {post.comments || 0}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
                    ❤️ {post.likes || 0}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
                    🔄 Share
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      <div className="flex justify-center">
        <Button variant="outline" asChild>
          <Link href="/microblogs">View More Posts</Link>
        </Button>
      </div>
    </div>
  );
}

// Communities section
function CommunitiesSection() {
  const { data: communities = [], isLoading } = useQuery<Community[]>({
    queryKey: ['/api/communities'],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Your Communities</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/communities">See All</Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {communities.slice(0, 3).map(community => (
          <Card key={community.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{community.name}</CardTitle>
              <CardDescription className="line-clamp-2">{community.description}</CardDescription>
            </CardHeader>
            <CardFooter className="pt-0 flex justify-between">
              <div className="text-sm text-muted-foreground flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {community.memberCount || 0} members
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/community/${community.slug}`}>Visit</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
        
        <Button variant="outline" className="mt-2" asChild>
          <Link href="/communities">
            <PlusCircle className="h-4 w-4 mr-2" />
            Explore More Communities
          </Link>
        </Button>
      </div>
    </div>
  );
}

// Events section
function EventsSection() {
  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events/public'],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Get upcoming events only
  const upcomingEvents = events
    .filter(event => new Date(event.eventDate) >= new Date())
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Upcoming Events</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/events">See All</Link>
        </Button>
      </div>
      
      <div className="space-y-3">
        {upcomingEvents.slice(0, 3).map(event => (
          <Card key={event.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{event.title}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {format(new Date(event.eventDate), 'EEE, MMM d, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{event.startTime} - {event.endTime}</span>
                </div>
                
                {event.location && (
                  <div className="flex items-start gap-2">
                    <Pin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{event.location}</span>
                  </div>
                )}
                
                {event.isVirtual && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                    Virtual
                  </Badge>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={`/events/${event.id}`}>View Details</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
        
        <Button variant="outline" className="w-full mt-2" asChild>
          <Link href="/events">View All Events</Link>
        </Button>
      </div>
    </div>
  );
}

// Forums section
function ForumsSection() {
  const { data: forums = [], isLoading } = useQuery<Forum[]>({
    queryKey: ['/api/forums'],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Active Forums</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/forums">See All</Link>
        </Button>
      </div>
      
      <div className="space-y-3">
        {forums.slice(0, 3).map(forum => (
          <Card key={forum.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{forum.title}</CardTitle>
              <CardDescription className="line-clamp-2">{forum.description}</CardDescription>
            </CardHeader>
            <CardFooter className="pt-0 flex justify-between">
              <div className="text-sm text-muted-foreground">
                {forum.postsCount || 0} posts
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/forums/${forum.id}`}>View</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
        
        <Button variant="outline" className="w-full mt-2" asChild>
          <Link href="/forums">Browse All Forums</Link>
        </Button>
      </div>
    </div>
  );
}

// Main Dashboard Component
export default function IntegratedDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Define greetings based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Menubar */}
      <Menubar />
      
      {/* Main Content */}
      <div className="container px-4 py-6">
        {/* Greeting Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {getGreeting()}, {user ? (user.displayName || user.username) : 'Friend'}
          </h1>
          <p className="text-muted-foreground">
            Welcome to The Connection. Your Christian community platform.
          </p>
        </div>
        
        {/* Create Post / Search Section - Only for logged in users */}
        {user ? (
          <div className="mb-8 flex gap-4">
            <div className="flex-1">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user?.avatarUrl || undefined} />
                      <AvatarFallback>{user?.displayName?.charAt(0) || user?.username?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <Input 
                      placeholder="Share what's on your mind..." 
                      className="flex-1"
                      onClick={() => navigate('/submit')}
                      readOnly
                    />
                    <Button variant="outline" onClick={() => navigate('/submit')}>Post</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10">
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Join The Connection</h3>
                    <p className="text-muted-foreground">Sign up to post, connect with other believers, and access all features.</p>
                  </div>
                  <div className="flex gap-3">
                    <Button asChild>
                      <Link href="/auth">Sign Up</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/auth">Log In</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* 3-column layout for desktop, 1-column for mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Feed Column */}
          <div className="lg:col-span-6">
            <FeedSection />
          </div>
          
          {/* Side Columns */}
          <div className="lg:col-span-3">
            <CommunitiesSection />
          </div>
          
          <div className="lg:col-span-3">
            <Tabs defaultValue="events">
              <TabsList className="w-full">
                <TabsTrigger value="events" className="flex-1">Events</TabsTrigger>
                <TabsTrigger value="forums" className="flex-1">Forums</TabsTrigger>
              </TabsList>
              <TabsContent value="events" className="mt-4">
                <EventsSection />
              </TabsContent>
              <TabsContent value="forums" className="mt-4">
                <ForumsSection />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}