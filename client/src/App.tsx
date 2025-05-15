import { Switch, Route } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute, ReadOnlyRoute } from "@/lib/protected-route";
import ResponsiveLayout from "@/components/layouts/responsive-layout";
import HomePage from "@/pages/home-page";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
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
import DiscoverPage from "@/pages/discover-page";
import MicroblogsPage from "@/pages/microblogs-page";
import MicroblogDetailPage from "@/pages/microblog-detail-page";
import PrayerRequestsPage from "@/pages/prayer-requests-page";
import EventsPage from "@/pages/events-page";
import EventDetailPage from "@/pages/event-detail-page";
import BibleStudyPage from "@/pages/bible-study-page";

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

function App() {
  return (
    <TooltipProvider>
      <Switch>
        {/* Auth page doesn't use the main layout */}
        <Route path="/auth" component={AuthPage} />
        
        {/* Public routes with responsive layout */}
        <ReadOnlyRoute path="/" component={withResponsiveLayout(HomePage)} />
        <ReadOnlyRoute path="/communities" component={withResponsiveLayout(CommunitiesPage)} />
        <ReadOnlyRoute path="/community/:slug" component={withResponsiveLayout(CommunityPage)} />
        <ReadOnlyRoute path="/apologetics" component={withResponsiveLayout(ApologeticsPage)} />
        <ReadOnlyRoute path="/prayer-requests" component={withResponsiveLayout(PrayerRequestsPage)} />
        <ReadOnlyRoute path="/discover" component={withResponsiveLayout(DiscoverPage)} />
        <ReadOnlyRoute path="/livestreams" component={withResponsiveLayout(LivestreamsPage)} />
        <ReadOnlyRoute path="/forums" component={withResponsiveLayout(ForumsPage)} />
        <ReadOnlyRoute path="/posts/:id" component={withResponsiveLayout(PostDetailPage)} />
        <ReadOnlyRoute path="/microblogs" component={withResponsiveLayout(MicroblogsPage)} />
        <ReadOnlyRoute path="/microblogs/:id" component={withResponsiveLayout(MicroblogDetailPage)} />
        <ReadOnlyRoute path="/events" component={withResponsiveLayout(EventsPage)} />
        <ReadOnlyRoute path="/events/:id" component={withResponsiveLayout(EventDetailPage)} />
        <ReadOnlyRoute path="/bible-study" component={withResponsiveLayout(BibleStudyPage)} />
        
        {/* Protected routes with responsive layout */}
        <ProtectedRoute path="/livestreamer-application" component={withResponsiveLayout(LivestreamerApplicationPage)} />
        <ProtectedRoute path="/groups" component={withResponsiveLayout(GroupsPage)} />
        <ProtectedRoute path="/profile" component={withResponsiveLayout(ProfilePage)} />
        <ProtectedRoute path="/submit" component={withResponsiveLayout(SubmitPostPage)} />
        
        {/* Not found page */}
        <Route component={withResponsiveLayout(NotFound)} />
      </Switch>
    </TooltipProvider>
  );
}

export default App;
