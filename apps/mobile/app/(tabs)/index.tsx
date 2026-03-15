import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Card } from '../../components/Card';
import { useApp } from '../../contexts/AppContext';
import { connectStrava, fetchActivities } from '../../lib/strava';

const DISTANCE_LABELS: Record<string, string> = {
  '5k': '5K',
  '10k': '10K',
  half: 'Half Marathon',
  marathon: 'Marathon',
};

export default function HomeScreen() {
  const { profile, stravaToken, setStravaToken } = useApp();
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);

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
              {distanceLabel} Training Plan
            </Text>
          </View>
          <View className="bg-accent px-3.5 py-2 rounded-xl">
            <Text className="text-sm font-bold text-bg">Week 1</Text>
          </View>
        </View>

        {/* Hero distance card with accent background */}
        <View className="rounded-2xl p-5 mb-4 overflow-hidden" style={styles.accentCard}>
          <View className="flex-row items-baseline" style={styles.headerGap}>
            <Text className="text-lg font-bold text-bg">This week</Text>
            <Text className="text-sm font-medium text-bg opacity-70">
              of {profile?.planDurationWeeks ?? 12} weeks
            </Text>
          </View>
          <View className="flex-row items-center mt-5">
            <View className="flex-1 items-center">
              <Text className="text-4xl font-bold text-bg" style={styles.statTracking}>0</Text>
              <Text className="text-[13px] font-semibold text-bg opacity-70 mt-1">Runs</Text>
            </View>
            <View style={styles.accentDivider} />
            <View className="flex-1 items-center">
              <Text className="text-4xl font-bold text-bg" style={styles.statTracking}>0.0</Text>
              <Text className="text-[13px] font-semibold text-bg opacity-70 mt-1">
                {profile?.useImperial ? 'Miles' : 'Km'}
              </Text>
            </View>
            <View style={styles.accentDivider} />
            <View className="flex-1 items-center">
              <Text className="text-4xl font-bold text-bg" style={styles.statTracking}>0:00</Text>
              <Text className="text-[13px] font-semibold text-bg opacity-70 mt-1">Time</Text>
            </View>
          </View>
        </View>

        {/* Plan card */}
        <Card style={styles.planCard}>
          <View className="w-14 h-14 rounded-full bg-surfaceLight justify-center items-center mb-4">
            <Feather name="zap" size={24} color={Colors.primary} />
          </View>
          <Text className="text-lg font-bold text-textPrimary mb-2">Building your plan</Text>
          <Text className="text-sm text-textMuted text-center leading-5 px-2">
            Your personalized training plan is being prepared. Check back soon for your daily workouts.
          </Text>
        </Card>

        {/* Strava section */}
        <View className="mt-2">
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
  planCard: {
    marginBottom: 16,
    alignItems: 'center',
    paddingVertical: 32,
  },
  stravaGap: {
    gap: 14,
  },
});
