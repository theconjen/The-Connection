import { Link } from "wouter";
import { 
  Home, 
  MessageCircle, 
  MessageSquare,
  PenSquare,
  Users
} from "lucide-react";
import { useState, useEffect } from "react";

interface MobileNavigationProps {
  currentPath: string;
}

export default function MobileNavigation({ currentPath }: MobileNavigationProps) {
  const [activeTab, setActiveTab] = useState(currentPath);
  const [scrolled, setScrolled] = useState(false);

  // Main navigation items - optimize for mobile tapping and most commonly used features
  const navItems = [
    {
      icon: <Home className="h-5 w-5" />,
      activeIcon: <Home className="h-5 w-5 fill-primary" />,
      label: "Home",
      path: "/"
    },
    {
      icon: <MessageCircle className="h-5 w-5" />,
      activeIcon: <MessageCircle className="h-5 w-5 fill-primary" />,
      label: "Feed",
      path: "/microblogs"
    },
    {
      icon: <PenSquare className="h-5 w-5" />,
      activeIcon: <PenSquare className="h-5 w-5 fill-primary" />,
      label: "Create",
      path: "/submit-post"
    },
    {
      icon: <Users className="h-5 w-5" />,
      activeIcon: <Users className="h-5 w-5 fill-primary" />,
      label: "Community",
      path: "/communities"
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      activeIcon: <MessageSquare className="h-5 w-5 fill-primary" />,
      label: "Chat",
      path: "/messages"
    }
  ];

  // Update active tab on path change
  useEffect(() => {
    setActiveTab(currentPath);
  }, [currentPath]);

  // Detect scroll to show/hide shadow on nav
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 bg-background border-t md:hidden z-40 transition-all duration-200 max-w-full overflow-hidden
        ${scrolled ? 'border-border/20 shadow-lg' : 'border-border/10'}
      `}
    >
      <div className="grid grid-cols-5 w-full">
        {navItems.map((item, index) => (
          <Link key={index} href={item.path} className="w-full">
            <button 
              className={`flex flex-col items-center justify-center py-3 w-full relative
                ${activeTab === item.path 
                  ? "text-primary" 
                  : "text-muted-foreground"
                }
              `}
            >
              {activeTab === item.path ? item.activeIcon : item.icon}
              
              <span className="text-xs mt-1 font-medium truncate">
                {item.label}
              </span>
              
              {/* Active indicator line */}
              {activeTab === item.path && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-10 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          </Link>
        ))}
      </div>
    </nav>
  );
}