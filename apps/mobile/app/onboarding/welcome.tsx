import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Colors } from '../../constants/colors';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-7 justify-between">
        <View className="flex-1 justify-center items-center">
          <View style={styles.iconRing} className="mb-8">
            <View className="w-[88px] h-[88px] rounded-full bg-surface justify-center items-center">
              <Feather name="zap" size={40} color={Colors.primary} />
            </View>
          </View>
          <Text className="text-4xl font-extrabold text-textPrimary mb-2" style={styles.title}>
            Start Your
          </Text>
          <Text className="text-4xl font-extrabold text-accent mb-3" style={styles.title}>
            Running Journey
          </Text>
          <Text className="text-lg font-medium text-accent mb-4">
            Your personal running coach
          </Text>
          <Text className="text-[15px] text-textMuted text-center leading-[22px] px-5">
            Build a training plan tailored to your goals, track your progress, and crush your next race.
          </Text>
        </View>

        <View className="pb-8">
          <PrimaryButton
            title="Sign in with Apple"
            icon="smartphone"
            onPress={() => router.push('/onboarding/profile')}
          />
          <View className="h-3" />
          <PrimaryButton
            title="Continue with Email"
            icon="mail"
            variant="secondary"
            onPress={() => router.push('/onboarding/profile')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  iconRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    letterSpacing: -0.5,
  },
});
