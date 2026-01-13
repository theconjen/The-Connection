import SearchScreen from "../src/screens/SearchScreen";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function SearchPage() {
  const router = useRouter();
  const { filter } = useLocalSearchParams<{ filter?: string }>();

  return (
    <SearchScreen
      onClose={() => {
        router.back();
      }}
      defaultFilter={filter as any}
    />
  );
}
