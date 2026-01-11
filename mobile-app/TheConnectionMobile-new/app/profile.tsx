import { ProfileScreen } from "../src/screens/ProfileScreen";
import { useRouter } from "expo-router";
import { useAuth } from "../src/contexts/AuthContext";
import { Alert } from "react-native";

export default function ProfileRoute() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <ProfileScreen
      onBackPress={() => router.back()}
      userName={user?.displayName || user?.username || "User"}
      userEmail={user?.email || ""}
      userAvatar={user?.profileImageUrl}
      userBio={user?.bio || ""}
      userLocation={user?.location || ""}
      userDenomination={user?.denomination || ""}
      onSaveProfile={(data) => {
        console.info("Saving profile:", data);
        Alert.alert("Success", "Profile saved! (API integration coming soon)");
      }}
    />
  );
}
