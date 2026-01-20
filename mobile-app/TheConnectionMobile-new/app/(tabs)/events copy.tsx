import { EventsScreen } from "../../src/screens/EventsScreen";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";

export default function EventsTab() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <EventsScreen
      onProfilePress={() => {
        router.push("/profile");
      }}
      onSearchPress={() => {
        Alert.alert("Search Events", "Search for events coming soon!");
      }}
      // onCreatePress removed - let EventsScreen handle it with modal
      onEventPress={(event) => {
        Alert.alert(
          event.title,
          `${event.subtitle}\n\n📅 ${event.date} at ${event.time}\n📍 ${event.location}\n👥 ${event.attendees} attending\n\nEvent details page coming soon!`
        );
      }}
      onCategoryPress={(category) => {
        Alert.alert(
          category.title,
          `Browse ${category.count} ${category.title.toLowerCase()} events\n\nCategory filter coming soon!`
        );
      }}
      onSettingsPress={() => {
        router.push("/settings");
      }}
      onMessagesPress={() => {
        router.push("/(tabs)/messages");
      }}
      userName={user?.displayName || user?.username || "User"}
      userAvatar={user?.profileImageUrl}
    />
  );
}
