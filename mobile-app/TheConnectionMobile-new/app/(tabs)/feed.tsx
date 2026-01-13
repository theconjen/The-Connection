import FeedScreen from "../../src/screens/FeedScreen";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../../src/lib/apiClient";
import { MenuDrawer } from "../../src/components/MenuDrawer";

export default function FeedTab() {
  const router = useRouter();
  const { user } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);

  // Fetch unread notifications count
  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ['/api/notifications/unread-count'],
    queryFn: async () => {
      if (!user) return 0;
      try {
        const response = await apiClient.get('/api/notifications/unread-count');
        return response.data.count || 0;
      } catch (error) {
        return 0;
      }
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <>
      <FeedScreen
        onProfilePress={() => {
          router.push("/profile");
        }}
        onSearchPress={() => {
          router.push("/search");
        }}
        onSettingsPress={() => setMenuVisible(true)}
        onMessagesPress={() => {
          router.push("/(tabs)/messages");
        }}
        onNotificationsPress={() => {
          router.push("/notifications");
        }}
        userName={user?.displayName || user?.username || "User"}
        userAvatar={user?.profileImageUrl}
        unreadNotificationsCount={unreadCount}
      />
      <MenuDrawer
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onSettings={() => router.push("/settings")}
        onNotifications={() => router.push("/notifications")}
        onApologetics={() => {
          Alert.alert(
            "Coming Soon",
            "The Apologetics feature is currently under development. Stay tuned. If you are interested in becoming a verified Apologist email: hello@theconnection.app",
            [{ text: "OK" }]
          );
        }}
      />
    </>
  );
}
