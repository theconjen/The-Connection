/**
 * Churches Directory Route
 */

import { useRouter } from 'expo-router';
import { ChurchesScreen } from '../../src/screens/ChurchesScreen';

export default function ChurchesRoute() {
  const router = useRouter();

  return (
    <ChurchesScreen
      onBack={() => router.back()}
      onChurchPress={(church) => router.push(`/churches/${church.slug}`)}
    />
  );
}
