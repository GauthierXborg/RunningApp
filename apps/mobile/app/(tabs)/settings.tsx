import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Card } from '../../components/Card';
import { useApp } from '../../contexts/AppContext';
import { connectStrava } from '../../lib/strava';

const DISTANCE_LABELS: Record<string, string> = {
  '5k': '5K',
  '10k': '10K',
  half: 'Half Marathon',
  marathon: 'Marathon',
};

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  elite: 'Elite',
};

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, plan, setProfile, stravaToken, setStravaToken, regeneratePlan } = useApp();
  const [connecting, setConnecting] = useState(false);

  const targetDate = useMemo(() => {
    if (!plan) return null;
    // End date is start date + plan duration weeks
    const start = new Date(plan.startDate + 'T00:00:00');
    const end = new Date(start);
    end.setDate(end.getDate() + plan.planDurationWeeks * 7);
    return end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }, [plan]);

  const fiveKDisplay = useMemo(() => {
    if (!profile?.fiveKSeconds) return 'Not set';
    const mins = Math.floor(profile.fiveKSeconds / 60);
    const secs = profile.fiveKSeconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }, [profile]);

  const restDaysDisplay = useMemo(() => {
    if (!profile?.restDays || profile.restDays.length === 0) return 'None';
    return profile.restDays.map((d) => DAY_NAMES[d]).join(', ');
  }, [profile]);

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

  const handleRegenerate = () => {
    Alert.alert(
      'Regenerate Plan',
      'This will take you through setup again to adjust your objectives. Your current plan and progress will be replaced.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => router.push('/onboarding/profile'),
        },
      ],
    );
  };

  const handleUnitToggle = async (v: boolean) => {
    if (!profile) return;
    await setProfile({ ...profile, useImperial: v });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-bold text-textPrimary mb-6" style={styles.tracking}>
          Settings
        </Text>

        {/* Your Objective card */}
        <Card>
          <View className="flex-row items-center mb-4" style={styles.objectiveHeader}>
            <View className="w-11 h-11 rounded-[14px] bg-surfaceLight justify-center items-center">
              <Feather name="target" size={20} color={Colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-textPrimary">Your Objective</Text>
              <Text className="text-[13px] text-textMuted mt-0.5">
                {DISTANCE_LABELS[profile?.targetDistance ?? ''] ?? '—'}
                {targetDate ? ` · ${targetDate}` : ''}
              </Text>
            </View>
          </View>

          {/* Parameter labels */}
          <View style={styles.paramGrid}>
            <View className="flex-row items-center justify-between py-2.5" style={styles.paramRow}>
              <Text className="text-[13px] text-textMuted">Experience</Text>
              <Text className="text-[13px] font-semibold text-textSecondary">
                {EXPERIENCE_LABELS[profile?.experienceLevel ?? ''] ?? '—'}
              </Text>
            </View>
            <View style={styles.divider} />
            <View className="flex-row items-center justify-between py-2.5" style={styles.paramRow}>
              <Text className="text-[13px] text-textMuted">5K Time</Text>
              <Text className="text-[13px] font-semibold text-textSecondary">{fiveKDisplay}</Text>
            </View>
            <View style={styles.divider} />
            <View className="flex-row items-center justify-between py-2.5" style={styles.paramRow}>
              <Text className="text-[13px] text-textMuted">Days / week</Text>
              <Text className="text-[13px] font-semibold text-textSecondary">
                {profile?.daysPerWeek ?? '—'}
              </Text>
            </View>
            <View style={styles.divider} />
            <View className="flex-row items-center justify-between py-2.5" style={styles.paramRow}>
              <Text className="text-[13px] text-textMuted">Plan duration</Text>
              <Text className="text-[13px] font-semibold text-textSecondary">
                {profile?.planDurationWeeks ?? '—'} weeks
              </Text>
            </View>
            <View style={styles.divider} />
            <View className="flex-row items-center justify-between py-2.5" style={styles.paramRow}>
              <Text className="text-[13px] text-textMuted">Rest days</Text>
              <Text className="text-[13px] font-semibold text-textSecondary">{restDaysDisplay}</Text>
            </View>
          </View>
        </Card>

        {/* Regenerate */}
        <View className="mt-5">
          <PrimaryButton
            title="Regenerate Plan"
            icon="refresh-cw"
            variant="secondary"
            onPress={handleRegenerate}
          />
        </View>

        {/* Units */}
        <Text className="text-base font-semibold text-textSecondary mt-8 mb-3">
          Units
        </Text>
        <Card>
          <View className="flex-row items-center justify-between">
            <Text className="text-[15px] font-medium text-textPrimary">
              {profile?.useImperial ? 'Miles' : 'Kilometres'}
            </Text>
            <Switch
              value={profile?.useImperial ?? false}
              onValueChange={handleUnitToggle}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>
        </Card>

        {/* Integrations */}
        <Text className="text-base font-semibold text-textSecondary mt-8 mb-3">
          Integrations
        </Text>
        <Card>
          <View className="flex-row items-center" style={styles.stravaGap}>
            <View className="w-11 h-11 rounded-[14px] bg-surfaceLight justify-center items-center">
              <Feather
                name={stravaToken ? 'check-circle' : 'link'}
                size={20}
                color={stravaToken ? Colors.success : Colors.textMuted}
              />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-textPrimary">Strava</Text>
              <Text className="text-[13px] text-textMuted mt-0.5">
                {stravaToken ? 'Connected' : 'Not connected'}
              </Text>
            </View>
          </View>
          <View className="mt-4">
            {stravaToken ? (
              <PrimaryButton
                title="Disconnect"
                variant="secondary"
                onPress={handleDisconnectStrava}
              />
            ) : (
              <PrimaryButton
                title="Connect Strava"
                icon="link"
                onPress={handleConnectStrava}
                loading={connecting}
              />
            )}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 48,
  },
  tracking: {
    letterSpacing: -0.3,
  },
  objectiveHeader: {
    gap: 14,
  },
  paramGrid: {
    marginTop: 4,
  },
  paramRow: {
    paddingHorizontal: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  stravaGap: {
    gap: 14,
  },
});
