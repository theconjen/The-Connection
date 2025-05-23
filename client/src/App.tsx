import { Switch, Route } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute, ReadOnlyRoute, AdminRoute } from "@/lib/protected-route";
import ResponsiveLayout from "@/components/layouts/responsive-layout";
import HomePage from "@/pages/home-page";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import AdminLoginPage from "@/pages/admin-login";
import LoginTestPage from "@/pages/login-test";
import SimpleLogin from "@/pages/simple-login";
import Dashboard from "@/pages/Dashboard";
import IntegratedDashboard from "@/pages/IntegratedDashboard";
import Grow from "@/pages/Grow";
import Connect from "@/pages/Connect";
import NearMe from "@/pages/NearMe";
import CommunityPage from "@/pages/community-page";
import CommunitiesPage from "@/pages/communities-page";
import ApologeticsPage from "@/pages/apologetics-page";
import GroupsPage from "@/pages/groups-page";
import ProfilePage from "@/pages/profile-page";
import ForumsPage from "@/pages/forums-page";
import PostDetailPage from "@/pages/post-detail-page";
import SubmitPostPage from "@/pages/submit-post-page";
import LivestreamsPage from "@/pages/livestreams-page";
import LivestreamerApplicationPage from "@/pages/livestreamer-application-page";
import ApologistScholarApplicationPage from "@/pages/apologist-scholar-application-page";
import DiscoverPage from "@/pages/discover-page";
import MicroblogsPage from "@/pages/microblogs-page";
import MicroblogDetailPage from "@/pages/microblog-detail-page";
import PrayerRequestsPage from "@/pages/prayer-requests-page";
import EventsPage from "@/pages/events-page";
import EventDetailPage from "@/pages/event-detail-page";
import BibleStudyPage from "@/pages/bible-study-page";
import { useEffect } from "react";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";

// Admin pages
import AdminDashboard from "@/pages/admin";
import AdminLivestreamerApplications from "@/pages/admin/livestreamer-applications";
import AdminApologistScholarApplications from "@/pages/admin/apologist-scholar-applications";

/**
 * Wraps components with the responsive layout
 * This function helps avoid repetition of the ResponsiveLayout wrapper 
 * in each route definition
 */
const withResponsiveLayout = (Component: React.ComponentType) => {
  return () => (
    <ResponsiveLayout>
      <Component />
    </ResponsiveLayout>
  );
};

function Router() {
  // Use analytics hook to track page views
  useAnalytics();
  
  return (
    <Switch>
      {/* Auth pages don't use the main layout */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/admin-login" component={AdminLoginPage} />
      <Route path="/login-test" component={LoginTestPage} />
      <Route path="/simple-login" component={SimpleLogin} />
      <ProtectedRoute path="/dashboard" component={withResponsiveLayout(IntegratedDashboard)} />
      <ProtectedRoute path="/grow" component={withResponsiveLayout(Grow)} />
      <ProtectedRoute path="/connect" component={withResponsiveLayout(Connect)} />
      <ProtectedRoute path="/near-me" component={withResponsiveLayout(NearMe)} />
      
      {/* Public routes with responsive layout */}
      <ReadOnlyRoute path="/" component={withResponsiveLayout(IntegratedDashboard)} />
      <ReadOnlyRoute path="/communities" component={withResponsiveLayout(CommunitiesPage)} />
      <ReadOnlyRoute path="/c/:slug" component={withResponsiveLayout(CommunityPage)} />
      <ReadOnlyRoute path="/apologetics" component={withResponsiveLayout(ApologeticsPage)} />
      <ReadOnlyRoute path="/prayer-requests" component={withResponsiveLayout(PrayerRequestsPage)} />
      <ReadOnlyRoute path="/discover" component={withResponsiveLayout(DiscoverPage)} />
      <ReadOnlyRoute path="/livestreams" component={withResponsiveLayout(LivestreamsPage)} />
      <ReadOnlyRoute path="/forums" component={withResponsiveLayout(ForumsPage)} />
      <ReadOnlyRoute path="/c/:id" component={withResponsiveLayout(PostDetailPage)} />
      <ReadOnlyRoute path="/posts/:id" component={withResponsiveLayout(PostDetailPage)} />
      <ReadOnlyRoute path="/microblogs" component={withResponsiveLayout(MicroblogsPage)} />
      <ReadOnlyRoute path="/microblogs/:id" component={withResponsiveLayout(MicroblogDetailPage)} />
      <ReadOnlyRoute path="/events" component={withResponsiveLayout(EventsPage)} />
      <ReadOnlyRoute path="/events/:id" component={withResponsiveLayout(EventDetailPage)} />
      <ReadOnlyRoute path="/bible-study" component={withResponsiveLayout(BibleStudyPage)} />
      
      {/* Protected routes with responsive layout */}
      <ProtectedRoute path="/livestreamer-application" component={withResponsiveLayout(LivestreamerApplicationPage)} />
      <ProtectedRoute path="/apologist-scholar-application" component={withResponsiveLayout(ApologistScholarApplicationPage)} />
      <ProtectedRoute path="/groups" component={withResponsiveLayout(GroupsPage)} />
      <ProtectedRoute path="/profile" component={withResponsiveLayout(ProfilePage)} />
      <ProtectedRoute path="/submit" component={withResponsiveLayout(SubmitPostPage)} />
      
      {/* Admin routes - directly use admin pages (they include AdminLayout inside) */}
      <AdminRoute path="/admin" component={AdminDashboard} />
      <AdminRoute path="/admin/livestreamer-applications" component={AdminLivestreamerApplications} />
      <AdminRoute path="/admin/apologist-scholar-applications" component={AdminApologistScholarApplications} />
      
      {/* Not found page */}
      <Route component={withResponsiveLayout(NotFound)} />
    </Switch>
  );
}

function App() {
  // Initialize Google Analytics when app loads
  useEffect(() => {
    // Verify required environment variable is present
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
      console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    } else {
      initGA();
      console.log('Google Analytics initialized with ID:', import.meta.env.VITE_GA_MEASUREMENT_ID);
    }
  }, []);

  return (
    <TooltipProvider>
      <Router />
    </TooltipProvider>
  );
}

export default App;
