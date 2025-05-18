import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ChevronRight, Settings, Users, FileText, Calendar, MessageCircle, BookOpen, PieChart } from "lucide-react";

const Dashboard = () => {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    navigate("/simple-login");
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome, {user.displayName || user.username}!</h1>
        <p className="text-muted-foreground">
          {user.isAdmin 
            ? "You have admin access to the platform." 
            : "Welcome to your personal dashboard."}
        </p>
      </div>

      {user.isAdmin ? <AdminDashboardContent /> : <UserDashboardContent />}
    </div>
  );
};

const UserDashboardContent = () => {
  const [, navigate] = useLocation();
  
  const menuItems = [
    { title: "Communities", description: "Browse and join faith communities", icon: <Users className="h-5 w-5" />, path: "/communities" },
    { title: "Prayer Requests", description: "Share and respond to prayer needs", icon: <MessageCircle className="h-5 w-5" />, path: "/prayer-requests" },
    { title: "Bible Study", description: "Access Bible reading plans and studies", icon: <BookOpen className="h-5 w-5" />, path: "/bible-study" },
    { title: "Apologetics", description: "Explore answers to tough questions about faith", icon: <FileText className="h-5 w-5" />, path: "/apologetics" },
    { title: "Events", description: "View upcoming Christian events", icon: <Calendar className="h-5 w-5" />, path: "/events" },
    { title: "Profile Settings", description: "Update your profile information", icon: <Settings className="h-5 w-5" />, path: "/profile" },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {menuItems.map((item, index) => (
        <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="p-2 bg-primary/10 rounded-lg">
                {item.icon}
              </div>
            </div>
            <CardTitle className="mt-2">{item.title}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </CardHeader>
          <CardFooter className="pt-2">
            <Button 
              variant="ghost" 
              className="w-full justify-between"
              onClick={() => navigate(item.path)}
            >
              View <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

const AdminDashboardContent = () => {
  const [, navigate] = useLocation();
  
  const adminMenuItems = [
    { title: "User Management", description: "Manage users and permissions", icon: <Users className="h-5 w-5" />, path: "/admin/users" },
    { title: "Livestreamer Applications", description: "Review livestreamer applications", icon: <FileText className="h-5 w-5" />, path: "/admin/livestreamer-applications" },
    { title: "Apologist Applications", description: "Review apologist scholar applications", icon: <FileText className="h-5 w-5" />, path: "/admin/apologist-scholar-applications" },
    { title: "Community Management", description: "Manage communities and posts", icon: <Users className="h-5 w-5" />, path: "/admin/communities" },
    { title: "Event Management", description: "Manage and approve events", icon: <Calendar className="h-5 w-5" />, path: "/admin/events" },
    { title: "Analytics Dashboard", description: "View platform usage analytics", icon: <PieChart className="h-5 w-5" />, path: "/admin/analytics" },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Admin Controls</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {adminMenuItems.map((item, index) => (
          <Card key={index} className="overflow-hidden border-primary/20 hover:border-primary transition-colors duration-300">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {item.icon}
                </div>
              </div>
              <CardTitle className="mt-2">{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardFooter className="pt-2">
              <Button 
                variant="outline" 
                className="w-full justify-between hover:bg-primary hover:text-white"
                onClick={() => navigate(item.path)}
              >
                Access <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;