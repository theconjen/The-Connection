import { Stack } from 'expo-router';
import { useAppFonts } from '../src/shared/useFonts';
import { ThemeProvider } from '../src/shared/ThemeProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/contexts/AuthContext';
import { UpdatesErrorBoundary } from '../src/shared/UpdatesErrorBoundary';
import { RootErrorBoundary } from '../src/shared/RootErrorBoundary';

const queryClient = new QueryClient();

export default function Root() {
  const [loaded] = useAppFonts();
  if (!loaded) return null;
  return (
    <RootErrorBoundary>
      <UpdatesErrorBoundary>
        <AuthProvider>
          <ThemeProvider>
            <QueryClientProvider client={queryClient}>
              <Stack screenOptions={{ headerShown: false }} />
            </QueryClientProvider>
          </ThemeProvider>
        </AuthProvider>
      </UpdatesErrorBoundary>
    </RootErrorBoundary>
  );
}
