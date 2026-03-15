import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { PrimaryButton } from '../../components/PrimaryButton';
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.weekLabel}>
            Week 1 of {profile?.planDurationWeeks ?? 12}
          </Text>
          <Text style={styles.planLabel}>
            {DISTANCE_LABELS[profile?.targetDistance ?? ''] ?? ''} Plan
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardText}>
            Your training plan is being built. Check back soon.
          </Text>
        </View>

        <View style={styles.stravaSection}>
          {stravaToken ? (
            <PrimaryButton
              title="Sync Strava"
              onPress={handleSync}
              loading={syncing}
              variant="secondary"
            />
          ) : (
            <PrimaryButton
              title="Connect Strava"
              onPress={handleConnect}
              loading={connecting}
            />
          )}
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
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    marginBottom: 24,
  },
  weekLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  planLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cardText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  stravaSection: {
    marginTop: 24,
  },
});
