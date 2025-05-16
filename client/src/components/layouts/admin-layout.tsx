import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Users, 
  Video, 
  Settings, 
  GraduationCap,
  Lightbulb,
  ChevronRight,
  Home,
  LogOut
} from "lucide-react";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  
  const menuItems = [
    { 
      label: "Dashboard", 
      icon: <Home className="h-4 w-4 mr-2" />, 
      href: "/admin" 
    },
    { 
      label: "Livestreamer Applications", 
      icon: <Video className="h-4 w-4 mr-2" />, 
      href: "/admin/livestreamer-applications" 
    },
    { 
      label: "Apologist Scholar Applications", 
      icon: <GraduationCap className="h-4 w-4 mr-2" />, 
      href: "/admin/apologist-scholar-applications" 
    },
    { 
      label: "Application Statistics", 
      icon: <BarChart3 className="h-4 w-4 mr-2" />, 
      href: "/admin/application-stats" 
    },
    { 
      label: "User Management", 
      icon: <Users className="h-4 w-4 mr-2" />, 
      href: "/admin/users" 
    },
    { 
      label: "Platform Settings", 
      icon: <Settings className="h-4 w-4 mr-2" />, 
      href: "/admin/settings" 
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Admin Sidebar */}
      <div className="w-64 bg-white border-r hidden md:block">
        <div className="h-full flex flex-col">
          <div className="p-4 border-b">
            <Link href="/">
              <div className="flex items-center space-x-2">
                <Lightbulb className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">Admin Portal</span>
              </div>
            </Link>
          </div>
          
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatarUrl || ""} alt={user?.displayName || ""} />
                <AvatarFallback>{user?.displayName?.charAt(0) || user?.username?.charAt(0) || "A"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{user?.displayName || user?.username}</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={location === item.href ? "default" : "ghost"}
                  className="w-full justify-start"
                >
                  {item.icon}
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
          
          <div className="p-4 mt-auto border-t">
            <Link href="/">
              <Button variant="outline" className="w-full justify-start">
                <Home className="h-4 w-4 mr-2" />
                Back to Main Site
              </Button>
            </Link>
            <Link href="/api/logout">
              <Button variant="ghost" className="w-full justify-start mt-2 text-red-500 hover:text-red-600 hover:bg-red-50">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Mobile Admin Header */}
      <div className="md:hidden w-full bg-white border-b fixed top-0 z-10">
        <div className="p-4 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center space-x-2">
              <Lightbulb className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Admin</span>
            </div>
          </Link>
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatarUrl || ""} alt={user?.displayName || ""} />
              <AvatarFallback>{user?.displayName?.charAt(0) || user?.username?.charAt(0) || "A"}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 md:ml-64 md:mt-0 mt-16">
        <div className="hidden md:block bg-white border-b p-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Link href="/admin">
              <span className="hover:text-primary">Admin</span>
            </Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="font-medium text-foreground">
              {menuItems.find(item => item.href === location)?.label || "Dashboard"}
            </span>
          </div>
        </div>
        
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  );
}