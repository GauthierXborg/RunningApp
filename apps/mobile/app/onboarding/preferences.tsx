import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChipSelector } from '../../components/ChipSelector';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Colors } from '../../constants/colors';
import { useApp, RunnerProfile } from '../../contexts/AppContext';

const DURATION_OPTIONS = [
  { label: '8 weeks', value: '8' },
  { label: '10 weeks', value: '10' },
  { label: '12 weeks', value: '12' },
];

const DAY_OPTIONS = [
  { label: 'Mon', value: '0' },
  { label: 'Tue', value: '1' },
  { label: 'Wed', value: '2' },
  { label: 'Thu', value: '3' },
  { label: 'Fri', value: '4' },
  { label: 'Sat', value: '5' },
  { label: 'Sun', value: '6' },
];

export default function PreferencesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    targetDistance: string;
    fiveKSeconds: string;
    experienceLevel: string;
    useImperial: string;
    regenerate?: string;
  }>();
  const { profile, setProfile, regeneratePlan, onboardingComplete } = useApp();
  const isRegenerate = params.regenerate === '1' || onboardingComplete;

  const [daysPerWeek, setDaysPerWeek] = useState(profile?.daysPerWeek ?? 4);
  const [planDuration, setPlanDuration] = useState<string | null>(
    profile?.planDurationWeeks?.toString() ?? null
  );
  const [restDays, setRestDays] = useState<string[]>(
    profile?.restDays?.map(String) ?? []
  );

  const handleContinue = async () => {
    if (!planDuration) {
      Alert.alert('Required', 'Please select a plan duration.');
      return;
    }

    const availableDays = 7 - restDays.length;
    if (availableDays < daysPerWeek) {
      Alert.alert(
        'Too many rest days',
        `You selected ${daysPerWeek} training days per week but only ${availableDays} days are available. Please reduce rest days or training days.`
      );
      return;
    }

    const newProfile: RunnerProfile = {
      targetDistance: params.targetDistance as RunnerProfile['targetDistance'],
      fiveKSeconds:
        params.fiveKSeconds === 'null' ? null : parseInt(params.fiveKSeconds, 10),
      experienceLevel: params.experienceLevel as RunnerProfile['experienceLevel'],
      daysPerWeek,
      planDurationWeeks: parseInt(planDuration, 10) as 8 | 10 | 12,
      restDays: restDays.map(Number),
      useImperial: params.useImperial === '1',
    };

    await setProfile(newProfile);

    if (isRegenerate) {
      // Regenerate plan and go back to tabs
      await regeneratePlan();
      router.replace('/(tabs)');
    } else {
      router.push('/onboarding/strava');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-bold text-textPrimary" style={styles.tracking}>
          Training preferences
        </Text>
        <Text className="text-[15px] text-textMuted mt-1 mb-2">
          Set up your ideal training schedule
        </Text>

        <Text className="text-base font-semibold text-textSecondary mt-7 mb-3">
          Days per week
        </Text>
        <View className="flex-row justify-between items-center bg-surface rounded-2xl p-1.5 border border-divider">
          {[3, 4, 5, 6, 7].map((n) => (
            <TouchableOpacity
              key={n}
              className={`flex-1 items-center py-3.5 rounded-xl ${
                n === daysPerWeek ? 'bg-accent' : ''
              }`}
              onPress={() => setDaysPerWeek(n)}
              activeOpacity={0.7}
            >
              <Text
                className={`text-lg font-bold ${
                  n === daysPerWeek ? 'text-bg' : 'text-textMuted'
                }`}
              >
                {n}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-base font-semibold text-textSecondary mt-7 mb-3">
          Plan duration
        </Text>
        <ChipSelector
          options={DURATION_OPTIONS}
          selected={planDuration}
          onSelect={setPlanDuration}
        />

        <Text className="text-base font-semibold text-textSecondary mt-7 mb-3">
          Rest days
        </Text>
        <Text className="text-[13px] text-textMuted mb-3 -mt-1">
          Select days you prefer not to train
        </Text>
        <ChipSelector
          options={DAY_OPTIONS}
          selected={null}
          onSelect={() => {}}
          multi
          selectedValues={restDays}
          onMultiSelect={setRestDays}
        />
      </ScrollView>

      <View className="px-6 pb-4 pt-2">
        <PrimaryButton title={isRegenerate ? 'Generate Plan' : 'Continue'} onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
  tracking: {
    letterSpacing: -0.3,
  },
});
