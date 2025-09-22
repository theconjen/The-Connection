import { Router, Route, Switch } from "wouter";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { trackPageView, trackEvent } from "./lib/analytics";
import { Toaster } from "./components/ui/toaster";
import ResponsiveLayout from "./components/layouts/responsive-layout";
import HomePage from "./pages/home-page";
import AuthPage from "./pages/auth-page";
import NotFound from "./pages/not-found";
import ApologeticsPage from "./pages/apologetics-page";
import LivestreamsPage from "./pages/livestreams-page";
import CommunitiesPage from "./pages/communities-page";
import CommunityPage from "./pages/community-page";
import ForumsPage from "./pages/forums-page";
import MicroblogsPage from "./pages/microblogs-page";
import MicroblogDetailPage from "./pages/microblog-detail-page";
import BibleStudyPage from "./pages/bible-study-page";
import EventsPage from "./pages/events-page";
import EventDetailPage from "./pages/event-detail-page";
import PrayerRequestsPage from "./pages/prayer-requests-page";
import SettingsPage from "./pages/settings-page";
import ProfilePage from "./pages/profile-page";
import SubmitPostPage from "./pages/submit-post-page";
import PostsPage from "./pages/posts-page";
import PostDetailPage from "./pages/post-detail-page";
import DMsPage from "./pages/dms-page";
import ChurchSignupPage from "./pages/church-signup-page";
import ApologistScholarApplicationPage from "./pages/apologist-scholar-application-page";
import LivestreamerApplicationPage from "./pages/livestreamer-application-page";
import AdminDashboard from "./pages/admin";
import AdminApologistApplications from "./pages/admin/apologist-scholar-applications";
import AdminLivestreamerApplications from "./pages/admin/livestreamer-applications";
import OrganizationDashboardPage from "./pages/organization-dashboard-page";
import AcceptInvitationPage from "./pages/accept-invitation-page";
import { useAuth } from "./hooks/use-auth";

// Analytics tracking component with event tracking
function AnalyticsTracker() {
  const [location] = useLocation();
  
  useEffect(() => {
    trackPageView(location);
  }, [location]);
  
  useEffect(() => {
    // Track navigation events
    trackEvent('page_view', 'navigation', location);
  }, [location]);
  
  return null;
}

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AnalyticsTracker />
      <ResponsiveLayout>
        <Switch>
          <Route path="/" component={() => <HomePage />} />
          <Route path="/auth" component={AuthPage} />
          
          {/* Main Content Pages */}
          <Route path="/microblogs" component={MicroblogsPage} />
          <Route path="/microblogs/:id" component={MicroblogDetailPage} />
          <Route path="/bible-study" component={BibleStudyPage} />
          <Route path="/communities" component={CommunitiesPage} />
          <Route path="/communities/:slug" component={CommunityPage} />
          <Route path="/invitations/:token/accept" component={AcceptInvitationPage} />
          <Route path="/forums" component={() => <ForumsPage />} />
          <Route path="/posts" component={() => <PostsPage />} />
          <Route path="/posts/:id" component={PostDetailPage} />
          
          {/* Resources */}
          <Route path="/events" component={EventsPage} />
          <Route path="/events/:id" component={EventDetailPage} />
          <Route path="/prayer-requests" component={PrayerRequestsPage} />
          <Route path="/livestreams" component={LivestreamsPage} />
          <Route path="/apologetics" component={ApologeticsPage} />
          
          {/* User Actions */}
          <Route path="/submit" component={SubmitPostPage} />
          <Route path="/submit-post" component={SubmitPostPage} />
          <Route path="/profile" component={ProfilePage} />
          <Route path="/profile/:username" component={ProfilePage} />
          <Route path="/dms" component={DMsPage} />
          <Route path="/settings" component={SettingsPage} />
          
          {/* Organization */}
          <Route path="/church-signup" component={ChurchSignupPage} />
          <Route path="/organization-dashboard" component={OrganizationDashboardPage} />
          
          {/* Applications */}
          <Route path="/apologist-scholar-application" component={ApologistScholarApplicationPage} />
          <Route path="/livestreamer-application" component={LivestreamerApplicationPage} />
          
          {/* Admin Routes */}
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/apologist-scholar-applications" component={AdminApologistApplications} />
          <Route path="/admin/livestreamer-applications" component={AdminLivestreamerApplications} />
          
          <Route component={NotFound} />
        </Switch>
      </ResponsiveLayout>
      <Toaster />
    </Router>
  );
}

export default App;