import { useLocalSearchParams } from 'expo-router';
import { OrganizationDashboardScreen } from '../../src/screens/organization/OrganizationDashboardScreen';

export default function OrganizationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <OrganizationDashboardScreen organizationId={id} />;
}
