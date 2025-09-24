import { Router, Route, Switch } from "wouter";
import { Suspense, useEffect, lazy } from "react";
import { useLocation } from "wouter";
import { trackPageView, trackEvent } from "./lib/analytics";
import { Toaster } from "./components/ui/toaster";
import ResponsiveLayout from "./components/layouts/responsive-layout";
import { useAuth } from "./hooks/use-auth";

// Route-level code-splitting using React.lazy
const HomePage = lazy(() => import("./pages/home-page"));
const AuthPage = lazy(() => import("./pages/auth-page"));
const NotFound = lazy(() => import("./pages/not-found"));
const ApologeticsPage = lazy(() => import("./pages/apologetics-page"));
const LivestreamsPage = lazy(() => import("./pages/livestreams-page"));
const CommunitiesPage = lazy(() => import("./pages/communities-page"));
const CommunityPage = lazy(() => import("./pages/community-page"));
const ForumsPage = lazy(() => import("./pages/forums-page"));
const MicroblogsPage = lazy(() => import("./pages/microblogs-page"));
const MicroblogDetailPage = lazy(() => import("./pages/microblog-detail-page"));
const BibleStudyPage = lazy(() => import("./pages/bible-study-page"));
const EventsPage = lazy(() => import("./pages/events-page"));
const EventDetailPage = lazy(() => import("./pages/event-detail-page"));
const PrayerRequestsPage = lazy(() => import("./pages/prayer-requests-page"));
const SettingsPage = lazy(() => import("./pages/settings-page"));
const ProfilePage = lazy(() => import("./pages/profile-page"));
const SubmitPostPage = lazy(() => import("./pages/submit-post-page"));
const PostsPage = lazy(() => import("./pages/posts-page"));
const PostDetailPage = lazy(() => import("./pages/post-detail-page"));
const DMsPage = lazy(() => import("./pages/dms-page"));
const ChurchSignupPage = lazy(() => import("./pages/church-signup-page"));
const ApologistScholarApplicationPage = lazy(() => import("./pages/apologist-scholar-application-page"));
const LivestreamerApplicationPage = lazy(() => import("./pages/livestreamer-application-page"));
const AdminDashboard = lazy(() => import("./pages/admin"));
const AdminApologistApplications = lazy(() => import("./pages/admin/apologist-scholar-applications"));
const AdminLivestreamerApplications = lazy(() => import("./pages/admin/livestreamer-applications"));
const OrganizationDashboardPage = lazy(() => import("./pages/organization-dashboard-page"));
const AcceptInvitationPage = lazy(() => import("./pages/accept-invitation-page"));
const SupportPage = lazy(() => import("./pages/support-page"));

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
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div></div>
        }>
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
          <Route path="/support" component={SupportPage} />
          
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
        </Suspense>
      </ResponsiveLayout>
      <Toaster />
    </Router>
  );
}

export default App;