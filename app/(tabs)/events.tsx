import { EventsScreen } from "../../src/screens/EventsScreen";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { useState } from "react";
import { MenuDrawer } from "../../src/components/MenuDrawer";

export default function EventsTab() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <>
      <EventsScreen
      userName={user?.displayName || user?.username || "User"}
      userAvatar={user?.profileImageUrl}
      onProfilePress={() => {
        router.push("/profile");
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
      onEventPress={(event) => {
        router.push(`/events/${event.id}`);
      }}
      onCategoryPress={(category) => {
        setSelectedCategory(category.id);
      }}
      selectedCategory={selectedCategory}
      onClearCategory={() => setSelectedCategory(null)}
    />
    <MenuDrawer
      visible={menuVisible}
      onClose={() => setMenuVisible(false)}
      onSettings={() => router.push("/settings")}
      onNotifications={() => router.push("/notifications")}
    />
  </>
  );
}
