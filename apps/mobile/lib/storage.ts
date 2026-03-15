import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PROFILE: '@runner_profile',
  PLAN: '@training_plan',
  STRAVA_TOKEN: '@strava_token',
  ONBOARDING_COMPLETE: '@onboarding_complete',
} as const;

export async function getItem<T>(key: string): Promise<T | null> {
  const value = await AsyncStorage.getItem(key);
  if (value === null) return null;
  return JSON.parse(value) as T;
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeItem(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove([
    KEYS.PROFILE,
    KEYS.PLAN,
    KEYS.STRAVA_TOKEN,
    KEYS.ONBOARDING_COMPLETE,
  ]);
}

export { KEYS };
