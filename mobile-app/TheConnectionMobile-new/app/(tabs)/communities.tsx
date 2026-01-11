import { CommunitiesScreen } from "../../src/screens/CommunitiesScreen";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";

export default function CommunitiesTab() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <CommunitiesScreen
      showCenteredLogo={true}
      userName={user?.displayName || user?.username || "User"}
      userAvatar={user?.profileImageUrl}
      onProfilePress={() => {
        router.push("/profile");
      }}
      onMessagesPress={() => {
        router.push("/(tabs)/messages");
      }}
      onMenuPress={() => {
        Alert.alert("Menu", "Settings and more options coming soon!");
      }}
      onSearchPress={() => {
        Alert.alert("Search", "Search functionality coming soon!");
      }}
      // onCreatePress is removed - let CommunitiesScreen handle it with the modal
      onCommunityPress={(community) => {
        Alert.alert(
          community.name,
          `${community.description}\n\nMembers: ${community.memberCount || 0}\n\nNavigation to community details coming soon!`
        );
      }}
      onCategoryPress={(category) => {
        Alert.alert(
          category.title,
          `Browse communities in this category\n\nComing soon!`
        );
      }}
    />
  );
}
