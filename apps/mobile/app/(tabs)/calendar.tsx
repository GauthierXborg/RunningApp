import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/colors';
import { useApp } from '../../contexts/AppContext';
import { RUN_TYPE_META } from '../../constants/runTypes';
import type { RunType } from '../../constants/runTypes';

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonthData() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = Array(startDow).fill(null);

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  const monthName = firstDay.toLocaleString('default', { month: 'long' });
  return { weeks, monthName, year, today: now.getDate(), month };
}

export default function CalendarScreen() {
  const { weeks: calWeeks, monthName, year, today, month } = getMonthData();
  const { plan, profile } = useApp();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const weekListRef = useRef<ScrollView>(null);

  // Build date -> run map
  const runsByDate = useMemo(() => {
    if (!plan) return new Map<string, any>();
    const map = new Map<string, any>();
    for (const week of plan.weeks) {
      for (const run of week.runs) {
        map.set(run.date, run);
      }
    }
    return map;
  }, [plan]);

  // Set today as default selected
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    setSelectedDate(todayStr);
  }, []);

  function getDateStr(day: number | null): string | null {
    if (day === null) return null;
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function getDotColor(dateStr: string | null): string | null {
    if (!dateStr) return null;
    const run = runsByDate.get(dateStr);
    if (!run || run.runType === 'rest') return null;
    return RUN_TYPE_META[run.runType as RunType]?.color ?? Colors.primary;
  }

  // Get all upcoming weeks with runs for the scrollable list
  const weeklySchedule = useMemo(() => {
    if (!plan) return [];
    const todayStr = new Date().toISOString().split('T')[0];

    // If a day is selected, find its week; otherwise show from current week onward
    const targetDate = selectedDate ?? todayStr;

    return plan.weeks.map((week: any) => {
      const weekRuns = week.runs.filter((r: any) => r.runType !== 'rest');
      const firstDate = week.runs[0]?.date ?? '';
      const lastDate = week.runs[week.runs.length - 1]?.date ?? '';
      const isCurrent = targetDate >= firstDate && targetDate <= lastDate;
      return {
        ...week,
        weekRuns,
        isCurrent,
      };
    });
  }, [plan, selectedDate]);

  // Find which week index is selected
  const selectedWeekIdx = weeklySchedule.findIndex((w: any) => w.isCurrent);
  const imperial = profile?.useImperial ?? false;

  const handleDayPress = (day: number | null) => {
    if (day === null) return;
    const dateStr = getDateStr(day);
    setSelectedDate(dateStr);
  };

  const handleRunPress = (runId: string) => {
    router.push({ pathname: '/run-detail', params: { runId } });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Month header */}
        <View className="flex-row items-baseline mb-5" style={styles.headerGap}>
          <Text className="text-2xl font-bold text-textPrimary" style={styles.tracking}>
            {monthName}
          </Text>
          <Text className="text-lg font-medium text-textMuted">{year}</Text>
        </View>

        {/* Calendar grid */}
        <Card>
          <View className="flex-row">
            {DAY_HEADERS.map((d) => (
              <View key={d} className="flex-1 items-center py-1.5">
                <Text className="text-xs font-semibold text-textMuted mb-2" style={styles.daySpacing}>
                  {d}
                </Text>
              </View>
            ))}
          </View>
          {calWeeks.map((week, wi) => (
            <View key={wi} className="flex-row">
              {week.map((day, di) => {
                const dateStr = getDateStr(day);
                const dotColor = getDotColor(dateStr);
                const isToday = day === today;
                const isSelected = dateStr === selectedDate && !isToday;
                return (
                  <TouchableOpacity
                    key={di}
                    className="flex-1 items-center py-1.5"
                    onPress={() => handleDayPress(day)}
                    activeOpacity={0.6}
                    disabled={day === null}
                  >
                    {day !== null && (
                      <View
                        className={`w-[38px] h-[38px] rounded-xl justify-center items-center ${
                          isToday ? 'bg-accent' : ''
                        }`}
                        style={isSelected ? styles.selectedDay : undefined}
                      >
                        <Text
                          className={`text-[15px] ${
                            isToday
                              ? 'text-bg font-bold'
                              : isSelected
                              ? 'text-textPrimary font-bold'
                              : 'text-textSecondary font-medium'
                          }`}
                        >
                          {day}
                        </Text>
                        {dotColor && !isToday && (
                          <View
                            style={[styles.dot, { backgroundColor: dotColor }]}
                          />
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </Card>

        {/* Selected day detail */}
        {selectedDate && runsByDate.get(selectedDate) && (
          <View className="mt-4">
            <Text className="text-[13px] font-semibold text-textMuted mb-3 uppercase" style={styles.daySpacing}>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            {(() => {
              const run = runsByDate.get(selectedDate);
              if (!run) return null;
              const meta = RUN_TYPE_META[run.runType as RunType];
              const dist = imperial
                ? `${Math.round(run.distanceKm * 0.621371 * 2) / 2} mi`
                : `${run.distanceKm} km`;
              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleRunPress(run.id)}
                >
                  <Card>
                    <View className="flex-row items-center" style={styles.runRow}>
                      <View
                        className="w-11 h-11 rounded-[14px] justify-center items-center"
                        style={{ backgroundColor: Colors.surfaceLight }}
                      >
                        <Feather
                          name={(meta?.icon ?? 'activity') as any}
                          size={20}
                          color={meta?.color ?? Colors.primary}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[15px] font-semibold text-textPrimary">
                          {meta?.label ?? run.runType}
                        </Text>
                        <Text className="text-[13px] text-textMuted mt-0.5">
                          {run.runType === 'rest'
                            ? 'Recovery and regeneration'
                            : `${dist} · ~${run.estimatedDurationMinutes} min`}
                        </Text>
                      </View>
                      <Feather name="chevron-right" size={20} color={Colors.textMuted} />
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })()}
          </View>
        )}

        {/* Weekly schedule - scrollable list of upcoming weeks */}
        {weeklySchedule.length > 0 && (
          <View className="mt-6">
            <Text className="text-base font-semibold text-textSecondary mb-3">
              Training schedule
            </Text>
            {weeklySchedule.map((week: any, idx: number) => {
              // Show current week and all future weeks
              if (idx < (selectedWeekIdx >= 0 ? selectedWeekIdx : 0) - 1) return null;
              const phaseLabel = week.phase.charAt(0).toUpperCase() + week.phase.slice(1);
              return (
                <View key={week.weekNumber} className="mb-4">
                  <View className="flex-row items-center mb-2" style={styles.weekHeader}>
                    <Text className="text-[13px] font-bold text-textPrimary">
                      Week {week.weekNumber}
                    </Text>
                    <View className="bg-surfaceLight px-2.5 py-1 rounded-md">
                      <Text className="text-[11px] font-semibold text-textMuted">
                        {phaseLabel}
                        {week.isCutback ? ' · Cutback' : ''}
                      </Text>
                    </View>
                    <Text className="text-[12px] text-textMuted">
                      {week.targetVolumeKm} {imperial ? 'mi' : 'km'}
                    </Text>
                  </View>
                  {week.weekRuns.map((run: any) => {
                    const meta = RUN_TYPE_META[run.runType as RunType];
                    const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][run.dayOfWeek];
                    const dist = imperial
                      ? `${Math.round(run.distanceKm * 0.621371 * 2) / 2} mi`
                      : `${run.distanceKm} km`;
                    return (
                      <TouchableOpacity
                        key={run.id}
                        activeOpacity={0.7}
                        onPress={() => handleRunPress(run.id)}
                      >
                        <Card style={styles.runCard}>
                          <View className="flex-row items-center" style={styles.runRow}>
                            <View
                              className="w-10 h-10 rounded-xl justify-center items-center"
                              style={{ backgroundColor: Colors.surfaceLight }}
                            >
                              <Feather
                                name={(meta?.icon ?? 'activity') as any}
                                size={18}
                                color={meta?.color ?? Colors.primary}
                              />
                            </View>
                            <View className="flex-1">
                              <Text className="text-[15px] font-semibold text-textPrimary">
                                {dayName} — {meta?.label ?? run.runType}
                              </Text>
                              <Text className="text-[13px] text-textMuted mt-0.5">
                                {dist} · ~{run.estimatedDurationMinutes} min
                              </Text>
                            </View>
                            {run.completed ? (
                              <Feather name="check-circle" size={18} color={Colors.success} />
                            ) : (
                              <Feather name="chevron-right" size={18} color={Colors.textMuted} />
                            )}
                          </View>
                        </Card>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
          </View>
        )}

        {/* Empty state */}
        {!plan && (
          <Card style={styles.emptyCard}>
            <View className="w-[52px] h-[52px] rounded-full bg-surfaceLight justify-center items-center mb-4">
              <Feather name="calendar" size={24} color={Colors.textMuted} />
            </View>
            <Text className="text-base font-semibold text-textPrimary mb-2">No workouts scheduled</Text>
            <Text className="text-sm text-textMuted text-center leading-5">
              Your daily workouts will appear here once your training plan is ready.
            </Text>
          </Card>
        )}
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
  headerGap: {
    gap: 8,
  },
  tracking: {
    letterSpacing: -0.3,
  },
  daySpacing: {
    letterSpacing: 0.5,
  },
  selectedDay: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    position: 'absolute',
    bottom: 3,
  },
  weekHeader: {
    gap: 8,
  },
  runCard: {
    marginBottom: 6,
  },
  runRow: {
    gap: 12,
  },
  emptyCard: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 32,
  },
});
