import { useAuth } from "../../hooks/use-auth";
import { Loader2 } from "lucide-react";
import { AdminNav } from "../admin/admin-nav";
import { useLocation, Link } from "wouter";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  // If loading, show loading spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is not logged in or not an admin, redirect to login
  if (!user || !user.isAdmin) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Admin Sidebar */}
      <div className="w-64 hidden md:block">
        <AdminNav />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}