import SearchScreen from "../src/screens/SearchScreen";
import { useRouter } from "expo-router";

export default function SearchPage() {
  const router = useRouter();

  return (
    <SearchScreen
      onClose={() => {
        router.back();
      }}
    />
  );
}
