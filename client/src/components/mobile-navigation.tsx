import { Link } from "wouter";
import { Home, MessageCircle, Search, BookText, Menu } from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import SidebarNavigation from "@/components/sidebar-navigation";

interface MobileNavigationProps {
  currentPath: string;
}

export default function MobileNavigation({ currentPath }: MobileNavigationProps) {
  // Main navigation items - keep to 5 most important ones
  const navItems = [
    {
      icon: <Home className="h-6 w-6" />,
      label: "Home",
      path: "/"
    },
    {
      icon: <MessageCircle className="h-6 w-6" />,
      label: "Feed",
      path: "/microblogs"
    },
    {
      icon: <Search className="h-6 w-6" />,
      label: "Discover",
      path: "/discover"
    },
    {
      icon: <BookText className="h-6 w-6" />,
      label: "Bible",
      path: "/bible-study"
    },
    {
      icon: <Menu className="h-6 w-6" />,
      label: "More",
      isSheet: true
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-secondary/10 md:hidden z-40">
      <div className="flex items-center justify-around">
        {navItems.map((item, index) => 
          item.isSheet ? (
            <Sheet key={index}>
              <SheetTrigger asChild>
                <button className="flex flex-col items-center py-2 px-4 w-full">
                  {item.icon}
                  <span className="text-xs mt-1">{item.label}</span>
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80vw] sm:w-[350px]">
                <div className="py-4">
                  <SheetClose asChild>
                    <div className="absolute right-4 top-4">
                      <Button variant="ghost" size="icon">
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </SheetClose>
                  <SidebarNavigation currentPath={currentPath} />
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Link key={index} href={item.path}>
              <div 
                className={`flex flex-col items-center py-2 px-4 w-full ${
                  currentPath === item.path 
                    ? "text-primary" 
                    : "text-muted-foreground"
                }`}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
              </div>
            </Link>
          )
        )}
      </div>
    </nav>
  );
}