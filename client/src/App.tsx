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

function App() {
  return (
    <TooltipProvider>
      <Switch>
        <ReadOnlyRoute path="/" component={({ isGuest }) => <HomePage isGuest={isGuest} />} />
        <Route path="/auth" component={AuthPage} />
        <ReadOnlyRoute path="/community/:slug" component={({ isGuest }) => <CommunityPage isGuest={isGuest} />} />
        <ReadOnlyRoute path="/apologetics" component={({ isGuest }) => <ApologeticsPage isGuest={isGuest} />} />
        <ReadOnlyRoute path="/discover" component={({ isGuest }) => <DiscoverPage isGuest={isGuest} />} />
        <ReadOnlyRoute path="/livestreams" component={({ isGuest }) => <LivestreamsPage isGuest={isGuest} />} />
        <ProtectedRoute path="/livestreamer-application" component={LivestreamerApplicationPage} />
        <ReadOnlyRoute path="/posts/:id" component={({ isGuest }) => <PostDetailPage isGuest={isGuest} />} />
        <ProtectedRoute path="/groups" component={GroupsPage} />
        <ProtectedRoute path="/profile" component={ProfilePage} />
        <ProtectedRoute path="/submit" component={SubmitPostPage} />
        <Route component={NotFound} />
      </Switch>
    </TooltipProvider>
  );
}

export default App;
