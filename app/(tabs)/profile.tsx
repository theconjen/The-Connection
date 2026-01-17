import { ProfileScreenRedesigned } from "../../src/screens/ProfileScreenRedesigned";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";

export default function ProfileRoute() {
  const router = useRouter();
  const { user } = useAuth();
  const { userId } = useLocalSearchParams<{ userId?: string }>();

  // If userId is provided in query params, use that, otherwise use current user's ID
  const targetUserId = userId ? parseInt(userId) : user?.id;

  return (
    <ProfileScreenRedesigned
      onBackPress={() => router.back()}
      userId={targetUserId}
    />
  );
}
