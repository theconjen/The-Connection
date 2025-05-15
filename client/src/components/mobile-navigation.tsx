import { Link } from "wouter";
import { 
  Home, 
  MessageCircle, 
  Search, 
  BookOpen, 
  Menu, 
  PenSquare,
  Users,
  CalendarDays
} from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import SidebarNavigation from "@/components/sidebar-navigation";
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
      icon: <BookOpen className="h-5 w-5" />,
      activeIcon: <BookOpen className="h-5 w-5 fill-primary" />,
      label: "Bible",
      path: "/bible-study"
    },
    {
      icon: <Menu className="h-5 w-5" />,
      activeIcon: <Menu className="h-5 w-5 fill-primary" />,
      label: "More",
      isSheet: true
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
      className={`fixed bottom-0 left-0 right-0 bg-background border-t md:hidden z-40 transition-all duration-200
        ${scrolled ? 'border-border/20 shadow-lg' : 'border-border/10'}
      `}
    >
      <div className="flex items-center justify-between px-1">
        {navItems.map((item, index) => 
          item.isSheet ? (
            <Sheet key={index}>
              <SheetTrigger asChild>
                <button 
                  className={`flex flex-col items-center justify-center py-3 px-2 w-full
                    ${activeTab === item.path 
                      ? "text-primary" 
                      : "text-muted-foreground"
                    }
                  `}
                >
                  {activeTab === item.path ? item.activeIcon : item.icon}
                  <span className="text-xs mt-1 font-medium">{item.label}</span>
                </button>
              </SheetTrigger>
              <SheetContent 
                side="bottom" 
                className="h-[85vh] rounded-t-xl border-t border-border/10 pb-safe-area-inset-bottom pt-6"
              >
                <SheetHeader>
                  <SheetTitle className="text-center text-xl font-medium">More Options</SheetTitle>
                </SheetHeader>
                <div className="py-4 overflow-y-auto h-full">
                  <SidebarNavigation currentPath={currentPath} />
                  
                  <SheetClose asChild className="mt-4">
                    <Button variant="secondary" className="w-full">
                      Close
                    </Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Link key={index} href={item.path}>
              <button 
                className={`flex flex-col items-center justify-center py-3 px-2 w-full relative
                  ${activeTab === item.path 
                    ? "text-primary" 
                    : "text-muted-foreground"
                  }
                `}
              >
                {/* Special styling for create button */}
                {item.path === "/submit-post" ? (
                  <div className="flex items-center justify-center h-10 w-10 rounded-full 
                    bg-gradient-to-r from-primary to-primary-600 shadow-md -mt-6 mb-0.5">
                    <PenSquare className="h-5 w-5 text-white" />
                  </div>
                ) : (
                  activeTab === item.path ? item.activeIcon : item.icon
                )}
                
                <span className={`text-xs mt-1 font-medium ${item.path === "/submit-post" ? "-mt-1" : ""}`}>
                  {item.label}
                </span>
                
                {/* Active indicator line */}
                {activeTab === item.path && !item.isSheet && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-10 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            </Link>
          )
        )}
      </div>
    </nav>
  );
}