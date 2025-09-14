import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Users, Calendar, Map, Heart, UserPlus, Coffee, 
         Activity, Briefcase, GraduationCap, Palette } from 'lucide-react';

export default function Connect() {
  const { user, isLoading } = useAuth();

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
        <h1 className="text-3xl font-bold mb-4">Connect in Community</h1>
        <p className="mb-8 text-center max-w-md">
          Find and join Christian communities based on shared interests and location.
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

  const connectFeatures = [
    {
      title: 'Local Groups',
      description: 'Find and join Christian communities in your city based on shared interests.',
      icon: <Users className="h-8 w-8 text-primary" />,
      link: '/communities',
      color: 'bg-emerald-50'
    },
    {
      title: 'Christian Creatives',
      description: 'Connect with writers, artists, musicians, and other creative Christians.',
      icon: <Palette className="h-8 w-8 text-primary" />,
      link: '/communities/creatives',
      color: 'bg-pink-50'
    },
    {
      title: 'Christian Entrepreneurs',
      description: 'Network with business owners and startup founders who share your faith.',
      icon: <Briefcase className="h-8 w-8 text-primary" />,
      link: '/communities/entrepreneurs',
      color: 'bg-amber-50'
    },
    {
      title: 'Christian Fitness',
      description: 'Find workout partners, sports teams, and wellness groups for believers.',
      icon: <Activity className="h-8 w-8 text-primary" />,
      link: '/communities/fitness',
      color: 'bg-blue-50'
    },
    {
      title: 'College Students',
      description: 'Connect with other Christian students at your university or in your city.',
      icon: <GraduationCap className="h-8 w-8 text-primary" />,
      link: '/communities/college',
      color: 'bg-purple-50'
    },
    {
      title: 'Events Near You',
      description: 'Discover Christian events happening in your area.',
      icon: <Calendar className="h-8 w-8 text-primary" />,
      link: '/events',
      color: 'bg-indigo-50'
    },
    {
      title: 'Find Christians Near You',
      description: 'Connect with believers in your area who share your interests.',
      icon: <Map className="h-8 w-8 text-primary" />,
      link: '/near-me',
      color: 'bg-teal-50'
    },
    {
      title: 'Start a Group',
      description: 'Create your own local Christian community around shared interests.',
      icon: <UserPlus className="h-8 w-8 text-primary" />,
      link: '/communities',
      color: 'bg-green-50'
    },
    {
      title: 'Prayer Requests',
      description: 'Share your prayer needs and pray for others in the community.',
      icon: <Heart className="h-8 w-8 text-primary" />,
      link: '/prayer-requests',
      color: 'bg-rose-50'
    },
    {
      title: 'Coffee Chats',
      description: 'Schedule one-on-one conversations with believers who share your interests.',
      icon: <Coffee className="h-8 w-8 text-primary" />,
      link: '/coffee-chats',
      color: 'bg-orange-50'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Connect in Community</h1>
        <p className="text-muted-foreground mt-2">
          Find and join Christian communities based on shared interests and location
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connectFeatures.map((feature, index) => (
          <Card key={index} className={`${feature.color} border-none shadow-sm hover:shadow transition-shadow`}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                {feature.icon}
              </div>
              <CardTitle className="mt-4">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-700">{feature.description}</CardDescription>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href={feature.link}>Explore</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Button asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}