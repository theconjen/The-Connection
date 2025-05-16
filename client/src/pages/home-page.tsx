import { Link } from "wouter";
import { useAuth, AuthContextType } from "@/hooks/use-auth";
import WelcomeBanner from "@/components/welcome-banner";
import { useMediaQuery } from "@/hooks/use-media-query";
import { 
  MessageCircle, 
  BookOpen, 
  Users, 
  FileHeart, 
  Tv, 
  Calendar, 
  Sparkles, 
  Lightbulb, 
  MessageSquare
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

function FeatureCard({ title, description, icon, path, color }: FeatureCardProps) {
  return (
    <Card className="transition-all duration-200 hover:shadow-md overflow-hidden border h-full">
      <div className={`h-1 w-full ${color}`}></div>
      <CardContent className="p-4">
        <div className="flex items-center mb-2">
          <div className={`inline-flex items-center justify-center rounded-full w-8 h-8 ${color} bg-opacity-15 mr-3`}>
            {icon}
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
      </CardContent>
      <CardFooter className="border-t bg-muted/10 p-2">
        <Link href={path} className="w-full">
          <Button variant="outline" size="sm" className="w-full">Go to {title}</Button>
        </Link>
      </CardFooter>
    </Card>
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
    {
      title: "Bible Study",
      description: "Dive into God's Word with Bible study plans, devotionals, and reading tools.",
      icon: <BookOpen className="h-6 w-6 text-green-600" />,
      path: "/bible-study",
      color: "bg-green-500"
    },
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
    {
      title: "Livestreams",
      description: "Watch live services, teachings, and special events from Christian speakers and churches.",
      icon: <Tv className="h-6 w-6 text-sky-600" />,
      path: "/livestreams",
      color: "bg-sky-500"
    },
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
    <div className="container mx-auto px-4 py-4 flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Welcome Banner - Smaller and more compact */}
      <WelcomeBanner className="mb-3" />
      
      <div className="mb-3">
        <h2 className="text-xl font-bold mb-1">Explore The Connection</h2>
        <p className="text-sm text-muted-foreground">Discover features to support your faith journey.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 flex-grow">
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

      {!user && (
        <div className="mt-4 p-3 border rounded-lg bg-muted/10 text-center">
          <h3 className="text-lg font-semibold">Join Our Community</h3>
          <p className="mb-2 text-sm mx-auto">Connect with fellow believers and access all features.</p>
          <Link href="/auth">
            <Button size="sm" className="btn-gradient font-medium">Sign Up Now</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
