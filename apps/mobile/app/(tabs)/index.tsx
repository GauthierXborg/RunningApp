import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Card } from '../../components/Card';
import { useApp } from '../../contexts/AppContext';
import { connectStrava, fetchActivities } from '../../lib/strava';
import { RUN_TYPE_META } from '../../constants/runTypes';
import type { RunType } from '../../constants/runTypes';

const DISTANCE_LABELS: Record<string, string> = {
  '5k': '5K',
  '10k': '10K',
  half: 'Half Marathon',
  marathon: 'Marathon',
};

export default function HomeScreen() {
  const router = useRouter();
  const { profile, plan, stravaToken, setStravaToken } = useApp();
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const currentWeekData = useMemo(() => {
    if (!plan || plan.weeks.length === 0) return null;
    const todayStr = new Date().toISOString().split('T')[0];
    for (const week of plan.weeks) {
      const dates = week.runs.map((r: any) => r.date);
      if (dates.includes(todayStr) || (dates[0] <= todayStr && dates[dates.length - 1] >= todayStr)) {
        return week;
      }
    }
    return plan.weeks[0];
  }, [plan]);

  const weekStats = useMemo(() => {
    if (!currentWeekData) return { runs: 0, distance: 0, time: 0, weekNum: 1 };
    const runActivities = currentWeekData.runs.filter((r: any) => r.runType !== 'rest');
    return {
      runs: runActivities.length,
      distance: currentWeekData.targetVolumeKm,
      time: runActivities.reduce((sum: number, r: any) => sum + r.estimatedDurationMinutes, 0),
      weekNum: currentWeekData.weekNumber,
    };
  }, [currentWeekData]);

  // Find the next upcoming run (today or future, not completed, not rest)
  const upcomingRun = useMemo(() => {
    if (!plan) return null;
    const todayStr = new Date().toISOString().split('T')[0];
    for (const week of plan.weeks) {
      for (const run of week.runs) {
        if (run.date >= todayStr && run.runType !== 'rest' && !run.completed) {
          return run;
        }
      }
    }
    return null;
  }, [plan]);

  const handleSync = async () => {
    if (!stravaToken) return;
    setSyncing(true);
    try {
      const fourWeeksAgo = Math.floor(Date.now() / 1000) - 28 * 24 * 60 * 60;
      const activities = await fetchActivities(stravaToken, fourWeeksAgo);
      Alert.alert('Synced', `Fetched ${activities.length} activities.`);
    } catch {
      Alert.alert('Error', 'Failed to sync activities.');
    } finally {
      setSyncing(false);
    }
  };

  const handleConnect = async () => {
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

  const distanceLabel = DISTANCE_LABELS[profile?.targetDistance ?? ''] ?? '';
  const imperial = profile?.useImperial ?? false;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row justify-between items-start mb-6">
          <View>
            <Text className="text-[15px] text-textMuted font-medium">Good to see you</Text>
            <Text className="text-2xl font-bold text-textPrimary mt-0.5" style={styles.tracking}>
              {distanceLabel} Training
            </Text>
          </View>
          <View className="bg-accent px-3.5 py-2 rounded-xl">
            <Text className="text-sm font-bold text-bg">Week {weekStats.weekNum}</Text>
          </View>
        </View>

        {/* Hero week card */}
        <View className="rounded-2xl p-5 mb-4 overflow-hidden" style={styles.accentCard}>
          <View className="flex-row items-baseline" style={styles.headerGap}>
            <Text className="text-lg font-bold text-bg">This week</Text>
            <Text className="text-sm font-medium text-bg opacity-70">
              of {profile?.planDurationWeeks ?? 12} weeks
            </Text>
          </View>
          <View className="flex-row items-center mt-5">
            <View className="flex-1 items-center">
              <Text className="text-4xl font-bold text-bg" style={styles.statTracking}>{weekStats.runs}</Text>
              <Text className="text-[13px] font-semibold text-bg opacity-70 mt-1">Runs</Text>
            </View>
            <View style={styles.accentDivider} />
            <View className="flex-1 items-center">
              <Text className="text-4xl font-bold text-bg" style={styles.statTracking}>
                {imperial ? Math.round(weekStats.distance * 0.621371) : weekStats.distance}
              </Text>
              <Text className="text-[13px] font-semibold text-bg opacity-70 mt-1">
                {imperial ? 'Miles' : 'Km'}
              </Text>
            </View>
            <View style={styles.accentDivider} />
            <View className="flex-1 items-center">
              <Text className="text-4xl font-bold text-bg" style={styles.statTracking}>
                {weekStats.time >= 120
                  ? `${Math.floor(weekStats.time / 60)}h${String(weekStats.time % 60).padStart(2, '0')}`
                  : `${weekStats.time}m`}
              </Text>
              <Text className="text-[13px] font-semibold text-bg opacity-70 mt-1">Time</Text>
            </View>
          </View>
        </View>

        {/* Upcoming run */}
        {upcomingRun ? (
          <>
            <Text className="text-base font-semibold text-textSecondary mt-2 mb-3">
              Up next
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push({ pathname: '/run-detail', params: { runId: upcomingRun.id } })}
            >
              <Card>
                <View className="flex-row items-center mb-3" style={styles.runHeader}>
                  <View
                    className="w-11 h-11 rounded-[14px] justify-center items-center"
                    style={{ backgroundColor: Colors.surfaceLight }}
                  >
                    <Feather
                      name={(RUN_TYPE_META[upcomingRun.runType as RunType]?.icon ?? 'activity') as any}
                      size={20}
                      color={RUN_TYPE_META[upcomingRun.runType as RunType]?.color ?? Colors.primary}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-textPrimary">
                      {RUN_TYPE_META[upcomingRun.runType as RunType]?.label ?? upcomingRun.runType}
                    </Text>
                    <Text className="text-[13px] text-textMuted mt-0.5">
                      {(() => {
                        const d = new Date(upcomingRun.date + 'T00:00:00');
                        const todayStr = new Date().toISOString().split('T')[0];
                        const label = upcomingRun.date === todayStr ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                        const dist = imperial
                          ? `${Math.round(upcomingRun.distanceKm * 0.621371 * 2) / 2} mi`
                          : `${upcomingRun.distanceKm} km`;
                        return `${label} · ${dist} · ~${upcomingRun.estimatedDurationMinutes} min`;
                      })()}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={Colors.textMuted} />
                </View>
                <Text className="text-sm text-textSecondary leading-5" numberOfLines={2}>
                  {upcomingRun.description}
                </Text>
              </Card>
            </TouchableOpacity>
          </>
        ) : plan ? (
          <Card style={styles.emptyPlanCard}>
            <View className="w-14 h-14 rounded-full bg-surfaceLight justify-center items-center mb-4">
              <Feather name="check-circle" size={24} color={Colors.success} />
            </View>
            <Text className="text-lg font-bold text-textPrimary mb-2">All done!</Text>
            <Text className="text-sm text-textMuted text-center leading-5 px-2">
              You've completed all scheduled runs. Great work!
            </Text>
          </Card>
        ) : (
          <Card style={styles.emptyPlanCard}>
            <View className="w-14 h-14 rounded-full bg-surfaceLight justify-center items-center mb-4">
              <Feather name="zap" size={24} color={Colors.primary} />
            </View>
            <Text className="text-lg font-bold text-textPrimary mb-2">Building your plan</Text>
            <Text className="text-sm text-textMuted text-center leading-5 px-2">
              Your personalized training plan is being prepared.
            </Text>
          </Card>
        )}

        {/* Strava section */}
        <View className="mt-4">
          {stravaToken ? (
            <Card>
              <View className="flex-row items-center" style={styles.stravaGap}>
                <View className="w-11 h-11 rounded-[14px] bg-surfaceLight justify-center items-center">
                  <Feather name="check-circle" size={20} color={Colors.success} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-textPrimary">Strava connected</Text>
                  <Text className="text-[13px] text-textMuted mt-0.5">Sync your latest runs</Text>
                </View>
              </View>
              <View className="mt-4">
                <PrimaryButton
                  title="Sync now"
                  icon="refresh-cw"
                  onPress={handleSync}
                  loading={syncing}
                  variant="secondary"
                />
              </View>
            </Card>
          ) : (
            <PrimaryButton
              title="Connect Strava"
              icon="link"
              onPress={handleConnect}
              loading={connecting}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  tracking: {
    letterSpacing: -0.3,
  },
  statTracking: {
    letterSpacing: -0.5,
  },
  accentCard: {
    backgroundColor: Colors.primary,
  },
  accentDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(10, 10, 15, 0.2)',
  },
  headerGap: {
    gap: 8,
  },
  runHeader: {
    gap: 14,
  },
  emptyPlanCard: {
    marginTop: 8,
    marginBottom: 16,
    alignItems: 'center',
    paddingVertical: 32,
  },
  stravaGap: {
    gap: 14,
  },
});
