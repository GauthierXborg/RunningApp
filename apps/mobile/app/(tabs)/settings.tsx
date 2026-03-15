import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { ChipSelector } from '../../components/ChipSelector';
import { TimeInput } from '../../components/TimeInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useApp, RunnerProfile } from '../../contexts/AppContext';
import { connectStrava } from '../../lib/strava';

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

export default function SettingsScreen() {
  const { profile, setProfile, stravaToken, setStravaToken } = useApp();
  const [connecting, setConnecting] = useState(false);

  const [targetDistance, setTargetDistance] = useState(profile?.targetDistance ?? '5k');
  const [dontKnowTime, setDontKnowTime] = useState(profile?.fiveKSeconds === null);
  const [minutes, setMinutes] = useState(
    profile?.fiveKSeconds ? String(Math.floor(profile.fiveKSeconds / 60)) : ''
  );
  const [seconds, setSeconds] = useState(
    profile?.fiveKSeconds ? String(profile.fiveKSeconds % 60).padStart(2, '0') : ''
  );
  const [experienceLevel, setExperienceLevel] = useState(
    profile?.experienceLevel ?? 'beginner'
  );
  const [daysPerWeek, setDaysPerWeek] = useState(profile?.daysPerWeek ?? 4);
  const [planDuration, setPlanDuration] = useState(
    String(profile?.planDurationWeeks ?? 12)
  );
  const [restDays, setRestDays] = useState<string[]>(
    profile?.restDays?.map(String) ?? []
  );
  const [useImperial, setUseImperial] = useState(profile?.useImperial ?? false);

  // Sync local state when profile changes externally
  useEffect(() => {
    if (profile) {
      setTargetDistance(profile.targetDistance);
      setDontKnowTime(profile.fiveKSeconds === null);
      setMinutes(profile.fiveKSeconds ? String(Math.floor(profile.fiveKSeconds / 60)) : '');
      setSeconds(profile.fiveKSeconds ? String(profile.fiveKSeconds % 60).padStart(2, '0') : '');
      setExperienceLevel(profile.experienceLevel);
      setDaysPerWeek(profile.daysPerWeek);
      setPlanDuration(String(profile.planDurationWeeks));
      setRestDays(profile.restDays.map(String));
      setUseImperial(profile.useImperial);
    }
  }, [profile]);

  const saveProfile = async (overrides: Partial<RunnerProfile> = {}) => {
    let fiveKSeconds: number | null = null;
    const currentDontKnow = overrides.fiveKSeconds === undefined ? dontKnowTime : overrides.fiveKSeconds === null;
    if (!currentDontKnow) {
      const mins = parseInt(minutes, 10) || 0;
      const secs = parseInt(seconds, 10) || 0;
      fiveKSeconds = mins * 60 + secs;
    }

    const updated: RunnerProfile = {
      targetDistance: (overrides.targetDistance ?? targetDistance) as RunnerProfile['targetDistance'],
      fiveKSeconds: overrides.fiveKSeconds !== undefined ? overrides.fiveKSeconds : fiveKSeconds,
      experienceLevel: (overrides.experienceLevel ?? experienceLevel) as RunnerProfile['experienceLevel'],
      daysPerWeek: overrides.daysPerWeek ?? daysPerWeek,
      planDurationWeeks: (overrides.planDurationWeeks ?? parseInt(planDuration, 10)) as 8 | 10 | 12,
      restDays: overrides.restDays ?? restDays.map(Number),
      useImperial: overrides.useImperial ?? useImperial,
    };

    await setProfile(updated);
  };

  const handleConnectStrava = async () => {
    setConnecting(true);
    try {
      const token = await connectStrava();
      if (token) {
        await setStravaToken(token);
      } else {
        Alert.alert('Connection failed', 'Could not connect to Strava.');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectStrava = () => {
    Alert.alert('Disconnect Strava', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: () => setStravaToken(null),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Target distance</Text>
        <ChipSelector
          options={DISTANCE_OPTIONS}
          selected={targetDistance}
          onSelect={(v) => {
            setTargetDistance(v as RunnerProfile['targetDistance']);
            saveProfile({ targetDistance: v as RunnerProfile['targetDistance'] });
          }}
        />

        <Text style={styles.sectionTitle}>Recent 5K time</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>I don't know</Text>
          <Switch
            value={dontKnowTime}
            onValueChange={(v) => {
              setDontKnowTime(v);
              if (v) saveProfile({ fiveKSeconds: null });
            }}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Colors.text}
          />
        </View>
        {!dontKnowTime && (
          <TimeInput
            minutes={minutes}
            seconds={seconds}
            onChangeMinutes={(v) => {
              setMinutes(v);
              // Save on blur would be better, but save after short delay
            }}
            onChangeSeconds={(v) => {
              setSeconds(v);
            }}
          />
        )}

        <Text style={styles.sectionTitle}>Experience level</Text>
        <ChipSelector
          options={EXPERIENCE_OPTIONS}
          selected={experienceLevel}
          onSelect={(v) => {
            setExperienceLevel(v as RunnerProfile['experienceLevel']);
            saveProfile({ experienceLevel: v as RunnerProfile['experienceLevel'] });
          }}
        />

        <Text style={styles.sectionTitle}>Days per week</Text>
        <View style={styles.sliderTrack}>
          {[3, 4, 5, 6, 7].map((n) => (
            <View
              key={n}
              style={[styles.sliderDot, n === daysPerWeek && styles.sliderDotActive]}
            >
              <Text
                style={[
                  styles.sliderLabel,
                  n === daysPerWeek && styles.sliderLabelActive,
                ]}
                onPress={() => {
                  setDaysPerWeek(n);
                  saveProfile({ daysPerWeek: n });
                }}
              >
                {n}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Plan duration</Text>
        <ChipSelector
          options={DURATION_OPTIONS}
          selected={planDuration}
          onSelect={(v) => {
            setPlanDuration(v);
            saveProfile({ planDurationWeeks: parseInt(v, 10) as 8 | 10 | 12 });
          }}
        />

        <Text style={styles.sectionTitle}>Rest days</Text>
        <ChipSelector
          options={DAY_OPTIONS}
          selected={null}
          onSelect={() => {}}
          multi
          selectedValues={restDays}
          onMultiSelect={(v) => {
            setRestDays(v);
            saveProfile({ restDays: v.map(Number) });
          }}
        />

        <Text style={styles.sectionTitle}>Units</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>
            {useImperial ? 'Miles' : 'Kilometres'}
          </Text>
          <Switch
            value={useImperial}
            onValueChange={(v) => {
              setUseImperial(v);
              saveProfile({ useImperial: v });
            }}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Colors.text}
          />
        </View>

        <Text style={styles.sectionTitle}>Strava</Text>
        {stravaToken ? (
          <PrimaryButton
            title="Disconnect Strava"
            variant="secondary"
            onPress={handleDisconnectStrava}
          />
        ) : (
          <PrimaryButton
            title="Connect Strava"
            onPress={handleConnectStrava}
            loading={connecting}
          />
        )}

        <View style={styles.regenSection}>
          <PrimaryButton
            title="Regenerate Plan"
            variant="secondary"
            onPress={() =>
              Alert.alert('Coming soon', 'Plan regeneration coming soon.')
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
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
  regenSection: {
    marginTop: 32,
  },
});
