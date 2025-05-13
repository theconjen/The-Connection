import { Switch, Route } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/lib/protected-route";
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
        <Route path="/" component={HomePage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/community/:slug" component={CommunityPage} />
        <Route path="/apologetics" component={ApologeticsPage} />
        <Route path="/discover" component={DiscoverPage} />
        <Route path="/livestreams" component={LivestreamsPage} />
        <ProtectedRoute path="/livestreamer-application" component={LivestreamerApplicationPage} />
        <Route path="/posts/:id" component={PostDetailPage} />
        <ProtectedRoute path="/groups" component={GroupsPage} />
        <ProtectedRoute path="/profile" component={ProfilePage} />
        <ProtectedRoute path="/submit" component={SubmitPostPage} />
        <Route component={NotFound} />
      </Switch>
    </TooltipProvider>
  );
}

export default App;
