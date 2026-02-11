/**
 * Church Profile Route
 */

import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChurchProfileScreen } from '../../src/screens/ChurchProfileScreen';

export default function ChurchProfileRoute() {
  const router = useRouter();
  const { slug } = useLocalSearchParams() as { slug: string };

  if (!slug) {
    return null;
  }

  return (
    <ChurchProfileScreen
      slug={slug}
      onBack={() => router.back()}
    />
  );
}
