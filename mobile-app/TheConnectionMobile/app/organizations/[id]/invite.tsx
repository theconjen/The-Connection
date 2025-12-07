import { useLocalSearchParams } from 'expo-router';
import { OrganizationInviteScreen } from '../../../src/screens/organization/OrganizationInviteScreen';

export default function OrganizationInvite() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <OrganizationInviteScreen organizationId={id} />;
}
