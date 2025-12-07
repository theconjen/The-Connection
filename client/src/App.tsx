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
const DirectMessageThread = lazy(() => import("./pages/DMs"));
const ChurchSignupPage = lazy(() => import("./pages/church-signup-page"));
const ApologistScholarApplicationPage = lazy(() => import("./pages/apologist-scholar-application-page"));
const LivestreamerApplicationPage = lazy(() => import("./pages/livestreamer-application-page"));
const AdminDashboard = lazy(() => import("./pages/admin"));
const AdminApologistApplications = lazy(() => import("./pages/admin/apologist-scholar-applications"));
const AdminLivestreamerApplications = lazy(() => import("./pages/admin/livestreamer-applications"));
const AdminApplicationStats = lazy(() => import("./pages/admin/application-stats"));
const AdminUserManagement = lazy(() => import("./pages/admin/user-management"));
const AdminAdminUsers = lazy(() => import("./pages/admin/admin-users"));
const AdminPlatformSettings = lazy(() => import("./pages/admin/platform-settings"));
const AdminApologeticsResources = lazy(() => import("./pages/admin/apologetics-resources"));
const OrganizationDashboardPage = lazy(() => import("./pages/organization-dashboard-page"));
const OrganizationSettingsPage = lazy(() => import("./pages/organization-settings-page"));
const OrganizationInvitePage = lazy(() => import("./pages/organization-invite-page"));
const AcceptInvitationPage = lazy(() => import("./pages/accept-invitation-page"));
const SupportPage = lazy(() => import("./pages/support-page"));
const ApologistDashboard = lazy(() => import("./pages/apologist-dashboard"));

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
          <Route path="/messages/:userId" component={DirectMessageThread} />
          <Route path="/messages" component={DMsPage} />
          <Route path="/dms/:userId" component={DirectMessageThread} />
          <Route path="/dms" component={DMsPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/support" component={SupportPage} />
          
          {/* Organization */}
          <Route path="/church-signup" component={ChurchSignupPage} />
          <Route path="/organization-dashboard" component={OrganizationDashboardPage} />
          <Route path="/organizations/:id" component={OrganizationDashboardPage} />
          <Route path="/organizations/:id/settings" component={OrganizationSettingsPage} />
          <Route path="/organizations/:id/invite" component={OrganizationInvitePage} />
          
          {/* Applications */}
          <Route path="/apologist-scholar-application" component={ApologistScholarApplicationPage} />
          <Route path="/livestreamer-application" component={LivestreamerApplicationPage} />
          <Route path="/apologist-dashboard" component={ApologistDashboard} />
          
          {/* Admin Routes */}
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/apologist-scholar-applications" component={AdminApologistApplications} />
          <Route path="/admin/livestreamer-applications" component={AdminLivestreamerApplications} />
          <Route path="/admin/application-stats" component={AdminApplicationStats} />
          <Route path="/admin/users" component={AdminUserManagement} />
          <Route path="/admin/admin-users" component={AdminAdminUsers} />
          <Route path="/admin/settings" component={AdminPlatformSettings} />
          <Route path="/admin/apologetics-resources" component={AdminApologeticsResources} />
          
          <Route component={NotFound} />
          </Switch>
        </Suspense>
      </ResponsiveLayout>
      <Toaster />
    </Router>
  );
}

export default App;