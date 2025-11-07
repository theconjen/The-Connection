import { Stack } from 'expo-router';
import { useAppFonts } from '../src/shared/useFonts';
import { ThemeProvider } from '../src/shared/ThemeProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function Root() {
  const [loaded] = useAppFonts();
  if (!loaded) return null;
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
