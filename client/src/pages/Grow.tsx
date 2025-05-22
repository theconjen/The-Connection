import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { BookOpen, Shield, Video, Lightbulb, BookMarked, 
         MessageCircle, FileText, Compass, PlayCircle, Headphones } from 'lucide-react';

export default function Grow() {
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
        <h1 className="text-3xl font-bold mb-4">Grow in Knowledge</h1>
        <p className="mb-8 text-center max-w-md">
          Access resources to deepen your understanding of Scripture and strengthen your faith.
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
    },
    {
      title: 'Daily Devotionals',
      description: 'Start each day with Scripture-based reflections and prayer prompts.',
      icon: <FileText className="h-8 w-8 text-primary" />,
      link: '/devotionals',
      color: 'bg-indigo-50'
    },
    {
      title: 'Q&A Forums',
      description: 'Ask questions about the Bible, theology, and Christian living.',
      icon: <MessageCircle className="h-8 w-8 text-primary" />,
      link: '/forums/questions',
      color: 'bg-teal-50'
    },
    {
      title: 'Bible Commentary',
      description: 'Access theological insights and explanations of Scripture passages.',
      icon: <Compass className="h-8 w-8 text-primary" />,
      link: '/commentary',
      color: 'bg-orange-50'
    },
    {
      title: 'Sermon Library',
      description: 'Browse and listen to sermons from various Christian perspectives.',
      icon: <PlayCircle className="h-8 w-8 text-primary" />,
      link: '/sermons',
      color: 'bg-pink-50'
    },
    {
      title: 'Christian Podcasts',
      description: 'Listen to discussions on faith, theology, and Christian living.',
      icon: <Headphones className="h-8 w-8 text-primary" />,
      link: '/podcasts',
      color: 'bg-cyan-50'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Grow in Knowledge</h1>
        <p className="text-muted-foreground mt-2">
          Resources to deepen your understanding of Scripture and strengthen your faith
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {growFeatures.map((feature, index) => (
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