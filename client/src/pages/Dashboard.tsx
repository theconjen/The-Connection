import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { BookOpen, Shield, Video, Lightbulb, BookMarked, 
         Map, Compass, Heart, Activity, Briefcase, GraduationCap, Palette, UserPlus, Calendar } from 'lucide-react';

export default function Dashboard() {
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
        <h1 className="text-3xl font-bold mb-4">Welcome to The Connection</h1>
        <p className="mb-8 text-center max-w-md">
          Connect with fellow Christians based on shared interests and location.
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

  const growFeatures = [
    {
      title: 'Bible Study',
      description: 'Deepen your understanding of Scripture through interactive studies and discussions.',
      icon: <BookOpen className="h-8 w-8 text-primary" />,
      link: '/bible-study',
      color: 'bg-blue-50'
    },
    {
      title: 'Apologetics',
      description: 'Strengthen your faith with resources to defend and explain your Christian beliefs.',
      icon: <Shield className="h-8 w-8 text-primary" />,
      link: '/apologetics',
      color: 'bg-amber-50'
    },
    {
      title: 'Livestreams',
      description: 'Watch and participate in live teachings, worship, and discussions.',
      icon: <Video className="h-8 w-8 text-primary" />,
      link: '/livestreams',
      color: 'bg-red-50'
    },
    {
      title: 'Discipleship',
      description: 'Grow in your faith journey through structured discipleship programs.',
      icon: <Lightbulb className="h-8 w-8 text-primary" />,
      link: '/discipleship',
      color: 'bg-green-50'
    },
    {
      title: 'Scripture Memory',
      description: 'Tools to help you memorize and internalize God\'s Word.',
      icon: <BookMarked className="h-8 w-8 text-primary" />,
      link: '/scripture-memory',
      color: 'bg-purple-50'
    }
  ];

  const connectFeatures = [
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
      color: 'bg-emerald-50'
    },
    {
      title: 'College Students',
      description: 'Connect with other Christian students at your university or in your city.',
      icon: <GraduationCap className="h-8 w-8 text-primary" />,
      link: '/communities/college',
      color: 'bg-indigo-50'
    },
    {
      title: 'Find Christians Near You',
      description: 'Connect with believers in your area who share your interests.',
      icon: <Map className="h-8 w-8 text-primary" />,
      link: '/near-me',
      color: 'bg-teal-50'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Welcome Section */}
      <div className="mobile-modern-card p-6">
        <h1 className="text-2xl md:text-3xl font-bold mobile-text-modern">Welcome, {user.displayName || user.username}!</h1>
        <p className="text-muted-foreground mt-2 mobile-text-modern">
          Connect with others and grow in your faith journey
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button className="h-auto py-6 flex flex-col mobile-button-modern" asChild>
          <Link href="/discover">
            <Compass className="h-6 w-6 mb-2" />
            <span className="mobile-text-modern">Discover Communities</span>
          </Link>
        </Button>
        <Button className="h-auto py-6 flex flex-col mobile-modern-card border-2 border-primary/20 hover:border-primary/40 text-primary" variant="outline" asChild>
          <Link href="/communities">
            <UserPlus className="h-6 w-6 mb-2" />
            <span className="mobile-text-modern">Start a Group</span>
          </Link>
        </Button>
        <Button className="h-auto py-6 flex flex-col mobile-modern-card bg-secondary/10 hover:bg-secondary/20 text-secondary" variant="secondary" asChild>
          <Link href="/events/nearby">
            <Calendar className="h-6 w-6 mb-2" />
            <span className="mobile-text-modern">Find Events Near Me</span>
          </Link>
        </Button>
      </div>

      {/* Grow Section */}
      <section className="space-y-4">
        <div className="mobile-modern-card p-4 flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold mobile-text-modern">Grow in Knowledge</h2>
          <Button variant="ghost" className="text-primary hover:bg-primary/10" asChild>
            <Link href="/grow">View All</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {growFeatures.slice(0, 3).map((feature, index) => (
            <Card key={index} className={`mobile-modern-card ${feature.color} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
              <CardHeader className="pb-2 p-4">
                <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-white shadow-sm mb-3">
                  {feature.icon}
                </div>
                <CardTitle className="mobile-text-modern text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <CardDescription className="text-gray-700 mobile-text-modern text-sm">{feature.description}</CardDescription>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button variant="outline" className="w-full mobile-modern-card border-primary/30 text-primary hover:bg-primary/5" asChild>
                  <Link href={feature.link}>Explore</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Connect Section */}
      <section className="space-y-4 pb-20">
        <div className="mobile-modern-card p-4 flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold mobile-text-modern">Connect in Community</h2>
          <Button variant="ghost" className="text-primary hover:bg-primary/10" asChild>
            <Link href="/connect">View All</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connectFeatures.slice(0, 3).map((feature, index) => (
            <Card key={index} className={`mobile-modern-card ${feature.color} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
              <CardHeader className="pb-2 p-4">
                <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-white shadow-sm mb-3">
                  {feature.icon}
                </div>
                <CardTitle className="mobile-text-modern text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <CardDescription className="text-gray-700 mobile-text-modern text-sm">{feature.description}</CardDescription>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button variant="outline" className="w-full mobile-modern-card border-secondary/30 text-secondary hover:bg-secondary/5" asChild>
                  <Link href={feature.link}>Explore</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}