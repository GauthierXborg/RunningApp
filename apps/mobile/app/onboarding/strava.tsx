import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/colors';
import { useApp } from '../../contexts/AppContext';
import { connectStrava } from '../../lib/strava';

export default function StravaScreen() {
  const router = useRouter();
  const { setStravaToken, completeOnboarding } = useApp();
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const token = await connectStrava();
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
    <SafeAreaView className="flex-1 bg-bg" edges={['bottom']}>
      <View className="flex-1 px-6 justify-between">
        <View className="flex-1 justify-center items-center">
          <View style={styles.iconRing} className="mb-6">
            <View className="w-[72px] h-[72px] rounded-full bg-surface justify-center items-center">
              <Feather name="link" size={36} color="#FC4C02" />
            </View>
          </View>
          <Text className="text-[26px] font-bold text-textPrimary mb-6" style={styles.tracking}>
            Connect Strava
          </Text>

          <Card style={styles.infoCard}>
            <View className="flex-row items-center" style={styles.infoGap}>
              <View className="w-9 h-9 rounded-xl bg-surfaceLight justify-center items-center">
                <Feather name="refresh-cw" size={18} color={Colors.primary} />
              </View>
              <Text className="text-[15px] font-medium text-textSecondary flex-1">
                Auto-sync your completed runs
              </Text>
            </View>
            <View className="flex-row items-center" style={styles.infoGap}>
              <View className="w-9 h-9 rounded-xl bg-surfaceLight justify-center items-center">
                <Feather name="bar-chart-2" size={18} color={Colors.primary} />
              </View>
              <Text className="text-[15px] font-medium text-textSecondary flex-1">
                Track progress automatically
              </Text>
            </View>
            <View className="flex-row items-center" style={styles.infoGap}>
              <View className="w-9 h-9 rounded-xl bg-surfaceLight justify-center items-center">
                <Feather name="clock" size={18} color={Colors.primary} />
              </View>
              <Text className="text-[15px] font-medium text-textSecondary flex-1">
                Works without it -- connect anytime
              </Text>
            </View>
          </Card>
        </View>

        <View className="pb-8 items-center">
          <PrimaryButton
            title="Connect Strava"
            icon="link"
            onPress={handleConnect}
            loading={connecting}
          />
          <TouchableOpacity onPress={handleSkip} className="mt-4 py-2.5 px-5">
            <Text className="text-[15px] font-medium text-textMuted">Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  iconRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tracking: {
    letterSpacing: -0.3,
  },
  infoCard: {
    width: '100%',
    gap: 16,
  },
  infoGap: {
    gap: 14,
  },
});
