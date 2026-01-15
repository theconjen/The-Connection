import BookmarksScreen from "../src/screens/BookmarksScreen";
import { useRouter } from "expo-router";

export default function BookmarksPage() {
  const router = useRouter();

  return <BookmarksScreen />;
}
