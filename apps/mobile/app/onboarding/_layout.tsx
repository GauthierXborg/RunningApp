import { Stack } from 'expo-router';
import { Colors } from '../../constants/colors';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: 'Runner Profile' }} />
      <Stack.Screen name="preferences" options={{ title: 'Training Preferences' }} />
      <Stack.Screen name="strava" options={{ title: 'Connect Strava' }} />
    </Stack>
  );
}
