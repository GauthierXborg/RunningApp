import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Colors } from '../../constants/colors';
import { useApp } from '../../contexts/AppContext';
import { generateState, openStravaAuth, pollForToken } from '../../lib/strava';

export default function StravaScreen() {
  const router = useRouter();
  const { setStravaToken, completeOnboarding } = useApp();
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const state = generateState();
      await openStravaAuth(state);
      const token = await pollForToken(state);
      if (token) {
        await setStravaToken(token);
        await completeOnboarding();
        router.replace('/(tabs)');
      } else {
        Alert.alert('Connection failed', 'Could not connect to Strava. Please try again.');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong connecting to Strava.');
    } finally {
      setConnecting(false);
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <View style={styles.center}>
          <View style={styles.iconContainer}>
            <Feather name="link" size={48} color="#FC4C02" />
          </View>
          <Text style={styles.title}>Connect Strava</Text>
          <Text style={styles.description}>
            Connect Strava to automatically sync your completed runs. Your training
            plan works without it — you can always connect later.
          </Text>
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            title="Connect Strava"
            onPress={handleConnect}
            loading={connecting}
          />
          <Text style={styles.skipText} onPress={handleSkip}>
            Skip for now
          </Text>
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
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  footer: {
    paddingBottom: 32,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 15,
    color: Colors.textMuted,
    marginTop: 16,
    paddingVertical: 8,
  },
});
