import { Stack } from 'expo-router';
import { useAppFonts } from '../src/useFonts';
import { ThemeProvider } from '../src/ThemeProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/auth/AuthContext';

const queryClient = new QueryClient();

export default function Root() {
  const [loaded] = useAppFonts();
  if (!loaded) return null;
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
