import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_KEY = 'tc_onboarding_seen';

export async function markOnboardingComplete() {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_KEY);
  return value === 'true';
}

