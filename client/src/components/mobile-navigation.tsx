import { Link } from "wouter";
import { 
  Home, 
  Compass, 
  BookOpen, 
  Users, 
  User, 
  Heart, 
  Video, 
  MessageCircle, 
  HeartHandshake, 
  Calendar, 
  MoreHorizontal,
  BookText,
  Bookmark,
  X,
  Settings,
  Bell,
  HelpCircle,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";

interface MobileNavigationProps {
  currentPath: string;
}

export default function MobileNavigation({ currentPath }: MobileNavigationProps) {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const { user } = useAuth();
  
  // Effect to detect scrolling and change navigation appearance
  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Main items visible in the bottom nav
  const mainItems = [
    { 
      path: "/", 
      label: "Home", 
      icon: <Home className="h-5 w-5" /> 
    },
    { 
      path: "/microblogs", 
      label: "Feed", 
      icon: <MessageCircle className="h-5 w-5" />,
      badge: "New"
    },
    { 
      path: "/discover", 
      label: "Discover", 
      icon: <Compass className="h-5 w-5" /> 
    },
    { 
      path: "/livestreams", 
      label: "Live", 
      icon: <Video className="h-5 w-5" />
    },
    { 
      path: "/profile", 
      label: "Profile", 
      icon: <User className="h-5 w-5" /> 
    },
  ];
  
  // Secondary items in the "More" sheet - organized by categories
  const moreItems = {
    community: [
      { 
        path: "/events", 
        label: "Events", 
        icon: <Calendar className="h-5 w-5" />,
        badge: "New",
        description: "Community gatherings and special occasions"
      },
      { 
        path: "/prayer-requests", 
        label: "Prayer Requests", 
        icon: <HeartHandshake className="h-5 w-5" />,
        description: "Share and pray for others' needs"
      },
      { 
        path: "/groups", 
        label: "My Groups", 
        icon: <Users className="h-5 w-5" />,
        description: "Your communities and group discussions"
      },
    ],
    content: [
      { 
        path: "/apologetics", 
        label: "Apologetics", 
        icon: <BookOpen className="h-5 w-5" />,
        description: "Learn to defend your faith"
      },
      { 
        path: "/bible-study", 
        label: "Bible Study", 
        icon: <BookText className="h-5 w-5" />,
        badge: "New",
        description: "Reading plans and study notes"
      },
      { 
        path: "/saved", 
        label: "Saved Posts", 
        icon: <Bookmark className="h-5 w-5" />,
        description: "Content you've bookmarked for later"
      },
    ],
    account: [
      {
        path: "/profile/settings",
        label: "Settings",
        icon: <Settings className="h-5 w-5" />,
        description: "Manage account and preferences"
      },
      {
        path: "/notifications",
        label: "Notifications",
        icon: <Bell className="h-5 w-5" />,
        description: "View all notifications",
        badge: user ? "3" : undefined
      }
    ],
    help: [
      {
        path: "/help",
        label: "Help Center",
        icon: <HelpCircle className="h-5 w-5" />,
        description: "Get assistance and answers"
      },
      {
        path: "/about",
        label: "About Us",
        icon: <Info className="h-5 w-5" />,
        description: "Learn about The Connection"
      }
    ]
  };

  return (
    <>
      {/* Main Bottom Navigation */}
      <nav 
        className={cn(
          "md:hidden fixed bottom-0 left-0 right-0 bg-white backdrop-blur-xl px-2 py-1 z-50 transition-all duration-300",
          hasScrolled 
            ? "border-t border-secondary/20 shadow-lg" 
            : "border-t border-secondary/10 shadow-md"
        )}
      >
        <div className="flex justify-around">
          {mainItems.map((item) => (
            <Link key={item.path} href={item.path} 
              className={cn(
                "flex flex-col items-center px-2 py-2 rounded-xl transition-colors relative",
                currentPath === item.path
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full mb-1 relative",
                currentPath === item.path
                  ? "bg-primary/10" 
                  : "bg-transparent"
              )}>
                {item.icon}
                {'badge' in item && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-secondary text-[10px] text-white flex items-center justify-center font-bold">
                    !
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium">{item.label}</span>
              
              {currentPath === item.path && (
                <span className="absolute -bottom-1 w-10 h-1 rounded-t-full bg-primary"></span>
              )}
            </Link>
          ))}
          
          {/* More Button */}
          <Sheet open={isMoreMenuOpen} onOpenChange={setIsMoreMenuOpen}>
            <SheetTrigger asChild>
              <button 
                className={cn(
                  "flex flex-col items-center px-2 py-2 rounded-xl transition-colors",
                  isMoreMenuOpen
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full mb-1",
                  isMoreMenuOpen
                    ? "bg-primary/10" 
                    : "bg-transparent"
                )}>
                  <MoreHorizontal className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-medium">More</span>
              </button>
            </SheetTrigger>
            
            <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto pb-8">
              <SheetHeader className="px-0">
                <SheetTitle className="text-xl font-semibold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  The Connection
                </SheetTitle>
                <SheetDescription className="text-center">
                  All features and sections
                </SheetDescription>
              </SheetHeader>
              
              {/* Community Section */}
              <div className="mt-4 mb-2">
                <h3 className="text-sm font-semibold text-primary mb-2 px-1">Community</h3>
                <div className="grid grid-cols-2 gap-3">
                  {moreItems.community.map((item) => (
                    <Link 
                      key={item.path} 
                      href={item.path}
                      onClick={() => setIsMoreMenuOpen(false)}
                      className={cn(
                        "flex flex-col items-center p-3 rounded-xl border transition-all",
                        currentPath === item.path
                          ? "border-primary/50 bg-primary/5"
                          : "border-secondary/20 hover:border-primary/30 hover:bg-secondary/5"
                      )}
                    >
                      <div className="relative mb-2">
                        <div className={cn(
                          "p-2 rounded-full",
                          currentPath === item.path ? "bg-primary/20" : "bg-secondary/10"
                        )}>
                          {item.icon}
                        </div>
                        {'badge' in item && (
                          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-secondary text-[10px] text-white flex items-center justify-center font-bold">
                            !
                          </span>
                        )}
                      </div>
                      <span className={cn(
                        "text-sm font-medium",
                        currentPath === item.path ? "text-primary" : "text-foreground"
                      )}>
                        {item.label}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1 text-center line-clamp-2">
                        {item.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Content Section */}
              <div className="mt-4 mb-2">
                <h3 className="text-sm font-semibold text-primary mb-2 px-1">Content</h3>
                <div className="grid grid-cols-2 gap-3">
                  {moreItems.content.map((item) => (
                    <Link 
                      key={item.path} 
                      href={item.path}
                      onClick={() => setIsMoreMenuOpen(false)}
                      className={cn(
                        "flex flex-col items-center p-3 rounded-xl border transition-all",
                        currentPath === item.path
                          ? "border-primary/50 bg-primary/5"
                          : "border-secondary/20 hover:border-primary/30 hover:bg-secondary/5"
                      )}
                    >
                      <div className="relative mb-2">
                        <div className={cn(
                          "p-2 rounded-full",
                          currentPath === item.path ? "bg-primary/20" : "bg-secondary/10"
                        )}>
                          {item.icon}
                        </div>
                        {'badge' in item && (
                          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-secondary text-[10px] text-white flex items-center justify-center font-bold">
                            !
                          </span>
                        )}
                      </div>
                      <span className={cn(
                        "text-sm font-medium",
                        currentPath === item.path ? "text-primary" : "text-foreground"
                      )}>
                        {item.label}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1 text-center line-clamp-2">
                        {item.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Account & Help Sections */}
              <div className="grid grid-cols-2 gap-6 mt-6">
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-2 px-1">Account</h3>
                  <div className="space-y-2">
                    {moreItems.account.map((item) => (
                      <Link 
                        key={item.path} 
                        href={item.path}
                        onClick={() => setIsMoreMenuOpen(false)}
                        className={cn(
                          "flex items-center p-2 rounded-lg border transition-all",
                          currentPath === item.path
                            ? "border-primary/50 bg-primary/5"
                            : "border-secondary/20 hover:border-primary/30 hover:bg-secondary/5"
                        )}
                      >
                        <div className={cn(
                          "p-1.5 rounded-full mr-2",
                          currentPath === item.path ? "bg-primary/20" : "bg-secondary/10"
                        )}>
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <span className={cn(
                            "text-sm font-medium",
                            currentPath === item.path ? "text-primary" : "text-foreground"
                          )}>
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className="ml-2 px-1.5 py-0.5 text-xs bg-secondary text-white rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-2 px-1">Help</h3>
                  <div className="space-y-2">
                    {moreItems.help.map((item) => (
                      <Link 
                        key={item.path} 
                        href={item.path}
                        onClick={() => setIsMoreMenuOpen(false)}
                        className={cn(
                          "flex items-center p-2 rounded-lg border transition-all",
                          currentPath === item.path
                            ? "border-primary/50 bg-primary/5"
                            : "border-secondary/20 hover:border-primary/30 hover:bg-secondary/5"
                        )}
                      >
                        <div className={cn(
                          "p-1.5 rounded-full mr-2",
                          currentPath === item.path ? "bg-primary/20" : "bg-secondary/10"
                        )}>
                          {item.icon}
                        </div>
                        <span className={cn(
                          "text-sm font-medium",
                          currentPath === item.path ? "text-primary" : "text-foreground"
                        )}>
                          {item.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              
              <SheetFooter className="px-0 mt-6 flex justify-center">
                <SheetClose asChild>
                  <button className="mx-auto w-10 h-10 rounded-full border border-secondary/20 flex items-center justify-center">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}
