import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/colors';

function StatCard({ icon, label, value }: { icon: keyof typeof Feather.glyphMap; label: string; value: string }) {
  return (
    <Card style={styles.statCard}>
      <View className="w-11 h-11 rounded-[14px] bg-surfaceLight justify-center items-center mb-3">
        <Feather name={icon} size={20} color={Colors.primary} />
      </View>
      <Text className="text-3xl font-bold text-textPrimary" style={styles.statTracking}>{value}</Text>
      <Text className="text-[13px] font-medium text-textMuted mt-1">{label}</Text>
    </Card>
  );
}

export default function ProgressScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold text-textPrimary" style={styles.tracking}>Progress</Text>
        <Text className="text-[15px] text-textMuted font-medium mt-1 mb-6">Your training overview</Text>

        <View className="flex-row flex-wrap" style={styles.statsGrid}>
          <StatCard icon="map-pin" label="Total distance" value="--" />
          <StatCard icon="clock" label="Total time" value="--" />
          <StatCard icon="zap" label="Avg pace" value="--" />
          <StatCard icon="trending-up" label="Runs completed" value="0" />
        </View>

        <Card style={styles.chartPlaceholder}>
          <View className="w-16 h-16 rounded-full bg-surfaceLight justify-center items-center mb-4">
            <Feather name="bar-chart-2" size={32} color={Colors.textMuted} />
          </View>
          <Text className="text-lg font-bold text-textPrimary mb-2">Weekly progress</Text>
          <Text className="text-sm text-textMuted text-center leading-5 px-4">
            Your weekly distance and pace charts will appear here once you start training.
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
  tracking: {
    letterSpacing: -0.3,
  },
  statTracking: {
    letterSpacing: -0.5,
  },
  statsGrid: {
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: '46%',
    alignItems: 'center',
    paddingVertical: 24,
  },
  chartPlaceholder: {
    alignItems: 'center',
    paddingVertical: 40,
  },
});
