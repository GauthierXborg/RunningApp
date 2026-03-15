import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonthData() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Monday = 0, Sunday = 6
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

  const monthName = firstDay.toLocaleString('default', { month: 'long', year: 'numeric' });
  return { weeks, monthName, today: now.getDate() };
}

export default function CalendarScreen() {
  const { weeks, monthName, today } = getMonthData();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.monthTitle}>{monthName}</Text>

        <View style={styles.grid}>
          <View style={styles.row}>
            {DAYS.map((d) => (
              <View key={d} style={styles.cell}>
                <Text style={styles.dayHeader}>{d}</Text>
              </View>
            ))}
          </View>
          {weeks.map((week, wi) => (
            <View key={wi} style={styles.row}>
              {week.map((day, di) => (
                <View key={di} style={styles.cell}>
                  {day !== null && (
                    <View
                      style={[
                        styles.dayCircle,
                        day === today && styles.todayCircle,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          day === today && styles.todayText,
                        ]}
                      >
                        {day}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 24,
  },
  grid: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayCircle: {
    backgroundColor: Colors.primary,
  },
  dayText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  todayText: {
    color: Colors.background,
    fontWeight: '600',
  },
});
