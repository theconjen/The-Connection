import { Link } from "wouter";
import { Home, Compass, BookOpen, Users, User, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavigationProps {
  currentPath: string;
}

export default function MobileNavigation({ currentPath }: MobileNavigationProps) {
  const menuItems = [
    { 
      path: "/", 
      label: "Home", 
      icon: <Home className="h-5 w-5" /> 
    },
    { 
      path: "/discover", 
      label: "Discover", 
      icon: <Compass className="h-5 w-5" /> 
    },
    { 
      path: "/apologetics", 
      label: "Learn", 
      icon: <BookOpen className="h-5 w-5" /> 
    },
    { 
      path: "/groups", 
      label: "Groups", 
      icon: <Users className="h-5 w-5" /> 
    },
    { 
      path: "/profile", 
      label: "Me", 
      icon: <User className="h-5 w-5" /> 
    }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-secondary/20 px-2 py-1 z-50 shadow-lg">
      <div className="flex justify-around">
        {menuItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <a className={cn(
              "flex flex-col items-center px-3 py-2 rounded-xl transition-colors",
              currentPath === item.path
                ? "text-primary bg-primary/5"
                : "text-muted-foreground hover:text-primary"
            )}>
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full mb-1",
                currentPath === item.path
                  ? "bg-primary/10" 
                  : "bg-transparent"
              )}>
                {item.icon}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
              
              {currentPath === item.path && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"></span>
              )}
            </a>
          </Link>
        ))}
      </div>
    </nav>
  );
}
