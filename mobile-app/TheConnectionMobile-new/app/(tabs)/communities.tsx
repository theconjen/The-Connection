import { CommunitiesScreen } from "../../src/screens/CommunitiesScreen";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../../src/lib/apiClient";
import { MenuDrawer } from "../../src/components/MenuDrawer";

export default function CommunitiesTab() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  // Check if user has inbox access permission
  const hasInboxAccess = user?.permissions?.includes('inbox_access') || false;

  // Fetch unread notifications count
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

  // Fetch unread DM count
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
      <CommunitiesScreen
      userName={user?.displayName || user?.username || "User"}
      userAvatar={user?.profileImageUrl || user?.avatarUrl}
      onProfilePress={() => {
        router.push("/(tabs)/profile");
      }}
      onSearchPress={() => {
        router.push("/search");
      }}
      onNotificationsPress={() => {
        router.push("/notifications");
      }}
      onSettingsPress={() => {
        router.push("/settings");
      }}
      onMessagesPress={() => {
        router.push("/(tabs)/messages");
      }}
      onMenuPress={() => setMenuVisible(true)}
      onCreatePress={() => {
        router.push("/communities/create");
      }}
      onCommunityPress={(community) => {
        router.push(`/communities/${community.id}`);
      }}
      onCategoryPress={(category) => {
        setSelectedCategory(category.id);
      }}
      selectedCategory={selectedCategory}
      onClearCategory={() => setSelectedCategory(null)}
      unreadNotificationCount={unreadNotificationCount}
      unreadMessageCount={unreadMessageCount}
    />
    <MenuDrawer
      visible={menuVisible}
      onClose={() => setMenuVisible(false)}
      onSettings={() => router.push("/settings")}
      onNotifications={() => router.push("/notifications")}
      onBookmarks={() => router.push("/bookmarks")}
      onInbox={() => router.push("/questions/inbox")}
      hasInboxAccess={hasInboxAccess}
      onSearch={() => router.push("/search")}
      onUserPress={(userId) => router.push(`/(tabs)/profile?userId=${userId}`)}
    />
  </>
  );
}
