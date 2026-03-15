import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
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
  }>();
  const { profile, setProfile } = useApp();

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
    router.push('/onboarding/strava');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.sectionTitle}>Days per week</Text>
        <View style={styles.sliderContainer}>
          <View style={styles.sliderTrack}>
            {[3, 4, 5, 6, 7].map((n) => (
              <View
                key={n}
                style={[
                  styles.sliderDot,
                  n === daysPerWeek && styles.sliderDotActive,
                ]}
              >
                <Text
                  style={[
                    styles.sliderLabel,
                    n === daysPerWeek && styles.sliderLabelActive,
                  ]}
                  onPress={() => setDaysPerWeek(n)}
                >
                  {n}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Plan duration</Text>
        <ChipSelector
          options={DURATION_OPTIONS}
          selected={planDuration}
          onSelect={setPlanDuration}
        />

        <Text style={styles.sectionTitle}>Rest days</Text>
        <Text style={styles.hint}>Select days you prefer not to train</Text>
        <ChipSelector
          options={DAY_OPTIONS}
          selected={null}
          onSelect={() => {}}
          multi
          selectedValues={restDays}
          onMultiSelect={setRestDays}
        />
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton title="Continue" onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  hint: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  sliderContainer: {
    paddingVertical: 8,
  },
  sliderTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 8,
  },
  sliderDot: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  sliderDotActive: {
    backgroundColor: Colors.primary,
  },
  sliderLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  sliderLabelActive: {
    color: Colors.background,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
});
