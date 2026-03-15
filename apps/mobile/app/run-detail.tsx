import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { Colors } from '../constants/colors';
import { RUN_TYPE_META } from '../constants/runTypes';
import type { RunType } from '../constants/runTypes';
import { useApp } from '../contexts/AppContext';
import { formatPaceRange } from '../lib/vdot';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function RunDetailScreen() {
  const { runId } = useLocalSearchParams<{ runId: string }>();
  const router = useRouter();
  const { plan, profile } = useApp();

  const run = useMemo(() => {
    if (!plan || !runId) return null;
    for (const week of plan.weeks) {
      const found = week.runs.find((r: any) => r.id === runId);
      if (found) return { ...found, weekNumber: week.weekNumber, phase: week.phase };
    }
    return null;
  }, [plan, runId]);

  if (!run) {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
        <View className="flex-1 justify-center items-center">
          <Text className="text-textMuted text-base">Run not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const meta = RUN_TYPE_META[run.runType as RunType];
  const imperial = profile?.useImperial ?? false;
  const dist = imperial
    ? `${Math.round(run.distanceKm * 0.621371 * 2) / 2} mi`
    : `${run.distanceKm} km`;
  const dateObj = new Date(run.date + 'T00:00:00');
  const dateFormatted = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const dayName = DAY_NAMES[run.dayOfWeek];
  const phaseLabel = run.phase.charAt(0).toUpperCase() + run.phase.slice(1);

  const durationDisplay = run.estimatedDurationMinutes >= 120
    ? `${Math.floor(run.estimatedDurationMinutes / 60)}h ${run.estimatedDurationMinutes % 60}min`
    : `${run.estimatedDurationMinutes} min`;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-5 py-3" style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Feather name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-textPrimary ml-3">
          Week {run.weekNumber}
        </Text>
        <View className="flex-1" />
        <View className="bg-surfaceLight px-3 py-1.5 rounded-lg">
          <Text className="text-xs font-semibold text-textSecondary">{phaseLabel} phase</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Run type hero */}
        <View className="items-center mb-6">
          <View
            className="w-20 h-20 rounded-full justify-center items-center mb-4"
            style={{ backgroundColor: (meta?.color ?? Colors.primary) + '22' }}
          >
            <Feather
              name={(meta?.icon ?? 'activity') as any}
              size={36}
              color={meta?.color ?? Colors.primary}
            />
          </View>
          <Text className="text-[13px] font-semibold text-textMuted uppercase" style={styles.dateSpacing}>
            {dateFormatted}
          </Text>
          <Text className="text-2xl font-bold text-textPrimary mt-1" style={styles.tracking}>
            {meta?.label ?? run.runType}
          </Text>
          <Text className="text-[15px] text-textMuted mt-1">
            {dayName} · {dist}
          </Text>
        </View>

        {/* Stats row */}
        {run.runType !== 'rest' && (
          <Card style={styles.statsCard}>
            <View className="flex-row">
              <View className="flex-1 items-center">
                <Feather name="map-pin" size={18} color={Colors.primary} />
                <Text className="text-xl font-bold text-textPrimary mt-2">{dist}</Text>
                <Text className="text-[12px] text-textMuted mt-1">Distance</Text>
              </View>
              <View style={styles.statDivider} />
              <View className="flex-1 items-center">
                <Feather name="clock" size={18} color={Colors.primary} />
                <Text className="text-xl font-bold text-textPrimary mt-2">{durationDisplay}</Text>
                <Text className="text-[12px] text-textMuted mt-1">Est. Duration</Text>
              </View>
              {run.paceMin && run.paceMax ? (
                <>
                  <View style={styles.statDivider} />
                  <View className="flex-1 items-center">
                    <Feather name="zap" size={18} color={Colors.primary} />
                    <Text className="text-xl font-bold text-textPrimary mt-2">
                      {formatPaceRange(run.paceMin, run.paceMax, imperial).replace(imperial ? '/mi' : '/km', '')}
                    </Text>
                    <Text className="text-[12px] text-textMuted mt-1">Pace</Text>
                  </View>
                </>
              ) : null}
            </View>
          </Card>
        )}

        {/* Description */}
        <Text className="text-base font-semibold text-textSecondary mt-6 mb-3">
          Description
        </Text>
        <Card>
          <Text className="text-[15px] text-textPrimary leading-6">
            {run.description}
          </Text>
        </Card>

        {/* Tips */}
        {run.tips ? (
          <>
            <Text className="text-base font-semibold text-textSecondary mt-6 mb-3">
              Tips
            </Text>
            <Card>
              <View className="flex-row" style={styles.tipRow}>
                <Feather name="info" size={16} color={Colors.primary} style={styles.tipIcon} />
                <Text className="text-[15px] text-textSecondary leading-6 flex-1">
                  {run.tips}
                </Text>
              </View>
            </Card>
          </>
        ) : null}

        {/* Completion status */}
        {run.runType !== 'rest' && (
          <Card style={styles.statusCard}>
            <View className="flex-row items-center" style={styles.statusRow}>
              <View
                className="w-10 h-10 rounded-full justify-center items-center"
                style={{
                  backgroundColor: run.completed
                    ? Colors.success + '22'
                    : Colors.surfaceLight,
                }}
              >
                <Feather
                  name={run.completed ? 'check' : 'circle'}
                  size={20}
                  color={run.completed ? Colors.success : Colors.textMuted}
                />
              </View>
              <Text className="text-[15px] font-medium text-textPrimary">
                {run.completed ? 'Workout complete' : 'Not yet completed'}
              </Text>
            </View>
          </Card>
        )}

        {/* Rest day content */}
        {run.runType === 'rest' && (
          <Card style={styles.restCard}>
            <View className="w-16 h-16 rounded-full bg-surfaceLight justify-center items-center mb-4">
              <Feather name="moon" size={28} color={Colors.textMuted} />
            </View>
            <Text className="text-lg font-bold text-textPrimary mb-2">Rest & Recover</Text>
            <Text className="text-sm text-textMuted text-center leading-5 px-4">
              {run.tips}
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    gap: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 48,
  },
  tracking: {
    letterSpacing: -0.3,
  },
  dateSpacing: {
    letterSpacing: 1,
  },
  statsCard: {
    paddingVertical: 20,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  tipRow: {
    gap: 10,
  },
  tipIcon: {
    marginTop: 3,
  },
  statusCard: {
    marginTop: 24,
  },
  statusRow: {
    gap: 12,
  },
  restCard: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 32,
  },
});
