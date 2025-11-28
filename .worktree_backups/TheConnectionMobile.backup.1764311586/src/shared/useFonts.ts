import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { PlayfairDisplay_400Regular } from '@expo-google-fonts/playfair-display';
import { Merriweather_400Regular } from '@expo-google-fonts/merriweather';

export function useAppFonts() {
  return useFonts({
    Inter: Inter_400Regular,
    InterBold: Inter_700Bold,
    Playfair: PlayfairDisplay_400Regular,
    Merri: Merriweather_400Regular,
  });
}
