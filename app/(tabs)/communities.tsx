import { CommunitiesScreen } from "../../src/screens/CommunitiesScreen";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { useState } from "react";
import { MenuDrawer } from "../../src/components/MenuDrawer";

export default function CommunitiesTab() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <>
      <CommunitiesScreen
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
