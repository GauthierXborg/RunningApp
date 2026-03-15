import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChipSelector } from '../../components/ChipSelector';
import { TimeInput } from '../../components/TimeInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/colors';
import { useApp } from '../../contexts/AppContext';

const DISTANCE_OPTIONS = [
  { label: '5K', value: '5k' },
  { label: '10K', value: '10k' },
  { label: 'Half Marathon', value: 'half' },
  { label: 'Marathon', value: 'marathon' },
];

const EXPERIENCE_OPTIONS = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
  { label: 'Elite', value: 'elite' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { profile } = useApp();

  const [targetDistance, setTargetDistance] = useState<string | null>(
    profile?.targetDistance ?? null
  );
  const [dontKnowTime, setDontKnowTime] = useState(profile?.fiveKSeconds === null);
  const [minutes, setMinutes] = useState(
    profile?.fiveKSeconds ? String(Math.floor(profile.fiveKSeconds / 60)) : ''
  );
  const [seconds, setSeconds] = useState(
    profile?.fiveKSeconds ? String(profile.fiveKSeconds % 60).padStart(2, '0') : ''
  );
  const [experienceLevel, setExperienceLevel] = useState<string | null>(
    profile?.experienceLevel ?? null
  );
  const [useImperial, setUseImperial] = useState(profile?.useImperial ?? false);

  const handleContinue = () => {
    if (!targetDistance) {
      Alert.alert('Required', 'Please select a target distance.');
      return;
    }
    if (!experienceLevel) {
      Alert.alert('Required', 'Please select your experience level.');
      return;
    }

    let fiveKSeconds: number | null = null;
    if (!dontKnowTime) {
      const mins = parseInt(minutes, 10) || 0;
      const secs = parseInt(seconds, 10) || 0;
      const totalSeconds = mins * 60 + secs;
      if (totalSeconds < 720 || totalSeconds > 2700) {
        Alert.alert('Invalid time', '5K time must be between 12:00 and 45:00.');
        return;
      }
      fiveKSeconds = totalSeconds;
    }

    router.push({
      pathname: '/onboarding/preferences',
      params: {
        targetDistance,
        fiveKSeconds: fiveKSeconds !== null ? String(fiveKSeconds) : 'null',
        experienceLevel,
        useImperial: useImperial ? '1' : '0',
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-bold text-textPrimary" style={styles.tracking}>
          Tell us about yourself
        </Text>
        <Text className="text-[15px] text-textMuted mt-1 mb-2">
          We'll use this to build your personalized plan
        </Text>

        <Text className="text-base font-semibold text-textSecondary mt-7 mb-3">
          Target distance
        </Text>
        <ChipSelector
          options={DISTANCE_OPTIONS}
          selected={targetDistance}
          onSelect={setTargetDistance}
        />

        <Text className="text-base font-semibold text-textSecondary mt-7 mb-3">
          Recent 5K time
        </Text>
        <Card>
          <View className="flex-row items-center justify-between">
            <Text className="text-[15px] font-medium text-textPrimary">
              I don't know my time
            </Text>
            <Switch
              value={dontKnowTime}
              onValueChange={setDontKnowTime}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>
          {!dontKnowTime && (
            <View className="mt-4 items-center">
              <TimeInput
                minutes={minutes}
                seconds={seconds}
                onChangeMinutes={setMinutes}
                onChangeSeconds={setSeconds}
              />
            </View>
          )}
        </Card>

        <Text className="text-base font-semibold text-textSecondary mt-7 mb-3">
          Experience level
        </Text>
        <ChipSelector
          options={EXPERIENCE_OPTIONS}
          selected={experienceLevel}
          onSelect={setExperienceLevel}
        />

        <Text className="text-base font-semibold text-textSecondary mt-7 mb-3">
          Units
        </Text>
        <Card>
          <View className="flex-row items-center justify-between">
            <Text className="text-[15px] font-medium text-textPrimary">
              {useImperial ? 'Miles' : 'Kilometres'}
            </Text>
            <Switch
              value={useImperial}
              onValueChange={setUseImperial}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>
        </Card>
      </ScrollView>

      <View className="px-6 pb-4 pt-2">
        <PrimaryButton title="Continue" onPress={handleContinue} />
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
