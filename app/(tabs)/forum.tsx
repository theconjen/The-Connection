import { ForumsScreen } from "../../src/screens/ForumsScreen";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useAuth } from "../../src/contexts/AuthContext";
import { MenuDrawer } from "../../src/components/MenuDrawer";
import { Alert } from "react-native";

export default function ForumTab() {
  const router = useRouter();
  const { user } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <>
      <ForumsScreen
      onProfilePress={() => {
        router.push("/profile");
      }}
      onPostPress={(post) => {
        // Navigate to post detail screen
        router.push(`/posts/${post.id}`);
      }}
      onSearchPress={() => {
        // Navigate to search screen
        router.push("/search");
      }}
      onNotificationsPress={() => {
        router.push("/notifications");
      }}
      onSettingsPress={() => setMenuVisible(true)}
      onMessagesPress={() => {
        router.push("/(tabs)/messages");
      }}
      onCreatePostPress={() => {
        router.push("/create-forum-post"); // Reddit-style forum post with anonymous option
      }}
      onAuthorPress={(authorId) => {
        // Navigate to user profile
        router.push(`/profile?userId=${authorId}`);
      }}
      userName={user?.displayName || user?.username || "User"}
      userAvatar={user?.profileImageUrl}
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
