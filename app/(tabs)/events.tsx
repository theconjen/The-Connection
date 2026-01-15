import { EventsScreen } from "../../src/screens/EventsScreen";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { useState } from "react";
import { MenuDrawer } from "../../src/components/MenuDrawer";
import { Alert } from "react-native";

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
      onBookmarks={() => router.push("/bookmarks")}
      onApologetics={() => {
        Alert.alert(
          "Coming Soon",
          "The Apologetics feature is currently under development. Stay tuned. If you are interested in becoming a verified Apologist email: hello@theconnection.app",
          [{ text: "OK" }]
        );
      }}
      onSearch={() => router.push("/search")}
    />
  </>
  );
}
