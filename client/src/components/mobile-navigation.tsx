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
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
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

interface MobileNavigationProps {
  currentPath: string;
}

export default function MobileNavigation({ currentPath }: MobileNavigationProps) {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  
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
  
  // Secondary items in the "More" sheet
  const moreItems = [
    { 
      path: "/events", 
      label: "Events", 
      icon: <Calendar className="h-5 w-5" />,
      badge: "New",
      description: "Community gatherings and special occasions"
    },
    { 
      path: "/apologetics", 
      label: "Apologetics", 
      icon: <BookOpen className="h-5 w-5" />,
      description: "Learn to defend your faith"
    },
    { 
      path: "/prayer-requests", 
      label: "Prayer Requests", 
      icon: <HeartHandshake className="h-5 w-5" />,
      description: "Share and pray for others' needs"
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
    { 
      path: "/groups", 
      label: "My Groups", 
      icon: <Users className="h-5 w-5" />,
      description: "Your communities and group discussions"
    },
  ];

  return (
    <>
      {/* Main Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-secondary/20 px-2 py-1 z-50 shadow-lg">
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
            
            <SheetContent side="bottom" className="rounded-t-xl max-h-[85vh] overflow-y-auto pb-8">
              <SheetHeader className="px-0">
                <SheetTitle className="text-xl font-semibold text-center">
                  More Options
                </SheetTitle>
                <SheetDescription className="text-center">
                  Additional features and sections
                </SheetDescription>
              </SheetHeader>
              
              <div className="grid grid-cols-2 gap-3 mt-2">
                {moreItems.map((item) => (
                  <Link 
                    key={item.path} 
                    href={item.path}
                    onClick={() => setIsMoreMenuOpen(false)}
                    className={cn(
                      "flex flex-col items-center p-4 rounded-xl border transition-all",
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
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      {item.description}
                    </p>
                  </Link>
                ))}
              </div>
              
              <SheetFooter className="px-0 mt-4 flex justify-center">
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
