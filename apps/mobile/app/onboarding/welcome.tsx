import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Colors } from '../../constants/colors';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.iconContainer}>
            <Feather name="activity" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.title}>RunningApp</Text>
          <Text style={styles.tagline}>Your personal running coach</Text>
        </View>

        <View style={styles.buttons}>
          <PrimaryButton
            title="Sign in with Apple"
            onPress={() => router.push('/onboarding/profile')}
          />
          <View style={{ height: 12 }} />
          <PrimaryButton
            title="Continue with Email"
            variant="secondary"
            onPress={() => router.push('/onboarding/profile')}
          />
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
  hero: {
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
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  buttons: {
    paddingBottom: 32,
  },
});
