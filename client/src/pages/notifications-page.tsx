/**
 * Notifications Page
 *
 * Shell page that redirects to settings or shows info about mobile notifications.
 * Web doesn't have push notifications like mobile, but this prevents 404 for shared links.
 */

import { Bell } from "lucide-react";
import AppShellPage from "../components/app-shell-page";
import { Button } from "../components/ui/button";
import { useLocation } from "wouter";

export default function NotificationsPage() {
  const [, navigate] = useLocation();

  return (
    <AppShellPage
      title="Notifications"
      description="Push notifications are available in The Connection mobile app. Manage your notification preferences in settings."
      deepLinkPath="notifications"
      icon={<Bell className="h-8 w-8 text-primary" />}
      showStoreLinks={true}
    >
      <div className="text-center">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate("/settings")}
        >
          Go to Settings
        </Button>
      </div>
    </AppShellPage>
  );
}
