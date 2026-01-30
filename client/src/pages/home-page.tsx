import { Link } from "wouter";
import { useAuth, AuthContextType } from "../hooks/use-auth";
import PersonalizedFeed from "../components/PersonalizedFeed";
import { useMediaQuery } from "../hooks/use-media-query";
import {
  Users,
  Calendar,
  BookOpen,
  MessageSquare,
  Heart
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

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

  // Simplified feature cards matching mobile tabs
  const featuredApps = [
    {
      title: "Communities",
      description: "Connect with other believers in specialized communities for encouragement and discussion.",
      icon: <Users className="h-6 w-6 text-[#7C6B78]" />,
      path: "/communities",
      color: "bg-[#7C6B78]"
    },
    {
      title: "Events",
      description: "Discover upcoming in-person and virtual events to connect with the Christian community.",
      icon: <Calendar className="h-6 w-6 text-[#B56A55]" />,
      path: "/events",
      color: "bg-[#B56A55]"
    },
    {
      title: "Apologetics",
      description: "Discover resources to help you understand and defend your faith with confidence.",
      icon: <BookOpen className="h-6 w-6 text-[#5C6B5E]" />,
      path: "/apologetics",
      color: "bg-[#5C6B5E]"
    },
    {
      title: "Prayer Requests",
      description: "Share your prayer needs or pray for others in our supportive prayer community.",
      icon: <Heart className="h-6 w-6 text-pink-600" />,
      path: "/prayer-requests",
      color: "bg-pink-500"
    },
    {
      title: "Advice",
      description: "Ask questions and get thoughtful advice from the community on matters of faith and life.",
      icon: <MessageSquare className="h-6 w-6 text-[#C7A45B]" />,
      path: "/advice",
      color: "bg-[#C7A45B]"
    },
  ];

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      {user ? (
        // Clean, mobile-like layout for authenticated users
        <div className="space-y-6">
          {/* Personalized Feed with 3 sections matching mobile */}
          <PersonalizedFeed limit={15} />
        </div>
      ) : (
        // Guest User Experience
        <div className="flex flex-col min-h-[calc(100vh-4rem)]">
          {/* Hero Section */}
          <div className="mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Welcome to The Connection</h1>
            <p className="text-lg text-muted-foreground">A community where faith grows through meaningful connections.</p>
          </div>

          {/* Feature Grid for Guests */}
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-6 text-center">Explore What We Offer</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
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
          <div className="mt-6 p-8 rounded-xl bg-gradient-to-r from-[#5C6B5E]/10 to-[#B56A55]/10 text-center shadow-sm">
            <h3 className="text-2xl font-semibold mb-3">Join Our Community</h3>
            <p className="mb-6 text-lg max-w-xl mx-auto text-muted-foreground">
              Connect with fellow believers, access all features, and start your journey with us today.
            </p>
            <Link href="/auth" className="inline-block">
              <Button size="lg" className="font-medium text-base px-8 py-6 shadow-md bg-[#5C6B5E] hover:bg-[#4A574C] text-white">
                Sign Up Now
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
