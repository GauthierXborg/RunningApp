import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/colors';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
  return { weeks, monthName, year, today: now.getDate() };
}

export default function CalendarScreen() {
  const { weeks, monthName, year, today } = getMonthData();

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View className="flex-row items-baseline mb-5" style={styles.headerGap}>
          <Text className="text-2xl font-bold text-textPrimary" style={styles.tracking}>
            {monthName}
          </Text>
          <Text className="text-lg font-medium text-textMuted">{year}</Text>
        </View>

        <Card>
          <View className="flex-row">
            {DAYS.map((d) => (
              <View key={d} className="flex-1 items-center py-1.5">
                <Text className="text-xs font-semibold text-textMuted mb-2" style={styles.daySpacing}>
                  {d}
                </Text>
              </View>
            ))}
          </View>
          {weeks.map((week, wi) => (
            <View key={wi} className="flex-row">
              {week.map((day, di) => (
                <View key={di} className="flex-1 items-center py-1.5">
                  {day !== null && (
                    <View
                      className={`w-[38px] h-[38px] rounded-xl justify-center items-center ${
                        day === today ? 'bg-accent' : ''
                      }`}
                    >
                      <Text
                        className={`text-[15px] ${
                          day === today
                            ? 'text-bg font-bold'
                            : 'text-textSecondary font-medium'
                        }`}
                      >
                        {day}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ))}
        </Card>

        <Card style={styles.emptyCard}>
          <View className="w-[52px] h-[52px] rounded-full bg-surfaceLight justify-center items-center mb-4">
            <Feather name="calendar" size={24} color={Colors.textMuted} />
          </View>
          <Text className="text-base font-semibold text-textPrimary mb-2">No workouts scheduled</Text>
          <Text className="text-sm text-textMuted text-center leading-5">
            Your daily workouts will appear here once your training plan is ready.
          </Text>
        </Card>
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
  emptyCard: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 32,
  },
});
