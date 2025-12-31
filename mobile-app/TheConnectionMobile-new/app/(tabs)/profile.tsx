import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import ProfileScreen from '../../src/screens/ProfileScreen';

export default function Profile() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProfileScreen />
    </QueryClientProvider>
  );
}
