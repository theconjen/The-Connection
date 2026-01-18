import ApologeticsScreen from "../../src/screens/ApologeticsScreen";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useAuth } from "../../src/contexts/AuthContext";
import { MenuDrawer } from "../../src/components/MenuDrawer";

export default function ApologeticsTab() {
  const router = useRouter();
  const { user } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);

  // Check if user has inbox access permission
  const hasInboxAccess = user?.permissions?.includes('inbox_access') || false;

  return (
    <>
      <ApologeticsScreen
        onProfilePress={() => router.push("/(tabs)/profile")}
        onMessagesPress={() => router.push("/(tabs)/messages")}
        onMenuPress={() => setMenuVisible(true)}
        userName={user?.displayName || user?.username || "User"}
        userAvatar={user?.profileImageUrl || user?.avatarUrl}
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
