import { BlockedUsersScreen } from "../src/screens/BlockedUsersScreen";
import { useRouter } from "expo-router";

export default function BlockedUsersPage() {
  const router = useRouter();

  return (
    <BlockedUsersScreen
      onBackPress={() => {
        router.back();
      }}
    />
  );
}
