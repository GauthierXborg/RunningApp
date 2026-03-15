import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getItem, setItem, removeItem, clearAll as clearStorage, KEYS } from '../lib/storage';
import type { StravaToken } from '../lib/strava';

export interface RunnerProfile {
  targetDistance: '5k' | '10k' | 'half' | 'marathon';
  fiveKSeconds: number | null;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  daysPerWeek: number;
  planDurationWeeks: 8 | 10 | 12;
  restDays: number[];
  useImperial: boolean;
}

export interface TrainingPlan {
  id: string;
  createdAt: string;
  weeks: any[];
}

interface AppState {
  profile: RunnerProfile | null;
  plan: TrainingPlan | null;
  stravaToken: StravaToken | null;
  onboardingComplete: boolean;
  isLoading: boolean;
}

interface AppContextType extends AppState {
  setProfile: (profile: RunnerProfile) => Promise<void>;
  setPlan: (plan: TrainingPlan) => Promise<void>;
  setStravaToken: (token: StravaToken | null) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  clearAll: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    profile: null,
    plan: null,
    stravaToken: null,
    onboardingComplete: false,
    isLoading: true,
  });

  useEffect(() => {
    (async () => {
      const [profile, plan, stravaToken, onboardingComplete] = await Promise.all([
        getItem<RunnerProfile>(KEYS.PROFILE),
        getItem<TrainingPlan>(KEYS.PLAN),
        getItem<StravaToken>(KEYS.STRAVA_TOKEN),
        getItem<boolean>(KEYS.ONBOARDING_COMPLETE),
      ]);
      setState({
        profile,
        plan,
        stravaToken,
        onboardingComplete: onboardingComplete ?? false,
        isLoading: false,
      });
    })();
  }, []);

  const setProfile = useCallback(async (profile: RunnerProfile) => {
    await setItem(KEYS.PROFILE, profile);
    setState((prev) => ({ ...prev, profile }));
  }, []);

  const setPlan = useCallback(async (plan: TrainingPlan) => {
    await setItem(KEYS.PLAN, plan);
    setState((prev) => ({ ...prev, plan }));
  }, []);

  const setStravaToken = useCallback(async (token: StravaToken | null) => {
    if (token) {
      await setItem(KEYS.STRAVA_TOKEN, token);
    } else {
      await removeItem(KEYS.STRAVA_TOKEN);
    }
    setState((prev) => ({ ...prev, stravaToken: token }));
  }, []);

  const completeOnboarding = useCallback(async () => {
    await setItem(KEYS.ONBOARDING_COMPLETE, true);
    setState((prev) => ({ ...prev, onboardingComplete: true }));
  }, []);

  const clearAll = useCallback(async () => {
    await clearStorage();
    setState({
      profile: null,
      plan: null,
      stravaToken: null,
      onboardingComplete: false,
      isLoading: false,
    });
  }, []);

  return (
    <AppContext.Provider
      value={{ ...state, setProfile, setPlan, setStravaToken, completeOnboarding, clearAll }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
