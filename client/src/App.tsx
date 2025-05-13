import { Switch, Route } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute, ReadOnlyRoute } from "@/lib/protected-route";
import HomePage from "@/pages/home-page";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import CommunityPage from "@/pages/community-page";
import ApologeticsPage from "@/pages/apologetics-page";
import GroupsPage from "@/pages/groups-page";
import ProfilePage from "@/pages/profile-page";
import PostDetailPage from "@/pages/post-detail-page";
import SubmitPostPage from "@/pages/submit-post-page";
import LivestreamsPage from "@/pages/livestreams-page";
import LivestreamerApplicationPage from "@/pages/livestreamer-application-page";
import DiscoverPage from "@/pages/discover-page";
import MicroblogsPage from "@/pages/microblogs-page";
import MicroblogDetailPage from "@/pages/microblog-detail-page";
import PrayerRequestsPage from "@/pages/prayer-requests-page";

function App() {
  return (
    <TooltipProvider>
      <Switch>
        <ReadOnlyRoute path="/" component={HomePage} />
        <Route path="/auth" component={AuthPage} />
        <ReadOnlyRoute path="/community/:slug" component={CommunityPage} />
        <ReadOnlyRoute path="/apologetics" component={ApologeticsPage} />
        <ReadOnlyRoute path="/discover" component={DiscoverPage} />
        <ReadOnlyRoute path="/livestreams" component={LivestreamsPage} />
        <ProtectedRoute path="/livestreamer-application" component={LivestreamerApplicationPage} />
        <ReadOnlyRoute path="/posts/:id" component={PostDetailPage} />
        <ReadOnlyRoute path="/microblogs" component={MicroblogsPage} />
        <ReadOnlyRoute path="/microblogs/:id" component={MicroblogDetailPage} />
        <ProtectedRoute path="/groups" component={GroupsPage} />
        <ProtectedRoute path="/profile" component={ProfilePage} />
        <ProtectedRoute path="/submit" component={SubmitPostPage} />
        <Route component={NotFound} />
      </Switch>
    </TooltipProvider>
  );
}

export default App;
