import { Link } from "wouter";
import { useAuth, AuthContextType } from "@/hooks/use-auth";
import { 
  Home,
  MessageCircle,
  BookOpen,
  Users,
  Calendar,
  FileHeart,
  Tv,
  Settings,
  HelpCircle,
  Sparkles,
  Handshake
} from "lucide-react";

interface SidebarNavigationProps {
  currentPath: string;
}

export default function SidebarNavigation({ currentPath }: SidebarNavigationProps) {
  const { user } = useAuth() as AuthContextType;

  const navItems = [
    {
      title: "Main",
      items: [
        { icon: <Home className="h-5 w-5" />, label: "Home", path: "/" },
        { icon: <MessageCircle className="h-5 w-5" />, label: "Feed", path: "/microblogs" },
        { icon: <BookOpen className="h-5 w-5" />, label: "Bible Study", path: "/bible-study" },
        { icon: <Users className="h-5 w-5" />, label: "Communities", path: "/communities" },
      ],
    },
    {
      title: "Resources",
      items: [
        { icon: <Calendar className="h-5 w-5" />, label: "Events", path: "/events" },
        { icon: <FileHeart className="h-5 w-5" />, label: "Prayer Requests", path: "/prayer-requests" },
        { icon: <Tv className="h-5 w-5" />, label: "Livestreams", path: "/livestreams" },
        { icon: <Sparkles className="h-5 w-5" />, label: "Apologetics", path: "/apologetics" },
      ],
    },
    {
      title: "Help",
      items: [
        { icon: <HelpCircle className="h-5 w-5" />, label: "FAQ", path: "/faq" },
        { icon: <Handshake className="h-5 w-5" />, label: "Support", path: "/support" },
        { icon: <Settings className="h-5 w-5" />, label: "Settings", path: "/settings" },
      ],
    },
  ];

  return (
    <div className="space-y-6 px-3">
      <div className="space-y-1">
        <h2 className="px-3 text-xl font-semibold tracking-tight text-gradient">
          The Connection
        </h2>
        <p className="px-3 text-sm text-muted-foreground">
          Building a Christ-centered community
        </p>
      </div>
      
      {user && (
        <div className="rounded-lg border border-secondary/20 px-3 py-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{user.username}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {navItems.map((section, i) => (
          <div key={i} className="space-y-2">
            <h3 className="px-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              {section.title}
            </h3>
            <nav className="grid gap-1">
              {section.items.map((item, j) => (
                <Link key={j} href={item.path}>
                  <div 
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer text-sm transition-all ${
                      currentPath === item.path
                        ? "bg-secondary/10 text-gradient font-medium"
                        : "hover:bg-secondary/5 text-foreground"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </div>
                </Link>
              ))}
            </nav>
          </div>
        ))}
      </div>

      {!user && (
        <div className="space-y-2">
          <Link href="/auth">
            <div className="w-full btn-gradient text-center py-2 px-4 rounded-lg font-medium transition-colors cursor-pointer">
              Sign In
            </div>
          </Link>
          <div className="text-center text-xs text-muted-foreground">
            Sign in to your account
          </div>
        </div>
      )}
    </div>
  );
}