import { Router, Route, Switch } from "wouter";
import { Suspense, useEffect, lazy } from "react";
import { useLocation } from "wouter";
import { trackPageView, trackEvent } from "./lib/analytics";
import { Toaster } from "./components/ui/toaster";
import ResponsiveLayout from "./components/layouts/responsive-layout";
import { useAuth } from "./hooks/use-auth";

// Route-level code-splitting using React.lazy
// Core pages matching mobile app
const HomePage = lazy(() => import("./pages/home-page"));
const AuthPage = lazy(() => import("./pages/auth-page"));
const NotFound = lazy(() => import("./pages/not-found"));
const ForgotPasswordPage = lazy(() => import("./pages/forgot-password-page"));

// Main features (matching mobile tabs)
const CommunitiesPage = lazy(() => import("./pages/communities-page"));
const CommunityPage = lazy(() => import("./pages/community-page"));
const EventsPage = lazy(() => import("./pages/events-page"));
const EventDetailPage = lazy(() => import("./pages/event-detail-page"));
const EventEditPage = lazy(() => import("./pages/event-edit-page"));
const ApologeticsPage = lazy(() => import("./pages/apologetics-page"));
const ApologeticsDetail = lazy(() => import("./pages/apologetics-detail"));
const ApologistScholarApplication = lazy(() => import("./pages/apologist-scholar-application-page"));

// Advice/Microblogs (Global Community section)
const MicroblogsPage = lazy(() => import("./pages/microblogs-page"));
const MicroblogDetailPage = lazy(() => import("./pages/microblog-detail-page"));

// User features
const ProfilePage = lazy(() => import("./pages/profile-page"));
const UserProfilePage = lazy(() => import("./pages/user-profile-page"));
const SettingsPage = lazy(() => import("./pages/settings-page"));
const DMsPage = lazy(() => import("./pages/dms-page"));
const DirectMessageThread = lazy(() => import("./pages/DMs"));
const NotificationsPage = lazy(() => import("./pages/notifications-page"));
const BookmarksPage = lazy(() => import("./pages/bookmarks-page"));
const SearchPage = lazy(() => import("./pages/search-page"));
const BlockedUsersPage = lazy(() => import("./pages/BlockedUsersPage"));

// Q&A features
const QuestionsInbox = lazy(() => import("./pages/questions-inbox"));
const QuestionDetailPage = lazy(() => import("./pages/question-detail-page"));
const QuestionsAskPage = lazy(() => import("./pages/questions-ask"));

// Prayer requests
const PrayerRequestsPage = lazy(() => import("./pages/prayer-requests-page"));
const PrayerDetailPage = lazy(() => import("./pages/prayer-detail-page"));

// Support and legal
const SupportPage = lazy(() => import("./pages/support-page"));
const PrivacyPolicyPage = lazy(() => import("./pages/privacy-policy-page"));
const TermsOfServicePage = lazy(() => import("./pages/terms-of-service-page"));

// Admin routes (web-only, for admin users)
const AdminDashboard = lazy(() => import("./pages/admin"));
const AdminUserManagement = lazy(() => import("./pages/admin/user-management"));
const AdminAdminUsers = lazy(() => import("./pages/admin/admin-users"));
const AdminPlatformSettings = lazy(() => import("./pages/admin/platform-settings"));
const AdminModeration = lazy(() => import("./pages/admin/AdminModerationPage"));
const AdminApologistApplications = lazy(() => import("./pages/admin/apologist-scholar-applications"));
const AdminApologeticsResources = lazy(() => import("./pages/admin/apologetics-resources"));
const AdminAnalytics = lazy(() => import("./pages/admin/analytics"));

// Organization admin (Steward Console - web-only)
const OrganizationAdminPage = lazy(() => import("./pages/organization-admin-page"));

// Organization public pages (Commons)
const OrganizationsDirectoryPage = lazy(() => import("./pages/organizations-directory-page"));
const OrganizationProfilePage = lazy(() => import("./pages/organization-profile-page"));
const OrganizationAboutPage = lazy(() => import("./pages/organization-about-page"));
const ChurchSignupPage = lazy(() => import("./pages/church-signup-page"));

// Library (Q&A Library posts)
const LibraryPage = lazy(() => import("./pages/library-page"));
const LibraryPostPage = lazy(() => import("./pages/library-post-page"));
const LibraryCreatePage = lazy(() => import("./pages/library-create-page"));

// Sermons
const SermonPage = lazy(() => import("./pages/sermon-page"));

// Public preview pages (no auth required)
const ApologeticsPreviewPage = lazy(() => import("./pages/public/apologetics-preview-page"));
const EventPreviewPage = lazy(() => import("./pages/public/event-preview-page"));
const PostPreviewPage = lazy(() => import("./pages/public/post-preview-page"));
const ProfilePreviewPage = lazy(() => import("./pages/public/profile-preview-page"));

// Analytics tracking component with event tracking
function AnalyticsTracker() {
  const [location] = useLocation();

  useEffect(() => {
    trackPageView(location);
  }, [location]);

  useEffect(() => {
    trackEvent('page_view', 'navigation', location);
  }, [location]);

  return null;
}

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
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
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        }>
          <Switch>
            {/* Public canonical share URLs (no auth required) */}
            <Route path="/a/:slugOrId" component={ApologeticsPreviewPage} />
            <Route path="/e/:eventId" component={EventPreviewPage} />
            <Route path="/p/:postId" component={PostPreviewPage} />
            <Route path="/u/:username" component={ProfilePreviewPage} />

            {/* Auth routes */}
            <Route path="/" component={() => <HomePage />} />
            <Route path="/auth" component={AuthPage} />
            <Route path="/reset-password" component={AuthPage} />
            <Route path="/forgot-password" component={ForgotPasswordPage} />

            {/* Main tabs (matching mobile) */}
            <Route path="/communities" component={CommunitiesPage} />
            <Route path="/communities/:slug" component={CommunityPage} />
            <Route path="/events" component={EventsPage} />
            <Route path="/events/:id/edit" component={EventEditPage} />
            <Route path="/events/:id" component={EventDetailPage} />
            <Route path="/apologetics" component={ApologeticsPage} />
            <Route path="/apologetics/apply" component={ApologistScholarApplication} />
            <Route path="/apologetics/:id" component={ApologeticsDetail} />

            {/* Library (Q&A curated posts) */}
            <Route path="/library/create" component={LibraryCreatePage} />
            <Route path="/library/:id" component={LibraryPostPage} />
            <Route path="/library" component={LibraryPage} />

            {/* Advice/Microblogs (Global Community) */}
            <Route path="/advice" component={MicroblogsPage} />
            <Route path="/advice/:id" component={MicroblogDetailPage} />
            <Route path="/microblogs" component={MicroblogsPage} />
            <Route path="/microblogs/:id" component={MicroblogDetailPage} />

            {/* Prayer requests */}
            <Route path="/prayer-requests" component={PrayerRequestsPage} />
            <Route path="/prayers/:id" component={PrayerDetailPage} />

            {/* Q&A */}
            <Route path="/questions/ask" component={QuestionsAskPage} />
            <Route path="/questions/inbox" component={QuestionsInbox} />
            <Route path="/questions/:id" component={QuestionDetailPage} />

            {/* User features */}
            <Route path="/profile" component={ProfilePage} />
            <Route path="/profile/:username" component={UserProfilePage} />
            <Route path="/user/:id">{() => <UserProfilePage byId />}</Route>
            <Route path="/messages/:userId" component={DirectMessageThread} />
            <Route path="/messages" component={DMsPage} />
            <Route path="/dms/:userId" component={DirectMessageThread} />
            <Route path="/dms" component={DMsPage} />
            <Route path="/settings" component={SettingsPage} />
            <Route path="/bookmarks" component={BookmarksPage} />
            <Route path="/blocked-users" component={BlockedUsersPage} />
            <Route path="/search" component={SearchPage} />
            <Route path="/notifications" component={NotificationsPage} />

            {/* Support and legal */}
            <Route path="/support" component={SupportPage} />
            <Route path="/privacy" component={PrivacyPolicyPage} />
            <Route path="/terms" component={TermsOfServicePage} />

            {/* Admin Routes (web-only) */}
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/admin/users" component={AdminUserManagement} />
            <Route path="/admin/admin-users" component={AdminAdminUsers} />
            <Route path="/admin/settings" component={AdminPlatformSettings} />
            <Route path="/admin/analytics" component={AdminAnalytics} />
            <Route path="/admin/moderation" component={AdminModeration} />
            <Route path="/admin/apologist-scholar-applications" component={AdminApologistApplications} />
            <Route path="/admin/apologetics-resources" component={AdminApologeticsResources} />

            {/* Organization Admin (Steward Console - web-only) */}
            <Route path="/org-admin/:orgId" component={OrganizationAdminPage} />

            {/* Organization Public (Commons) */}
            <Route path="/orgs" component={OrganizationsDirectoryPage} />
            <Route path="/orgs/:slug/about" component={OrganizationAboutPage} />
            <Route path="/orgs/:slug" component={OrganizationProfilePage} />
            <Route path="/church-signup" component={ChurchSignupPage} />

            {/* Sermons */}
            <Route path="/sermons/:id" component={SermonPage} />

            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </ResponsiveLayout>
      <Toaster />
    </Router>
  );
}

export default App;
