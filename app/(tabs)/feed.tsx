import FeedScreen from "../../src/screens/FeedScreen";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useAuth } from "../../src/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../../src/lib/apiClient";
import { MenuDrawer } from "../../src/components/MenuDrawer";

export default function FeedTab() {
  const router = useRouter();
  const { user } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);

  // Check if user has inbox access permission
  const hasInboxAccess = user?.permissions?.includes('inbox_access') || false;

  // Fetch unread notifications count (for hamburger menu badge)
  const { data: unreadNotificationCount = 0 } = useQuery<number>({
    queryKey: ['notification-count'],
    queryFn: async () => {
      if (!user) return 0;
      try {
        const response = await apiClient.get('/api/notifications/unread-count');
        return response.data?.data?.count ?? response.data?.count ?? 0;
      } catch (error) {
        return 0;
      }
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Fetch unread DM count (for message icon badge)
  const { data: unreadMessageCount = 0 } = useQuery<number>({
    queryKey: ['unread-count'],
    queryFn: async () => {
      if (!user) return 0;
      try {
        const response = await apiClient.get('/api/messages/unread-count');
        return response.data?.count ?? 0;
      } catch (error) {
        return 0;
      }
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  return (
    <>
      <FeedScreen
        onProfilePress={() => router.push("/(tabs)/profile")}
        onSearchPress={() => router.push("/search")}
        onSettingsPress={() => setMenuVisible(true)}
        onMessagesPress={() => router.push("/(tabs)/messages")}
        onNotificationsPress={() => router.push("/notifications")}
        onAuthorPress={(userId) => router.push(`/(tabs)/profile?userId=${userId}`)}
        onPostPress={(post) => router.push(`/posts/${post.id}`)}
        userName={user?.displayName || user?.username || "User"}
        userAvatar={user?.profileImageUrl || user?.avatarUrl}
        unreadNotificationsCount={unreadNotificationCount}
        unreadMessageCount={unreadMessageCount}
      />

      <MenuDrawer
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onSettings={() => router.push("/settings")}
        onNotifications={() => router.push("/notifications")}
        onBookmarks={() => router.push("/bookmarks")}
        onMessages={() => router.push("/(tabs)/messages")}
        onInbox={() => router.push("/questions/inbox")}
        hasInboxAccess={hasInboxAccess}
        onSearch={() => router.push("/search")}
        onUserPress={(userId) => router.push(`/(tabs)/profile?userId=${userId}`)}
      />
    </>
  );
}
