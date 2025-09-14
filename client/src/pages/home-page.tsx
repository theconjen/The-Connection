import { Link } from "wouter";
import { useAuth, AuthContextType } from "../hooks/use-auth";
import WelcomeBanner from "../components/welcome-banner";
import PersonalizedFeed from "../components/PersonalizedFeed";
import { useMediaQuery } from "../hooks/use-media-query";
import { 
  MessageCircle, 
  BookOpen, 
  Users, 
  FileHeart, 
  Tv, 
  Calendar, 
  Sparkles, 
  Lightbulb, 
  MessageSquare,
  Briefcase,
  Activity,
  GraduationCap,
  Palette,
  TrendingUp,
  Heart,
  Plus,
  Globe
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { FriendsSection } from "../components/FriendsSection";
import MobileModernButton from "../components/mobile-modern-button";
import TouchFeedback from "../components/mobile-touch-feedback";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

function FeatureCard({ title, description, icon, path, color }: FeatureCardProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <Link href={path} className="block h-full">
      <Card className="transition-all duration-300 hover:shadow-md hover:translate-y-[-2px] overflow-hidden border-none h-full shadow-sm">
        <div className={`h-2 w-full ${color}`}></div>
        <CardContent className={`${isMobile ? 'pt-4 px-4 pb-3' : 'pt-5 px-5 pb-4'}`}>
          <div className={`inline-flex items-center justify-center rounded-full ${isMobile ? 'w-10 h-10' : 'w-12 h-12'} ${color} bg-opacity-15 mb-3`}>
            {icon}
          </div>
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold mb-1`}>{title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

interface HomePageProps {
  isGuest?: boolean;
}

export default function HomePage({ isGuest = false }: HomePageProps) {
  const { user } = useAuth() as AuthContextType;
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  const featuredApps = [
    {
      title: "Feed",
      description: "Explore posts and discussions from the community on topics of faith and spiritual growth.",
      icon: <MessageCircle className="h-6 w-6 text-blue-600" />,
      path: "/microblogs",
      color: "bg-blue-500"
    },
    {
      title: "Communities",
      description: "Connect with other believers in specialized communities for encouragement and discussion.",
      icon: <Users className="h-6 w-6 text-purple-600" />,
      path: "/communities",
      color: "bg-purple-500"
    },
    // {
    //   title: "Bible Study",
    //   description: "Dive into God's Word with Bible study plans, devotionals, and reading tools.",
    //   icon: <BookOpen className="h-6 w-6 text-green-600" />,
    //   path: "/bible-study",
    //   color: "bg-green-500"
    // }, // Hidden for MVP
    {
      title: "Prayer Requests",
      description: "Share your prayer needs or pray for others in our supportive prayer community.",
      icon: <Sparkles className="h-6 w-6 text-red-600" />,
      path: "/prayer-requests",
      color: "bg-red-500"
    },
    {
      title: "Apologetics",
      description: "Discover resources to help you understand and defend your faith with confidence.",
      icon: <Lightbulb className="h-6 w-6 text-amber-600" />,
      path: "/apologetics",
      color: "bg-amber-500"
    },
    // {
    //   title: "Livestreams",
    //   description: "Watch live services, teachings, and special events from Christian speakers and churches.",
    //   icon: <Tv className="h-6 w-6 text-sky-600" />,
    //   path: "/livestreams",
    //   color: "bg-sky-500"
    // }, // Hidden for MVP
    {
      title: "Events",
      description: "Discover upcoming in-person and virtual events to connect with the Christian community.",
      icon: <Calendar className="h-6 w-6 text-indigo-600" />,
      path: "/events",
      color: "bg-indigo-500"
    },
    {
      title: "Forums",
      description: "Discover and engage with discussions, ask questions, and share insights with the Christian community.",
      icon: <FileHeart className="h-6 w-6 text-orange-600" />,
      path: "/forums",
      color: "bg-orange-500"
    },

  ];

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {user ? (
        // Social Media Style Layout for Authenticated Users
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Quick Actions & Navigation */}
          <div className="lg:w-80 space-y-4">
            {/* Welcome Card */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center text-white font-bold">
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="font-semibold">Welcome back!</h3>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Link href="/submit-post">
                  <Button className="w-full" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Share Something
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <h4 className="font-semibold flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Your Activity
                </h4>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Posts this week</span>
                  <Badge variant="secondary">3</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Prayer requests</span>
                  <Badge variant="secondary">2</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Communities joined</span>
                  <Badge variant="secondary">5</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Navigation */}
            <Card>
              <CardHeader>
                <h4 className="font-semibold flex items-center">
                  <Globe className="h-4 w-4 mr-2" />
                  Explore More
                </h4>
              </CardHeader>
              <CardContent className="space-y-2">
                {featuredApps.slice(0, 6).map((app, index) => (
                  <Link key={index} href={app.path}>
                    <Button variant="ghost" className="w-full justify-start h-auto p-2">
                      {app.icon}
                      <span className="ml-2 text-sm">{app.title}</span>
                    </Button>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Personalized Feed */}
          <div className="flex-1 max-w-2xl">
            <PersonalizedFeed limit={15} />
          </div>

          {/* Right Sidebar - Friends & Recommendations */}
          <div className="lg:w-80 space-y-4">
            <FriendsSection />
            
            {/* Trending Topics */}
            <Card>
              <CardHeader>
                <h4 className="font-semibold flex items-center">
                  <Heart className="h-4 w-4 mr-2" />
                  Trending in Faith
                </h4>
              </CardHeader>
              <CardContent className="space-y-2">
                {['#PrayerRequest', '#BibleStudy', '#Worship', '#Community', '#Faith'].map((tag) => (
                  <div key={tag} className="flex items-center justify-between">
                    <span className="text-sm text-primary cursor-pointer hover:underline">{tag}</span>
                    <Badge variant="outline" className="text-xs">234</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        // Guest User Experience
        <div className="flex flex-col min-h-[calc(100vh-4rem)]">
          {/* Hero Section */}
          <div className="mb-10">
            <WelcomeBanner className="mb-6" />
            
            <div className="max-w-2xl mx-auto text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-3">Welcome to The Connection</h1>
              <p className="text-lg text-muted-foreground">A community where faith grows through meaningful connections.</p>
            </div>
          </div>
          
          {/* Feature Grid for Guests */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">Explore What We Offer</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
              {featuredApps.map((app, index) => (
                <FeatureCard
                  key={index}
                  title={app.title}
                  description={app.description}
                  icon={app.icon}
                  path={app.path}
                  color={app.color}
                />
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-6 p-8 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 text-center shadow-sm">
            <h3 className="text-2xl font-semibold mb-3">Join Our Community</h3>
            <p className="mb-6 text-lg max-w-xl mx-auto">Connect with fellow believers, access all features, and start your journey with us today.</p>
            <Link href="/auth" className="inline-block">
              <Button size="lg" className="btn-gradient font-medium text-base px-8 py-6 shadow-md active-scale touch-target">
                Sign Up Now
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
