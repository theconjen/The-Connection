import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  Home, 
  Compass, 
  BookOpen, 
  Bookmark, 
  Users, 
  Heart, 
  BookMarked,
  PenTool,
  User,
  Video,
  MessageCircle,
  HeartHandshake,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarNavigationProps {
  currentPath: string;
}

export default function SidebarNavigation({ currentPath }: SidebarNavigationProps) {
  const menuItems = [
    { 
      path: "/", 
      label: "Home Feed", 
      icon: <Home className="mr-3 w-5 h-5" />
    },
    { 
      path: "/microblogs", 
      label: "Feed", 
      icon: <MessageCircle className="mr-3 w-5 h-5" />,
      badge: "New"
    },
    { 
      path: "/discover", 
      label: "Discover", 
      icon: <Compass className="mr-3 w-5 h-5" />
    },
    { 
      path: "/livestreams", 
      label: "Livestreams", 
      icon: <Video className="mr-3 w-5 h-5" />
    },
    { 
      path: "/events", 
      label: "Events", 
      icon: <Calendar className="mr-3 w-5 h-5" />,
      badge: "New"
    },
    { 
      path: "/apologetics", 
      label: "Apologetics", 
      icon: <BookOpen className="mr-3 w-5 h-5" />
    },
    { 
      path: "/prayer-requests", 
      label: "Prayer Requests", 
      icon: <HeartHandshake className="mr-3 w-5 h-5" />
    },
    { 
      path: "/saved", 
      label: "Saved Posts", 
      icon: <Bookmark className="mr-3 w-5 h-5" />
    },
    { 
      path: "/groups", 
      label: "My Groups", 
      icon: <Users className="mr-3 w-5 h-5" />
    },
    {
      path: "/profile",
      label: "My Profile",
      icon: <User className="mr-3 w-5 h-5" />
    },
    {
      path: "/submit",
      label: "Create Post",
      icon: <PenTool className="mr-3 w-5 h-5" />
    }
  ];

  // Top communities section
  const topCommunities = [
    { id: 1, name: "Women of Faith", path: "/community/women-of-faith", icon: <Heart className="w-4 h-4" /> },
    { id: 2, name: "Daily Scripture", path: "/community/daily-scripture", icon: <BookMarked className="w-4 h-4" /> },
    { id: 3, name: "College Life", path: "/community/college-life", icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-secondary/20 shadow-sm">
        <CardHeader className="px-4 py-3 bg-gradient-to-r from-primary/5 to-secondary/10 border-b border-secondary/20">
          <CardTitle className="font-semibold text-foreground">Navigation</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link key={item.path} href={item.path} 
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-lg transition-colors",
                  currentPath === item.path
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-muted hover:text-primary"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
                {'badge' in item && (
                  <span className="ml-auto text-xs bg-secondary/30 text-secondary-foreground px-1.5 py-0.5 rounded-full font-medium">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </CardContent>
      </Card>

      {/* Top Communities */}
      <Card className="overflow-hidden border-secondary/20 shadow-sm">
        <CardHeader className="px-4 py-3 bg-gradient-to-r from-secondary/5 to-accent/10 border-b border-secondary/20">
          <CardTitle className="font-semibold text-foreground">Top Communities</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <nav className="space-y-1">
            {topCommunities.map((community) => (
              <Link key={community.id} href={community.path}
                className="flex items-center px-3 py-2.5 rounded-lg text-foreground hover:bg-muted hover:text-primary transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-secondary/10 text-secondary-foreground flex items-center justify-center mr-3">
                  {community.icon}
                </div>
                <span>{community.name}</span>
              </Link>
            ))}
            <Link href="/discover"
              className="flex items-center px-3 py-2.5 text-sm text-primary hover:underline"
            >
              See more communities →
            </Link>
          </nav>
        </CardContent>
      </Card>

      {/* Design Accent at Bottom */}
      <div className="h-24 rounded-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-secondary/20 to-accent/30 p-3 flex items-end">
          <div className="text-sm font-medium text-foreground">
            The Connection
          </div>
        </div>
        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm"></div>
        <div className="absolute -top-6 -left-6 w-16 h-16 rounded-full bg-primary/20 backdrop-blur-sm"></div>
      </div>
    </div>
  );
}
