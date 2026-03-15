import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChipSelector } from '../../components/ChipSelector';
import { TimeInput } from '../../components/TimeInput';
import { PrimaryButton } from '../../components/PrimaryButton';
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Target distance</Text>
        <ChipSelector
          options={DISTANCE_OPTIONS}
          selected={targetDistance}
          onSelect={setTargetDistance}
        />

        <Text style={styles.sectionTitle}>Recent 5K time</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>I don't know</Text>
          <Switch
            value={dontKnowTime}
            onValueChange={setDontKnowTime}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Colors.text}
          />
        </View>
        {!dontKnowTime && (
          <TimeInput
            minutes={minutes}
            seconds={seconds}
            onChangeMinutes={setMinutes}
            onChangeSeconds={setSeconds}
          />
        )}

        <Text style={styles.sectionTitle}>Experience level</Text>
        <ChipSelector
          options={EXPERIENCE_OPTIONS}
          selected={experienceLevel}
          onSelect={setExperienceLevel}
        />

        <Text style={styles.sectionTitle}>Units</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>
            {useImperial ? 'Miles' : 'Kilometres'}
          </Text>
          <Switch
            value={useImperial}
            onValueChange={setUseImperial}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Colors.text}
          />
        </View>
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  toggleLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
});
