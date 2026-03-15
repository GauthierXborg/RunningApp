import { Colors } from './colors';

export type RunType = 'easy' | 'tempo' | 'interval' | 'hill' | 'long' | 'recovery' | 'rest';

export interface RunTypeMeta {
  label: string;
  icon: string; // Feather icon name
  color: string;
  shortLabel: string;
}

export const RUN_TYPE_META: Record<RunType, RunTypeMeta> = {
  easy: {
    label: 'Easy Run',
    shortLabel: 'Easy',
    icon: 'sun',
    color: Colors.success,
  },
  long: {
    label: 'Long Run',
    shortLabel: 'Long',
    icon: 'map',
    color: Colors.primary,
  },
  tempo: {
    label: 'Tempo',
    shortLabel: 'Tempo',
    icon: 'trending-up',
    color: '#FF9F43',
  },
  interval: {
    label: 'Intervals',
    shortLabel: 'Intervals',
    icon: 'zap',
    color: '#FF5555',
  },
  hill: {
    label: 'Hill Repeats',
    shortLabel: 'Hills',
    icon: 'triangle',
    color: '#A78BFA',
  },
  recovery: {
    label: 'Recovery Run',
    shortLabel: 'Recovery',
    icon: 'heart',
    color: '#67E8F9',
  },
  rest: {
    label: 'Rest Day',
    shortLabel: 'Rest',
    icon: 'moon',
    color: Colors.textMuted,
  },
};
