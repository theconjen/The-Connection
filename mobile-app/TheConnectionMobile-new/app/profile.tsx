import { ProfileScreen } from "../src/screens/ProfileScreen";
import { useRouter } from "expo-router";
import { useAuth } from "../src/contexts/AuthContext";
import { Alert } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import apiClient from "../src/lib/apiClient";

export default function ProfileRoute() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const handleSaveProfile = async (data: any) => {
    try {
      console.info("Saving profile:", data);
      await apiClient.patch('/api/user/profile', data);

      // Refresh user data
      await refreshUser?.();
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });

      Alert.alert("Success", "Profile updated successfully!");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      const message = error.response?.data?.message || error.message || "Failed to save profile";
      Alert.alert("Error", message);
    }
  };

  return (
    <ProfileScreen
      onBackPress={() => router.back()}
      userName={user?.displayName || user?.username || "User"}
      userEmail={user?.email || ""}
      userAvatar={user?.profileImageUrl}
      userBio={user?.bio || ""}
      userLocation={user?.location || ""}
      userDenomination={user?.denomination || ""}
      onSaveProfile={handleSaveProfile}
    />
  );
}
