import { Link } from "wouter";
import { useAuth, AuthContextType } from "../hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { ThemeToggle } from "./ui/theme-toggle";
import {
  Home,
  Users,
  Calendar,
  BookOpen,
  Settings,
  Bell,
  Bookmark,
  Search,
  MessageSquare,
  HelpCircle,
  Shield,
  Heart,
  Lightbulb,
  Church,
  LayoutDashboard
} from "lucide-react";

interface SidebarNavigationProps {
  currentPath: string;
  collapsed?: boolean;
}

export default function SidebarNavigation({ currentPath, collapsed = false }: SidebarNavigationProps) {
  const { user } = useAuth() as AuthContextType;
  const isAdmin = user && user.isAdmin;

  // Fetch leader entitlements to show Church Dashboard for org admins
  const { data: leaderEntitlements } = useQuery<{
    showLeaderInbox: boolean;
    leaderOrgs: number[];
  }>({
    queryKey: ["/api/me/inbox-entitlements"],
    queryFn: async () => {
      const res = await fetch("/api/me/inbox-entitlements", { credentials: "include" });
      if (!res.ok) return { showLeaderInbox: false, leaderOrgs: [] };
      return res.json();
    },
    enabled: !!user,
  });

  const hasChurchDashboard = leaderEntitlements?.leaderOrgs && leaderEntitlements.leaderOrgs.length > 0;
  const primaryOrgId = leaderEntitlements?.leaderOrgs?.[0];

  // Navigation structure matching mobile app tabs
  const mainNavItems = [
    { icon: <Home className="h-5 w-5" />, label: "Home", path: "/", color: "text-[#5C6B5E]" },
    { icon: <Users className="h-5 w-5" />, label: "Community", path: "/communities", color: "text-[#7C6B78]" },
    { icon: <Church className="h-5 w-5" />, label: "Churches", path: "/orgs", color: "text-[#6B7C8F]" },
    { icon: <Lightbulb className="h-5 w-5" />, label: "Advice", path: "/advice", color: "text-[#D97706]" },
    { icon: <Calendar className="h-5 w-5" />, label: "Events", path: "/events", color: "text-[#B56A55]" },
    { icon: <BookOpen className="h-5 w-5" />, label: "Apologetics", path: "/apologetics", color: "text-[#7C8F78]" },
  ];

  // Menu items (matching mobile drawer)
  const menuItems = [
    { icon: <Bell className="h-5 w-5" />, label: "Notifications", path: "/notifications" },
    { icon: <Bookmark className="h-5 w-5" />, label: "Bookmarks", path: "/bookmarks" },
    { icon: <MessageSquare className="h-5 w-5" />, label: "Messages", path: "/messages" },
    { icon: <Search className="h-5 w-5" />, label: "Search", path: "/search" },
    { icon: <Heart className="h-5 w-5" />, label: "Prayer Requests", path: "/prayer-requests" },
  ];

  const settingsItems = [
    { icon: <Settings className="h-5 w-5" />, label: "Settings", path: "/settings" },
    { icon: <HelpCircle className="h-5 w-5" />, label: "Support", path: "/support" },
  ];

  return (
    <div className={`flex flex-col h-full ${collapsed ? 'px-2' : 'px-3'} py-4`}>
      {/* Header */}
      {!collapsed && (
        <div className="space-y-1 mb-6">
          <h2 className="px-3 text-xl font-semibold tracking-tight site-title">
            The Connection
          </h2>
          <p className="px-3 text-sm text-muted-foreground">
            Your Christian Community
          </p>
        </div>
      )}

      {/* User Profile Card */}
      {user && (
        <Link href="/profile">
          <div className={`rounded-xl border border-border ${collapsed ? 'p-2' : 'px-4 py-3'} bg-card hover:bg-muted/50 transition-colors cursor-pointer mb-6`}>
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
              <div className={`${collapsed ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-primary/10 flex items-center justify-center`}>
                <span className={`text-primary font-semibold ${collapsed ? 'text-sm' : ''}`}>
                  {(user.displayName || user.username || '?')[0].toUpperCase()}
                </span>
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.displayName || user.username}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              )}
            </div>
          </div>
        </Link>
      )}

      {/* Main Navigation - Matching Mobile Tabs */}
      <div className="space-y-1 mb-6">
        {!collapsed && (
          <h3 className="px-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2">
            Explore
          </h3>
        )}
        <nav className="space-y-1">
          {mainNavItems.map((item, i) => (
            <Link key={i} href={item.path}>
              <div
                className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} rounded-xl ${collapsed ? 'p-3' : 'px-4 py-3'} cursor-pointer text-sm transition-all ${
                  currentPath === item.path
                    ? `bg-muted text-foreground font-medium ${collapsed ? '' : 'border-l-2 border-primary'}`
                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <span className={currentPath === item.path ? item.color : ""}>
                  {item.icon}
                </span>
                {!collapsed && item.label}
              </div>
            </Link>
          ))}
        </nav>
      </div>

      {/* Menu Items - Matching Mobile Drawer */}
      {user && (
        <div className="space-y-1 mb-6">
          {!collapsed && (
            <h3 className="px-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2">
              Menu
            </h3>
          )}
          <nav className="space-y-1">
            {menuItems.map((item, i) => (
              <Link key={i} href={item.path}>
                <div
                  className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} rounded-xl ${collapsed ? 'p-3' : 'px-4 py-3'} cursor-pointer text-sm transition-all ${
                    currentPath === item.path
                      ? "bg-muted text-foreground font-medium"
                      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  {item.icon}
                  {!collapsed && item.label}
                </div>
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Settings */}
      <div className="space-y-1 mb-6">
        {!collapsed && (
          <h3 className="px-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2">
            Settings
          </h3>
        )}
        <nav className="space-y-1">
          {settingsItems.map((item, i) => (
            <Link key={i} href={item.path}>
              <div
                className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} rounded-xl ${collapsed ? 'p-3' : 'px-4 py-3'} cursor-pointer text-sm transition-all ${
                  currentPath === item.path
                    ? "bg-muted text-foreground font-medium"
                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
                title={collapsed ? item.label : undefined}
              >
                {item.icon}
                {!collapsed && item.label}
              </div>
            </Link>
          ))}
        </nav>
      </div>

      {/* Church Dashboard Section - For org admins/owners */}
      {hasChurchDashboard && primaryOrgId && (
        <div className="space-y-1 mb-6">
          {!collapsed && (
            <h3 className="px-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2">
              Church
            </h3>
          )}
          <nav className="space-y-1">
            <Link href={`/org-admin/${primaryOrgId}`}>
              <div
                className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} rounded-xl ${collapsed ? 'p-3' : 'px-4 py-3'} cursor-pointer text-sm transition-all ${
                  currentPath.startsWith("/org-admin")
                    ? "bg-muted text-foreground font-medium"
                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
                title={collapsed ? "Church Dashboard" : undefined}
              >
                <LayoutDashboard className="h-5 w-5" />
                {!collapsed && "Church Dashboard"}
              </div>
            </Link>
          </nav>
        </div>
      )}

      {/* Admin Section */}
      {isAdmin && (
        <div className="space-y-1 mb-6">
          {!collapsed && (
            <h3 className="px-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2">
              Admin
            </h3>
          )}
          <nav className="space-y-1">
            <Link href="/admin">
              <div
                className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} rounded-xl ${collapsed ? 'p-3' : 'px-4 py-3'} cursor-pointer text-sm transition-all ${
                  currentPath.startsWith("/admin")
                    ? "bg-muted text-foreground font-medium"
                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
                title={collapsed ? "Admin Dashboard" : undefined}
              >
                <Shield className="h-5 w-5" />
                {!collapsed && "Admin Dashboard"}
              </div>
            </Link>
          </nav>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Theme Toggle */}
      <div className="border-t border-border pt-4 mb-4">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-2`}>
          {!collapsed && <span className="text-sm font-medium text-muted-foreground">Theme</span>}
          <ThemeToggle />
        </div>
      </div>

      {/* Sign In Button for guests */}
      {!user && (
        <div className="space-y-2">
          <Link href="/auth">
            <div className={`w-full bg-primary text-primary-foreground text-center py-3 ${collapsed ? 'px-2' : 'px-4'} rounded-xl font-medium transition-colors cursor-pointer hover:bg-primary/90`}>
              {collapsed ? '→' : 'Sign In'}
            </div>
          </Link>
          {!collapsed && (
            <p className="text-center text-xs text-muted-foreground">
              Join our community today
            </p>
          )}
        </div>
      )}
    </div>
  );
}
